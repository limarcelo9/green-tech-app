import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, of } from 'rxjs';

export interface RAraw {
    id_ra: string;
    nome_ra: string;
    lst_p90: number;
    ndvi_medio: number;
    impermeabilizacao_pct: number;
    declividade_media: number;
    twi: number;
    densidade_pop: number;
    renda_media: number;
    percentual_idosos: number;
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
    private cache$: Record<string, Observable<SetorIPAC[]>> = {};

    getSetoresIPAC(cityName: string = "Plano Piloto", state: string = "DF"): Observable<SetorIPAC[]> {
        const cacheKey = `${cityName}-${state}`;
        if (!this.cache$[cacheKey]) {
            if ((cityName === 'Plano Piloto' && state === 'DF') || cityName === 'Brasília') {
                this.cache$[cacheKey] = this.http.get('assets/data/indicadores_base_DF.csv', { responseType: 'text' })
                    .pipe(
                        map(csv => this.parseCSV(csv)),
                        map(rows => this.calculateIPAC(rows)),
                        shareReplay(1)
                    );
            } else {
                this.cache$[cacheKey] = of(this.generateMockSetores(cityName)).pipe(
                    map(rows => this.calculateIPAC(rows)),
                    shareReplay(1)
                );
            }
        }
        return this.cache$[cacheKey];
    }

    private generateMockSetores(cityName: string): RAraw[] {
        const setores: RAraw[] = [];
        let bairrosMock = ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste", "Distrito Industrial", "Jardim Central", "Vila Nova"];
        
        let baseLst = 30; let maxLst = 10;
        let baseImperm = 20; let maxImperm = 70;
        let baseDecliv = 1; let maxDecliv = 15;
        let baseTwi = 5; let maxTwi = 10;
        let baseDens = 10; let maxDens = 150;

        const cityLower = cityName.toLowerCase();
        
        if (cityLower.includes('recife')) {
            bairrosMock = ['Boa Viagem', 'Santo Amaro', 'Várzea', 'Pina', 'Ibura', 'Caxangá', 'Casa Amarela', 'Boa Vista'];
            baseTwi = 12; maxTwi = 8;
            baseDecliv = 0; maxDecliv = 5;
            baseImperm = 50; maxImperm = 40;
        } else if (cityLower.includes('petrópolis') || cityLower.includes('petropolis')) {
            bairrosMock = ['Centro', 'Quitandinha', 'Itaipava', 'Bingen', 'Alto da Serra', 'Corrêas', 'Nogueira', 'Cascatinha'];
            baseDecliv = 15; maxDecliv = 30;
            baseTwi = 8; maxTwi = 10;
        } else if (cityLower.includes('belo horizonte')) {
            bairrosMock = ['Pampulha', 'Venda Nova', 'Barreiro', 'Centro-Sul', 'Noroeste', 'Leste', 'Oeste', 'Norte'];
            baseDecliv = 10; maxDecliv = 20;
            baseDens = 50; maxDens = 200;
        } else if (cityLower.includes('são paulo') || cityLower.includes('sao paulo')) {
            bairrosMock = ['Subprefeitura Sé', 'Subprefeitura Pinheiros', 'Subprefeitura Itaquera', 'Subprefeitura Lapa', 'Subprefeitura Santo Amaro', 'Subprefeitura Mooca', 'Subprefeitura Vila Mariana', 'Subprefeitura Guaianases'];
            baseImperm = 60; maxImperm = 40;
            baseDens = 80; maxDens = 300;
            baseLst = 35; maxLst = 15;
        } else if (cityLower.includes('porto alegre')) {
            bairrosMock = ['Centro Histórico', 'Restinga', 'Sarandi', 'Cidade Baixa', 'Moinhos de Vento', 'Lomba do Pinheiro', 'Rubem Berta', 'Partenon'];
            baseLst = 32; maxLst = 12;
            baseImperm = 40; maxImperm = 50;
        }

        for (let i = 0; i < bairrosMock.length; i++) {
            setores.push({
                id_ra: `${cityName.replace(/\s+/g, '-').toLowerCase()}-${i}`,
                nome_ra: `${bairrosMock[i]}`,
                lst_p90: +(baseLst + Math.random() * maxLst).toFixed(1),
                ndvi_medio: +(0.1 + Math.random() * 0.5).toFixed(2),
                impermeabilizacao_pct: +(baseImperm + Math.random() * maxImperm).toFixed(1),
                declividade_media: +(baseDecliv + Math.random() * maxDecliv).toFixed(1),
                twi: +(baseTwi + Math.random() * maxTwi).toFixed(1),
                densidade_pop: +(baseDens + Math.random() * maxDens).toFixed(1),
                renda_media: +(1000 + Math.random() * 9000).toFixed(2),
                percentual_idosos: +(5 + Math.random() * 20).toFixed(1)
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
            return obj as RAraw;
        });
    }

    private calculateIPAC(rows: RAraw[]): SetorIPAC[] {
        const lst_norm = this.normalizePercentile(rows.map(r => r.lst_p90));
        const ndvi_inv_norm = this.normalizePercentile(rows.map(r => -r.ndvi_medio));
        const imperm_norm = this.normalizePercentile(rows.map(r => r.impermeabilizacao_pct));
        const decliv_norm = this.normalizePercentile(rows.map(r => r.declividade_media));
        const twi_norm = this.normalizePercentile(rows.map(r => r.twi));
        const densidade_norm = this.normalizePercentile(rows.map(r => r.densidade_pop));
        const renda_inv_norm = this.normalizePercentile(rows.map(r => -r.renda_media));
        const idosos_norm = this.normalizePercentile(rows.map(r => r.percentual_idosos));

        return rows.map((row, i) => {
            const modulo_h = (0.5 * lst_norm[i]) + (0.3 * imperm_norm[i]) + (0.2 * ndvi_inv_norm[i]);
            const modulo_w = (0.4 * twi_norm[i]) + (0.3 * imperm_norm[i]) + (0.3 * decliv_norm[i]);
            const modulo_p = (0.4 * densidade_norm[i]) + (0.4 * renda_inv_norm[i]) + (0.2 * idosos_norm[i]);
            const ipac_score = (0.4 * modulo_h) + (0.3 * modulo_w) + (0.3 * modulo_p);

            let ipac_categoria: string, ipac_cor: string;
            if (ipac_score >= 80) { ipac_categoria = 'Muito Alta'; ipac_cor = '#dc2626'; }
            else if (ipac_score >= 60) { ipac_categoria = 'Alta'; ipac_cor = '#ea580c'; }
            else if (ipac_score >= 40) { ipac_categoria = 'Média'; ipac_cor = '#eab308'; }
            else { ipac_categoria = 'Baixa'; ipac_cor = '#16a34a'; }

            return {
                ...row,
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
        }).sort((a, b) => b.ipac_score - a.ipac_score);
    }

    private normalizePercentile(values: number[]): number[] {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(v => {
            const rank = sorted.filter(s => s <= v).length;
            return (rank / values.length) * 100;
        });
    }
}
