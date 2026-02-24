import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Router } from '@angular/router';
import { MockDataService } from '../services/mock-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GoogleMap, MapMarker, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  private router = inject(Router);
  private dataService = inject(MockDataService);

  // Interactive Pin State
  selectedPin: google.maps.LatLngLiteral | null = null;
  pinLoading = false;
  pinIndicators = {
    temperature: '--',
    floodRisk: '--',
    elevation: '--'
  };

  @ViewChild(GoogleMap, { static: false }) mapComponent!: GoogleMap;

  // Initial Center: Brasília, DF
  center: google.maps.LatLngLiteral = { lat: -15.7938, lng: -47.8827 };
  zoom = 10;

  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapId: 'DEMO_MAP_ID', // Requisito para 3D
    tilt: 45,
    heading: 90,
    rotateControl: true,
    mapTypeId: 'hybrid' // Base de Satelite do Gmaps
  };

  // Multiple WMS Layers Dictionary
  activeLayers: Record<string, boolean> = {
    'biomes': false,
    'indigenous': false,
    'conservation': false,
    'quilombo': false,
    'settlements': false,
    'nasaSatellite': false,
    'nasaFires': false
  };

  private wmsOverlayMapTypes: Record<string, google.maps.ImageMapType> = {};

  // Parallax transform
  transformStyle = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';

  ngAfterViewInit() {
    // Generate yesterday's date string for NASA GIBS TIME parameter
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2); // -2 days to ensure NASA processing is finished globally
    const timeStr = yesterday.toISOString().split('T')[0];

    // Initialize MapBiomas and NASA GIBS Layers
    this.wmsOverlayMapTypes['biomes'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_biomes-static-layer', 0.8);
    this.wmsOverlayMapTypes['indigenous'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_indigenous-lands-static-layer', 0.8);
    this.wmsOverlayMapTypes['conservation'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_conservation-unit-static-layer', 0.8);
    this.wmsOverlayMapTypes['quilombo'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_quilombo-static-layer', 0.8);
    this.wmsOverlayMapTypes['settlements'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_settlements-static-layer', 0.8);

    // NASA GIBS Layers (Requires EPSG:4326 and TIME)
    this.wmsOverlayMapTypes['nasaSatellite'] = this.createNasaLayer('MODIS_Terra_CorrectedReflectance_TrueColor', timeStr, 1.0);
    this.wmsOverlayMapTypes['nasaFires'] = this.createNasaLayer('MODIS_Terra_Thermal_Anomalies_All', timeStr, 1.0);
  }

  private createWMSLayer(baseUrl: string, layerName: string, opacity: number): google.maps.ImageMapType {
    return new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        const proj = this.mapComponent.googleMap?.getProjection();
        if (!proj) return null;
        const zfactor = Math.pow(2, zoom);

        // Standard EPSG:4326 BBox calc for Google Maps
        const top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
        const bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
        if (!top || !bot) return null;

        const bbox = `${top.lng()},${bot.lat()},${bot.lng()},${top.lat()}`;
        return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layerName}&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=${bbox}`;
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: opacity
    });
  }

  private createNasaLayer(layerName: string, time: string, opacity: number): google.maps.ImageMapType {
    // NASA GIBS Web Mercator Projection (EPSG:3857) WMS
    return new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        const proj = this.mapComponent.googleMap?.getProjection();
        if (!proj) return null;
        const zfactor = Math.pow(2, zoom);

        const top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
        const bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
        if (!top || !bot) return null;

        const bbox = `${top.lng()},${bot.lat()},${bot.lng()},${top.lat()}`;
        return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layerName}&TIME=${time}&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=${bbox}`;
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: opacity
    });
  }

  toggleLayer(layerKey: string) {
    if (!this.mapComponent || !this.mapComponent.googleMap) return;

    this.activeLayers[layerKey] = !this.activeLayers[layerKey];
    const map = this.mapComponent.googleMap;
    const overlayMapTypes = map.overlayMapTypes;

    // Custom logic to add/remove the specific ImageMapType from the MVCArray
    if (this.activeLayers[layerKey]) {
      // Add layer
      overlayMapTypes.push(this.wmsOverlayMapTypes[layerKey]);
    } else {
      // Find and remove layer
      for (let i = 0; i < overlayMapTypes.getLength(); i++) {
        if (overlayMapTypes.getAt(i) === this.wmsOverlayMapTypes[layerKey]) {
          overlayMapTypes.removeAt(i);
          break;
        }
      }
    }
  }

  // Predefined Distrito Federal Administrative Regions (RAs)
  dfRegions: Record<string, { lat: number, lng: number, zoom: number, title: string }> = {
    'plano-piloto': { lat: -15.7938, lng: -47.8827, zoom: 12, title: 'Plano Piloto' },
    'taguatinga': { lat: -15.8333, lng: -48.0500, zoom: 13, title: 'Taguatinga' },
    'ceilandia': { lat: -15.8233, lng: -48.1158, zoom: 13, title: 'Ceilândia' },
    'samambaia': { lat: -15.8667, lng: -48.0667, zoom: 13, title: 'Samambaia' },
    'aguas-claras': { lat: -15.8368, lng: -48.0305, zoom: 14, title: 'Águas Claras' },
    'sobradinho': { lat: -15.6547, lng: -47.7858, zoom: 13, title: 'Sobradinho' }
  };

  // Keep track of the keys for iteration in template
  regionKeys = Object.keys(this.dfRegions);

  setMapType(mapTypeId: string) {
    this.mapOptions.mapTypeId = mapTypeId;
  }

  setRegion(regionKey: string) {
    const region = this.dfRegions[regionKey];
    if (region) {
      this.center = { lat: region.lat, lng: region.lng };
      this.zoom = region.zoom;
    }
  }

  navigateToRegion(regionKey: string) {
    this.router.navigate(['/analytics', regionKey]);
  }

  // ---- Interactive Map Click ----
  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.selectedPin = { lat, lng };
    this.pinLoading = true;
    this.pinIndicators = { temperature: '...', floodRisk: '...', elevation: '...' };

    // Fetch live data for this exact coordinate
    this.dataService.getTemperatureByCoords(lat, lng).subscribe(val => {
      this.pinIndicators.temperature = val;
    });
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(val => {
      this.pinIndicators.floodRisk = val;
    });
    this.dataService.getElevationByCoords(lat, lng).subscribe(val => {
      this.pinIndicators.elevation = val;
      this.pinLoading = false; // last to resolve typically
    });
  }

  clearPin() {
    this.selectedPin = null;
    this.pinLoading = false;
  }

  // 3D Parallax logic
  mapTransform = 'perspective(1000px) rotateX(2deg) rotateY(0deg)';

  onMouseMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();

    // Calculate mouse position relative to center of element
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    // Calculate rotation (-5 to 5 degrees)
    const rotateX = -(y / rect.height) * 10;
    const rotateY = (x / rect.width) * 10;

    this.mapTransform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  onMouseLeave() {
    // Reset softly
    this.mapTransform = 'perspective(1000px) rotateX(2deg) rotateY(0deg)';
  }
}
