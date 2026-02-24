import { Injectable } from '@angular/core';

export interface ChartData {
  labels: string[];
  data: number[];
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  constructor() { }

  private countryData = {
    vegetation: {
      labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'],
      data: [490, 90, 240, 31]
    },
    climate: {
      labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'],
      data: [160, 75, 5]
    },
    relief: {
      labels: ['Antropizada', 'Nativa Conservada'],
      data: [300, 550]
    }
  };

  private regionData: Record<string, any> = {
    norte: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [310, 10, 35, 15] },
      climate: { labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'], data: [32, 2, 1] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [35, 335] }
    },
    nordeste: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [30, 55, 45, 5] },
      climate: { labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'], data: [25, 18, 2] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [45, 90] }
    },
    centroOeste: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [50, 35, 65, 6] },
      climate: { labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'], data: [40, 24, 1] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [65, 91] }
    },
    sudeste: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [20, 5, 60, 3] },
      climate: { labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'], data: [45, 14, 1] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [60, 28] }
    },
    sul: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [15, 3, 35, 1] },
      climate: { labels: ['Pastagem', 'Agricultura', 'Cultivo Florestal'], data: [12, 22, 1] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [35, 19] }
    }
  };

  getVegetationData(region?: string): ChartData {
    if (region && this.regionData[region]) return this.regionData[region].vegetation;
    return this.countryData.vegetation;
  }

  getClimateData(region?: string): ChartData {
    if (region && this.regionData[region]) return this.regionData[region].climate;
    return this.countryData.climate;
  }

  getReliefData(region?: string): ChartData {
    if (region && this.regionData[region]) return this.regionData[region].relief;
    return this.countryData.relief;
  }
}
