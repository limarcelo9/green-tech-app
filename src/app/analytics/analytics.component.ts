import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MockDataService } from '../services/mock-data.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, RouterLink],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  private dataService = inject(MockDataService);

  biomeName: string = 'Brasil';
  biomeInfo: { description: string, relevance: string } | null = null;

  // MapBiomas Translators
  private biomeKeyMap: Record<string, string> = {
    amazonia: 'Amazônia',
    caatinga: 'Caatinga',
    cerrado: 'Cerrado',
    mataAtlantica: 'Mata Atlântica',
    pampa: 'Pampa',
    pantanal: 'Pantanal'
  };

  // Chart Configurations
  vegetationChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  climateChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };
  reliefChartOptions: ChartConfiguration['options'] = { responsive: true, plugins: { legend: { position: 'bottom' } } };

  vegetationChartData: ChartData<'pie'> = { labels: [], datasets: [] };
  climateChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  reliefChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const biomeParam = params.get('region');

      if (biomeParam && this.biomeKeyMap[biomeParam]) {
        this.biomeName = this.biomeKeyMap[biomeParam];
      } else {
        this.biomeName = 'Todos os Biomas (Brasil)';
      }

      this.loadMockData(biomeParam || undefined);
      this.fetchMapBiomasData(this.biomeName);
    });
  }

  private loadMockData(biomeKey?: string) {
    const landCoverData = this.dataService.getVegetationData(biomeKey);
    const nativeLossData = this.dataService.getReliefData(biomeKey);
    this.biomeInfo = this.dataService.getBiomeInfo(biomeKey);

    // 1. Cobertura de Terra (Pie Chart)
    this.vegetationChartData = {
      labels: landCoverData.labels,
      datasets: [{
        data: landCoverData.data,
        backgroundColor: ['#166534', '#eab308', '#f97316', '#3b82f6']
      }]
    };

    // 2. Vegetação Nativa vs Área Antropizada (Doughnut Chart)
    this.reliefChartData = {
      labels: nativeLossData.labels,
      datasets: [{
        data: nativeLossData.data,
        backgroundColor: ['#ef4444', '#22c55e']
      }]
    };
  }

  private fetchMapBiomasData(biomeName: string) {
    const query = `
      query {
        alertStatusByBiomes {
          biome
          total
        }
      }
    `;

    this.http.post<any>('https://plataforma.alerta.mapbiomas.org/api/v2/graphql', { query }).subscribe({
      next: (response) => {
        const data = response?.data?.alertStatusByBiomes;
        if (!data || !Array.isArray(data)) return;

        let aggregatedData = { total: 0 };

        if (biomeName === 'Todos os Biomas (Brasil)') {
          aggregatedData = data.reduce((acc: any, curr: any) => ({
            total: acc.total + (curr.total || 0),
          }), { total: 0 });
        } else {
          const filteredData = data.filter((b: any) => b.biome === biomeName);
          aggregatedData = filteredData.reduce((acc: any, curr: any) => ({
            total: acc.total + (curr.total || 0),
          }), { total: 0 });
        }

        this.updateTotalAlertsChart(aggregatedData);
      },
      error: (err) => console.error('Erro ao buscar MapBiomas:', err)
    });
  }

  private updateTotalAlertsChart(biomeData: any) {
    // 3. Resumo Total (Bar Chart) - GraphQL Real Data
    this.climateChartData = {
      labels: ['Total de Alertas Detectados'],
      datasets: [{
        data: [biomeData.total || 0],
        label: 'Quantidade de alertas de desmatamento',
        backgroundColor: '#4f46e5'
      }]
    };
  }
}
