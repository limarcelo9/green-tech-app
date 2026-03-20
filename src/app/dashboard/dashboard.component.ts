import { Component, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Router } from '@angular/router';
import { MockDataService, StateInfo, CityInfo } from '../services/mock-data.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
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
  selectedPin: { lat: number, lng: number } | null = null;
  pinLoading = false;
  pinIndicators = { temperature: '--', floodRisk: '--', elevation: '--' };

  // Map Settings
  private map: L.Map | undefined;
  private selectedPinMarker: L.Marker | undefined;
  private cityMarkers: L.Marker[] = [];
  center = { lat: -15.7938, lng: -47.8827 };
  zoom = 10;

  // WMS Layers
  activeLayers: Record<string, boolean> = {
    'biomes': false, 'indigenous': false, 'conservation': false,
    'quilombo': false, 'settlements': false, 'nasaSatellite': false, 'nasaFires': false
  };
  private wmsLayers: Record<string, L.TileLayer.WMS> = {};

  constructor() {
    this.currentCities = this.dataService.citiesByState['DF'] || [];
  }

  ngAfterViewInit() {
    this.initMap();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const timeStr = yesterday.toISOString().split('T')[0];

    this.wmsLayers['biomes'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_biomes-static-layer', 0.8);
    this.wmsLayers['indigenous'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_indigenous-lands-static-layer', 0.8);
    this.wmsLayers['conservation'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_conservation-unit-static-layer', 0.8);
    this.wmsLayers['quilombo'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_quilombo-static-layer', 0.8);
    this.wmsLayers['settlements'] = this.createWMSLayer('https://production.alerta.mapbiomas.org/geoserver/wms', 'mapbiomas-alertas:dashboard_settlements-static-layer', 0.8);
    this.wmsLayers['nasaSatellite'] = this.createNasaLayer('MODIS_Terra_CorrectedReflectance_TrueColor', timeStr, 1.0);
    this.wmsLayers['nasaFires'] = this.createNasaLayer('MODIS_Terra_Thermal_Anomalies_All', timeStr, 1.0);
  }

  initMap() {
    const mapEl = document.getElementById('dashboard-map');
    if (!mapEl) return;
    
    this.map = L.map('dashboard-map', { zoomControl: false }).setView([this.center.lat, this.center.lng], this.zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e.latlng.lat, e.latlng.lng);
    });

    this.updateCityMarkers();
  }

  // ---- State Selection ----
  setEstado(sigla: string) {
    this.selectedState = sigla;
    const state = this.dataService.states[sigla];
    if (state) {
      this.center = { lat: state.lat, lng: state.lng };
      this.zoom = state.zoom;
      if (this.map) this.map.setView([state.lat, state.lng], state.zoom);
    }
    this.currentCities = this.dataService.citiesByState[sigla] || [];
    this.updateCityMarkers();
    this.clearPin();
  }

  updateCityMarkers() {
    if (!this.map) return;
    // Remove old ones
    this.cityMarkers.forEach(m => this.map!.removeLayer(m));
    this.cityMarkers = [];

    // Create new ones
    this.currentCities.forEach(city => {
      const marker = L.marker([city.lat, city.lng], { title: city.name }).addTo(this.map!);
      marker.on('click', () => {
        this.navigateToCityAnalytics(city);
      });
      this.cityMarkers.push(marker);
    });
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

  // ---- Map Type (Ignored in Leaflet for now, or could swap tileLayers) ----
  setMapType(mapTypeId: string) {
    // optional logic
  }

  // ---- Interactive Map Click ----
  onMapClick(lat: number, lng: number) {
    this.selectedPin = { lat, lng };
    this.pinLoading = true;
    this.pinIndicators = { temperature: '...', floodRisk: '...', elevation: '...' };

    this.dataService.getTemperatureByCoords(lat, lng).subscribe(val => { this.pinIndicators.temperature = val; });
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(val => { this.pinIndicators.floodRisk = val; });
    this.dataService.getElevationByCoords(lat, lng).subscribe(val => { this.pinIndicators.elevation = val; this.pinLoading = false; });

    if (this.map) {
      if (this.selectedPinMarker) {
        this.selectedPinMarker.setLatLng([lat, lng]);
      } else {
        this.selectedPinMarker = L.marker([lat, lng]).addTo(this.map);
      }
    }
  }

  clearPin() {
    this.selectedPin = null;
    this.pinLoading = false;
    if (this.map && this.selectedPinMarker) {
      this.map.removeLayer(this.selectedPinMarker);
      this.selectedPinMarker = undefined;
    }
  }

  navigateToPin() {
    if (!this.selectedPin) return;
    this.router.navigate(['/analytics'], {
      queryParams: { lat: this.selectedPin.lat.toFixed(6), lng: this.selectedPin.lng.toFixed(6) }
    });
  }

  // ---- WMS Layers ----
  private createWMSLayer(baseUrl: string, layerName: string, opacity: number): L.TileLayer.WMS {
    return L.tileLayer.wms(baseUrl, {
      layers: layerName,
      format: 'image/png',
      transparent: true,
      opacity: opacity,
      attribution: 'MapBiomas/INPE'
    });
  }

  private createNasaLayer(layerName: string, time: string, opacity: number): L.TileLayer.WMS {
    return L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi', {
      layers: layerName,
      time: time,
      format: 'image/png',
      transparent: true,
      opacity: opacity,
      attribution: 'NASA GIBS'
    } as any);
  }

  toggleLayer(layerKey: string) {
    if (!this.map) return;
    this.activeLayers[layerKey] = !this.activeLayers[layerKey];
    const layer = this.wmsLayers[layerKey];
    if (!layer) return;

    if (this.activeLayers[layerKey]) {
      layer.addTo(this.map);
    } else {
      this.map.removeLayer(layer);
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
