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
    const landCoverData = this.dataService.getVegetationData(region);
    const agricultureData = this.dataService.getClimateData(region);
    const lossData = this.dataService.getReliefData(region);

    this.vegetationChartData = {
      labels: landCoverData.labels,
      datasets: [{
        data: landCoverData.data,
        backgroundColor: ['#166534', '#eab308', '#f97316', '#3b82f6', '#94a3b8']
      }]
    };

    this.climateChartData = {
      labels: agricultureData.labels,
      datasets: [{
        data: agricultureData.data,
        label: 'Área (Milhões de Hectares)',
        backgroundColor: '#f59e0b'
      }]
    };

    this.reliefChartData = {
      labels: lossData.labels,
      datasets: [{
        data: lossData.data,
        backgroundColor: ['#ef4444', '#22c55e']
      }]
    };
  }
}
