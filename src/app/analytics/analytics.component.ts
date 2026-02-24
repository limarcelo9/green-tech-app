import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MockDataService } from '../services/mock-data.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(MockDataService);

  regionName: string = 'plano-piloto';
  isLoading = true;
  isCustomLocation = false;

  // New Indicators Data Structure
  indicators = {
    temperature: '-- °C',
    floodRisk: 'Carregando...',
    elevation: '-- m',
    population: '... hab',
    soilSealing: '... %'
  };

  regionInfo = {
    name: 'Plano Piloto',
    info: 'Apesar de altamente arborizada, as vastas extensões de asfalto do Eixo Monumental contribuem para o aquecimento diurno.',
    ibgeId: '?'
  };

  // Supported DF Regions map
  regionKeys = ['plano-piloto', 'taguatinga', 'ceilandia', 'samambaia', 'aguas-claras', 'sobradinho'];

  // Mapeamento amigável para exibição nos botões
  regionLabels: Record<string, string> = {
    'plano-piloto': 'Plano Piloto',
    'taguatinga': 'Taguatinga',
    'ceilandia': 'Ceilândia',
    'samambaia': 'Samambaia',
    'aguas-claras': 'Águas Claras',
    'sobradinho': 'Sobradinho'
  };

  ngOnInit() {
    // Check for custom coordinates (from map click)
    this.route.queryParams.subscribe(qp => {
      const lat = parseFloat(qp['lat']);
      const lng = parseFloat(qp['lng']);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.isCustomLocation = true;
        this.regionInfo = {
          name: `📍 Ponto: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          info: 'Localização selecionada manualmente no mapa. Os dados abaixo são obtidos em tempo real para estas coordenadas específicas via Open-Meteo e Open-Elevation.',
          ibgeId: 'custom'
        };
        this.isLoading = true;
        this.fetchByCoords(lat, lng);
        return;
      }
    });

    // Fallback: check route param for predefined RAs
    this.route.paramMap.subscribe(params => {
      const region = params.get('region');
      if (!this.isCustomLocation) {
        if (region && this.regionKeys.includes(region)) {
          this.setRegion(region);
        } else {
          this.setRegion('plano-piloto');
        }
      }
    });
  }

  setRegion(region: string) {
    this.regionName = region;
    this.isCustomLocation = false;
    this.isLoading = true;
    this.fetchEnvironmentData(region);
  }

  private fetchEnvironmentData(region: string) {
    this.regionInfo = this.dataService.getEnvironmentInfo(region);

    setTimeout(() => {
      this.dataService.getTemperatureData(region).subscribe(data => {
        this.indicators.temperature = data;
      });
      this.dataService.getFloodRiskData(region).subscribe(data => {
        this.indicators.floodRisk = data;
      });
      this.dataService.getElevationData(region).subscribe(data => {
        this.indicators.elevation = data;
      });
      this.dataService.getPopulationData(region).subscribe(data => {
        this.indicators.population = data;
      });
      this.dataService.getSoilSealingData(region).subscribe(data => {
        this.indicators.soilSealing = data;
      });
      this.isLoading = false;
    }, 800);
  }

  private fetchByCoords(lat: number, lng: number) {
    this.indicators = {
      temperature: '...', floodRisk: '...', elevation: '...', population: 'N/A (ponto customizado)', soilSealing: 'N/A (ponto customizado)'
    };

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
  }
}
