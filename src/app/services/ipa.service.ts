import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

export interface SetorRaw {
    id_setor: string;
    lst_p90: number;
    ndvi_medio: number;
    impermeabilizacao_pct: number;
    declividade_media: number;
    twi: number;
    densidade_pop: number;
    renda_media: number;
    percentual_idosos: number;
}

export interface SetorIPA extends SetorRaw {
    // Normalized (percentile 0-100)
    lst_norm: number;
    ndvi_inv_norm: number;
    imperm_norm: number;
    decliv_norm: number;
    twi_norm: number;
    densidade_norm: number;
    renda_inv_norm: number;
    idosos_norm: number;
    // Modules
    modulo_h: number; // Heat
    modulo_w: number; // Water
    modulo_p: number; // People
    // Final
    ipa_score: number;
    ipa_categoria: string;
    ipa_cor: string;
    ra_nome: string;
}

@Injectable({ providedIn: 'root' })
export class IpaService {
    private http = inject(HttpClient);
    private cache$!: Observable<SetorIPA[]>;

    // RA name mapping by sector prefix
    private readonly raMap: Record<string, string> = {
        '530010805060': 'Plano Piloto',
        '530010805080': 'Taguatinga',
        '530010805150': 'Ceilândia',
        '530010805170': 'Samambaia',
        '530010805200': 'Águas Claras',
        '530010805100': 'Sobradinho',
        '530010805110': 'Planaltina',
        '530010805090': 'Brazlândia',
        '530010805120': 'Paranoá',
        '530010805070': 'Gama',
        '530010805130': 'N. Bandeirante',
        '530010805140': 'Candangolândia',
        '530010805160': 'Recanto das Emas',
        '530010805180': 'Riacho Fundo',
        '530010805190': 'SIA/SCIA',
        '530010805210': 'Itapoã',
    };

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

    private parseCSV(csv: string): SetorRaw[] {
        const lines = csv.trim().split('\n');
        const headers = lines[0].split(',');
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((h, i) => {
                const key = h.trim();
                obj[key] = key === 'id_setor' ? values[i].trim() : parseFloat(values[i].trim());
            });
            return obj as SetorRaw;
        });
    }

    private calculateIPA(rows: SetorRaw[]): SetorIPA[] {
        const n = rows.length;

        // Step 1: Normalize each variable using percentile rank (0–100)
        const lst_norm = this.normalizePercentile(rows.map(r => r.lst_p90));
        const ndvi_inv_norm = this.normalizePercentile(rows.map(r => -r.ndvi_medio)); // inverted: low NDVI = high priority
        const imperm_norm = this.normalizePercentile(rows.map(r => r.impermeabilizacao_pct));
        const decliv_norm = this.normalizePercentile(rows.map(r => r.declividade_media));
        const twi_norm = this.normalizePercentile(rows.map(r => r.twi));
        const densidade_norm = this.normalizePercentile(rows.map(r => r.densidade_pop));
        const renda_inv_norm = this.normalizePercentile(rows.map(r => -r.renda_media)); // inverted: low income = high priority
        const idosos_norm = this.normalizePercentile(rows.map(r => r.percentual_idosos));

        return rows.map((row, i) => {
            // Module H – Heat
            const modulo_h = (0.5 * lst_norm[i]) + (0.3 * imperm_norm[i]) + (0.2 * ndvi_inv_norm[i]);

            // Module W – Water
            const modulo_w = (0.4 * twi_norm[i]) + (0.3 * imperm_norm[i]) + (0.3 * decliv_norm[i]);

            // Module P – People
            const modulo_p = (0.4 * densidade_norm[i]) + (0.4 * renda_inv_norm[i]) + (0.2 * idosos_norm[i]);

            // Final IPA
            const ipa_score = (0.4 * modulo_h) + (0.3 * modulo_w) + (0.3 * modulo_p);

            // Category
            let ipa_categoria: string;
            let ipa_cor: string;
            if (ipa_score >= 80) { ipa_categoria = 'Muito Alta'; ipa_cor = '#dc2626'; }
            else if (ipa_score >= 60) { ipa_categoria = 'Alta'; ipa_cor = '#ea580c'; }
            else if (ipa_score >= 40) { ipa_categoria = 'Média'; ipa_cor = '#eab308'; }
            else { ipa_categoria = 'Baixa'; ipa_cor = '#16a34a'; }

            // RA name lookup
            const prefix = row.id_setor.substring(0, 12);
            const ra_nome = this.raMap[prefix] || 'DF';

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
                ra_nome,
            };
        }).sort((a, b) => b.ipa_score - a.ipa_score); // Rank by IPA descending
    }

    private normalizePercentile(values: number[]): number[] {
        const sorted = [...values].sort((a, b) => a - b);
        return values.map(v => {
            const rank = sorted.filter(s => s <= v).length;
            return (rank / values.length) * 100;
        });
    }
}
