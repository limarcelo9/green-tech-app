import { Injectable } from '@angular/core';
import { SetorIPA } from './ipa.service';

export interface SimulationInput {
    // Soluções baseadas na natureza
    aumentoCoberturaArborea: number;    // % (0–50)
    aumentoAreaVerde: number;           // % (0–30)
    // Soluções de infraestrutura (WRI Brasil)
    reducaoImpermeabilizacao: number;   // % (0–40)
    telhadosVerdes: number;             // % da área de telhados (0–50)
    telhadosFrios: number;              // % da área de telhados (0–80)
    pavimentosFrios: number;            // % das vias (0–60)
}

export interface SimulationResult {
    // Thermal
    deltaLST: number;
    deltaConfortoTermico: number;
    lstSimulado: number;
    // Detalhamento por solução (para o gráfico)
    contribuicoes: { nome: string; delta: number; cor: string; }[];
    // Hydrological
    reducaoEscoamento: number;
    aumentoInfiltracao: number;
    cnOriginal: number;
    cnSimulado: number;
    // Energia
    reducaoEnergia: number;
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

    // ============================================================
    // Coeficientes paramétricos baseados em literatura
    // Fontes: WRI Brasil (2025), EPA, Oke (2017), USDA TR-55
    // ============================================================

    // -- Arborização: cada 1% cobertura dossel → redução LST --
    // Ziter et al. (2019): 10% dossel → -0.5 a -1.2°C
    // WRI: sombra arbórea → -25°C superfície vs asfalto exposto
    private readonly treeCanopyEffect: Record<Cenario, number> = {
        conservador: 0.04,
        medio: 0.07,
        agressivo: 0.12
    };

    // -- Impermeabilização: cada 1% redução → redução LST --
    // EPA Cool Pavements (2008)
    private readonly impermLSTEffect: Record<Cenario, number> = {
        conservador: 0.02,
        medio: 0.04,
        agressivo: 0.06
    };

    // -- Telhados Verdes: cada 1% de cobertura → redução LST --
    // WRI: resfriamento evaporativo + isolamento térmico
    // Sailor et al. (2012): telhados verdes extensivos → -0.3 a -2°C LST local
    private readonly greenRoofEffect: Record<Cenario, number> = {
        conservador: 0.02,
        medio: 0.04,
        agressivo: 0.06
    };

    // -- Telhados Frios (reflexivos): cada 1% cobertura → redução LST --
    // WRI/Phoenix: tratamento reflexivo → -7°C LST de superfície
    // Malásia: telhados brancos → -13% consumo energia
    // Akbari et al. (2001): albedo +0.1 → -0.3°C ar
    private readonly coolRoofEffect: Record<Cenario, number> = {
        conservador: 0.03,
        medio: 0.06,
        agressivo: 0.09
    };

    // -- Pavimentos Frios: cada 1% das vias → redução LST --
    // WRI/Phoenix: -7°C LST com tratamentos reflexivos
    // EPA: albedo asfalto 0.05-0.10 → permeável 0.15-0.35
    private readonly coolPavementEffect: Record<Cenario, number> = {
        conservador: 0.03,
        medio: 0.05,
        agressivo: 0.08
    };

    // -- Conforto térmico: cada 1°C de redução LST → % melhoria --
    // Höppe (1999): PET, cada 1°C ≈ 3-6% conforto
    private readonly comfortPerDegree: Record<Cenario, number> = {
        conservador: 2.5,
        medio: 4.0,
        agressivo: 6.0
    };

    // -- Redução de energia: por % de telhado frio --
    // WRI/Malásia: telhados brancos → -13% energia
    private readonly energyReductionPerCoolRoof: Record<Cenario, number> = {
        conservador: 0.10,
        medio: 0.16,
        agressivo: 0.22
    };

    // -- SCS-CN --
    private readonly cnImpervious = 98;
    private readonly cnGreenArea = 61;

    simulateThermal(setor: SetorIPA, input: SimulationInput, cenario: Cenario): SimulationResult {
        // === THERMAL ===
        const deltaArvores = -(input.aumentoCoberturaArborea * this.treeCanopyEffect[cenario]);
        const deltaImperm = -(input.reducaoImpermeabilizacao * this.impermLSTEffect[cenario]);
        const deltaTelhadoVerde = -(input.telhadosVerdes * this.greenRoofEffect[cenario]);
        const deltaTelhadoFrio = -(input.telhadosFrios * this.coolRoofEffect[cenario]);
        const deltaPavFrio = -(input.pavimentosFrios * this.coolPavementEffect[cenario]);

        const deltaLST = deltaArvores + deltaImperm + deltaTelhadoVerde + deltaTelhadoFrio + deltaPavFrio;
        const deltaConfortoTermico = Math.abs(deltaLST) * this.comfortPerDegree[cenario];
        const lstSimulado = setor.lst_p90 + deltaLST;

        const contribuicoes = [
            { nome: '🌳 Arborização', delta: +deltaArvores.toFixed(2), cor: '#16a34a' },
            { nome: '🏗️ Desimpermeab.', delta: +deltaImperm.toFixed(2), cor: '#0284c7' },
            { nome: '🌿 Telhado Verde', delta: +deltaTelhadoVerde.toFixed(2), cor: '#15803d' },
            { nome: '🏠 Telhado Frio', delta: +deltaTelhadoFrio.toFixed(2), cor: '#7c3aed' },
            { nome: '🛣️ Pavimento Frio', delta: +deltaPavFrio.toFixed(2), cor: '#9333ea' },
        ].map(c => ({ ...c, delta: parseFloat(c.delta as any) }))
            .filter(c => c.delta !== 0);

        // === HYDROLOGICAL (SCS-CN) ===
        const impermOriginal = setor.impermeabilizacao_pct / 100;
        const impermNovo = Math.max(0, impermOriginal - (input.reducaoImpermeabilizacao / 100));
        const greenBoost = (input.aumentoAreaVerde + input.telhadosVerdes * 0.3) / 100; // telhados verdes contribuem ~30% para retenção

        const cnOriginal = (impermOriginal * this.cnImpervious) + ((1 - impermOriginal) * this.cnGreenArea);
        const cnSimulado = Math.max(40,
            (impermNovo * this.cnImpervious) +
            ((1 - impermNovo - greenBoost) * 80) +
            (greenBoost * this.cnGreenArea)
        );

        const runoffOrig = this.calcRunoff(cnOriginal);
        const runoffSim = this.calcRunoff(cnSimulado);
        const reducaoEscoamento = runoffOrig > 0 ? ((runoffOrig - runoffSim) / runoffOrig) * 100 : 0;
        const aumentoInfiltracao = reducaoEscoamento * 0.7;

        // === ENERGIA ===
        const reducaoEnergia = input.telhadosFrios * this.energyReductionPerCoolRoof[cenario] / 100 * 100; // % de telhado × efeito

        return {
            deltaLST: +deltaLST.toFixed(2),
            deltaConfortoTermico: +deltaConfortoTermico.toFixed(1),
            lstSimulado: +lstSimulado.toFixed(1),
            contribuicoes,
            reducaoEscoamento: +Math.min(reducaoEscoamento, 100).toFixed(1),
            aumentoInfiltracao: +Math.min(aumentoInfiltracao, 100).toFixed(1),
            cnOriginal: +cnOriginal.toFixed(0),
            cnSimulado: +cnSimulado.toFixed(0),
            reducaoEnergia: +Math.min(reducaoEnergia, 30).toFixed(1),
        };
    }

    private calcRunoff(cn: number): number {
        const s = (25400 / cn) - 254;
        const p = 50; // 50mm reference event
        const ia = 0.2 * s;
        return p > ia ? Math.pow(p - ia, 2) / (p - ia + s) : 0;
    }

    // === SENSITIVITY ===
    runSensitivityAnalysis(setores: SetorIPA[]): SensitivityResult[] {
        const scenarios = [
            { label: 'Base (0.4 / 0.3 / 0.3)', h: 0.4, w: 0.3, p: 0.3 },
            { label: 'Calor +20% (0.48 / 0.26 / 0.26)', h: 0.48, w: 0.26, p: 0.26 },
            { label: 'Calor -20% (0.32 / 0.34 / 0.34)', h: 0.32, w: 0.34, p: 0.34 },
            { label: 'Água +20% (0.36 / 0.36 / 0.28)', h: 0.36, w: 0.36, p: 0.28 },
            { label: 'Pessoas +20% (0.36 / 0.28 / 0.36)', h: 0.36, w: 0.28, p: 0.36 },
        ];
        return scenarios.map(s => {
            const recalc = setores.map(setor => ({
                id: setor.id_ra,
                ra: setor.ra_nome,
                score: +((s.h * setor.modulo_h) + (s.w * setor.modulo_w) + (s.p * setor.modulo_p)).toFixed(1),
            })).sort((a, b) => b.score - a.score);
            return {
                label: s.label, pesoH: s.h, pesoW: s.w, pesoP: s.p,
                topSetores: recalc.slice(0, 5),
                avgScore: +(recalc.reduce((sum, r) => sum + r.score, 0) / recalc.length).toFixed(1),
            };
        });
    }
}
