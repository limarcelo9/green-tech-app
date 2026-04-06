import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as L from 'leaflet';
import { MockDataService, CityInfo, TimelinePoint } from '../services/mock-data.service';
import { IpacService, SetorIPAC } from '../services/ipac.service';
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
  ipacService = inject(IpacService);
  simService = inject(SimulationService);


  selectedCityName = "Brasília";
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

  // IPAC
  setoresIPAC: SetorIPAC[] = [];
  ipacLoading = true;
  ipacStats = { muitoAlta: 0, alta: 0, media: 0, baixa: 0, avgScore: 0, maxScore: 0, principalDriver: '' };

  // Tabs
  activeTab: 'ipac' | 'simulation' | 'sensitivity' | 'indicators' = 'ipac';

  setTab(tab: 'ipac' | 'simulation' | 'sensitivity' | 'indicators') {
    this.activeTab = tab;
    if (tab === 'simulation') {
      setTimeout(() => this.initMap(), 100);
    }
  }

  // Simulation
  selectedSetorIndex = 0;
  cenario: Cenario = 'medio';
  simInput = {
    aumentoCoberturaArborea: 15, reducaoImpermeabilizacao: 10, aumentoAreaVerde: 10,
    telhadosVerdes: 10, telhadosFrios: 20, pavimentosFrios: 15
  };
  simResult: SimulationResult | null = null;
  investimentoSimulacao: number | null = null;
  investimentoFormatado = '';

  // Optimization Assistant state
  activeGoal: string | null = null;
  goalMessage: string = 'Selecione um objetivo acima para otimizar os parâmetros via Inteligência Artificial.';

  onInvestimentoChange(value: string) {
    if (!value) {
      this.investimentoSimulacao = null;
      this.investimentoFormatado = '';
      this.runSimulation();
      return;
    }
    const numbers = value.replace(/\D/g, '');
    if (!numbers) {
      this.investimentoSimulacao = null;
      this.investimentoFormatado = '';
    } else {
      const numberValue = parseInt(numbers, 10);
      this.investimentoSimulacao = numberValue / 100;
      this.investimentoFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(this.investimentoSimulacao);
    }
    this.runSimulation();
  }

  // Sensitivity
  sensitivityResults: SensitivityResult[] = [];

  // Map Integration
  map: L.Map | undefined;
  mainMarker: L.Marker | undefined;
  selectedPinMarker: L.Marker | undefined;

  center = { lat: -23.5505, lng: -46.6333 };
  zoom = 10;
  selectedPin: { lat: number, lng: number } | null = null;
  pinLoading = false;
  pinIndicators = { temperature: '--', floodRisk: '--', elevation: '--' };

  initMap() {
    if (this.map) {
      this.map.invalidateSize();
      return; 
    }
    const mapEl = document.getElementById('simulation-map');
    if (!mapEl) return;
    
    this.map = L.map('simulation-map', { zoomControl: false }).setView([this.center.lat, this.center.lng], this.zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Using Carto basemap (Free, minimal aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.updateMainMarker();

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e.latlng.lat, e.latlng.lng);
    });
  }

  updateMainMarker() {
    if (!this.map) return;
    if (this.mainMarker) {
      this.mainMarker.setLatLng([this.center.lat, this.center.lng]);
    } else {
      const cityIcon = L.divIcon({
        className: 'custom-city-icon',
        html: `<div style="background-color: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      this.mainMarker = L.marker([this.center.lat, this.center.lng], { icon: cityIcon }).addTo(this.map);
    }
    this.mainMarker.bindPopup(`<b>${this.selectedCityName}</b>`).openPopup();
  }

  ngOnInit() {
    this.route.queryParams.subscribe(qp => {
      const lat = parseFloat(qp['lat']);
      const lng = parseFloat(qp['lng']);
      const name = qp['name'] || null;
      if (!isNaN(lat) && !isNaN(lng)) {
        this.isCustomLocation = true;
        this.selectedCityName = name || `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        this.locationInfo = { name: this.selectedCityName, info: name ? `${name}. Tempo real.` : 'Localização no mapa.' };
        this.isLoading = true;
        this.fetchByCoords(lat, lng);
        return;
      }
    });

    this.route.paramMap.subscribe(() => {
      if (!this.isCustomLocation) {
        this.selectCity(this.dataService.pilotCities[0]);
      }
    });
  }

  selectCityByName(name: string) {
    const city = this.dataService.pilotCities.find((c: CityInfo) => c.name === name);
    if (city) this.selectCity(city);
  }

  selectCity(city: CityInfo) {
    this.selectedCityName = city.name;
    this.isCustomLocation = false;
    this.locationInfo = { name: city.name, info: `Análise territorial para ${city.name}.` };
    this.isLoading = true;
    this.center = { lat: city.lat, lng: city.lng };
    this.zoom = 12;
    this.clearPin();
    if (this.map) {
      this.map.setView([this.center.lat, this.center.lng], this.zoom);
      this.updateMainMarker();
    }
    this.loadIPAC(city.name, '');
    this.fetchByCoords(city.lat, city.lng);
  }

  // Map Events
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
        const pinIcon = L.divIcon({
          className: 'custom-pin-icon',
          html: `<div style="background-color: #2563eb; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        this.selectedPinMarker = L.marker([lat, lng], { icon: pinIcon }).addTo(this.map);
      }
    }
  }

  clearPin() {
    this.selectedPin = null;
    this.pinLoading = false;
    if (this.selectedPinMarker && this.map) {
      this.map.removeLayer(this.selectedPinMarker);
      this.selectedPinMarker = undefined;
    }
  }

  loadIPAC(cityName: string, state: string) {
    this.ipacLoading = true;
    this.ipacService.getSetoresIPAC(cityName, state).subscribe(data => {
      this.setoresIPAC = data;
      this.ipacLoading = false;

      const avgH = data.reduce((sum, s) => sum + s.modulo_h, 0) / data.length;
      const avgW = data.reduce((sum, s) => sum + s.modulo_w, 0) / data.length;
      const avgP = data.reduce((sum, s) => sum + s.modulo_p, 0) / data.length;
      
      let principalDriver = 'Calor (H)';
      let maxAvg = avgH;
      if (avgW > maxAvg) { principalDriver = 'Desastres Rel. Água (W)'; maxAvg = avgW; }
      if (avgP > maxAvg) { principalDriver = 'Vulnerabilidade Social (P)'; }

      this.ipacStats = {
        muitoAlta: data.filter(s => s.ipac_categoria === 'Muito Alta').length,
        alta: data.filter(s => s.ipac_categoria === 'Alta').length,
        media: data.filter(s => s.ipac_categoria === 'Média').length,
        baixa: data.filter(s => s.ipac_categoria === 'Baixa').length,
        avgScore: +(data.reduce((sum, s) => sum + s.ipac_score, 0) / data.length).toFixed(1),
        maxScore: Math.max(...data.map(s => s.ipac_score)),
        principalDriver: principalDriver
      } as any;
      
      this.selectedSetorIndex = 0;
      this.runSimulation();
      this.sensitivityResults = this.simService.runSensitivityAnalysis(data);
    });
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
    if (this.setoresIPAC.length === 0) return;
    const setor = this.setoresIPAC[this.selectedSetorIndex];
    if (this.investimentoSimulacao && this.investimentoSimulacao > 0) {
      this.simInput = this.simService.calcularIntervencoesPorInvestimento(this.investimentoSimulacao);
    }
    this.simResult = this.simService.simulateThermal(setor, this.simInput, this.cenario);
  }

  getSelectedSetor(): SetorIPAC | null {
    return this.setoresIPAC[this.selectedSetorIndex] || null;
  }

  // Helpers
  getBarHeightPx(temp: number): number { return Math.max(8, (temp / this.timelineMax) * 120); }
  formatDate(dateStr: string): string { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }); }
  getScoreBarWidth(score: number): number { return Math.min(100, Math.max(2, score)); }

  // ---- Optimization Assistant ----
  setOptimizationGoal(goal: 'cooling' | 'drainage' | 'balance') {
    this.activeGoal = goal;
    if (goal === 'cooling') {
      this.goalMessage = 'Foco Térmico: Priorizando Cobertura Arbórea densa e Telhados Frios para mitigar agressivamente as Ilhas de Calor.';
      this.cenario = 'agressivo';
      this.simInput = {
        aumentoCoberturaArborea: 40,
        aumentoAreaVerde: 15,
        reducaoImpermeabilizacao: 10,
        telhadosVerdes: 20,
        telhadosFrios: 60,
        pavimentosFrios: 30
      };
    } else if (goal === 'drainage') {
      this.goalMessage = 'Foco Hídrico: Focando na desimpermeabilização drástica e Telhados Verdes pesados para reter grandes volumes de águas pluviais.';
      this.cenario = 'agressivo';
      this.simInput = {
        aumentoCoberturaArborea: 15,
        aumentoAreaVerde: 30,
        reducaoImpermeabilizacao: 40,
        telhadosVerdes: 45,
        telhadosFrios: 10,
        pavimentosFrios: 10
      };
    } else {
      this.goalMessage = 'Foco Custo-Benefício: Distribuição harmônica equilibrando redução térmica eficiente e ganho hídrico seguro, modelo intermediário.';
      this.cenario = 'medio';
      this.simInput = {
        aumentoCoberturaArborea: 25,
        aumentoAreaVerde: 20,
        reducaoImpermeabilizacao: 25,
        telhadosVerdes: 30,
        telhadosFrios: 40,
        pavimentosFrios: 20
      };
    }
    this.runSimulation();
  }
}
