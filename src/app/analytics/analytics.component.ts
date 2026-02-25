import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MockDataService, CityInfo, TimelinePoint } from '../services/mock-data.service';
import { IpaService, SetorIPA } from '../services/ipa.service';

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
  ipaService = inject(IpaService);

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
  timelineMax = 45;

  // IPA
  setoresIPA: SetorIPA[] = [];
  ipaLoading = true;
  ipaStats = { muitoAlta: 0, alta: 0, media: 0, baixa: 0, avgScore: 0, maxScore: 0 };
  activeTab: 'indicators' | 'ipa' = 'ipa';

  ngOnInit() {
    this.currentCities = this.dataService.citiesByState['DF'] || [];

    // Load IPA data
    this.ipaService.getSetoresIPA().subscribe(data => {
      this.setoresIPA = data;
      this.ipaLoading = false;
      this.ipaStats = {
        muitoAlta: data.filter(s => s.ipa_categoria === 'Muito Alta').length,
        alta: data.filter(s => s.ipa_categoria === 'Alta').length,
        media: data.filter(s => s.ipa_categoria === 'Média').length,
        baixa: data.filter(s => s.ipa_categoria === 'Baixa').length,
        avgScore: +(data.reduce((sum, s) => sum + s.ipa_score, 0) / data.length).toFixed(1),
        maxScore: Math.max(...data.map(s => s.ipa_score)),
      };
    });

    // Check for custom coordinates
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
            ? `Cidade: ${name} (${state || ''}). Dados em tempo real.`
            : 'Localização selecionada no mapa. Dados em tempo real.'
        };
        this.isLoading = true;
        this.fetchByCoords(lat, lng);
        return;
      }
    });

    // Default
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
      info: `${city.name}, ${this.dataService.states[this.selectedState]?.name || ''}. Dados climáticos em tempo real.`
    };
    this.isLoading = true;
    this.fetchByCoords(city.lat, city.lng);
  }

  private fetchByCoords(lat: number, lng: number) {
    this.indicators = { temperature: '...', floodRisk: '...', elevation: '...', population: 'N/A', soilSealing: 'N/A' };
    this.timeline = [];

    this.dataService.getTemperatureByCoords(lat, lng).subscribe(data => { this.indicators.temperature = data; });
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(data => { this.indicators.floodRisk = data; });
    this.dataService.getElevationByCoords(lat, lng).subscribe(data => { this.indicators.elevation = data; this.isLoading = false; });
    this.dataService.getTemperatureTimeline(lat, lng).subscribe(data => {
      this.timeline = data;
      if (data.length > 0) this.timelineMax = Math.max(...data.map(d => d.tempMax), 40);
    });
  }

  getBarHeightPx(temp: number): number {
    return Math.max(8, (temp / this.timelineMax) * 120);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  getScoreBarWidth(score: number): number {
    return Math.min(100, Math.max(2, score));
  }
}
