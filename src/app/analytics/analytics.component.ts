import { Component, inject, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { MockDataService } from '../services/mock-data.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.css'
})
export class AnalyticsComponent implements OnInit {
  private dataService = inject(MockDataService);
  private route = inject(ActivatedRoute);

  public regionName: string = 'Brasil';

  // Chart Data Holders
  public vegetationChartData!: ChartConfiguration<'pie'>['data'];
  public vegetationChartOptions: ChartOptions<'pie'> = { responsive: true };

  public climateChartData!: ChartConfiguration<'bar'>['data'];
  public climateChartOptions: ChartOptions<'bar'> = { responsive: true };

  public reliefChartData!: ChartConfiguration<'doughnut'>['data'];
  public reliefChartOptions: ChartOptions<'doughnut'> = { responsive: true };

  ngOnInit(): void {
    // Read the region from route e.g. /analytics/nordeste
    this.route.paramMap.subscribe(params => {
      const regionParam = params.get('region');
      if (regionParam) {
        // Format the string roughly to title case for display
        this.regionName = regionParam.charAt(0).toUpperCase() + regionParam.slice(1);
      } else {
        this.regionName = 'Brasil';
      }
      this.loadData(regionParam || undefined);
    });
  }

  private loadData(region?: string) {
    const vegData = this.dataService.getVegetationData(region);
    const climData = this.dataService.getClimateData(region);
    const relData = this.dataService.getReliefData(region);

    this.vegetationChartData = {
      labels: vegData.labels,
      datasets: [{
        data: vegData.data,
        backgroundColor: ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac']
      }]
    };

    this.climateChartData = {
      labels: climData.labels,
      datasets: [{
        data: climData.data,
        label: 'Cobertura Climática (%)',
        backgroundColor: '#f59e0b'
      }]
    };

    this.reliefChartData = {
      labels: relData.labels,
      datasets: [{
        data: relData.data,
        backgroundColor: ['#64748b', '#94a3b8', '#cbd5e1']
      }]
    };
  }
}
