# 📊 Pipeline de Dados Geoespaciais — DF por Setor Censitário

## Visão Geral

Scripts para extração dos 5 indicadores necessários para análise de Ilhas de Calor no DF, agregados por **setor censitário**.

## Requisitos

### Google Earth Engine (Scripts 01-04)
1. Acesse [code.earthengine.google.com](https://code.earthengine.google.com)
2. Copie e cole o conteúdo de cada script
3. Clique em **Run**
4. Vá na aba **Tasks** e inicie a exportação para o Google Drive
5. Baixe os CSVs do Drive e coloque em `src/assets/data/`

### Python (Script 05)
```bash
pip install pandas requests
python scripts/python/05_censo_ibge.py
```

## Scripts

| # | Arquivo | Indica | Fonte | Produto |
|---|---------|---------|-------|---------|
| 1 | `gee/01_lst_landsat.js` | 🌡️ Temperatura | Landsat 8/9 | `lst_p90_por_setor.csv` |
| 2 | `gee/02_ndvi_sentinel.js` | 🌿 Vegetação | Sentinel-2 | `ndvi_medio_por_setor.csv` |
| 3 | `gee/03_impermeabilizacao.js` | 🏗️ Impermeab. | MapBiomas C9 | `impermeabilizacao_pct_por_setor.csv` |
| 4 | `gee/04_topografia_srtm.js` | ⛰️ Topografia | SRTM + MERIT | `declividade_por_setor.csv` + `twi_por_setor.csv` |
| 5 | `python/05_censo_ibge.py` | 👥 Social | Censo 2022 | `dados_sociais_por_setor.csv` |

## Destino dos CSVs

Todos os CSVs gerados devem ser colocados em:
```
src/assets/data/
```

## Nota sobre Setores Censitários

Os scripts GEE usam o asset de setores censitários do MapBiomas:
```
projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/NIVEL_POLITICO/setor_censitario
```

Caso este asset não esteja disponível, faça upload manual do shapefile IBGE como asset GEE.
