import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GoogleMap } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, GoogleMap],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'green-tech-app';

  // Google Maps configuration
  center: google.maps.LatLngLiteral = { lat: -23.5505, lng: -46.6333 }; // Default to São Paulo
  zoom = 12;
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

  // Predefined Brazil Regions
  regions: Record<string, { lat: number, lng: number, zoom: number }> = {
    norte: { lat: -3.7327, lng: -60.9169, zoom: 5 }, // Amazonas/Norte
    nordeste: { lat: -6.9023, lng: -39.0436, zoom: 6 }, // Ceará/Nordeste
    centroOeste: { lat: -15.7938, lng: -47.8827, zoom: 6 }, // Brasília/Centro-Oeste
    sudeste: { lat: -21.0, lng: -46.0, zoom: 6 }, // São Paulo-Minas/Sudeste
    sul: { lat: -27.5953, lng: -52.0, zoom: 6 } // SC/Sul
  };

  setRegion(regionKey: string) {
    const region = this.regions[regionKey];
    if (region) {
      this.center = { lat: region.lat, lng: region.lng };
      this.zoom = region.zoom;
    }
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
