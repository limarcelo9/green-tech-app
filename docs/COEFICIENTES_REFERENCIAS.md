# Documentação Técnica — Coeficientes do Motor de Simulação IPA-IVU

## 1. Simulação Térmica

### 1.1 Efeito da Cobertura Arbórea sobre LST

**Variável:** cada 1% de aumento na cobertura do dossel → redução da temperatura de superfície (°C)

| Cenário | Coeficiente | Justificativa |
|---------|-------------|---------------|
| Conservador | -0.04 °C/% | Limite inferior de meta-análises em climas tropicais |
| Médio | -0.07 °C/% | Valor central mais reportado na literatura |
| Agressivo | -0.12 °C/% | Limite superior (regiões com alta insolação e baixa umidade) |

**Referências:**

1. **Ziter, C. D., Pedersen, E. J., Kucharik, C. J., & Turner, M. G. (2019).** Scale-dependent interactions between tree canopy cover and impervious surfaces reduce daytime urban heat during summer. *Proceedings of the National Academy of Sciences*, 116(15), 7575–7580.
   - Cada 10% de aumento no dossel → -0.5 a -1.2°C de LST (~0.05–0.12°C/%))
   - Estudo em Madison, WI com dados de Landsat e sensores móveis

2. **Bowler, D. E., Buyung-Ali, L., Knight, T. M., & Pullin, A. S. (2010).** Urban greening to cool towns and cities: A systematic review of the empirical evidence. *Landscape and Urban Planning*, 97(3), 147–155.
   - Meta-análise: parques urbanos são em média 0.94°C mais frios que arredores
   - Relação não-linear entre área verde e resfriamento

3. **WRI Brasil (2020).** *Infraestrutura Verde e Soluções Baseadas na Natureza para Adaptação Climática nas Cidades*. São Paulo.
   - Referência contextual para cidades brasileiras
   - Diferenças de até 8°C entre centros urbanos e áreas rurais adjacentes no DF

4. **Fonseca, M. N. et al. (2022).** Análise de ilhas de calor urbanas no Distrito Federal utilizando dados Landsat. *Revista Brasileira de Climatologia*, 30, 245–268.
   - Estudo local validando faixas de LST no DF entre 28–48°C no período seco

---

### 1.2 Efeito da Redução de Impermeabilização sobre LST

**Variável:** cada 1% de redução na superfície impermeável → redução de LST (°C)

| Cenário | Coeficiente | Justificativa |
|---------|-------------|---------------|
| Conservador | -0.02 °C/% | Substituição por solo exposto (baixo efeito) |
| Médio | -0.04 °C/% | Substituição por pavimento permeável |
| Agressivo | -0.06 °C/% | Substituição por vegetação densa |

**Referências:**

5. **U.S. EPA (2008).** *Reducing Urban Heat Islands: Compendium of Strategies — Cool Pavements*. United States Environmental Protection Agency.
   - Pavimentos permeáveis reduzem temperatura superficial em 2–4°C comparado a asfalto convencional
   - Albedo do asfalto: 0.05–0.10 vs pavimento permeável: 0.15–0.35

6. **Akbari, H., Pomerantz, M., & Taha, H. (2001).** Cool surfaces and shade trees to reduce energy use and improve air quality in urban areas. *Solar Energy*, 70(3), 295–310.
   - Cada 0.1 de aumento no albedo → -0.3°C de temperatura do ar
   - Base teórica para a relação impermeabilização-LST

---

### 1.3 Proxy de Conforto Térmico

**Variável:** cada 1°C de redução na LST → % de melhoria no conforto térmico percebido

| Cenário | Coeficiente | Justificativa |
|---------|-------------|---------------|
| Conservador | 2.5%/°C | Ambientes com alta umidade (efeito atenuado) |
| Médio | 4.0%/°C | Condições típicas do cerrado (úmido-seco) |
| Agressivo | 6.0%/°C | Ambientes secos com grande amplitude térmica |

**Referências:**

7. **Oke, T. R., Mills, G., Christen, A., & Voogt, J. A. (2017).** *Urban Climates*. Cambridge University Press.
   - Framework teórico para relação entre temperatura de superfície e temperatura do ar
   - Fator de acoplamento LST → T(ar) varia entre 0.3–0.7

8. **Höppe, P. (1999).** The physiological equivalent temperature – a universal index for the biometeorological assessment of the thermal environment. *International Journal of Biometeorology*, 43(2), 71–75.
   - PET (Physiological Equivalent Temperature) como proxy de conforto
   - Cada 1°C de PET ≈ 3–6% na percepção de conforto em ambientes externos

---

## 2. Simulação Hídrica (SCS-CN)

### 2.1 Método SCS Curve Number

**Modelo:** U.S. Soil Conservation Service (SCS) — agora NRCS

**Equação simplificada:**

```
S = (25400 / CN) - 254          [mm]
Q = (P - 0.2*S)² / (P + 0.8*S) [mm]   para P > 0.2*S
```

Onde:
- **P** = precipitação (mm) — usamos 50mm como evento de referência
- **S** = retenção máxima potencial
- **Q** = escoamento superficial
- **CN** = Curve Number (0–100)

### 2.2 Valores de CN Utilizados

| Superfície | CN | Fonte |
|------------|-----|-------|
| Impermeável (asfalto, concreto, telhado) | 98 | USDA TR-55, Tabela 2-2a |
| Área verde urbana (gramado, parque) | 61 | USDA TR-55, condição hidrológica "boa", grupo B |
| Superfície mista (existente) | 80 | Média ponderada típica urbana |

**CN do setor** é calculado como média ponderada:

```
CN_original = (% impermeável × 98) + (% permeável × 61)
CN_simulado = (% impermeável_novo × 98) + (% existente × 80) + (% nova_verde × 61)
```

### 2.3 Cálculo de Redução de Escoamento

```
Redução(%) = ((Q_original - Q_simulado) / Q_original) × 100
```

### 2.4 Proxy de Infiltração

```
Aumento_infiltração = Redução_escoamento × 0.7
```

**Justificativa:** Nem toda redução de escoamento vira infiltração — parte é evapotranspiração, parte é armazenamento superficial. O fator 0.7 é conservador.

**Referências:**

9. **USDA Natural Resources Conservation Service (1986).** *Urban Hydrology for Small Watersheds — TR-55*. Technical Release 55.
   - Tabelas de CN por tipo de uso do solo e grupo hidrológico
   - Método padrão para estimativa de escoamento urbano

10. **Tucci, C. E. M. (2005).** *Hidrologia: Ciência e Aplicação*. 4ª ed. Porto Alegre: Editora da UFRGS/ABRH.
    - Adaptação do SCS-CN para condições brasileiras
    - Valores de CN para cerrado e áreas urbanas do Brasil Central

11. **Fletcher, T. D., Andrieu, H., & Hamel, P. (2013).** Understanding, management and modelling of urban hydrology and its consequences for receiving waters: A state of the art. *Advances in Water Resources*, 51, 261–279.
    - Revisão sobre o impacto da impermeabilização no ciclo hidrológico urbano
    - Validação de abordagens simplificadas tipo SCS-CN

---

## 3. Normalização IPA (Percentil)

**Método:** Rank percentile dentro do universo de RAs do DF

```
normalize(valor) = (rank(valor) / N) × 100
```

Onde `rank` = posição ordinal do valor na série ordenada, e `N` = total de RAs (35).

**Variáveis invertidas** (onde valor baixo = alta prioridade):
- **NDVI** → invertido (baixo NDVI = pouca vegetação = alta prioridade)
- **Renda** → invertida (baixa renda = maior vulnerabilidade = alta prioridade)

**Referência:**

12. **Cutter, S. L., Boruff, B. J., & Shirley, W. L. (2003).** Social Vulnerability to Environmental Hazards. *Social Science Quarterly*, 84(2), 242–261.
    - Metodologia SoVI (Social Vulnerability Index) usando percentis para normalização
    - Base teórica para composição de índices multi-variáveis com pesos

---

## 4. Pesos do IPA

### 4.1 Módulos

| Módulo | Fórmula | Peso Final |
|--------|---------|------------|
| H (Calor) | `0.5×LST + 0.3×Imperm + 0.2×NDVI⁻¹` | 0.40 |
| W (Água)  | `0.4×TWI + 0.3×Imperm + 0.3×Decliv`  | 0.30 |
| P (Pessoas) | `0.4×Dens + 0.4×Renda⁻¹ + 0.2×Idosos` | 0.30 |

### 4.2 Justificativa dos Pesos

- **H com maior peso (0.40):** O IPA é primariamente um índice de Ilhas de Calor; o módulo térmico deve dominar.
- **W e P iguais (0.30 cada):** A vulnerabilidade hídrica e social são fatores complementares de igual importância na priorização.
- **Dentro de H:** LST é o indicador direto (0.5); impermeabilização é causa (0.3); NDVI é proxy inverso (0.2).
- **Dentro de P:** Densidade e renda têm peso igual (0.4 cada) pois determinam quantidade e vulnerabilidade da população exposta; idosos são grupo de risco (0.2).

**Referência:**

13. **Coutts, A. M., Tapper, N. J., Beringer, J., Loughnan, M., & Demuzere, M. (2013).** Watering our cities: The capacity for Water Sensitive Urban Design to support urban cooling and improve human thermal comfort in the Australian context. *Progress in Physical Geography*, 37(1), 2–28.
    - Framework de ponderação para índices de vulnerabilidade ao calor urbano

---

## 5. Limitações e Ressalvas

| Limitação | Impacto | Mitigação |
|-----------|---------|-----------|
| Dados demonstrativos (não reais do GEE) | Rankings podem não refletir realidade | Executar scripts GEE com dados reais |
| SCS-CN é empírico e simplificado | Subestima efeitos de armazenamento | Usar SWMM para simulações detalhadas |
| Coeficientes térmicos de outras latitudes | Podem não se aplicar ao cerrado | Calibrar com estudos locais do DF |
| Relação LST→conforto é proxy | Não substitui medição in situ | Validar com estações meteorológicas |
| Pesos fixos | Podem não capturar especificidades locais | Análise de sensibilidade (aba implementada) |
