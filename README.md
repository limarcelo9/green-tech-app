# 🌳 Green-Tech DF: Priorização de Adaptação Climática

Uma plataforma analítica avançada para suporte à tomada de decisão legislativa e executiva, focada na resiliência urbana do Distrito Federal e grandes metrópoles brasileiras.

O projeto utiliza o **IPAC (Índice de Priorização de Adaptação Climática)** para identificar e simular intervenções baseadas na natureza (WRI Brasil, 2025).

---

## 🚀 Funcionalidades Principais

*   **🏆 Ranking IPAC:** Classificação das 35 Regiões Administrativas do DF por criticidade climática.
*   **🌡️ Módulo de Calor (H):** Análise de temperatura de superfície e ilhas de calor via satélite.
*   **💧 Módulo Hídrico (W):** Monitoramento de risco de alagamentos e escoamento superficial.
*   **👥 Módulo Social (P):** Mapeamento de vulnerabilidade socioeconômica e demográfica.
*   **🧠 Smart Allocator (A.I.):** Simulador de intervenções que calcula o impacto de arborização, telhados verdes e pavimentos frios no microclima urbano.

---

## 📊 Fontes de Dados e APIs

A plataforma consome dados em tempo real e bases históricas de alta resolução:

| Recurso | Fonte / API | Descritivo |
| :--- | :--- | :--- |
| **Clima (Temp/Chuva)** | [Open-Meteo](https://open-meteo.com/) | Previsões e histórico (GFS/ECMWF). |
| **Relevo (Altitude)** | [Open-Elevation](https://open-elevation.com/) | Modelagem digital de elevação (SRTM/NASA). |
| **Calor (Satélite)** | Landsat 8/9 & Copernicus | Captura da Temperatura da Superfície Terrestre (LST). |
| **Social / Renda** | IBGE & IPEDF (Codeplan) | Dados demográficos e socioeconômicos consolidados. |
| **Metodologia SBN** | [WRI Brasil](https://www.wribrasil.org.br/) | Parâmetros de intervenção baseados na natureza. |
| **Mapa Interativo** | Leaflet + CartoDB | Interface geoespacial de alta performance. |

---

## 🛠️ Tecnologias Utilizadas

*   **Framework:** Angular 18 (Standalone Components)
*   **Estilização:** Tailwind CSS & Vanilla CSS (Premium Aesthetics)
*   **Cartografia:** Leaflet.js
*   **Visualização:** Chart.js & NG2-Charts
*   **Deploy:** GitHub Pages (`angular-cli-ghpages`)

---

## 💻 Desenvolvimento

Para rodar o projeto localmente:

1.  Instale as dependências: `npm install`
2.  Inicie o servidor: `npm start`
3.  Acesse: `http://localhost:4200/`

Para deploy no GitHub Pages:
`ng deploy --base-href=/green-tech-app/`

---

**Desenvolvido por [limarcelo9](https://github.com/limarcelo9)**
