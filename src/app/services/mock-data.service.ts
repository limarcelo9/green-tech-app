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

  getVegetationData(): ChartData {
    return {
      labels: ['Amazônia', 'Cerrado', 'Mata Atlântica', 'Caatinga', 'Pampa', 'Pantanal'],
      data: [49.2, 23.9, 13.0, 9.9, 2.0, 1.8] // In percentage %
    };
  }

  getClimateData(): ChartData {
    return {
      labels: ['Equatorial', 'Tropical', 'Semiárido', 'Subtropical'],
      data: [35, 45, 10, 10] // In percentage %
    };
  }

  getReliefData(): ChartData {
    return {
      labels: ['Planaltos', 'Depressões', 'Planícies'],
      data: [45, 40, 15] // Distribution %
    };
  }
}

