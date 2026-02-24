import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MockDataService, CityInfo, TimelinePoint } from '../services/mock-data.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  dataService = inject(MockDataService);

  selectedState = 'DF';
  currentCities: CityInfo[] = [];
  selectedCityName = 'Plano Piloto';
  isLoading = true;
  isCustomLocation = false;

  indicators = {
    temperature: '-- °C',
    floodRisk: 'Carregando...',
    elevation: '-- m',
    population: '... hab',
    soilSealing: '... %'
  };

  locationInfo = {
    name: 'Plano Piloto',
    info: 'Selecione um estado e cidade para ver indicadores em tempo real.',
  };

  // Timeline
  timeline: TimelinePoint[] = [];
  timelineMax = 45; // for bar scaling

  ngOnInit() {
    this.currentCities = this.dataService.citiesByState['DF'] || [];

    // Check for custom coordinates (from map click)
    this.route.queryParams.subscribe(qp => {
      const lat = parseFloat(qp['lat']);
      const lng = parseFloat(qp['lng']);
      const name = qp['name'] || null;
      const state = qp['state'] || null;

      if (!isNaN(lat) && !isNaN(lng)) {
        this.isCustomLocation = true;
        if (state) {
          this.selectedState = state;
          this.currentCities = this.dataService.citiesByState[state] || [];
        }
        this.selectedCityName = name || `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        this.locationInfo = {
          name: this.selectedCityName,
          info: name
            ? `Cidade: ${name} (${state || ''}). Dados obtidos em tempo real.`
            : 'Localização selecionada manualmente no mapa. Dados obtidos em tempo real.'
        };
        this.isLoading = true;
        this.fetchByCoords(lat, lng);
        return;
      }
    });

    // Default: DF Plano Piloto
    this.route.paramMap.subscribe(() => {
      if (!this.isCustomLocation) {
        this.selectCity(this.currentCities[0] || { name: 'Plano Piloto', lat: -15.7938, lng: -47.8827 });
      }
    });
  }

  setEstado(sigla: string) {
    this.selectedState = sigla;
    this.currentCities = this.dataService.citiesByState[sigla] || [];
    this.isCustomLocation = false;
    if (this.currentCities.length > 0) {
      this.selectCity(this.currentCities[0]);
    }
  }

  selectCity(city: CityInfo) {
    this.selectedCityName = city.name;
    this.isCustomLocation = false;
    this.locationInfo = {
      name: city.name,
      info: `Cidade de ${city.name}, ${this.dataService.states[this.selectedState]?.name || ''}. Dados climáticos em tempo real via sensores e satélites.`
    };
    this.isLoading = true;
    this.fetchByCoords(city.lat, city.lng);
  }

  private fetchByCoords(lat: number, lng: number) {
    this.indicators = {
      temperature: '...', floodRisk: '...', elevation: '...', population: 'N/A', soilSealing: 'N/A'
    };
    this.timeline = [];

    this.dataService.getTemperatureByCoords(lat, lng).subscribe(data => {
      this.indicators.temperature = data;
    });
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(data => {
      this.indicators.floodRisk = data;
    });
    this.dataService.getElevationByCoords(lat, lng).subscribe(data => {
      this.indicators.elevation = data;
      this.isLoading = false;
    });

    // Timeline
    this.dataService.getTemperatureTimeline(lat, lng).subscribe(data => {
      this.timeline = data;
      if (data.length > 0) {
        this.timelineMax = Math.max(...data.map(d => d.tempMax), 40);
      }
    });
  }

  getBarHeightPx(temp: number): number {
    // Max bar height = 120px, scale proportionally
    return Math.max(8, (temp / this.timelineMax) * 120);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
}
