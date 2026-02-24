import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface StateInfo {
  name: string;
  sigla: string;
  lat: number;
  lng: number;
  zoom: number;
}

export interface CityInfo {
  name: string;
  lat: number;
  lng: number;
}

export interface TimelinePoint {
  date: string;
  tempMax: number;
  tempMin: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private http = inject(HttpClient);

  // ===================== ESTADOS =====================
  readonly states: Record<string, StateInfo> = {
    'AC': { name: 'Acre', sigla: 'AC', lat: -9.9754, lng: -67.8249, zoom: 7 },
    'AL': { name: 'Alagoas', sigla: 'AL', lat: -9.6658, lng: -35.7353, zoom: 8 },
    'AP': { name: 'Amapá', sigla: 'AP', lat: 0.0349, lng: -51.0694, zoom: 7 },
    'AM': { name: 'Amazonas', sigla: 'AM', lat: -3.1190, lng: -60.0217, zoom: 6 },
    'BA': { name: 'Bahia', sigla: 'BA', lat: -12.9714, lng: -38.5124, zoom: 6 },
    'CE': { name: 'Ceará', sigla: 'CE', lat: -3.7172, lng: -38.5433, zoom: 7 },
    'DF': { name: 'Distrito Federal', sigla: 'DF', lat: -15.7938, lng: -47.8827, zoom: 10 },
    'ES': { name: 'Espírito Santo', sigla: 'ES', lat: -20.3155, lng: -40.3128, zoom: 8 },
    'GO': { name: 'Goiás', sigla: 'GO', lat: -16.6869, lng: -49.2648, zoom: 7 },
    'MA': { name: 'Maranhão', sigla: 'MA', lat: -2.5297, lng: -44.2825, zoom: 7 },
    'MT': { name: 'Mato Grosso', sigla: 'MT', lat: -15.6010, lng: -56.0974, zoom: 6 },
    'MS': { name: 'Mato Grosso do Sul', sigla: 'MS', lat: -20.4697, lng: -54.6201, zoom: 7 },
    'MG': { name: 'Minas Gerais', sigla: 'MG', lat: -19.9167, lng: -43.9345, zoom: 6 },
    'PA': { name: 'Pará', sigla: 'PA', lat: -1.4558, lng: -48.5024, zoom: 6 },
    'PB': { name: 'Paraíba', sigla: 'PB', lat: -7.1195, lng: -34.8450, zoom: 8 },
    'PR': { name: 'Paraná', sigla: 'PR', lat: -25.4284, lng: -49.2733, zoom: 7 },
    'PE': { name: 'Pernambuco', sigla: 'PE', lat: -8.0476, lng: -34.8770, zoom: 7 },
    'PI': { name: 'Piauí', sigla: 'PI', lat: -5.0892, lng: -42.8019, zoom: 7 },
    'RJ': { name: 'Rio de Janeiro', sigla: 'RJ', lat: -22.9068, lng: -43.1729, zoom: 8 },
    'RN': { name: 'Rio Grande do Norte', sigla: 'RN', lat: -5.7945, lng: -35.2110, zoom: 8 },
    'RS': { name: 'Rio Grande do Sul', sigla: 'RS', lat: -30.0346, lng: -51.2177, zoom: 7 },
    'RO': { name: 'Rondônia', sigla: 'RO', lat: -8.7612, lng: -63.9004, zoom: 7 },
    'RR': { name: 'Roraima', sigla: 'RR', lat: 2.8195, lng: -60.6714, zoom: 7 },
    'SC': { name: 'Santa Catarina', sigla: 'SC', lat: -27.5954, lng: -48.5480, zoom: 7 },
    'SP': { name: 'São Paulo', sigla: 'SP', lat: -23.5505, lng: -46.6333, zoom: 7 },
    'SE': { name: 'Sergipe', sigla: 'SE', lat: -10.9091, lng: -37.0677, zoom: 9 },
    'TO': { name: 'Tocantins', sigla: 'TO', lat: -10.1689, lng: -48.3317, zoom: 7 }
  };

  readonly stateKeys = Object.keys(this.states);

  // ===================== CIDADES POR ESTADO =====================
  readonly citiesByState: Record<string, CityInfo[]> = {
    'AC': [{ name: 'Rio Branco', lat: -9.9754, lng: -67.8249 }, { name: 'Cruzeiro do Sul', lat: -7.6277, lng: -72.6698 }],
    'AL': [{ name: 'Maceió', lat: -9.6658, lng: -35.7353 }, { name: 'Arapiraca', lat: -9.7526, lng: -36.6611 }],
    'AP': [{ name: 'Macapá', lat: 0.0349, lng: -51.0694 }, { name: 'Santana', lat: -0.0584, lng: -51.1725 }],
    'AM': [{ name: 'Manaus', lat: -3.1190, lng: -60.0217 }, { name: 'Parintins', lat: -2.6284, lng: -56.7369 }],
    'BA': [{ name: 'Salvador', lat: -12.9714, lng: -38.5124 }, { name: 'Feira de Santana', lat: -12.2669, lng: -38.9668 }, { name: 'Vitória da Conquista', lat: -14.8619, lng: -40.8444 }],
    'CE': [{ name: 'Fortaleza', lat: -3.7172, lng: -38.5433 }, { name: 'Juazeiro do Norte', lat: -7.2131, lng: -39.3153 }, { name: 'Sobral', lat: -3.6861, lng: -40.3481 }],
    'DF': [
      { name: 'Plano Piloto', lat: -15.7938, lng: -47.8827 },
      { name: 'Taguatinga', lat: -15.8333, lng: -48.0500 },
      { name: 'Ceilândia', lat: -15.8233, lng: -48.1158 },
      { name: 'Samambaia', lat: -15.8667, lng: -48.0667 },
      { name: 'Águas Claras', lat: -15.8368, lng: -48.0305 },
      { name: 'Sobradinho', lat: -15.6547, lng: -47.7858 }
    ],
    'ES': [{ name: 'Vitória', lat: -20.3155, lng: -40.3128 }, { name: 'Vila Velha', lat: -20.3297, lng: -40.2925 }, { name: 'Serra', lat: -20.1209, lng: -40.3075 }],
    'GO': [{ name: 'Goiânia', lat: -16.6869, lng: -49.2648 }, { name: 'Anápolis', lat: -16.3281, lng: -48.9529 }, { name: 'Aparecida de Goiânia', lat: -16.8198, lng: -49.2469 }],
    'MA': [{ name: 'São Luís', lat: -2.5297, lng: -44.2825 }, { name: 'Imperatriz', lat: -5.5189, lng: -47.4735 }],
    'MT': [{ name: 'Cuiabá', lat: -15.6010, lng: -56.0974 }, { name: 'Várzea Grande', lat: -15.6462, lng: -56.1324 }, { name: 'Rondonópolis', lat: -16.4713, lng: -54.6374 }],
    'MS': [{ name: 'Campo Grande', lat: -20.4697, lng: -54.6201 }, { name: 'Dourados', lat: -22.2233, lng: -54.8118 }, { name: 'Três Lagoas', lat: -20.7849, lng: -51.7008 }],
    'MG': [{ name: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 }, { name: 'Uberlândia', lat: -18.9186, lng: -48.2772 }, { name: 'Juiz de Fora', lat: -21.7642, lng: -43.3503 }],
    'PA': [{ name: 'Belém', lat: -1.4558, lng: -48.5024 }, { name: 'Ananindeua', lat: -1.3659, lng: -48.3886 }, { name: 'Santarém', lat: -2.4313, lng: -54.6988 }],
    'PB': [{ name: 'João Pessoa', lat: -7.1195, lng: -34.8450 }, { name: 'Campina Grande', lat: -7.2290, lng: -35.8811 }],
    'PR': [{ name: 'Curitiba', lat: -25.4284, lng: -49.2733 }, { name: 'Londrina', lat: -23.3045, lng: -51.1696 }, { name: 'Maringá', lat: -23.4205, lng: -51.9333 }],
    'PE': [{ name: 'Recife', lat: -8.0476, lng: -34.8770 }, { name: 'Jaboatão', lat: -8.1130, lng: -35.0152 }, { name: 'Caruaru', lat: -8.2833, lng: -35.9761 }],
    'PI': [{ name: 'Teresina', lat: -5.0892, lng: -42.8019 }, { name: 'Parnaíba', lat: -2.9055, lng: -41.7769 }],
    'RJ': [{ name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 }, { name: 'Niterói', lat: -22.8833, lng: -43.1036 }, { name: 'Nova Iguaçu', lat: -22.7556, lng: -43.4603 }],
    'RN': [{ name: 'Natal', lat: -5.7945, lng: -35.2110 }, { name: 'Mossoró', lat: -5.1878, lng: -37.3442 }],
    'RS': [{ name: 'Porto Alegre', lat: -30.0346, lng: -51.2177 }, { name: 'Caxias do Sul', lat: -29.1681, lng: -51.1794 }, { name: 'Pelotas', lat: -31.7654, lng: -52.3376 }],
    'RO': [{ name: 'Porto Velho', lat: -8.7612, lng: -63.9004 }, { name: 'Ji-Paraná', lat: -10.8853, lng: -61.9514 }],
    'RR': [{ name: 'Boa Vista', lat: 2.8195, lng: -60.6714 }],
    'SC': [{ name: 'Florianópolis', lat: -27.5954, lng: -48.5480 }, { name: 'Joinville', lat: -26.3045, lng: -48.8487 }, { name: 'Blumenau', lat: -26.9194, lng: -49.0661 }],
    'SP': [{ name: 'São Paulo', lat: -23.5505, lng: -46.6333 }, { name: 'Campinas', lat: -22.9099, lng: -47.0626 }, { name: 'Santos', lat: -23.9608, lng: -46.3336 }, { name: 'Ribeirão Preto', lat: -21.1704, lng: -47.8103 }],
    'SE': [{ name: 'Aracaju', lat: -10.9091, lng: -37.0677 }, { name: 'N.Sra. do Socorro', lat: -10.8555, lng: -37.1264 }],
    'TO': [{ name: 'Palmas', lat: -10.1689, lng: -48.3317 }, { name: 'Araguaína', lat: -7.1908, lng: -48.2074 }]
  };

  // ===================== REGION DATA (DF SPECIFIC) =====================
  private regionData: Record<string, { name: string, info: string, ibgeId: string }> = {
    'plano-piloto': { name: 'Plano Piloto', ibgeId: '53001080506', info: 'Apesar de altamente arborizada, as vastas extensões de asfalto do Eixo Monumental contribuem para o aquecimento diurno. Soluções Baseadas na Natureza (SBN) são recomendadas para parques lineares.' },
    'taguatinga': { name: 'Taguatinga', ibgeId: '53001080508', info: 'Região densamente povoada com alta impermeabilização do solo. Propensa à formação severa de Ilhas de Calor Urbanas.' },
    'ceilandia': { name: 'Ceilândia', ibgeId: '53001080515', info: 'A RA com maior vulnerabilidade climática no DF devido à alta densidade e déficit de áreas verdes.' },
    'samambaia': { name: 'Samambaia', ibgeId: '53001080517', info: 'Expansão urbana rápida tem selado o solo agressivamente.' },
    'aguas-claras': { name: 'Águas Claras', ibgeId: '53001080520', info: 'A verticalização extrema bloqueia os ventos, criando cânions urbanos que retêm o calor noturno.' },
    'sobradinho': { name: 'Sobradinho', ibgeId: '53001080510', info: 'Localizada em uma cota mais alta, sofre menos com a temperatura média.' }
  };

  // ===================== API METHODS (by coords) =====================

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

  // ===================== TIMELINE (Open-Meteo Archive - últimos 7 dias) =====================

  getTemperatureTimeline(lat: number, lng: number): Observable<TimelinePoint[]> {
    const end = new Date();
    end.setDate(end.getDate() - 1); // yesterday (archive only has completed days)
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSao_Paulo&start_date=${fmt(start)}&end_date=${fmt(end)}`;

    return this.http.get<any>(url).pipe(
      map(res => {
        const dates: string[] = res.daily?.time || [];
        const maxTemps: number[] = res.daily?.temperature_2m_max || [];
        const minTemps: number[] = res.daily?.temperature_2m_min || [];
        return dates.map((d: string, i: number) => ({
          date: d,
          tempMax: maxTemps[i] ?? 0,
          tempMin: minTemps[i] ?? 0
        }));
      }),
      catchError(() => of([]))
    );
  }

  // ===================== LEGACY =====================

  getTemperatureData(regionKey: string): Observable<string> {
    const coords = this.regionData[regionKey] ? this.getCoordsForRegion(regionKey) : { lat: -15.7938, lng: -47.8827 };
    return this.getTemperatureByCoords(coords.lat, coords.lng);
  }

  getFloodRiskData(regionKey: string): Observable<string> {
    const coords = this.getCoordsForRegion(regionKey);
    return this.getFloodRiskByCoords(coords.lat, coords.lng);
  }

  getElevationData(regionKey: string): Observable<string> {
    const coords = this.getCoordsForRegion(regionKey);
    return this.getElevationByCoords(coords.lat, coords.lng);
  }

  getPopulationData(regionKey: string): Observable<string> {
    const popMap: Record<string, string> = {
      'plano-piloto': '214.529 hab', 'taguatinga': '221.909 hab', 'ceilandia': '398.374 hab',
      'samambaia': '254.439 hab', 'aguas-claras': '135.685 hab', 'sobradinho': '69.363 hab'
    };
    return of(popMap[regionKey] || 'N/A');
  }

  getSoilSealingData(regionKey: string): Observable<string> {
    const sealMap: Record<string, string> = {
      'plano-piloto': '35% Impermeabilizado', 'taguatinga': '78% Impermeabilizado', 'ceilandia': '85% Impermeabilizado',
      'samambaia': '68% Impermeabilizado', 'aguas-claras': '92% Impermeabilizado', 'sobradinho': '40% Impermeabilizado'
    };
    return of(sealMap[regionKey] || 'N/A');
  }

  getEnvironmentInfo(regionKey: string) {
    return this.regionData[regionKey] || this.regionData['plano-piloto'];
  }

  private getCoordsForRegion(key: string): { lat: number, lng: number } {
    const dfCities = this.citiesByState['DF'];
    const found = dfCities.find(c => c.name.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '') === key);
    if (found) return { lat: found.lat, lng: found.lng };
    return { lat: -15.7938, lng: -47.8827 };
  }
}
