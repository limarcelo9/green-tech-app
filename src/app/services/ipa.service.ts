import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

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

export interface SetorIPA extends RAraw {
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
    ipa_score: number;
    ipa_categoria: string;
    ipa_cor: string;
    ra_nome: string;
}

@Injectable({ providedIn: 'root' })
export class IpaService {
    private http = inject(HttpClient);
    private cache$!: Observable<SetorIPA[]>;

    getSetoresIPA(): Observable<SetorIPA[]> {
        if (!this.cache$) {
            this.cache$ = this.http.get('assets/data/indicadores_base_DF.csv', { responseType: 'text' })
                .pipe(
                    map(csv => this.parseCSV(csv)),
                    map(rows => this.calculateIPA(rows)),
                    shareReplay(1)
                );
        }
        return this.cache$;
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

    private calculateIPA(rows: RAraw[]): SetorIPA[] {
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
            const ipa_score = (0.4 * modulo_h) + (0.3 * modulo_w) + (0.3 * modulo_p);

            let ipa_categoria: string, ipa_cor: string;
            if (ipa_score >= 80) { ipa_categoria = 'Muito Alta'; ipa_cor = '#dc2626'; }
            else if (ipa_score >= 60) { ipa_categoria = 'Alta'; ipa_cor = '#ea580c'; }
            else if (ipa_score >= 40) { ipa_categoria = 'Média'; ipa_cor = '#eab308'; }
            else { ipa_categoria = 'Baixa'; ipa_cor = '#16a34a'; }

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
                ipa_score: +ipa_score.toFixed(1),
                ipa_categoria,
                ipa_cor,
                ra_nome: row.nome_ra,
            };
        }).sort((a, b) => b.ipa_score - a.ipa_score);
    }

    private normalizePercentile(values: number[]): number[] {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(v => {
            const rank = sorted.filter(s => s <= v).length;
            return (rank / values.length) * 100;
        });
    }
}
