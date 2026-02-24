import { Injectable } from '@angular/core';

export interface ChartData {
  labels: string[];
  data: number[];
}

export interface BiomeInfo {
  description: string;
  relevance: string;
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

  private biomeData: Record<string, any> = {
    amazonia: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [330, 15, 50, 25] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [55, 365] },
      info: {
        description: 'A Amazônia é o maior bioma do Brasil e a maior floresta tropical do mundo, abrigando imensa biodiversidade e sendo vital para a regulação climática global.',
        relevance: 'Monitorar a Cobertura de Terra aqui é vital porque a conversão de florestas primárias em áreas agropecuárias afeta o regime de chuvas. Os alertas de desmatamento refletem a pressão imediata sobre as bordas remanescentes.'
      }
    },
    caatinga: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [5, 45, 35, 2] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [40, 47] },
      info: {
        description: 'Bioma exclusivamente brasileiro, a Caatinga possui vegetação adaptada a longos períodos de seca e abrange clima semiárido.',
        relevance: 'A perda de vegetação na Caatinga acelera o processo de desertificação. Avaliar o balanço entre área antropizada e remanescente revela a resiliência do terreno contra as secas agudas.'
      }
    },
    cerrado: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [20, 70, 100, 5] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [110, 85] },
      info: {
        description: 'O Cerrado é a savana mais biodiversa do mundo e berço das principais bacias hidrográficas do continente.',
        relevance: 'É o bioma que sofre a mais rápida conversão de terras para expansão agrícola. Acompanhar a perda de formação savânica é o principal indicador para a conservação de nascentes d\'água no país.'
      }
    },
    mataAtlantica: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [15, 2, 70, 3] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [75, 15] },
      info: {
        description: 'A Mata Atlântica é um bioma extremamente ameaçado que se estende ao longo da costa brasileira, abrigando grande parte da população.',
        relevance: 'Com menos de 30% de remanescentes nativos, qualquer desmatamento adicional prejudica a provisão hídrica e a biodiversidade endêmica. Os indicadores focam em proteger as poucas áreas ainda conservadas.'
      }
    },
    pampa: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [1, 25, 40, 2] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [42, 26] },
      info: {
        description: 'Localizado no extremo sul, o Pampa é caracterizado por imensas planícies cobertas de campos naturais.',
        relevance: 'O bioma vem perdendo espaço rapidamente para plantações como monoculturas e pastagens artificiais. Monitorar os campos naturais (vegetação nativa conservada) previne a descaracterização ambiental sulista.'
      }
    },
    pantanal: {
      vegetation: { labels: ['Floresta', 'Form. Savânica', 'Agropecuária', 'Água/Outros'], data: [3, 10, 2, 12] },
      relief: { labels: ['Antropizada', 'Nativa Conservada'], data: [3, 22] },
      info: {
        description: 'O Pantanal é a maior planície inundável do planeta, pulsando através dos ciclos de cheia e seca ao longo do ano.',
        relevance: 'A ocupação antrópica e desmatamentos no planalto afetam a hidrodinâmica do Pantanal. Avaliar as áreas conservadas assegura a manutenção do ciclo de águas e do refúgio animal.'
      }
    }
  };

  getVegetationData(biome?: string): ChartData {
    if (biome && this.biomeData[biome]) return this.biomeData[biome].vegetation;
    return this.countryData.vegetation;
  }

  getReliefData(biome?: string): ChartData {
    if (biome && this.biomeData[biome]) return this.biomeData[biome].relief;
    return this.countryData.relief;
  }

  getBiomeInfo(biome?: string): BiomeInfo {
    if (biome && this.biomeData[biome]) return this.biomeData[biome].info;
    return {
      description: 'O Brasil é o país com a maior biodiversidade do mundo, abrangendo seis biomas terrestres distintos com imensa variedade climática e biológica.',
      relevance: 'Monitorar os indicadores de desmatamento, cobertura de terra e expansão agropecuária em escala nacional é fundamental para cumprir metas climáticas.'
    };
  }
}
