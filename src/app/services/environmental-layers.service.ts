import { Injectable } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.heat'; // Garante que a extensão do leaflet.heat seja carregada
import { environment } from '../../environments/environment';

export interface EnvironmentalLayerInfo {
  name: string;
  source: string;
  type: 'wms' | 'heat';
  active: boolean;
  color?: string; // Para a legenda
}

@Injectable({
  providedIn: 'root'
})
export class EnvironmentalLayersService {

  // Armazena as instâncias de L.TileLayer.WMS e L.Layer
  private layers = new Map<string, L.Layer>();
  
  // Estado UI
  activeLayers: EnvironmentalLayerInfo[] = [
    { name: 'inpe', source: 'INPE TerraBrasilis', type: 'wms', active: false, color: '#ef4444' },
    { name: 'firms', source: 'NASA FIRMS', type: 'wms', active: false, color: '#f97316' },
    { name: 'icmbio', source: 'ICMBio (Reservas)', type: 'wms', active: false, color: '#10b981' },
    { name: 'heatmap', source: 'Densidade Local (Simulada)', type: 'heat', active: false, color: '#f59e0b' }
  ];

  constructor() { }

  /**
   * Retorna a instância Layer (ou cria se ainda não existe)
   */
  getLayer(layerName: string, map?: L.Map): L.Layer | null {
    if (this.layers.has(layerName)) {
      return this.layers.get(layerName)!;
    }

    let newLayer: L.Layer | null = null;

    switch (layerName) {
      case 'inpe':
        newLayer = this.createInpeLayer();
        break;
      case 'firms':
        newLayer = this.createFirmsLayer();
        break;
      case 'icmbio':
        newLayer = this.createIcmbioLayer();
        break;
      case 'heatmap':
        newLayer = this.createHeatmapLayer(map);
        break;
    }

    if (newLayer) {
      this.layers.set(layerName, newLayer);
    }
    return newLayer;
  }

  toggleLayer(layerName: string, map: L.Map | undefined) {
    if (!map) return;

    const layerInfo = this.activeLayers.find(l => l.name === layerName);
    if (!layerInfo) return;

    layerInfo.active = !layerInfo.active;
    const layerInstance = this.getLayer(layerName, map);

    if (layerInstance) {
      if (layerInfo.active) {
        console.log(`[GreenTech] Adicionando camada: ${layerName}`, layerInstance);
        map.addLayer(layerInstance);
      } else {
        console.log(`[GreenTech] Removendo camada: ${layerName}`);
        map.removeLayer(layerInstance);
      }
    } else {
      console.error(`[GreenTech] Falha ao obter instância da camada: ${layerName}`);
    }
  }

  // --- Camadas ---

  private createInpeLayer(): L.TileLayer.WMS {
    // Usaremos Camada de Desmatamento Acumulado (Cerrado) como exemplo estável
    return L.tileLayer.wms('https://terrabrasilis.dpi.inpe.br/geoserver/ows', {
      layers: 'prodes-cerrado-nb:accumulated_deforestation_2000',
      format: 'image/png',
      version: '1.1.1',
      transparent: true,
      zIndex: 100,
      attribution: 'INPE TerraBrasilis'
    });
  }

  private createFirmsLayer(): L.TileLayer.WMS {
    const key = environment.nasaFirmsApiKey;
    // URL Corrigida: NASA FIRMS espera a chave no path, sem o sufixo /wms/? que o Leaflet adiciona via params
    const baseUrl = `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/${key}/`;
    return L.tileLayer.wms(baseUrl, {
      layers: 'fires_viirs_snpp,fires_modis', 
      format: 'image/png',
      version: '1.1.1',
      transparent: true,
      zIndex: 101,
      attribution: 'NASA FIRMS'
    });
  }

  private createIcmbioLayer(): L.TileLayer.WMS {
    return L.tileLayer.wms('https://geoservicos.inde.gov.br/geoserver/ICMBio/ows', {
      layers: 'ICMBio:limiteucsfederais_01042024_a',
      format: 'image/png',
      version: '1.3.0',
      transparent: true,
      zIndex: 102,
      attribution: 'ICMBio/INDE'
    });
  }

  private createHeatmapLayer(map?: L.Map): L.Layer {
    const heatData: [number, number, number][] = [];
    // Gera heatmap relativo à visualização atual do usuário, não presa em brasília.
    const center = map ? map.getCenter() : L.latLng(-23.55, -46.63);
    const baseLat = center.lat;
    const baseLng = center.lng;
    
    // Simula 300 focos de calor espalhados aleatoriamente ao redor do centro na tela atual
    for (let i = 0; i < 300; i++) {
        heatData.push([
            baseLat + (Math.random() - 0.5) * 0.15, // Raio menor (zoom local)
            baseLng + (Math.random() - 0.5) * 0.15,
            Math.random() // Intensidade
        ]);
    }

    return (L as any).heatLayer(heatData, {
      radius: 40, // Aumentado para visibilidade
      blur: 25,
      maxZoom: 16,
      gradient: {
        0.0: '#313695',
        0.4: '#4575b4',
        0.6: '#fee090',
        0.8: '#f46d43',
        1.0: '#a50026'
      }
    });
  }
}
