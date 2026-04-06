import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, of } from "rxjs";
import { MockDataService } from "./mock-data.service";

export interface RAraw {
    id_ra: string;
    nome_ra: string;
    cidade: string;
    lst_p90: number;
    ndvi_medio: number;
    impermeabilizacao_pct: number;
    declividade_media: number;
    twi: number;
    densidade_pop: number;
    renda_media: number;
    percentual_idosos: number;
    lat?: number;
    lng?: number;
}

export interface SetorIPAC extends RAraw {
    lst_norm: number;
    ndvi_inv_norm: number;
    imperm_norm: number;
    decliv_norm: number;
    twi_norm: number;
    densidade_norm: number;
    renda_inv_norm: number;
    idosos_norm: number;
    modulo_h: number;
    modulo_w: number;
    modulo_p: number;
    ipac_score: number;
    ipac_categoria: string;
    ipac_cor: string;
    ra_nome: string;
}

@Injectable({ providedIn: 'root' })
export class IpacService {
    private http = inject(HttpClient);
    private mockData = inject(MockDataService);
    private cache$: Record<string, Observable<SetorIPAC[]>> = {};

    private readonly EXPECTED_UNITS: Record<string, number> = {
        "Brasília": 35,
        "São Paulo": 32,
        "Rio de Janeiro": 34,
        "Belo Horizonte": 9,
        "Curitiba": 10,
        "Porto Alegre": 17,
        "Recife": 15,
        "Paranaguá": 10,
        "Ubatuba": 11,
        "Petrópolis": 8
    };

    public integrityLog: string[] = [];
    public isDataConsistent = true;

    private coordsDF: Record<string, { lat: number, lng: number }> = {
        "Plano Piloto": { lat: -15.7938, lng: -47.8827 },
        "Gama": { lat: -16.0232, lng: -48.0645 },
        "Taguatinga": { lat: -15.8333, lng: -48.0500 },
        "Brazlândia": { lat: -15.6703, lng: -48.2014 },
        "Sobradinho": { lat: -15.6547, lng: -47.7858 },
        "Planaltina": { lat: -15.6175, lng: -47.6531 },
        "Paranoá": { lat: -15.7725, lng: -47.7781 },
        "Núcleo Bandeirante": { lat: -15.8678, lng: -47.9317 },
        "Ceilândia": { lat: -15.8233, lng: -48.1158 },
        "Guará": { lat: -15.8202, lng: -47.9772 },
        "Cruzeiro": { lat: -15.7892, lng: -47.9351 },
        "Samambaia": { lat: -15.8667, lng: -48.0667 },
        "Santa Maria": { lat: -16.0177, lng: -48.0089 },
        "São Sebastião": { lat: -15.9083, lng: -47.7719 },
        "Recanto das Emas": { lat: -15.9032, lng: -48.0772 },
        "Lago Sul": { lat: -15.8456, lng: -47.8827 },
        "Riacho Fundo": { lat: -15.8825, lng: -47.9944 },
        "Lago Norte": { lat: -15.7483, lng: -47.8725 },
        "Candangolândia": { lat: -15.8503, lng: -47.9472 },
        "Águas Claras": { lat: -15.8368, lng: -48.0305 },
        "Riacho Fundo II": { lat: -15.8944, lng: -48.0461 },
        "Sudoeste/Octogonal": { lat: -15.7969, lng: -47.9250 },
        "Varjão": { lat: -15.7275, lng: -47.8783 },
        "Park Way": { lat: -15.9011, lng: -47.9625 },
        "SCIA/Estrutural": { lat: -15.7831, lng: -47.9861 },
        "Sobradinho II": { lat: -15.6264, lng: -47.8089 },
        "Jardim Botânico": { lat: -15.8750, lng: -47.7850 },
        "Itapoã": { lat: -15.7481, lng: -47.7561 },
        "SIA": { lat: -15.8011, lng: -47.9547 },
        "Vicente Pires": { lat: -15.8114, lng: -48.0169 },
        "Fercal": { lat: -15.5892, lng: -47.8867 },
        "Sol Nascente/Pôr do Sol": { lat: -15.8322, lng: -48.1436 },
        "Arniqueira": { lat: -15.8583, lng: -48.0181 },
        "Arapoanga": { lat: -15.6322, lng: -47.6978 },
        "Água Quente": { lat: -15.9811, lng: -48.1961 }
    };

    getSetoresIPAC(cityName: string = "Plano Piloto", state: string = "DF"): Observable<SetorIPAC[]> {
        return this.getGlobalData().pipe(
            map(allData => {
                const target = (cityName === "Plano Piloto" || cityName === "Brasília") ? "Brasília" : cityName;
                
                if (target.toLowerCase().includes("ranking geral")) {
                    return allData.sort((a, b) => b.ipac_score - a.ipac_score);
                }

                // Filtro flexível para encontrar a cidade nos dados agregados
                const filtered = allData.filter(s => 
                    s.cidade.toLowerCase() === target.toLowerCase() ||
                    s.id_ra.toLowerCase().includes(target.toLowerCase().replace(/\s+/g, "-")) ||
                    s.ra_nome === cityName ||
                    (target === "Brasília" && (s.ra_nome === "Plano Piloto" || s.id_ra.startsWith("ra")))
                );

                return filtered.sort((a, b) => b.ipac_score - a.ipac_score);
            })
        );
    }

    private globalData$: Observable<SetorIPAC[]> | null = null;

    private getGlobalData(): Observable<SetorIPAC[]> {
        if (!this.globalData$) {
            const officialCities = ["Brasília", "São Paulo", "Belo Horizonte", "Porto Alegre", "Recife", "Petrópolis", "Rio de Janeiro", "Curitiba", "Ubatuba", "Paranaguá"];
            const rawObservables: Observable<RAraw[]>[] = officialCities.map(city => {
                if (city === "Brasília") {
                    return this.http.get("assets/data/indicadores_base_DF.csv", { responseType: "text" }).pipe(
                        map(csv => this.parseCSV(csv))
                    );
                } else {
                    return of(this.generateMockSetores(city));
                }
            });

            this.globalData$ = new Observable<SetorIPAC[]>(observer => {
                const results: RAraw[][] = [];
                let count = 0;
                rawObservables.forEach((obs$, i) => {
                    obs$.subscribe({
                        next: rows => {
                            results[i] = rows;
                            count++;
                            if (count === rawObservables.length) {
                                const flattened = results.reduce((acc, val) => acc.concat(val), []);
                                try {
                                    observer.next(this.calculateIPAC(flattened));
                                    this.validateDataIntegrity(flattened);
                                    observer.complete();
                                } catch (e) {
                                    observer.error(e);
                                }
                            }
                        },
                        error: err => observer.error(err)
                    });
                });
            }).pipe(shareReplay(1));
        }
        return this.globalData$;
    }

    private generateMockSetores(cityName: string): RAraw[] {
        const setores: RAraw[] = [];
        let bairrosMock: string[] = [];
        
        let baseLst = 30; let maxLst = 10;
        let baseImperm = 20; let maxImperm = 70;
        let baseDecliv = 1; let maxDecliv = 15;
        let baseTwi = 5; let maxTwi = 10;
        let baseDens = 10; let maxDens = 150;

        const cityLower = cityName.toLowerCase();
        
        if (cityLower.includes("recife")) {
            bairrosMock = ["Boa Viagem", "Santo Amaro", "Várzea", "Pina", "Ibura", "Caxangá", "Casa Amarela", "Boa Vista", "Afogados", "Espinheiro", "Graças", "Jardim São Paulo", "Madalena", "Torre", "Mustardinha"];
            baseTwi = 12; maxTwi = 8; baseDecliv = 0; maxDecliv = 5; baseImperm = 50; maxImperm = 40;
        } else if (cityLower.includes("petrópolis") || cityLower.includes("petropolis")) {
            bairrosMock = ["Centro", "Quitandinha", "Itaipava", "Bingen", "Alto da Serra", "Corrêas", "Nogueira", "Cascatinha"];
            baseDecliv = 15; maxDecliv = 30; baseTwi = 8; maxTwi = 10;
        } else if (cityLower.includes("belo horizonte")) {
            bairrosMock = ["Barreiro", "Centro-Sul", "Leste", "Nordeste", "Noroeste", "Norte", "Oeste", "Pampulha", "Venda Nova"];
            baseDecliv = 10; maxDecliv = 20; baseDens = 50; maxDens = 200;
        } else if (cityLower.includes("são paulo") || cityLower.includes("sao paulo")) {
            bairrosMock = ["Aricanduva", "Butantã", "Campo Limpo", "Capela do Socorro", "Casa Verde", "Cidade Ademar", "Cidade Tiradentes", "Ermelino Matarazzo", "Freguesia do Ó", "Guaianases", "Ipiranga", "Itaim Paulista", "Itaquera", "Jabaquara", "Jaçanã", "Lapa", "M'Boi Mirim", "Mooca", "Parelheiros", "Penha", "Perus", "Pinheiros", "Pirituba", "Santana", "Santo Amaro", "São Mateus", "São Miguel", "Sapopemba", "Sé", "Vila Maria", "Vila Mariana", "Vila Prudente"];
            baseImperm = 60; maxImperm = 40; baseDens = 80; maxDens = 300; baseLst = 35; maxLst = 15;
        } else if (cityLower.includes("porto alegre")) {
            bairrosMock = ["Centro Histórico", "Eixo Baltazar", "Humaitá-Navegantes", "Leste", "Lomba do Pinheiro", "Noroeste", "Norte", "Partenon", "Restinga", "Sul", "Centro-Sul", "Cristal", "Glória", "Ilhas", "Petrópolis", "Região 17", "Extremo-Sul"];
            baseLst = 32; maxLst = 12; baseImperm = 40; maxImperm = 50;
        } else if (cityLower.includes("rio de janeiro")) {
            bairrosMock = ["Centro", "Portuária", "São Cristóvão", "Rio Comprido", "Botafogo", "Copacabana", "Lagoa", "Tijuca", "Vila Isabel", "Ramos", "Penha", "Vigário Geral", "Ilha do Governador", "Méier", "Irajá", "Madureira", "Jacarepaguá", "Bangu", "Campo Grande", "Santa Cruz", "Guaratiba", "Paquetá", "Pavuna", "Barra da Tijuca", "Jacarezinho", "Complexo do Alemão", "Maré", "Vigário Geral", "Realengo", "Rocinha", "Jacarezinho", "Vidigal", "Santa Teresa", "Gardenia Azul"];
            baseLst = 34; maxLst = 12; baseImperm = 55; maxImperm = 35; baseDens = 100; maxDens = 350;
        } else if (cityLower.includes("curitiba")) {
            bairrosMock = ["Matriz", "Santa Felicidade", "Boa Vista", "Cajuru", "Portão", "Boqueirão", "Pinheirinho", "Bairro Novo", "Tatuquara", "CIC", "Parolin", "Caximba"];
            baseLst = 24; maxLst = 8; baseDecliv = 3; maxDecliv = 10; baseDens = 40; maxDens = 150;
        } else if (cityLower.includes("ubatuba")) {
            bairrosMock = ["Centro", "Itaguá", "Perequê-Açu", "Enseada", "Lázaro", "Praia Grande", "Tenório", "Félix", "Estufa II", "Ipiranguinha", "Sesmaria"];
            baseLst = 28; maxLst = 10; baseImperm = 15; maxImperm = 30; baseTwi = 14; maxTwi = 5;
        } else if (cityLower.includes("paranaguá") || cityLower.includes("paranagua")) {
            bairrosMock = ["Centro Histórico", "Estradinha", "Labra", "Oceania", "Vila Itiberê", "Palmital", "Rocio", "Jardim Iguaçu", "Vila Pantanal", "Araçá"];
            baseLst = 29; maxLst = 10; baseTwi = 15; maxTwi = 7; baseImperm = 30; maxImperm = 40;
        }

        const cityInfo = this.mockData.pilotCities.find(c => c.name === cityName);
        const baseLat = cityInfo ? cityInfo.lat : -15.7938;
        const baseLng = cityInfo ? cityInfo.lng : -47.8827;

        for (let i = 0; i < bairrosMock.length; i++) {
            const bairroNome = bairrosMock[i];
            // Identificação de Hotspots (Áreas críticas reais)
            const isHotspot = ["Caximba", "Tatuquara", "Parolin", "Vila Pantanal", "Araçá", "Rocio", "Estufa II", "Ipiranguinha", "Sesmaria"].includes(bairroNome);

            let lst = +(baseLst + Math.random() * maxLst).toFixed(1);
            let imperm = +(baseImperm + Math.random() * maxImperm).toFixed(1);
            let renda = +(1000 + Math.random() * 9000).toFixed(2);
            let ndvi = +(0.1 + Math.random() * 0.5).toFixed(2);
            let twi = +(baseTwi + Math.random() * maxTwi).toFixed(1);

            if (isHotspot) {
                lst += 6; // Calor urbano severo
                imperm = Math.min(95, imperm + 30); // Impermeabilização crítica
                renda = +(1200 + Math.random() * 800).toFixed(2); // Baixa renda
                ndvi = +(0.05 + Math.random() * 0.1).toFixed(2); // Pouca vegetação
                twi += 4; // Risco de inundação elevado
            }

            setores.push({
                id_ra: `${cityName.replace(/\s+/g, "-").toLowerCase()}-${i}`,
                nome_ra: `${bairroNome}`,
                cidade: cityName,
                lst_p90: lst,
                ndvi_medio: ndvi,
                impermeabilizacao_pct: imperm,
                declividade_media: +(baseDecliv + Math.random() * maxDecliv).toFixed(1),
                twi: twi,
                densidade_pop: +(baseDens + (isHotspot ? 100 : Math.random() * maxDens)).toFixed(1),
                renda_media: renda,
                percentual_idosos: +(5 + Math.random() * 20).toFixed(1),
                lat: baseLat + (Math.random() - 0.5) * 0.1, 
                lng: baseLng + (Math.random() - 0.5) * 0.1
            });
        }
        return setores;
    }

    private parseCSV(csv: string): RAraw[] {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((h, i) => {
                const key = h.trim();
                obj[key] = (key === 'id_ra' || key === 'nome_ra') ? values[i].trim() : parseFloat(values[i].trim());
            });
            obj["cidade"] = "Brasília";
            return obj as RAraw;
        });
    }

    private calculateIPAC(rows: RAraw[]): SetorIPAC[] {
        // Normalização GLOBAL por Percentil (Calculado sobre o pool de todas as cidades)
        const lst_norm = this.normalizePercentile(rows.map(r => r.lst_p90));
        const ndvi_inv_norm = this.normalizePercentile(rows.map(r => -r.ndvi_medio));
        const imperm_norm = this.normalizePercentile(rows.map(r => r.impermeabilizacao_pct));
        const decliv_norm = this.normalizePercentile(rows.map(r => r.declividade_media));
        const twi_norm = this.normalizePercentile(rows.map(r => r.twi));
        const densidade_norm = this.normalizePercentile(rows.map(r => r.densidade_pop));
        const renda_inv_norm = this.normalizePercentile(rows.map(r => -r.renda_media));
        const idosos_norm = this.normalizePercentile(rows.map(r => r.percentual_idosos));

        return rows.map((row, i) => {
            // Novas fórmulas conforme diretriz metodológica
            // H = 0.5 * LST_norm + 0.3 * Imperm_norm + 0.2 * (1 - NDVI_norm)
            const modulo_h = (0.5 * lst_norm[i]) + (0.3 * imperm_norm[i]) + (0.2 * ndvi_inv_norm[i]);
            
            // W = 0.4 * TWI_norm + 0.3 * Imperm_norm + 0.3 * Decliv_norm
            const modulo_w = (0.4 * twi_norm[i]) + (0.3 * imperm_norm[i]) + (0.3 * decliv_norm[i]);
            
            // P = 0.4 * Dens_norm + 0.4 * (1 - Renda_norm) + 0.2 * Idosos_norm
            const modulo_p = (0.4 * densidade_norm[i]) + (0.4 * renda_inv_norm[i]) + (0.2 * idosos_norm[i]);
            
            // IPAC Final = 0.4 * H + 0.3 * W + 0.3 * P
            const ipac_score = (0.4 * modulo_h) + (0.3 * modulo_w) + (0.3 * modulo_p);

            let ipac_categoria: string, ipac_cor: string;
            // Classificação rigorosa: >=80 Muito Alta | 60-79 Alta | 40-59 Média | <40 Baixa
            if (ipac_score >= 80) { ipac_categoria = "Muito Alta"; ipac_cor = "#dc2626"; }
            else if (ipac_score >= 60) { ipac_categoria = "Alta"; ipac_cor = "#ea580c"; }
            else if (ipac_score >= 40) { ipac_categoria = "Média"; ipac_cor = "#eab308"; }
            else { ipac_categoria = "Baixa"; ipac_cor = "#16a34a"; }

            const coords = this.coordsDF[row.nome_ra];

            return {
                ...row,
                lat: row.lat || coords?.lat,
                lng: row.lng || coords?.lng,
                lst_norm: +lst_norm[i].toFixed(1),
                ndvi_inv_norm: +ndvi_inv_norm[i].toFixed(1),
                imperm_norm: +imperm_norm[i].toFixed(1),
                decliv_norm: +decliv_norm[i].toFixed(1),
                twi_norm: +twi_norm[i].toFixed(1),
                densidade_norm: +densidade_norm[i].toFixed(1),
                renda_inv_norm: +renda_inv_norm[i].toFixed(1),
                idosos_norm: +idosos_norm[i].toFixed(1),
                modulo_h: +modulo_h.toFixed(1),
                modulo_w: +modulo_w.toFixed(1),
                modulo_p: +modulo_p.toFixed(1),
                ipac_score: +ipac_score.toFixed(1),
                ipac_categoria,
                ipac_cor,
                ra_nome: row.nome_ra,
            };
        });
    }

    private normalizePercentile(values: number[]): number[] {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(v => {
            const rank = sorted.filter(s => s <= v).length;
            return (rank / values.length) * 100;
        });
    }

    private validateDataIntegrity(allRows: RAraw[]) {
        this.integrityLog = [];
        this.isDataConsistent = true;
        const cities = ["Brasília", "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Recife", "Paranaguá", "Ubatuba", "Petrópolis"];
        
        cities.forEach(city => {
            const count = allRows.filter(r => r.cidade === city).length;
            const expected = this.EXPECTED_UNITS[city] || 0;
            const coverage = (count / expected) * 100;

            if (coverage < 80) {
                this.integrityLog.push(`⚠️ Alerta: Cidade ${city} com cobertura territorial de ${coverage.toFixed(1)}% (Baixo de 80%)`);
                this.isDataConsistent = false;
            } else {
                this.integrityLog.push(`✅ ${city}: Cobertura de ${coverage.toFixed(1)}% (${count} territórios)`);
            }
        });

        // Identificação de Outliers Extremos (> 3 DP da média)
        const lstValues = allRows.map(r => r.lst_p90);
        const mean = lstValues.reduce((a, b) => a + b, 0) / lstValues.length;
        const std = Math.sqrt(lstValues.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / lstValues.length);
        const outliers = allRows.filter(r => Math.abs(r.lst_p90 - mean) > 3 * std);

        if (outliers.length > 0) {
            this.integrityLog.push(`🚨 Crítico: Detectados ${outliers.length} territórios com outliers extremos de temperatura.`);
        }
    }
}
