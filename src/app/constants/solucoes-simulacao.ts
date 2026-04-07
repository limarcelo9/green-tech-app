export type IndicadorSimulacao = "lst" | "conforto_termico" | "escoamento" | "infiltracao" | "energia";
export type CenarioSimulacao = "conservador" | "medio" | "agressivo";

export interface FatoresImpacto {
    conservador: number;
    medio: number;
    agressivo: number;
}

export interface ImpactoSolucao {
    indicador: IndicadorSimulacao;
    fatores: FatoresImpacto;
}

export interface SolucaoSimulacao {
    id: string;
    nome: string;
    categoria: "SbN" | "Infraestrutura";
    eixo_principal: "calor" | "agua" | "qualidade_urbana";
    unidade: "m2" | "m3" | "unidade";
    area_elegivel: string | null;
    percentual: number;
    custo_unitario: number | null;
    fator_regional: number;
    area_equivalente?: number; // m2 por unidade (para comparabilidade)
    indicadores_afetados: IndicadorSimulacao[];
    impactos: ImpactoSolucao[];
    observacao_tecnica: string;
}

export const BIBLIOTECA_SOLUCOES: SolucaoSimulacao[] = [
    // --- BLOCO 1: CALOR ---
    {
        id: "cobertura_arborea",
        nome: "Cobertura Arbórea",
        categoria: "SbN",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 250,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico", "escoamento"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.04, medio: 0.07, agressivo: 0.12 } },
            { indicador: "escoamento", fatores: { conservador: 0.15, medio: 0.25, agressivo: 0.40 } }
        ],
        observacao_tecnica: "Aumento do dossel para sombreamento direto e resfriamento evaporativo."
    },
    {
        id: "area_verde",
        nome: "Área Verde (Parques/Praças)",
        categoria: "SbN",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 180,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico", "escoamento", "infiltracao"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.03, medio: 0.05, agressivo: 0.09 } },
            { indicador: "escoamento", fatores: { conservador: 0.30, medio: 0.50, agressivo: 0.75 } },
            { indicador: "infiltracao", fatores: { conservador: 0.20, medio: 0.40, agressivo: 0.60 } }
        ],
        observacao_tecnica: "Criação de espaços vegetados permeáveis para redução de ilhas de calor."
    },
    {
        id: "telhado_verde",
        nome: "Telhado Verde",
        categoria: "SbN",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 850,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico", "energia", "escoamento"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.02, medio: 0.04, agressivo: 0.06 } },
            { indicador: "energia", fatores: { conservador: 0.05, medio: 0.10, agressivo: 0.15 } },
            { indicador: "escoamento", fatores: { conservador: 0.10, medio: 0.20, agressivo: 0.35 } }
        ],
        observacao_tecnica: "Vegetação sobre coberturas para isolamento térmico e retenção pluvial."
    },
    {
        id: "telhado_frio",
        nome: "Telhado Frio",
        categoria: "Infraestrutura",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 65,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "energia"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.03, medio: 0.06, agressivo: 0.09 } },
            { indicador: "energia", fatores: { conservador: 0.10, medio: 0.16, agressivo: 0.22 } }
        ],
        observacao_tecnica: "Pintura reflexiva para aumento do albedo e redução de carga térmica interna."
    },
    {
        id: "pavimento_frio",
        nome: "Pavimento Frio",
        categoria: "Infraestrutura",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 120,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.03, medio: 0.05, agressivo: 0.08 } }
        ],
        observacao_tecnica: "Tratamento de vias com cores claras para reduzir absorção de calor solar."
    },
    {
        id: "parede_verde",
        nome: "Parede Verde",
        categoria: "SbN",
        eixo_principal: "calor",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 950,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico", "energia"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.015, medio: 0.03, agressivo: 0.05 } },
            { indicador: "energia", fatores: { conservador: 0.04, medio: 0.08, agressivo: 0.12 } }
        ],
        observacao_tecnica: "Jardins verticais para resfriamento de fachadas e microclima local."
    },

    // --- BLOCO 2: ÁGUA / ENCHENTES ---
    {
        id: "desimpermeabilizacao",
        nome: "Desimpermeabilização",
        categoria: "Infraestrutura",
        eixo_principal: "agua",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 320,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao", "lst"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 0.25, medio: 0.45, agressivo: 0.70 } },
            { indicador: "infiltracao", fatores: { conservador: 0.20, medio: 0.40, agressivo: 0.65 } },
            { indicador: "lst", fatores: { conservador: 0.02, medio: 0.04, agressivo: 0.06 } }
        ],
        observacao_tecnica: "Remoção de asfalto/concreto para solo exposto ou gramado."
    },
    {
        id: "jardim_de_chuva",
        nome: "Jardim de Chuva",
        categoria: "SbN",
        eixo_principal: "agua",
        unidade: "unidade",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 2500,
        fator_regional: 1.0,
        area_equivalente: 25, // 1 Jardim de Chuva equivale a ~25m2
        indicadores_afetados: ["escoamento", "infiltracao"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 1.1, medio: 2.5, agressivo: 3.85 } },
            { indicador: "infiltracao", fatores: { conservador: 0.8, medio: 1.8, agressivo: 2.8 } }
        ],
        observacao_tecnica: "Sistemas de biorretenção para filtrar e infiltrar águas pluviais."
    },
    {
        id: "biovaleta",
        nome: "Biovaleta",
        categoria: "SbN",
        eixo_principal: "agua",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 450,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 0.5, medio: 1.1, agressivo: 1.75 } },
            { indicador: "infiltracao", fatores: { conservador: 0.4, medio: 0.9, agressivo: 1.4 } }
        ],
        observacao_tecnica: "Canais vegetados para transporte e infiltração de escoamento superficial."
    },
    {
        id: "canteiro_pluvial",
        nome: "Canteiro Pluvial",
        categoria: "SbN",
        eixo_principal: "agua",
        unidade: "unidade",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 1200,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 1.0, medio: 2.2, agressivo: 3.5 } },
            { indicador: "infiltracao", fatores: { conservador: 0.8, medio: 1.7, agressivo: 2.8 } }
        ],
        observacao_tecnica: "Adaptação de canteiros existentes para recepção de águas da via."
    },
    {
        id: "pavimento_permeavel",
        nome: "Pavimento Permeável",
        categoria: "Infraestrutura",
        eixo_principal: "agua",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 380,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 0.2, medio: 0.4, agressivo: 0.65 } },
            { indicador: "infiltracao", fatores: { conservador: 0.15, medio: 0.35, agressivo: 0.60 } }
        ],
        observacao_tecnica: "Concreto ou intertravado que permite a passagem de água para o substrato."
    },
    {
        id: "trincheira_de_infiltracao",
        nome: "Trincheira de Infiltração",
        categoria: "Infraestrutura",
        eixo_principal: "agua",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 550,
        fator_regional: 1.0,
        indicadores_afetados: ["infiltracao"],
        impactos: [
            { indicador: "infiltracao", fatores: { conservador: 0.3, medio: 0.6, agressivo: 1.0 } }
        ],
        observacao_tecnica: "Valetas escavadas preenchidas com brita para infiltração direta no lençol."
    },
    {
        id: "bacia_retencao",
        nome: "Bacia de Retenção",
        categoria: "Infraestrutura",
        eixo_principal: "agua",
        unidade: "m3",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 850,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 2.0, medio: 4.5, agressivo: 7.0 } }
        ],
        observacao_tecnica: "Reservatórios temporários para amortecimento de picos de cheia."
    },
    {
        id: "escada_hidraulica_vegetada",
        nome: "Escada Hidráulica Vegetada",
        categoria: "SbN",
        eixo_principal: "agua",
        unidade: "unidade",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 15000,
        fator_regional: 1.0,
        area_equivalente: 50, // 1 Escada Hidráulica equivale a ~50m2
        indicadores_afetados: ["escoamento"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 0.8, medio: 1.5, agressivo: 2.8 } }
        ],
        observacao_tecnica: "Controle de erosão e redução de velocidade da água em declividades."
    },

    // --- BLOCO 3: QUALIDADE URBANA / RESILIÊNCIA ---
    {
        id: "parques_lineares",
        nome: "Parques Lineares",
        categoria: "SbN",
        eixo_principal: "qualidade_urbana",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 550,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "escoamento", "infiltracao", "conforto_termico"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.04, medio: 0.08, agressivo: 0.15 } },
            { indicador: "escoamento", fatores: { conservador: 0.40, medio: 0.65, agressivo: 0.90 } }
        ],
        observacao_tecnica: "Proteção de cursos d'água associada a lazer e mobilidade ativa."
    },
    {
        id: "requalificacao_fundos_vale",
        nome: "Requalificação de Fundos de Vale",
        categoria: "SbN",
        eixo_principal: "qualidade_urbana",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 1200,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 3.5, medio: 7.0, agressivo: 12.0 } }
        ],
        observacao_tecnica: "Restauração ecológica de margens e prevenção de transbordamentos."
    },
    {
        id: "recuperacao_app_urbana",
        nome: "Recuperação de APP Urbana",
        categoria: "SbN",
        eixo_principal: "qualidade_urbana",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: 950,
        fator_regional: 1.0,
        indicadores_afetados: ["escoamento", "infiltracao", "lst"],
        impactos: [
            { indicador: "escoamento", fatores: { conservador: 4.0, medio: 8.5, agressivo: 15.0 } },
            { indicador: "lst", fatores: { conservador: 0.03, medio: 0.06, agressivo: 0.10 } }
        ],
        observacao_tecnica: "Restauração de Áreas de Preservação Permanente degradadas pelo tecido urbano."
    },
    {
        id: "corredores_verdes",
        nome: "Corredores Verdes",
        categoria: "SbN",
        eixo_principal: "qualidade_urbana",
        unidade: "m2",
        area_elegivel: null,
        percentual: 0,
        custo_unitario: null,
        fator_regional: 1.0,
        indicadores_afetados: ["lst", "conforto_termico"],
        impactos: [
            { indicador: "lst", fatores: { conservador: 0.02, medio: 0.04, agressivo: 0.07 } }
        ],
        observacao_tecnica: "Conectividade entre fragmentos florestais para biodiversidade e frescor urbano."
    }
];
