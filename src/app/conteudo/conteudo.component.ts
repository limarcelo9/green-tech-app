import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Slide {
  titulo: string;
  topicos: string[];
  notas: string;
}

@Component({
  selector: "app-conteudo",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./conteudo.component.html",
  styleUrls: ["./conteudo.component.css"]
})
export class ConteudoComponent implements OnInit {
  isGenerating = false;
  isFinished = false;
  currentSlideIndex = 0;

  slides: Slide[] = [
    {
      titulo: "Resiliência Climática: Brasília",
      topicos: [
        "Foco em Infraestrutura Verde e Azul",
        "Mitigação de Ilhas de Calor Urbana",
        "Adaptação às Mudanças Hídricas"
      ],
      notas: "Este slide serve como abertura, destacando a complexidade do microclima do DF e a necessidade de métricas geoespaciais integradas."
    },
    {
      titulo: "Diagnóstico Térmico (Percentil 90)",
      topicos: [
        "Identificação de Hotspots Críticos",
        "Correlação entre LST e Vulnerabilidade Social",
        "Impacto na Saúde das Sub-bacias"
      ],
      notas: "Usamos os dados de sensoriamento remoto do GreenTech para isolar as áreas onde a temperatura de superfície excede a média de forma crítica."
    },
    {
      titulo: "Soluções Baseadas na Natureza (SbN)",
      topicos: [
        "Bio-valas e Retenção Hídrica",
        "Parques Lineares como Corredores de Frescor",
        "Arborização Viária Estratégica"
      ],
      notas: "A simulação mostra que a cada 10% de aumento na cobertura arbórea, podemos reduzir até 1.2°C na temperatura de superfície local."
    },
    {
      titulo: "Impacto Hídrico e Permeabilidade",
      topicos: [
        "Infiltração vs. Escoamento Superficial",
        "Prevenção de Inundações em RA's de Alta Densidade",
        "Melhoria do Ciclo Hidrológico Urbano"
      ],
      notas: "A desimpermeabilização estratégica em fundos de vale reduz a carga nos sistemas de drenagem convencional em até 20% no cenário médio."
    },
    {
      titulo: "Economia e Eficiência Energética",
      topicos: [
        "Redução da Demanda por Resfriamento",
        "Impactos da Albedo nas Fachadas",
        "Eficiência de Telhados Frios e Verdes"
      ],
      notas: "Estimamos uma economia de até 15% no consumo elétrico de edifícios públicos que adotem tratamentos reflexivos em coberturas."
    },
    {
      titulo: "Próximos Passos: Custos e SROI",
      topicos: [
        "Integração com Tabelas de Investimento",
        "Cálculo do Retorno Social (SROI)",
        "Escalonamento de Intervenções por RA"
      ],
      notas: "A próxima fase do projeto ligará estes indicadores a valores monetários reais para subsidiar decisões orçamentárias."
    }
  ];

  constructor() { }

  ngOnInit(): void {
    console.log("Módulo Conteúdo (Official MCP Edition) Inicializado");
  }

  gerarApresentacao() {
    this.isGenerating = true;
    setTimeout(() => {
      this.isGenerating = false;
      this.isFinished = true;
      this.currentSlideIndex = 0;
    }, 2500);
  }

  proximoSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.currentSlideIndex++;
    }
  }

  anteriorSlide() {
    if (this.currentSlideIndex > 0) {
      this.currentSlideIndex--;
    }
  }

  voltar() {
    this.isFinished = false;
    this.currentSlideIndex = 0;
  }
}
