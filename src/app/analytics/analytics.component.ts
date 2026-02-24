import { Component, inject } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { MockDataService, ChartData } from '../services/mock-data.service';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent {
  private dataService = inject(MockDataService);

  private vegetation = this.dataService.getVegetationData();
  private climate = this.dataService.getClimateData();
  private relief = this.dataService.getReliefData();

  // Vegetation Pie Chart
  public vegetationChartData: ChartConfiguration<'pie'>['data'] = {
    labels: this.vegetation.labels,
    datasets: [{
      data: this.vegetation.data,
      backgroundColor: ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac']
    }]
  };
  public vegetationChartOptions: ChartOptions<'pie'> = { responsive: true };

  // Climate Bar Chart
  public climateChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.climate.labels,
    datasets: [{
      data: this.climate.data,
      label: 'Cobertura Climática (%)',
      backgroundColor: '#f59e0b'
    }]
  };
  public climateChartOptions: ChartOptions<'bar'> = { responsive: true };

  // Relief Doughnut Chart
  public reliefChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: this.relief.labels,
    datasets: [{
      data: this.relief.data,
      backgroundColor: ['#64748b', '#94a3b8', '#cbd5e1']
    }]
  };
  public reliefChartOptions: ChartOptions<'doughnut'> = { responsive: true };
}
