import { Injectable } from '@angular/core';
import { SetorIPAC } from './ipac.service';
import { SolucaoSimulacao, BIBLIOTECA_SOLUCOES, CenarioSimulacao } from '../constants/solucoes-simulacao';

export type SimulationInput = Record<string, number>;

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
    // Financeiro (v2.2)
    financeiro: SimulationCost;
    // SROI (v2.3)
    sroi: SimulationSROI;
}

export interface SimulationSROI {
    economiaSaudeAnual: number;
    economiaEnergiaAnual: number;
    economiaInfraAnual: number;
    economiaTotalAnual: number;
    paybackAnos: number;
    sroiRatio: number; // VPL Benefícios (10 anos, i=5%) / Custo Inicial
    vplBeneficios: number; // Valor Presente Líquido dos benefícios
    labelPayback: string;
}

export interface SolutionCost {
    id: string;
    nome: string;
    areaIntervencao: number;
    unidade: string;
    custoUnitario: number;
    custoTotal: number;
    eixo: string;
    eficiencia: number; // Impacto (deltaLST ou sim) / Custo
}

export interface SimulationCost {
    custoTotal: number;
    detalhePorSolucao: SolutionCost[];
    custoPorEixo: Record<string, number>;
    rankingTermico: SolutionCost[];
    rankingHidrico: SolutionCost[];
    rankingComposto: SolutionCost[];
    // Rastreabilidade (v2.7)
    area_setor_real: number | null;
    area_setor_utilizada: number;
    area_intervencao_total: number; // Soma real das áreas de intervenção
    percentual_cobertura: number;   // % do setor coberto pelas intervenções
    area_fonte: "metadata" | "fallback_padrao";
    isEstimativo: boolean;
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

    public readonly bibliotecaSolucoes = BIBLIOTECA_SOLUCOES;

    // ============================================================
    // Coeficientes paramétricos baseados em literatura
    // Fontes: WRI Brasil (2025), EPA, Oke (2017), USDA TR-55
    // ============================================================

    // O serviço agora utiliza a BIBLIOTECA_SOLUCOES para todos os coeficientes de impacto.
    // As propriedades privadas redundantes foram removidas.

    private readonly comfortPerDegree: Record<Cenario, number> = {
        conservador: 2.5,
        medio: 4.0,
        agressivo: 6.0
    };

    // Coeficientes SROI (Real-world based benchmarks)
    private readonly SROI_COEFFS = {
        saude_por_hab_grau: 1250, // R$ salvos por habitante/ano por 1°C reduzido
        energia_kwh_preco: 0.95,  // R$ por kWh médio
        infra_dano_enchente_km2: 1500000, // R$ economia em danos por km2 (100% redução escoamento)
        ciclo_vida_anos: 10,
        taxa_desconto: 0.05
    };

    private readonly cnImpervious = 98;
    private readonly cnGreenArea = 61;

    /**
     * Calcula o delta acumulado para um indicador específico baseado no input e cenário
     */
    private calcularDelta(indicador: string, cenario: CenarioSimulacao, input: SimulationInput): number {
        let deltaTotal = 0;

        this.bibliotecaSolucoes.forEach(solucao => {
            const percentual = input[solucao.id] || 0;

            if (percentual > 0) {
                const impacto = solucao.impactos.find(i => i.indicador === indicador);
                if (impacto) {
                    const fator = impacto.fatores[cenario];
                    // Deltas de LST são negativos (redução), Infiltração é positivo (aumento), etc.
                    // Padronizamos: se for LST/Escoamento/Energia, o fator é multiplicador de redução (-)
                    // Se for Infiltração/Conforto, o fator é multiplicador de aumento (+)
                    const multiplicador = (indicador === "lst" || indicador === "escoamento" || indicador === "energia") ? -1 : 1;
                    deltaTotal += (percentual * fator * multiplicador);
                }
            }
        });

        return deltaTotal;
    }

    simulateThermal(setor: SetorIPAC, input: SimulationInput, cenario: Cenario): SimulationResult {
        // === REGRA DE NÃO-SOBREPOSIÇÃO (v2.1) ===
        const originalInput = { ...input };
        let areaVerde = input["area_verde"] || 0;
        let desimperm = input["desimpermeabilizacao"] || 0;
        const somaSuperficie = areaVerde + desimperm;
        const TETO_SUPERFICIE = 40; 

        if (somaSuperficie > TETO_SUPERFICIE) {
            const fatorAbatimento = TETO_SUPERFICIE / somaSuperficie;
            input["area_verde"] = areaVerde * fatorAbatimento;
            input["desimpermeabilizacao"] = desimperm * fatorAbatimento;
            // Atualiza para o cálculo hídrico abaixo
            areaVerde = input["area_verde"];
            desimperm = input["desimpermeabilizacao"];
        }

        // === NOVO MOTOR DINÂMICO ===
        const cenarioSim = cenario as CenarioSimulacao;
        const deltaLST = this.calcularDelta("lst", cenarioSim, input);
        const reducaoEnergia = Math.abs(this.calcularDelta("energia", cenarioSim, input));
        
        // Conforto térmico: cada 1°C de redução LST ≈ 4% melhoria (médio)
        const deltaConfortoTermico = Math.abs(deltaLST) * this.comfortPerDegree[cenario];
        const lstSimulado = setor.lst_p90 + deltaLST;

        // Contribuições dinâmicas para o gráfico
        const contribuicoes = this.bibliotecaSolucoes
            .map(sol => {
                const imp = sol.impactos.find(i => i.indicador === "lst");
                if (!imp) return null;
                
                const p = input[sol.id] || 0;
                if (p === 0) return null;
                const d = -(p * imp.fatores[cenarioSim]);
                return { nome: sol.nome, delta: +d.toFixed(2), cor: this.getCorEixo(sol.eixo_principal) };
            })
            .filter((c): c is { nome: string; delta: number; cor: string } => c !== null && c.delta !== 0);

        // === HYDROLOGICAL (SCS-CN) ===
        const impermOriginal = setor.impermeabilizacao_pct / 100;
        let reducaoEscoamento = 0;
        let aumentoInfiltracao = 0;
        let cnOriginal = 0;
        let cnSimulado = 0;

        // Só calcula hidrologia se há alguma intervenção ativa
        const temIntervencao = Object.values(input).some(v => v > 0);
        
        if (temIntervencao) {
            const impermNovo = Math.max(0, impermOriginal - (desimperm / 100));
            
            let greenBoost = 0;
            if (areaVerde > 0) greenBoost += (areaVerde / 100);
            if (input["telhado_verde"] > 0) greenBoost += (input["telhado_verde"] * 0.3) / 100;

            cnOriginal = (impermOriginal * this.cnImpervious) + ((1 - impermOriginal) * this.cnGreenArea);
            cnSimulado = Math.max(40,
                (impermNovo * this.cnImpervious) +
                ((1 - impermNovo - greenBoost) * 80) +
                (greenBoost * this.cnGreenArea)
            );

            const runoffOrig = this.calcRunoff(cnOriginal);
            const runoffSim = this.calcRunoff(cnSimulado);
            reducaoEscoamento = runoffOrig > 0 ? Math.max(0, ((runoffOrig - runoffSim) / runoffOrig) * 100) : 0;
            aumentoInfiltracao = Math.max(0, reducaoEscoamento * 0.7);
        }

        // === ENERGIA (Calculado dinamicamente acima) ===

        // === FINANCEIRO (v2.3) ===
        const financeiro = this.calcularCustos(setor, input, cenarioSim, deltaLST, reducaoEscoamento);

        // === SROI (v2.4) ===
        const sroi = this.calcularSROI(setor, financeiro, deltaLST, reducaoEscoamento, reducaoEnergia);

        return {
            deltaLST: +deltaLST.toFixed(2),
            deltaConfortoTermico: +deltaConfortoTermico.toFixed(1),
            lstSimulado: +lstSimulado.toFixed(1),
            contribuicoes,
            reducaoEscoamento: +Math.min(Math.max(reducaoEscoamento, 0), 100).toFixed(1),
            aumentoInfiltracao: +Math.min(Math.max(aumentoInfiltracao, 0), 100).toFixed(1),
            cnOriginal: +cnOriginal.toFixed(0),
            cnSimulado: +cnSimulado.toFixed(0),
            reducaoEnergia: +Math.min(reducaoEnergia, 30).toFixed(1),
            financeiro,
            sroi
        };
    }

    private calcularCustos(setor: SetorIPAC, input: SimulationInput, cenario: CenarioSimulacao, deltaLST: number, reducaoEscoam: number): SimulationCost {
        const AREA_FALLBACK = 1000000; // 1km2 de fallback
        const areaReal = setor.area_total_m2 || null;
        const areaUtilizada = areaReal || AREA_FALLBACK;
        const areaFonte = areaReal ? "metadata" : "fallback_padrao";
        const isEstimativo = areaFonte === "fallback_padrao";

        const detalhePorSolucao: SolutionCost[] = [];
        const custoPorEixo: Record<string, number> = { calor: 0, agua: 0, qualidade_urbana: 0 };

        this.bibliotecaSolucoes.forEach(sol => {
            const percentual = input[sol.id] || 0;

            if (percentual > 0) {
                // Cálculo da área de intervenção (m2 ou similar)
                // Usamos o percentual aplicado sobre a área utilizada do setor
                const areaIntervencao = (percentual / 100) * areaUtilizada;
                
                // Se for unidade, dividimos pela area_equivalente para saber o N de unidades (estimado)
                // Mas o custo é sempre m2 * valor ou (m2/equivalente) * valor_unidade
                let custoTotal = 0;
                if (sol.unidade === "unidade" && sol.area_equivalente) {
                    const numUnidades = areaIntervencao / sol.area_equivalente;
                    custoTotal = numUnidades * (sol.custo_unitario || 0);
                } else {
                    custoTotal = areaIntervencao * (sol.custo_unitario || 0);
                }
                
                custoTotal *= sol.fator_regional;

                // Cálculo de Eficiências Normalizadas
                // Térmico: Impacto Unitário * Fator Real / Custo
                const impTermico = sol.impactos.find(i => i.indicador === "lst")?.fatores[cenario] || 0;
                const impHidrico = sol.impactos.find(i => i.indicador === "escoamento")?.fatores[cenario] || 0;

                const solCost: SolutionCost = {
                    id: sol.id,
                    nome: sol.nome,
                    areaIntervencao: +areaIntervencao.toFixed(0),
                    unidade: sol.unidade,
                    custoUnitario: sol.custo_unitario || 0,
                    custoTotal: +custoTotal.toFixed(0),
                    eixo: sol.eixo_principal,
                    eficiencia: 0 // Será preenchido nos rankings específicos
                };

                // Injetamos métricas brutas para o ranking final
                (solCost as any)._rawImpT = impTermico;
                (solCost as any)._rawImpH = impHidrico;

                detalhePorSolucao.push(solCost);
                custoPorEixo[sol.eixo_principal] += custoTotal;
            }
        });

        const custoTotalGeral = Object.values(custoPorEixo).reduce((a, b) => a + b, 0);

        // Área de intervenção total (soma real, não a área do setor)
        const areaIntervencaoTotal = detalhePorSolucao.reduce((acc, s) => acc + s.areaIntervencao, 0);
        const percentualCobertura = areaUtilizada > 0 ? (areaIntervencaoTotal / areaUtilizada) * 100 : 0;

        // Ranking Térmico (Focado no eixo Calor)
        const rankingTermico = detalhePorSolucao
            .map(s => ({ ...s, eficiencia: s.custoTotal > 0 ? (s as any)._rawImpT / (s.custoTotal / 1000) : 0 }))
            .sort((a, b) => b.eficiencia - a.eficiencia);

        // Ranking Hídrico (Focado no eixo Água)
        const rankingHidrico = detalhePorSolucao
            .map(s => ({ ...s, eficiencia: s.custoTotal > 0 ? (s as any)._rawImpH / (s.custoTotal / 1000) : 0 }))
            .sort((a, b) => b.eficiencia - a.eficiencia);

        // Ranking Composto
        const rankingComposto = detalhePorSolucao
            .map(s => {
                const scoreSROI = ((s as any)._rawImpT * 10) + (s as any)._rawImpH; 
                return { ...s, eficiencia: s.custoTotal > 0 ? scoreSROI / (s.custoTotal / 1000) : 0 };
            })
            .sort((a, b) => b.eficiencia - a.eficiencia);

        return {
            custoTotal: +custoTotalGeral.toFixed(0),
            detalhePorSolucao,
            custoPorEixo,
            rankingTermico,
            rankingHidrico,
            rankingComposto,
            area_setor_real: areaReal,
            area_setor_utilizada: areaUtilizada,
            area_intervencao_total: +areaIntervencaoTotal.toFixed(0),
            percentual_cobertura: +percentualCobertura.toFixed(1),
            area_fonte: areaFonte,
            isEstimativo
        };
    }

    /**
     * Calcula VPL (Valor Presente Líquido) de um fluxo de caixa anual constante
     * VPL = Σ (FC / (1 + i)^t) para t = 1..n
     */
    private calcularVPL(fluxoAnual: number, taxa: number, anos: number): number {
        let vpl = 0;
        for (let t = 1; t <= anos; t++) {
            vpl += fluxoAnual / Math.pow(1 + taxa, t);
        }
        return vpl;
    }

    /**
     * Calcula Payback Descontado: menor t onde Σ FC/(1+i)^k >= Investimento
     */
    private calcularPaybackDescontado(fluxoAnual: number, investimento: number, taxa: number, maxAnos: number): number {
        if (fluxoAnual <= 0 || investimento <= 0) return 0;
        let acumulado = 0;
        for (let t = 1; t <= maxAnos; t++) {
            acumulado += fluxoAnual / Math.pow(1 + taxa, t);
            if (acumulado >= investimento) return t;
        }
        return maxAnos; // Não paga no horizonte
    }

    private calcularSROI(setor: SetorIPAC, financ: SimulationCost, deltaLST: number, redEscoam: number, redEnergia: number): SimulationSROI {
        // Guarda: se não há intervenção, retornar zeros limpos
        if (financ.custoTotal === 0 && financ.detalhePorSolucao.length === 0) {
            return {
                economiaSaudeAnual: 0, economiaEnergiaAnual: 0, economiaInfraAnual: 0,
                economiaTotalAnual: 0, paybackAnos: 0, sroiRatio: 0, vplBeneficios: 0,
                labelPayback: "Sem Intervenção"
            };
        }

        const areaKM2 = financ.area_setor_utilizada / 1000000;
        const totalPop = areaKM2 * (setor.densidade_pop || 50);
        const i = this.SROI_COEFFS.taxa_desconto; // 5%
        const n = this.SROI_COEFFS.ciclo_vida_anos; // 10 anos
        
        // 1. Economia Saúde
        const pesoVulnerabilidade = (setor.modulo_p / 50);
        const economiaSaudeAnual = Math.max(0, Math.abs(deltaLST) * totalPop * this.SROI_COEFFS.saude_por_hab_grau * pesoVulnerabilidade);

        // 2. Economia Energia
        const areaTelhadosIntervencao = financ.detalhePorSolucao
            .filter(s => s.eixo === 'qualidade_urbana' || s.id.includes('telhado'))
            .reduce((acc, val) => acc + val.areaIntervencao, 0);
        const economiaEnergiaAnual = Math.max(0, (redEnergia / 100) * areaTelhadosIntervencao * 50 * this.SROI_COEFFS.energia_kwh_preco);

        // 3. Economia Infra (Redução de danos por alagamentos)
        const economiaInfraAnual = Math.max(0, (redEscoam / 100) * areaKM2 * this.SROI_COEFFS.infra_dano_enchente_km2);

        const economiaTotalAnual = economiaSaudeAnual + economiaEnergiaAnual + economiaInfraAnual;
        
        // === VPL e Payback Descontado (i = 5%, n = 10 anos) ===
        const vplBeneficios = this.calcularVPL(economiaTotalAnual, i, n);
        const paybackAnos = this.calcularPaybackDescontado(economiaTotalAnual, financ.custoTotal, i, 99);
        const sroiRatio = financ.custoTotal > 0 ? vplBeneficios / financ.custoTotal : 0;

        let labelPayback = "Excelente";
        if (financ.custoTotal === 0) labelPayback = "Sem Intervenção";
        else if (paybackAnos >= 99) labelPayback = "Inviável";
        else if (paybackAnos > 15) labelPayback = "Longo Prazo";
        else if (paybackAnos > 8) labelPayback = "Moderado";
        else if (paybackAnos < 4) labelPayback = "Altíssimo Impacto";

        return {
            economiaSaudeAnual: +economiaSaudeAnual.toFixed(0),
            economiaEnergiaAnual: +economiaEnergiaAnual.toFixed(0),
            economiaInfraAnual: +economiaInfraAnual.toFixed(0),
            economiaTotalAnual: +economiaTotalAnual.toFixed(0),
            paybackAnos: +paybackAnos.toFixed(1),
            sroiRatio: +sroiRatio.toFixed(2),
            vplBeneficios: +vplBeneficios.toFixed(0),
            labelPayback
        };
    }

    private getCorEixo(eixo: string): string {
        switch (eixo) {
            case 'calor': return '#e11d48'; // Rose 600
            case 'agua': return '#0284c7'; // Sky 600
            case 'qualidade_urbana': return '#16a34a'; // Green 600
            default: return '#4b5563';
        }
    }

    private calcRunoff(cn: number): number {
        const s = (25400 / cn) - 254;
        const p = 50; // 50mm reference event
        const ia = 0.2 * s;
        return p > ia ? Math.pow(p - ia, 2) / (p - ia + s) : 0;
    }

    // === SENSITIVITY ===
    runSensitivityAnalysis(setores: SetorIPAC[]): SensitivityResult[] {
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

    // === INVESTIMENTO (v2.7 — Fonte única: custo_unitario da BIBLIOTECA_SOLUCOES) ===
    calcularIntervencoesPorInvestimento(investimento: number, areaSetor: number): SimulationInput {
        // Pesos de alocação por solução (quanto do orçamento vai para cada)
        const pesos: Record<string, number> = {
            cobertura_arborea: 0.18,
            area_verde: 0.10,
            desimpermeabilizacao: 0.12,
            telhado_verde: 0.08,
            telhado_frio: 0.10,
            pavimento_frio: 0.07,
            jardim_de_chuva: 0.08,
            biovaleta: 0.06,
            pavimento_permeavel: 0.06,
            parques_lineares: 0.05,
            recuperacao_app_urbana: 0.05,
            canteiro_pluvial: 0.03,
            parede_verde: 0.02,
        };

        const result: SimulationInput = {};
        this.bibliotecaSolucoes.forEach(s => result[s.id] = 0);

        this.bibliotecaSolucoes.forEach(sol => {
            const peso = pesos[sol.id] || 0;
            if (peso <= 0 || !sol.custo_unitario) return;

            const orcamentoSolucao = investimento * peso;

            // Calcular área comprável com o orçamento e custo_unitario real
            let areaComprada: number;
            if (sol.unidade === "unidade" && sol.area_equivalente) {
                // Para unidades: orçamento / custo_unidade → n_unidades → n_unidades * area_equivalente
                const numUnidades = orcamentoSolucao / (sol.custo_unitario * sol.fator_regional);
                areaComprada = numUnidades * sol.area_equivalente;
            } else {
                // Para m²/m³: orçamento / custo_por_m²
                areaComprada = orcamentoSolucao / (sol.custo_unitario * sol.fator_regional);
            }

            // Converter área para percentual do setor
            const percentual = (areaComprada / areaSetor) * 100;

            // Limitar a 60% máximo
            result[sol.id] = +Math.min(60, Math.max(0, percentual)).toFixed(1);
        });

        return result;
    }
}
