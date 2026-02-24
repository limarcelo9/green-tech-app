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
      labels: ['Amazônia', 'Cerrado', 'Mata Atlântica', 'Caatinga', 'Pampa', 'Pantanal'],
      data: [49.2, 23.9, 13.0, 9.9, 2.0, 1.8]
    },
    climate: {
      labels: ['Equatorial', 'Tropical', 'Semiárido', 'Subtropical'],
      data: [35, 45, 10, 10]
    },
    relief: {
      labels: ['Planaltos', 'Depressões', 'Planícies'],
      data: [45, 40, 15]
    }
  };

  private regionData: Record<string, any> = {
    norte: {
      vegetation: { labels: ['Amazônia', 'Cerrado'], data: [95, 5] },
      climate: { labels: ['Equatorial', 'Tropical'], data: [90, 10] },
      relief: { labels: ['Planícies', 'Depressões', 'Planaltos'], data: [45, 30, 25] }
    },
    nordeste: {
      vegetation: { labels: ['Caatinga', 'Mata Atlântica', 'Cerrado', 'Amazônia'], data: [50, 20, 25, 5] },
      climate: { labels: ['Semiárido', 'Tropical', 'Equatorial'], data: [60, 30, 10] },
      relief: { labels: ['Planaltos', 'Depressões', 'Planícies'], data: [60, 30, 10] }
    },
    centroOeste: {
      vegetation: { labels: ['Cerrado', 'Pantanal', 'Amazônia'], data: [65, 20, 15] },
      climate: { labels: ['Tropical', 'Equatorial'], data: [95, 5] },
      relief: { labels: ['Planaltos', 'Depressões', 'Planícies'], data: [55, 35, 10] }
    },
    sudeste: {
      vegetation: { labels: ['Mata Atlântica', 'Cerrado'], data: [80, 20] },
      climate: { labels: ['Tropical de Altitude', 'Tropical'], data: [75, 25] },
      relief: { labels: ['Planaltos', 'Escarpas'], data: [85, 15] }
    },
    sul: {
      vegetation: { labels: ['Mata Atlântica', 'Pampa', 'Mata de Araucárias'], data: [40, 35, 25] },
      climate: { labels: ['Subtropical'], data: [100] },
      relief: { labels: ['Planaltos', 'Planícies'], data: [70, 30] }
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
