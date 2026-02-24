import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GoogleMap, MapMarker],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements AfterViewInit {
  private router = inject(Router);

  @ViewChild(GoogleMap, { static: false }) mapComponent!: GoogleMap;

  // Google Maps configuration
  center: google.maps.LatLngLiteral = { lat: -15.7938, lng: -47.8827 }; // Default to Brasília (Center)
  zoom = 4;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.SATELLITE,
    disableDefaultUI: false,
    zoomControl: true,
    mapId: 'DEMO_MAP_ID', // Requisito do Google para mapas Vetoriais/3D
    tilt: 45, // Angulação inicial para criar o efeito 3D
    heading: 90, // Direção da vista
    rotateControl: true // Permitir rotacionar
  };

  // MapBiomas Layers Integration
  mapBiomasLayers: { id: string, title: string, layerName: string, isActive: boolean, overlay: any }[] = [
    { id: 'desmatamento', title: 'Desmatamento (Biomas)', layerName: 'mapbiomas-alertas:dashboard_biomes-static-layer', isActive: false, overlay: null },
    { id: 'indigenous', title: 'Terras Indígenas', layerName: 'mapbiomas-alertas:dashboard_indigenous-lands-static-layer', isActive: false, overlay: null },
    { id: 'conservation', title: 'Unidades de Conservação', layerName: 'mapbiomas-alertas:dashboard_conservation-unit-static-layer', isActive: false, overlay: null },
    { id: 'quilombo', title: 'Áreas Quilombolas', layerName: 'mapbiomas-alertas:dashboard_quilombo-static-layer', isActive: false, overlay: null },
    { id: 'settlements', title: 'Assentamentos', layerName: 'mapbiomas-alertas:dashboard_settlements-static-layer', isActive: false, overlay: null }
  ];

  ngOnInit() {
    this.center = { lat: -14.235, lng: -51.925 };
    this.zoom = 4;
  }

  ngAfterViewInit() {
    // 3D Tilt Initialization
    // Assuming mapContainer and bounds are defined elsewhere if needed for 3D tilt
    // if (this.mapContainer && this.mapContainer.nativeElement) {
    //   this.bounds = this.mapContainer.nativeElement.getBoundingClientRect();
    // }
  }

  toggleLayer(layerId: string) {
    const layer = this.mapBiomasLayers.find(l => l.id === layerId);
    if (!layer || !this.mapComponent || !this.mapComponent.googleMap) return;

    layer.isActive = !layer.isActive;
    const map = this.mapComponent.googleMap;

    if (layer.isActive) {
      // Create new WMS layer instance if enabling
      layer.overlay = new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) => {
          const proj = map.getProjection();
          if (!proj) return null;
          const zfactor = Math.pow(2, zoom);

          const top = proj.fromPointToLatLng(new google.maps.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
          const bot = proj.fromPointToLatLng(new google.maps.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));

          if (!top || !bot) return null;

          const bbox = `${top.lng()},${bot.lat()},${bot.lng()},${top.lat()}`;
          return `https://production.alerta.mapbiomas.org/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=${layer.layerName}&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=${bbox}`;
        },
        tileSize: new google.maps.Size(256, 256),
        opacity: 0.8
      });
      map.overlayMapTypes.push(layer.overlay);
    } else {
      // Remove layer if disabling
      const overlays = map.overlayMapTypes.getArray();
      for (let i = 0; i < overlays.length; i++) {
        if (overlays[i] === layer.overlay) {
          map.overlayMapTypes.removeAt(i);
          layer.overlay = null;
          break;
        }
      }
    }
  }

  setMapType(type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') {
    this.mapOptions = {
      ...this.mapOptions,
      mapTypeId: type as unknown as google.maps.MapTypeId
    };
  }

  // Predefined Brazil Biomes & Markers
  biomes: Record<string, { lat: number, lng: number, zoom: number, title: string }> = {
    amazonia: { lat: -3.7327, lng: -60.9169, zoom: 5, title: 'Amazônia' },
    caatinga: { lat: -6.9023, lng: -39.0436, zoom: 6, title: 'Caatinga' },
    cerrado: { lat: -15.7938, lng: -47.8827, zoom: 6, title: 'Cerrado' },
    mataAtlantica: { lat: -21.0, lng: -46.0, zoom: 6, title: 'Mata Atlântica' },
    pampa: { lat: -30.0346, lng: -51.2177, zoom: 6, title: 'Pampa' },
    pantanal: { lat: -19.0, lng: -56.5, zoom: 6, title: 'Pantanal' }
  };

  // Keep track of the keys for iteration in template
  biomeKeys = Object.keys(this.biomes);

  setBiome(biomeKey: string) {
    const biome = this.biomes[biomeKey];
    if (biome) {
      this.center = { lat: biome.lat, lng: biome.lng };
      this.zoom = biome.zoom;
    }
  }

  navigateToBiome(biomeKey: string) {
    this.router.navigate(['/analytics', biomeKey]);
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
