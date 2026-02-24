import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Router } from '@angular/router';
import { MockDataService, StateInfo, CityInfo } from '../services/mock-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GoogleMap, MapMarker, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  private router = inject(Router);
  dataService = inject(MockDataService);

  // State Selection
  selectedState = 'DF';
  currentCities: CityInfo[] = [];

  // Interactive Pin State
  selectedPin: google.maps.LatLngLiteral | null = null;
  pinLoading = false;
  pinIndicators = { temperature: '--', floodRisk: '--', elevation: '--' };

  @ViewChild(GoogleMap, { static: false }) mapComponent!: GoogleMap;

  // Map Settings
  center: google.maps.LatLngLiteral = { lat: -15.7938, lng: -47.8827 };
  zoom = 10;

  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapId: 'DEMO_MAP_ID',
    tilt: 45,
    heading: 90,
    rotateControl: true,
    mapTypeId: 'hybrid'
  };

  // WMS Layers
  activeLayers: Record<string, boolean> = {
    'biomes': false, 'indigenous': false, 'conservation': false,
    'quilombo': false, 'settlements': false, 'nasaSatellite': false, 'nasaFires': false
  };
  private wmsOverlayMapTypes: Record<string, google.maps.ImageMapType> = {};

  constructor() {
    this.currentCities = this.dataService.citiesByState['DF'] || [];
  }

  ngAfterViewInit() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const timeStr = yesterday.toISOString().split('T')[0];

    this.wmsOverlayMapTypes['biomes'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_biomes-static-layer', 0.8);
    this.wmsOverlayMapTypes['indigenous'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_indigenous-lands-static-layer', 0.8);
    this.wmsOverlayMapTypes['conservation'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_conservation-unit-static-layer', 0.8);
    this.wmsOverlayMapTypes['quilombo'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_quilombo-static-layer', 0.8);
    this.wmsOverlayMapTypes['settlements'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_settlements-static-layer', 0.8);
    this.wmsOverlayMapTypes['nasaSatellite'] = this.createNasaLayer('MODIS_Terra_CorrectedReflectance_TrueColor', timeStr, 1.0);
    this.wmsOverlayMapTypes['nasaFires'] = this.createNasaLayer('MODIS_Terra_Thermal_Anomalies_All', timeStr, 1.0);
  }

  // ---- State Selection ----
  setEstado(sigla: string) {
    this.selectedState = sigla;
    const state = this.dataService.states[sigla];
    if (state) {
      this.center = { lat: state.lat, lng: state.lng };
      this.zoom = state.zoom;
    }
    this.currentCities = this.dataService.citiesByState[sigla] || [];
    this.clearPin();
  }

  goToCity(city: CityInfo) {
    this.center = { lat: city.lat, lng: city.lng };
    this.zoom = 13;
  }

  navigateToCityAnalytics(city: CityInfo) {
    this.router.navigate(['/analytics'], {
      queryParams: { lat: city.lat.toFixed(6), lng: city.lng.toFixed(6), name: city.name, state: this.selectedState }
    });
  }

  // ---- Map Type ----
  setMapType(mapTypeId: string) {
    this.mapOptions.mapTypeId = mapTypeId;
  }

  // ---- Interactive Map Click ----
  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.selectedPin = { lat, lng };
    this.pinLoading = true;
    this.pinIndicators = { temperature: '...', floodRisk: '...', elevation: '...' };

    this.dataService.getTemperatureByCoords(lat, lng).subscribe(val => { this.pinIndicators.temperature = val; });
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(val => { this.pinIndicators.floodRisk = val; });
    this.dataService.getElevationByCoords(lat, lng).subscribe(val => { this.pinIndicators.elevation = val; this.pinLoading = false; });
  }

  clearPin() {
    this.selectedPin = null;
    this.pinLoading = false;
  }

  navigateToPin() {
    if (!this.selectedPin) return;
    this.router.navigate(['/analytics'], {
      queryParams: { lat: this.selectedPin.lat.toFixed(6), lng: this.selectedPin.lng.toFixed(6) }
    });
  }

  // ---- WMS Layers ----
  private createWMSLayer(baseUrl: string, layerName: string, opacity: number): google.maps.ImageMapType {
    return new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        const proj = this.mapComponent.googleMap?.getProjection();
        if (!proj) return null;
        const zfactor = Math.pow(2, zoom);
        const top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
        const bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
        if (!top || !bot) return null;
        const bbox = `${top.lng()},${bot.lat()},${bot.lng()},${top.lat()}`;
        return `${baseUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layerName}&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=${bbox}`;
      },
      tileSize: new google.maps.Size(256, 256), opacity
    });
  }

  private createNasaLayer(layerName: string, time: string, opacity: number): google.maps.ImageMapType {
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
      tileSize: new google.maps.Size(256, 256), opacity
    });
  }

  toggleLayer(layerKey: string) {
    if (!this.mapComponent || !this.mapComponent.googleMap) return;
    this.activeLayers[layerKey] = !this.activeLayers[layerKey];
    const overlayMapTypes = this.mapComponent.googleMap.overlayMapTypes;
    if (this.activeLayers[layerKey]) {
      overlayMapTypes.push(this.wmsOverlayMapTypes[layerKey]);
    } else {
      for (let i = 0; i < overlayMapTypes.getLength(); i++) {
        if (overlayMapTypes.getAt(i) === this.wmsOverlayMapTypes[layerKey]) { overlayMapTypes.removeAt(i); break; }
      }
    }
  }

  // ---- Parallax ----
  mapTransform = 'perspective(1000px) rotateX(2deg) rotateY(0deg)';

  onMouseMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const rotateX = -(y / rect.height) * 10;
    const rotateY = (x / rect.width) * 10;
    this.mapTransform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }

  onMouseLeave() {
    this.mapTransform = 'perspective(1000px) rotateX(2deg) rotateY(0deg)';
  }
}
