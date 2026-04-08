import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import * as L from "leaflet";
import "leaflet-draw";
import { MockDataService, CityInfo, TimelinePoint } from "../services/mock-data.service";
import { IpacService, SetorIPAC } from "../services/ipac.service";
import { SimulationService, SimulationResult, SensitivityResult, Cenario, SimulationInput, SolutionCost } from "../services/simulation.service";
import { BIBLIOTECA_SOLUCOES, SolucaoSimulacao } from "../constants/solucoes-simulacao";

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
 
   showIntegrityDetails = false;
  selectedCityName = "Brasília";
  isLoading = true;
  isCustomLocation = false;
  isOficial = false;
  dataFonte = "";
  showOnlyAnomalies = false;
  selectedAnomaly: SetorIPAC | null = null;

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

  get filteredSetores(): SetorIPAC[] {
    if (this.showOnlyAnomalies) {
      return this.setoresIPAC.filter(s => s.isAnomalia);
    }
    return this.setoresIPAC;
  }

  toggleAnomalyFilter() {
    this.showOnlyAnomalies = !this.showOnlyAnomalies;
    if (this.showOnlyAnomalies) {
      this.setTab("simulation");
      
      // Smart Focus: Identifica o hotspot mais crítico (maior LST) para zoom imediato
      const critical = [...this.setoresIPAC]
        .filter(s => s.isAnomalia)
        .sort((a, b) => (b.lst_p90 || 0) - (a.lst_p90 || 0))[0];

      if (critical) {
        // Sincroniza o seletor (combo) com a anomalia detectada
        this.selectedSetorIndex = this.setoresIPAC.findIndex(s => s.id_ra === critical.id_ra);
        this.runSimulation(); // Atualiza indicadores técnicos imediatamente
      }

      setTimeout(() => {
        if (this.map) {
          if (critical && critical.lat && critical.lng) {
            this.map.setView([critical.lat, critical.lng], 16);
          }
          this.updateAnomalyMarkers(); // Atualiza camadas, incluindo o novo sonar geográfico
        }
      }, 400);
    } else {
      if (this.map) this.updateAnomalyMarkers();
    }
  }

  openAnomalyReport(setor: SetorIPAC) {
    this.selectedAnomaly = setor;
    this.activeTab = "ipac"; // Garante visibilidade
    if (this.map && setor.lat && setor.lng) {
      this.map.setView([setor.lat, setor.lng], 14);
    }
  }

  setTab(tab: 'ipac' | 'simulation' | 'sensitivity' | 'indicators') {
    this.activeTab = tab;
    if (tab === 'simulation') {
      setTimeout(() => {
        this.initMap();
        // Garantia extra para o novo layout Full Width v2.5
        this.map?.invalidateSize();
      }, 300);
    }
  }

  // Simulation
  selectedSetorIndex = 0;
  cenario: Cenario = 'medio';
  
  // Estado dinâmico lido iterativamente da constante
  simInput: SimulationInput = BIBLIOTECA_SOLUCOES.reduce((acc, sol) => ({ ...acc, [sol.id]: 0 }), {});
  
  get solucoesCalor() { return BIBLIOTECA_SOLUCOES.filter(s => s.eixo_principal === 'calor'); }
  get solucoesAgua() { return BIBLIOTECA_SOLUCOES.filter(s => s.eixo_principal === 'agua'); }
  get solucoesQualidade() { return BIBLIOTECA_SOLUCOES.filter(s => s.eixo_principal === 'qualidade_urbana'); }

  openAccordion: string | null = 'calor';
  toggleAccordion(eixo: string) {
    this.openAccordion = this.openAccordion === eixo ? null : eixo;
  }
  simResult: SimulationResult | null = null;
  investimentoSimulacao: number | null = null;
  investimentoFormatado = '';

  // Optimization Assistant state
  activeGoal: string | null = null;
  goalMessage: string = 'Selecione um objetivo acima para otimizar os parâmetros via Inteligência Artificial.';

  onInvestimentoChange(value: string) {
    if (!value) {
      this.investimentoSimulacao = null;
      this.investimentoFormatado = "";
      this.runSimulation();
      return;
    }
    // Extrai apenas dígitos e limita a 12 chars (R$ 9.999.999.999,99)
    const digits = value.replace(/\D/g, "").slice(0, 12);
    if (!digits) {
      this.investimentoSimulacao = null;
      this.investimentoFormatado = "";
    } else {
      const centavos = parseInt(digits, 10);
      this.investimentoSimulacao = centavos / 100;
      this.investimentoFormatado = new Intl.NumberFormat("pt-BR", {
        style: "currency", currency: "BRL",
        minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(this.investimentoSimulacao);
    }
    this.runSimulation();
  }

  // Sensitivity
  sensitivityResults: SensitivityResult[] = [];

  // Map Integration
  map: L.Map | undefined;
  anomalyLayerGroup: L.LayerGroup | undefined;
  mainMarker: L.Marker | undefined;
  selectedPinMarker: L.Marker | undefined;
  drawControl: any;
  drawnItems: L.FeatureGroup = new L.FeatureGroup();

  center = { lat: -23.5505, lng: -46.6333 };
  zoom = 10;
  selectedPin: { lat: number, lng: number } | null = null;
  pinLoading = false;
  pinIndicators = { temperature: "--", floodRisk: "--", elevation: "--" };
  pinTemperatureSource: "api" | "lst_satelite" | null = null;

  // Drawing / Measurement
  measuredArea: number | null = null;
  measuredSuggestions: { solucao: SolucaoSimulacao; quantidade: number; custoTotal: number }[] = [];
  showMeasurePanel = false;

  // Modal de detalhamento de solução
  showSolutionModal = false;
  selectedSolution: SolucaoSimulacao | null = null;
  selectedSolutionCost: SolutionCost | null = null;

  // Biblioteca de soluções (ref para o template)
  readonly biblioteca = BIBLIOTECA_SOLUCOES;

  initMap() {
    const mapEl = document.getElementById("simulation-map");
    if (!mapEl) return;

    if (this.map) {
      // Se a instância já estiver vinculada ao elemento atual, apenas redimensiona e atualiza camadas
      if (this.map.getContainer() === mapEl) {
        this.map.invalidateSize();
        this.updateAnomalyMarkers();
        return;
      }
      // Se o container mudou (ex: via *ngIf), precisamos destruir a instância anterior
      this.map.remove();
      this.map = undefined;
      this.mainMarker = undefined;
      this.selectedPinMarker = undefined;
    }
    
    this.map = L.map("simulation-map", { zoomControl: false }).setView([this.center.lat, this.center.lng], this.zoom);
    L.control.zoom({ position: "bottomright" }).addTo(this.map);

    // Carto Dark Matter for premium feel
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(this.map);

    this.anomalyLayerGroup = L.layerGroup().addTo(this.map);
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Leaflet Draw Controls
    this.drawControl = new (L as any).Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: { color: "#10b981", weight: 2, fillOpacity: 0.15 }
        },
        circle: {
          shapeOptions: { color: "#3b82f6", weight: 2, fillOpacity: 0.1 }
        },
        rectangle: {
          shapeOptions: { color: "#a855f7", weight: 2, fillOpacity: 0.1 }
        },
        polyline: false,
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      }
    });
    this.map.addControl(this.drawControl);

    // Draw Events
    this.map.on((L as any).Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      this.drawnItems.addLayer(layer);
      this.onShapeDrawn(layer, e.layerType);
    });

    this.map.on((L as any).Draw.Event.DELETED, () => {
      this.closeMeasurePanel();
    });

    this.updateMainMarker();
    this.updateAnomalyMarkers();

    this.map.on("click", (e: L.LeafletMouseEvent) => {
      this.onMapClick(e.latlng.lat, e.latlng.lng);
    });
  }


  updateMainMarker() {
    if (!this.map) return;
    if (this.mainMarker) {
      this.mainMarker.setLatLng([this.center.lat, this.center.lng]);
    } else {
      const cityIcon = L.divIcon({
        className: "custom-city-icon",
        html: `<div style="background-color: #16a34a; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      this.mainMarker = L.marker([this.center.lat, this.center.lng], { icon: cityIcon }).addTo(this.map);
    }
    this.mainMarker.bindPopup(`<b>${this.selectedCityName}</b>`).openPopup();
  }

  updateAnomalyMarkers() {
    if (!this.map || !this.anomalyLayerGroup) return;
    this.anomalyLayerGroup.clearLayers();

    if (this.showOnlyAnomalies || this.setoresIPAC[this.selectedSetorIndex]?.isAnomalia) {
      const selectedSetor = this.setoresIPAC[this.selectedSetorIndex];
      
      // Sonar Geo-Precisão: 10km de raio real no mapa
      if (selectedSetor && selectedSetor.isAnomalia && selectedSetor.lat && selectedSetor.lng) {
        L.circle([selectedSetor.lat, selectedSetor.lng], {
          radius: 10000, 
          className: "sonar-geocircle",
          interactive: false
        }).addTo(this.anomalyLayerGroup);
      }

      // Mantém os radares individuais para todas as anomalias detectadas
      const anomalies = this.setoresIPAC.filter(s => s.isAnomalia);
      anomalies.forEach(s => {
        if (s.lat && s.lng) {
          const radarIcon = L.divIcon({
            className: "radar-anomalia",
            html: `<div class="radar-anomalia-core"></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          const m = L.marker([s.lat, s.lng], { icon: radarIcon }).addTo(this.anomalyLayerGroup!);
          m.bindPopup(`
            <div class="p-2">
              <p class="text-[10px] font-black text-red-600 uppercase mb-1">🔬 Anomalia Detectada</p>
              <p class="text-xs font-bold mb-2">${s.ra_nome}</p>
              <button onclick="window.dispatchEvent(new CustomEvent('open-anomaly-report', {detail: '${s.id_ra}'}))" 
                class="w-full py-1 bg-red-600 text-white text-[9px] font-bold rounded uppercase">Ver Relatório Comparativo</button>
            </div>
          `);
        }
      });
    }
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

    window.addEventListener("open-anomaly-report", (e: any) => {
      const id = e.detail;
      const setor = this.setoresIPAC.find(s => s.id_ra === id);
      if (setor) this.openAnomalyReport(setor);
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
    this.showOnlyAnomalies = false;
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
    this.pinTemperatureSource = null;
    this.pinIndicators = { temperature: "...", floodRisk: "...", elevation: "..." };

    // Busca temperatura com fallback para LST do setor selecionado
    this.dataService.getTemperatureByCoords(lat, lng).subscribe(val => {
      if (val === "-- °C" || val === "... °C") {
        // Fallback: usar LST P90 do setor IPAC selecionado
        const setor = this.getSelectedSetor();
        if (setor && setor.lst_p90) {
          this.pinIndicators.temperature = `${setor.lst_p90.toFixed(1)} °C`;
          this.pinTemperatureSource = "lst_satelite";
        } else {
          this.pinIndicators.temperature = val;
          this.pinTemperatureSource = "api";
        }
      } else {
        this.pinIndicators.temperature = val;
        this.pinTemperatureSource = "api";
      }
    });
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
    this.showOnlyAnomalies = false;
    this.ipacService.getSetoresIPAC(cityName, state).subscribe(data => {
      this.setoresIPAC = data;
      this.ipacLoading = false;

      this.isOficial = data.length > 0 ? data[0].isOficial : false;
      this.dataFonte = data.length > 0 ? data[0].fonte : "";

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
      const areaSetor = setor.area_total_m2 || 1000000;
      this.simInput = this.simService.calcularIntervencoesPorInvestimento(this.investimentoSimulacao, areaSetor);
    }
    this.simResult = this.simService.simulateThermal(setor, this.simInput, this.cenario);

    // Auto-pin no mapa ao selecionar setor
    if (setor.lat && setor.lng && this.map) {
      this.onMapClick(setor.lat, setor.lng);
      this.map.setView([setor.lat, setor.lng], 13);
      this.updateAnomalyMarkers(); // Sincroniza o Sonar 10km com a seleção atual
      
      // Delay para garantir que o container full-width já esteja estabilizado
      setTimeout(() => this.map?.invalidateSize(), 150);
    }
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
    // Reinicia tudo a zero
    const base: SimulationInput = BIBLIOTECA_SOLUCOES.reduce((acc, sol) => ({ ...acc, [sol.id]: 0 }), {});

    if (goal === 'cooling') {
      this.goalMessage = 'Foco Térmico: Priorizando Cobertura Arbórea densa e Telhados Frios para mitigar agressivamente as Ilhas de Calor.';
      this.cenario = 'agressivo';
      this.simInput = {
        ...base,
        cobertura_arborea: 40,
        area_verde: 15,
        desimpermeabilizacao: 10,
        telhado_verde: 20,
        telhado_frio: 60,
        pavimento_frio: 30,
        parede_verde: 15
      };
    } else if (goal === 'drainage') {
      this.goalMessage = 'Foco Hídrico: Focando na desimpermeabilização drástica e infraestrutura verde para reter grandes volumes de águas pluviais.';
      this.cenario = 'agressivo';
      this.simInput = {
        ...base,
        cobertura_arborea: 15,
        area_verde: 30,
        desimpermeabilizacao: 40,
        telhado_verde: 45,
        jardim_de_chuva: 30,
        biovaleta: 25,
        pavimento_permeavel: 30,
        bacia_retencao: 20
      };
    } else {
      this.goalMessage = 'Foco Custo-Benefício: Distribuição harmônica equilibrando redução térmica eficiente e ganho hídrico seguro, modelo intermediário.';
      this.cenario = 'medio';
      this.simInput = {
        ...base,
        cobertura_arborea: 25,
        area_verde: 20,
        desimpermeabilizacao: 25,
        telhado_verde: 30,
        telhado_frio: 40,
        pavimento_frio: 20,
        jardim_de_chuva: 15,
        parques_lineares: 15,
        pavimento_permeavel: 15
      };
    }
    this.runSimulation();
  }

  // ---- Map Drawing / Measurement ----
  onShapeDrawn(layer: any, layerType: string) {
    let areaM2 = 0;

    if (layerType === "circle") {
      const radius = layer.getRadius();
      areaM2 = Math.PI * radius * radius;
    } else if (layerType === "polygon" || layerType === "rectangle") {
      // Geodesic area via Leaflet
      const latlngs = layer.getLatLngs()[0];
      areaM2 = Math.abs((L as any).GeometryUtil?.geodesicArea(latlngs) || this.calcPolygonArea(latlngs));
    }

    this.measuredArea = +areaM2.toFixed(0);
    this.measuredSuggestions = this.calcSugestoes(areaM2);
    this.showMeasurePanel = true;

    // Popup no shape
    const center = layer.getBounds ? layer.getBounds().getCenter() : layer.getLatLng();
    L.popup({ className: "measure-popup" })
      .setLatLng(center)
      .setContent(`<div class="p-2 text-center">
        <p class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">📐 Área Medida</p>
        <p class="text-lg font-black text-white">${this.measuredArea?.toLocaleString("pt-BR")} m²</p>
      </div>`)
      .openOn(this.map!);
  }

  private calcPolygonArea(latlngs: L.LatLng[]): number {
    // Shoelace formula approximation
    let area = 0;
    const n = latlngs.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += latlngs[i].lng * latlngs[j].lat;
      area -= latlngs[j].lng * latlngs[i].lat;
    }
    return Math.abs(area / 2) * 111319.9 * 111319.9; // deg² to m² approximation
  }

  private calcSugestoes(areaM2: number): { solucao: SolucaoSimulacao; quantidade: number; custoTotal: number }[] {
    return BIBLIOTECA_SOLUCOES
      .filter(sol => sol.custo_unitario && sol.custo_unitario > 0)
      .map(sol => {
        let quantidade: number;
        if (sol.unidade === "unidade" && sol.area_equivalente) {
          quantidade = Math.floor(areaM2 / sol.area_equivalente);
        } else {
          quantidade = areaM2;
        }
        const custoTotal = quantidade * (sol.custo_unitario || 0) * sol.fator_regional;
        return { solucao: sol, quantidade: +quantidade.toFixed(0), custoTotal: +custoTotal.toFixed(0) };
      })
      .filter(s => s.quantidade > 0)
      .sort((a, b) => a.custoTotal - b.custoTotal);
  }

  closeMeasurePanel() {
    this.showMeasurePanel = false;
    this.measuredArea = null;
    this.measuredSuggestions = [];
  }

  // ---- Modal de Detalhamento ----
  openSolutionModal(solId: string) {
    this.selectedSolution = BIBLIOTECA_SOLUCOES.find(s => s.id === solId) || null;
    if (this.simResult) {
      this.selectedSolutionCost = this.simResult.financeiro.detalhePorSolucao.find(s => s.id === solId) || null;
    }
    this.showSolutionModal = true;
  }

  closeSolutionModal() {
    this.showSolutionModal = false;
    this.selectedSolution = null;
    this.selectedSolutionCost = null;
  }

  getEixoIcon(eixo: string): string {
    switch (eixo) {
      case "calor": return "🔥";
      case "agua": return "💧";
      case "qualidade_urbana": return "🌿";
      default: return "📍";
    }
  }

  getEixoLabel(eixo: string): string {
    switch (eixo) {
      case "calor": return "Eixo Calor";
      case "agua": return "Eixo Água";
      case "qualidade_urbana": return "Qualidade Urbana";
      default: return eixo;
    }
  }
}
