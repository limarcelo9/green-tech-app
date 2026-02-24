import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private http = inject(HttpClient);

  // Administrative Regions (RAs) of Distrito Federal
  private regionCoordinates: Record<string, { lat: number, lng: number }> = {
    'plano-piloto': { lat: -15.7938, lng: -47.8827 },
    'taguatinga': { lat: -15.8333, lng: -48.0500 },
    'ceilandia': { lat: -15.8233, lng: -48.1158 },
    'samambaia': { lat: -15.8667, lng: -48.0667 },
    'aguas-claras': { lat: -15.8368, lng: -48.0305 },
    'sobradinho': { lat: -15.6547, lng: -47.7858 }
  };

  private regionData: Record<string, { name: string, info: string, ibgeId: string }> = {
    'plano-piloto': {
      name: 'Plano Piloto',
      ibgeId: '53001080506',
      info: 'Apesar de altamente arborizada, as vastas extensões de asfalto do Eixo Monumental contribuem para o aquecimento diurno. Soluções Baseadas na Natureza (SBN) são recomendadas para parques lineares.'
    },
    'taguatinga': {
      name: 'Taguatinga',
      ibgeId: '53001080508',
      info: 'Região densamente povoada com alta impermeabilização do solo. Propensa à formação severa de Ilhas de Calor Urbanas. Investimentos físicos em tetos verdes e biovaletas são urgentes.'
    },
    'ceilandia': {
      name: 'Ceilândia',
      ibgeId: '53001080515',
      info: 'A RA com maior vulnerabilidade climática no DF devido à alta densidade e déficit de áreas verdes. A falta de árvores de rua potencializa o acúmulo de calor (WRI Brasil).'
    },
    'samambaia': {
      name: 'Samambaia',
      ibgeId: '53001080517', // Approximation, we fetched 10
      info: 'Expansão urbana rápida tem selado o solo agressivamente. A infraestrutura cinza agrava riscos de enxurradas periféricas e picos de temperatura no verão.'
    },
    'aguas-claras': {
      name: 'Águas Claras',
      ibgeId: '53001080520',
      info: 'A verticalização extrema bloqueia os ventos, criando cânions urbanos que retêm o calor noturno. Áreas permeáveis no parque central são o único sumidouro térmico.'
    },
    'sobradinho': {
      name: 'Sobradinho',
      ibgeId: '53001080510',
      info: 'Localizada em uma cota mais alta, sofre menos com a temperatura média, mas o avanço de loteamentos irregulares impermeabiliza nascentes importantes.'
    }
  };

  // 1. Fetch Temperature Focus (Open-Meteo)
  getTemperatureData(regionKey: string): Observable<string> {
    const coords = this.regionCoordinates[regionKey] || this.regionCoordinates['plano-piloto'];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,surface_temperature&timezone=America%2FSao_Paulo`;

    return this.http.get<any>(url).pipe(
      map(res => `${res.current.surface_temperature || res.current.temperature_2m || '--'} °C`),
      catchError(() => of('-- °C'))
    );
  }

  // 2. Fetch Flood Risk / Precipitation (Open-Meteo)
  getFloodRiskData(regionKey: string): Observable<string> {
    const coords = this.regionCoordinates[regionKey] || this.regionCoordinates['plano-piloto'];
    // Using standard weather API for precipitation sum to infer risk as GloFAS is complex for generic coordinates
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=precipitation_sum&timezone=America%2FSao_Paulo&forecast_days=1`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const precip = res.daily?.precipitation_sum?.[0] || 0;
        if (precip > 50) return 'ALTO (Enxurrada)';
        if (precip > 20) return 'MÉDIO (Atenção)';
        return 'BAIXO (Seguro)';
      }),
      catchError(() => of('Indisponível'))
    );
  }

  // 3. Fetch Elevation (Open-Elevation)
  getElevationData(regionKey: string): Observable<string> {
    const coords = this.regionCoordinates[regionKey] || this.regionCoordinates['plano-piloto'];
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${coords.lat},${coords.lng}`;

    return this.http.get<any>(url).pipe(
      map(res => `${res.results[0].elevation} m`),
      catchError(() => of('1000 m (Aprox)')) // Brasília average fallback
    );
  }

  // 4. Fetch Population (IBGE API Simulation - specific endpoint requires complex query builder)
  getPopulationData(regionKey: string): Observable<string> {
    // We will return a static mock mapped to the reality of the RA to avoid the extremely complex IBGE SIDRA query builder
    const popMap: Record<string, string> = {
      'plano-piloto': '214.529 hab',
      'taguatinga': '221.909 hab',
      'ceilandia': '398.374 hab',
      'samambaia': '254.439 hab',
      'aguas-claras': '135.685 hab',
      'sobradinho': '69.363 hab'
    };
    return of(popMap[regionKey] || 'N/A');
  }

  // 5. Fetch Soil Sealing (MapBiomas GraphQL integration point)
  getSoilSealingData(regionKey: string): Observable<string> {
    // For now, representing the concept. Real GraphQL requires exact territory ID from MapBiomas which takes time to map.
    const sealMap: Record<string, string> = {
      'plano-piloto': '35% Impermeabilizado',
      'taguatinga': '78% Impermeabilizado',
      'ceilandia': '85% Impermeabilizado',
      'samambaia': '68% Impermeabilizado',
      'aguas-claras': '92% Impermeabilizado', // extreme verticalization
      'sobradinho': '40% Impermeabilizado'
    };
    return of(sealMap[regionKey] || 'N/A');
  }

  getEnvironmentInfo(regionKey: string) {
    return this.regionData[regionKey] || this.regionData['plano-piloto'];
  }

  // ---- Coordinate-based methods (for arbitrary map clicks) ----

  getTemperatureByCoords(lat: number, lng: number): Observable<string> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_temperature&timezone=America%2FSao_Paulo`;
    return this.http.get<any>(url).pipe(
      map(res => `${res.current.surface_temperature || res.current.temperature_2m || '--'} °C`),
      catchError(() => of('-- °C'))
    );
  }

  getFloodRiskByCoords(lat: number, lng: number): Observable<string> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_sum&timezone=America%2FSao_Paulo&forecast_days=1`;
    return this.http.get<any>(url).pipe(
      map(res => {
        const precip = res.daily?.precipitation_sum?.[0] || 0;
        if (precip > 50) return 'ALTO (Enxurrada)';
        if (precip > 20) return 'MÉDIO (Atenção)';
        return 'BAIXO (Seguro)';
      }),
      catchError(() => of('Indisponível'))
    );
  }

  getElevationByCoords(lat: number, lng: number): Observable<string> {
    const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`;
    return this.http.get<any>(url).pipe(
      map(res => `${res.results[0].elevation} m`),
      catchError(() => of('~1000 m'))
    );
  }
}
