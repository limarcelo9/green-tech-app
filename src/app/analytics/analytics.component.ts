import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MockDataService, CityInfo, TimelinePoint } from '../services/mock-data.service';
import { IpaService, SetorIPA } from '../services/ipa.service';
import { SimulationService, SimulationResult, SensitivityResult, Cenario } from '../services/simulation.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  dataService = inject(MockDataService);
  ipaService = inject(IpaService);
  simService = inject(SimulationService);

  selectedState = 'DF';
  currentCities: CityInfo[] = [];
  selectedCityName = 'Plano Piloto';
  isLoading = true;
  isCustomLocation = false;

  indicators = {
    temperature: '-- °C', floodRisk: 'Carregando...', elevation: '-- m',
    population: '... hab', soilSealing: '... %'
  };

  locationInfo = { name: 'Plano Piloto', info: 'Selecione um estado e cidade.' };

  // Timeline
  timeline: TimelinePoint[] = [];
  timelineMax = 45;

  // IPA
  setoresIPA: SetorIPA[] = [];
  ipaLoading = true;
  ipaStats = { muitoAlta: 0, alta: 0, media: 0, baixa: 0, avgScore: 0, maxScore: 0 };

  // Tabs
  activeTab: 'ipa' | 'simulation' | 'sensitivity' | 'indicators' = 'ipa';

  // Simulation
  selectedSetorIndex = 0;
  cenario: Cenario = 'medio';
  simInput = { aumentoCoberturaArborea: 15, reducaoImpermeabilizacao: 10, aumentoAreaVerde: 10 };
  simResult: SimulationResult | null = null;

  // Sensitivity
  sensitivityResults: SensitivityResult[] = [];

  ngOnInit() {
    this.currentCities = this.dataService.citiesByState['DF'] || [];

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
      // Auto-run simulation for top-ranked sector
      this.runSimulation();
      // Run sensitivity
      this.sensitivityResults = this.simService.runSensitivityAnalysis(data);
    });

    this.route.queryParams.subscribe(qp => {
      const lat = parseFloat(qp['lat']);
      const lng = parseFloat(qp['lng']);
      const name = qp['name'] || null;
      const state = qp['state'] || null;
      if (!isNaN(lat) && !isNaN(lng)) {
        this.isCustomLocation = true;
        if (state) { this.selectedState = state; this.currentCities = this.dataService.citiesByState[state] || []; }
        this.selectedCityName = name || `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        this.locationInfo = { name: this.selectedCityName, info: name ? `${name} (${state}). Tempo real.` : 'Localização no mapa.' };
        this.isLoading = true;
        this.fetchByCoords(lat, lng);
        return;
      }
    });

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
    if (this.currentCities.length > 0) this.selectCity(this.currentCities[0]);
  }

  selectCity(city: CityInfo) {
    this.selectedCityName = city.name;
    this.isCustomLocation = false;
    this.locationInfo = { name: city.name, info: `${city.name}, ${this.dataService.states[this.selectedState]?.name || ''}. Tempo real.` };
    this.isLoading = true;
    this.fetchByCoords(city.lat, city.lng);
  }

  private fetchByCoords(lat: number, lng: number) {
    this.indicators = { temperature: '...', floodRisk: '...', elevation: '...', population: 'N/A', soilSealing: 'N/A' };
    this.timeline = [];
    this.dataService.getTemperatureByCoords(lat, lng).subscribe(d => this.indicators.temperature = d);
    this.dataService.getFloodRiskByCoords(lat, lng).subscribe(d => this.indicators.floodRisk = d);
    this.dataService.getElevationByCoords(lat, lng).subscribe(d => { this.indicators.elevation = d; this.isLoading = false; });
    this.dataService.getTemperatureTimeline(lat, lng).subscribe(d => {
      this.timeline = d;
      if (d.length > 0) this.timelineMax = Math.max(...d.map(p => p.tempMax), 40);
    });
  }

  // Simulation
  runSimulation() {
    if (this.setoresIPA.length === 0) return;
    const setor = this.setoresIPA[this.selectedSetorIndex];
    this.simResult = this.simService.simulateThermal(setor, this.simInput, this.cenario);
  }

  getSelectedSetor(): SetorIPA | null {
    return this.setoresIPA[this.selectedSetorIndex] || null;
  }

  // Helpers
  getBarHeightPx(temp: number): number { return Math.max(8, (temp / this.timelineMax) * 120); }
  formatDate(dateStr: string): string { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); }
  getScoreBarWidth(score: number): number { return Math.min(100, Math.max(2, score)); }
}
