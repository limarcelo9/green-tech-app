import { Component, inject } from '@angular/core';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [GoogleMap, MapMarker],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private router = inject(Router);

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

  setMapType(type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') {
    this.mapOptions = {
      ...this.mapOptions,
      mapTypeId: type as unknown as google.maps.MapTypeId
    };
  }

  // Predefined Brazil Regions & Markers
  regions: Record<string, { lat: number, lng: number, zoom: number, title: string }> = {
    norte: { lat: -3.7327, lng: -60.9169, zoom: 5, title: 'Norte' }, // Amazonas/Norte
    nordeste: { lat: -6.9023, lng: -39.0436, zoom: 6, title: 'Nordeste' }, // Ceará/Nordeste
    centroOeste: { lat: -15.7938, lng: -47.8827, zoom: 6, title: 'Centro-Oeste' }, // Brasília/Centro-Oeste
    sudeste: { lat: -21.0, lng: -46.0, zoom: 6, title: 'Sudeste' }, // São Paulo-Minas/Sudeste
    sul: { lat: -27.5953, lng: -52.0, zoom: 6, title: 'Sul' } // SC/Sul
  };

  // Keep track of the keys for iteration in template
  regionKeys = Object.keys(this.regions);

  setRegion(regionKey: string) {
    const region = this.regions[regionKey];
    if (region) {
      this.center = { lat: region.lat, lng: region.lng };
      this.zoom = region.zoom;
    }
  }

  navigateToRegion(regionKey: string) {
    this.router.navigate(['/analytics', regionKey]);
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
