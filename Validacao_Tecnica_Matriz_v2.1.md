# Relatório de Auditoria Técnica: Matriz de Impactos v2.1

Este documento contém o registro das alterações realizadas para a versão **v2.1** da matriz de simulação do GreenTech, garantindo a rastreabilidade das decisões de projeto.

---

## 1. Tabela de Auditoria (Antes vs. Depois)

Focada nas soluções hídricas recalibradas conforme diretrizes de variância e proporcionalidade.

| Solução (Indicador) | v2.0 (Cons / Med / Agr) | v2.1 (Cons / Med / Agr) | Variância (v2.1) | Notas de Auditoria |
| :--- | :--- | :--- | :--- | :--- |
| **Jardim de Chuva** (Esc.) | 1.5 / 3.5 / 6.0 | **1.1 / 2.5 / 3.85** | 3.5x | Ajuste de escala volumétrica. |
| **Jardim de Chuva** (Inf.) | 1.0 / 2.5 / 4.5 | **0.8 / 1.8 / 2.80** | 3.5x | Redução proporcional ao escoamento. |
| **Bacia de Retenção** (Esc.) | 2.0 / 5.0 / 10.0 | **2.0 / 4.5 / 7.00** | 3.5x | Atenuação de pico agressivo. |
| **Biovaleta** (Esc.) | 0.5 / 1.2 / 2.5 | **0.5 / 1.1 / 1.75** | 3.5x | Limite de variância aplicado. |
| **Canteiro Pluvial** (Esc.) | 1.0 / 2.5 / 4.0 | **1.0 / 2.2 / 3.50** | 3.5x | Ajuste de limite agressivo. |

---

## 2. Matriz Consolidada Final (v2.1)

Dados validados para o motor de cálculo dinâmico.

| Solução | ID Interno | LST | Escoam. | Infiltr. | Energia | Conforto |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Cobertura Arbórea | `cobertura_arborea` | -0.07 | -0.25 | -- | -- | Sim (Deriv.) |
| Área Verde | `area_verde` | -0.05 | -0.50 | +0.40 | -- | Sim (Deriv.) |
| Telhado Verde | `telhado_verde` | -0.04 | -0.20 | -- | -0.10 | Sim (Deriv.) |
| Telhado Frio | `telhado_frio` | -0.06 | -- | -- | -0.16 | -- |
| Desimpermeab. | `desimpermeabilizacao` | -0.04 | -0.45 | +0.40 | -- | -- |
| Jardim de Chuva | `jardim_de_chuva` | -0.01 | **-2.50** | **+1.80** | -- | -- |
| Bacia Retenção | `bacia_retencao` | -- | **-4.50** | -- | -- | -- |
| Pav. Permeável | `pavimento_permeavel` | -- | -0.40 | +0.35 | -- | -- |

---

## 3. Validação das Regras Lógicas
> [!IMPORTANT]
> **Atenuação de Variância:** Confirmamos que nenhuma solução hídrica agora ultrapassa o salto de **3.5x** entre os cenários Conservador e Agressivo.
> **Regra de Não-Sobreposição:** Implementada no `SimulationService`. Caso `Área Verde` + `Desimpermeabilização` ultrapassem 40% do setor, o sistema aplica um decaimento proporcional para evitar duplicação de área física simulada.

**A base de impacto está agora 100% validada para integração com os Módulos de Custo e SROI.**
