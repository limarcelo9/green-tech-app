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

  // New Indicators Data Structure
  indicators = {
    temperature: '-- °C',
    floodRisk: 'Carregando...',
    elevation: '-- m',
    population: '... hab',
    soilSealing: '... %' // Using mapbiomas concept simulation
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
    this.route.paramMap.subscribe(params => {
      const region = params.get('region');
      if (region && this.regionKeys.includes(region)) {
        this.setRegion(region);
      } else {
        this.setRegion('plano-piloto');
      }
    });
  }

  setRegion(region: string) {
    this.regionName = region;
    this.isLoading = true;
    this.fetchEnvironmentData(region);
  }

  private fetchEnvironmentData(region: string) {
    // 1. Get Static Meta Info
    this.regionInfo = this.dataService.getEnvironmentInfo(region);

    // 2. Fetch Public APIs via Service (Simulating network delay for UI effect)
    setTimeout(() => {
      // Temperature
      this.dataService.getTemperatureData(region).subscribe(data => {
        this.indicators.temperature = data;
      });

      // Flood Risk
      this.dataService.getFloodRiskData(region).subscribe(data => {
        this.indicators.floodRisk = data;
      });

      // Elevation
      this.dataService.getElevationData(region).subscribe(data => {
        this.indicators.elevation = data;
      });

      // Population
      this.dataService.getPopulationData(region).subscribe(data => {
        this.indicators.population = data;
      });

      // Soil Sealing
      this.dataService.getSoilSealingData(region).subscribe(data => {
        this.indicators.soilSealing = data;
      });

      this.isLoading = false;
    }, 800);
  }
}
