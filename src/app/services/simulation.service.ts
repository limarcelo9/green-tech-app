import { Injectable } from '@angular/core';
import { SetorIPA } from './ipa.service';

export interface SimulationInput {
    aumentoCoberturaArborea: number;   // % (0–50)
    reducaoImpermeabilizacao: number;  // % (0–40)
    aumentoAreaVerde: number;          // % (0–30)
}

export interface SimulationResult {
    // Thermal
    deltaLST: number;          // °C reduction
    deltaConfortoTermico: number; // % improvement
    lstSimulado: number;       // new LST estimate
    // Hydrological
    reducaoEscoamento: number; // % runoff reduction
    aumentoInfiltracao: number; // % infiltration increase
    cnOriginal: number;        // SCS Curve Number original
    cnSimulado: number;        // SCS CN after intervention
}

export interface SensitivityResult {
    label: string;
    pesoH: number;
    pesoW: number;
    pesoP: number;
    topSetores: { id: string; ra: string; score: number; }[];
    avgScore: number;
}

export type Cenario = 'conservador' | 'medio' | 'agressivo';

@Injectable({ providedIn: 'root' })
export class SimulationService {

    // =====================================================
    // Literature-based parametric coefficients
    // Sources: WRI Brasil, EPA Urban Heat Island Compendium,
    //          Oke (2017), USDA TR-55
    // =====================================================

    // Each % increase in tree canopy → LST reduction (°C)
    private readonly treeCanopyEffect: Record<Cenario, number> = {
        conservador: 0.04,  // Conservative: 0.04°C per 1% canopy
        medio: 0.07,        // Medium: 0.07°C per 1% canopy
        agressivo: 0.12     // Aggressive: 0.12°C per 1% canopy (WRI upper bound)
    };

    // Each % reduction in impermeabilization → LST reduction (°C)
    private readonly impermLSTEffect: Record<Cenario, number> = {
        conservador: 0.02,
        medio: 0.04,
        agressivo: 0.06
    };

    // Comfort proxy: each °C of LST reduction → % thermal comfort improvement
    private readonly comfortPerDegree: Record<Cenario, number> = {
        conservador: 2.5,
        medio: 4.0,
        agressivo: 6.0
    };

    // ---- Hydrological ----
    // SCS Curve Number approach (simplified)
    // CN reference: urban impervious = 98, green area = 61, mixed = ~80
    private readonly cnImpervious = 98;
    private readonly cnGreenArea = 61;

    simulateThermal(setor: SetorIPA, input: SimulationInput, cenario: Cenario): SimulationResult {
        // --- Thermal Simulation ---
        const treeEffect = input.aumentoCoberturaArborea * this.treeCanopyEffect[cenario];
        const impermEffect = input.reducaoImpermeabilizacao * this.impermLSTEffect[cenario];
        const deltaLST = -(treeEffect + impermEffect);  // negative = cooling

        const deltaConfortoTermico = Math.abs(deltaLST) * this.comfortPerDegree[cenario];

        const lstSimulado = setor.lst_p90 + deltaLST;

        // --- Hydrological Simulation (SCS-CN simplified) ---
        const impermOriginal = setor.impermeabilizacao_pct / 100;
        const impermNovo = Math.max(0, impermOriginal - (input.reducaoImpermeabilizacao / 100));

        // Weighted CN: original mix
        const cnOriginal = (impermOriginal * this.cnImpervious) + ((1 - impermOriginal) * this.cnGreenArea);

        // Green area increase reduces CN
        const greenBoost = input.aumentoAreaVerde / 100;
        const cnSimulado = (impermNovo * this.cnImpervious) +
            ((1 - impermNovo - greenBoost) * 80) + // existing pervious
            (greenBoost * this.cnGreenArea);       // new green

        // Runoff reduction proxy: higher CN = more runoff
        const runoffOriginal = Math.pow(Math.max(0, 25.4 * ((1000 / cnOriginal) - 10)), 2) / (25.4 * ((1000 / cnOriginal) - 10) + 50);
        const runoffSimulado = Math.pow(Math.max(0, 25.4 * ((1000 / Math.max(cnSimulado, 40)) - 10)), 2) / (25.4 * ((1000 / Math.max(cnSimulado, 40)) - 10) + 50);

        const reducaoEscoamento = runoffOriginal > 0
            ? ((runoffOriginal - runoffSimulado) / runoffOriginal) * 100
            : 0;

        const aumentoInfiltracao = reducaoEscoamento * 0.7; // assume 70% of runoff reduction → infiltration

        return {
            deltaLST: +deltaLST.toFixed(2),
            deltaConfortoTermico: +deltaConfortoTermico.toFixed(1),
            lstSimulado: +lstSimulado.toFixed(1),
            reducaoEscoamento: +Math.min(reducaoEscoamento, 100).toFixed(1),
            aumentoInfiltracao: +Math.min(aumentoInfiltracao, 100).toFixed(1),
            cnOriginal: +cnOriginal.toFixed(0),
            cnSimulado: +Math.max(cnSimulado, 40).toFixed(0),
        };
    }

    // =====================================================
    // Sensitivity Analysis
    // Vary H, W, P weights ±20% and see how ranking changes
    // =====================================================

    runSensitivityAnalysis(setores: SetorIPA[]): SensitivityResult[] {
        const scenarios: { label: string, h: number, w: number, p: number }[] = [
            { label: 'Base (0.4 / 0.3 / 0.3)', h: 0.4, w: 0.3, p: 0.3 },
            { label: 'Calor +20% (0.48 / 0.26 / 0.26)', h: 0.48, w: 0.26, p: 0.26 },
            { label: 'Calor -20% (0.32 / 0.34 / 0.34)', h: 0.32, w: 0.34, p: 0.34 },
            { label: 'Água +20% (0.36 / 0.36 / 0.28)', h: 0.36, w: 0.36, p: 0.28 },
            { label: 'Pessoas +20% (0.36 / 0.28 / 0.36)', h: 0.36, w: 0.28, p: 0.36 },
        ];

        return scenarios.map(s => {
            const recalculated = setores.map(setor => ({
                id: setor.id_ra,
                ra: setor.ra_nome,
                score: +((s.h * setor.modulo_h) + (s.w * setor.modulo_w) + (s.p * setor.modulo_p)).toFixed(1),
            })).sort((a, b) => b.score - a.score);

            return {
                label: s.label,
                pesoH: s.h,
                pesoW: s.w,
                pesoP: s.p,
                topSetores: recalculated.slice(0, 5),
                avgScore: +(recalculated.reduce((sum, r) => sum + r.score, 0) / recalculated.length).toFixed(1),
            };
        });
    }
}
