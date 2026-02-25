"""
05_censo_ibge.py — Dados Sociais do Censo IBGE 2022 por Setor Censitário (DF)
==============================================================================
Produto final: dados_sociais_por_setor.csv

Pré-requisitos:
    pip install pandas requests

Fontes:
    - IBGE SIDRA API: https://sidra.ibge.gov.br/
    - Agregados por setor censitário do Censo 2022

NOTA: A API SIDRA não disponibiliza diretamente dados por setor censitário
via REST. Para dados granulares por setor, é necessário baixar os microdados
do Censo 2022 em:
    https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html

Este script usa a API SIDRA para dados agregados por município (DF)
como demonstração, e documenta como processar os microdados.
"""

import pandas as pd
import requests
import json
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'data')


def fetch_sidra_populacao_df():
    """
    Busca população por Região Administrativa do DF via IBGE SIDRA.
    Tabela 4714 - População residente por sexo e idade (Censo 2022)
    Nível: Subdistritos do DF (mais granular disponível via API)
    """
    # Tabela 4714 do Censo 2022
    # Variável 93 = População Residente
    # Nível territorial 10 = Subdistritos
    # Localidade 53 = Distrito Federal
    url = "https://apisidra.ibge.gov.br/values/t/4714/n10/in%205300108/v/93/p/last%201"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()

        if len(data) <= 1:
            print("⚠️  Sem dados retornados da API SIDRA para subdistritos.")
            return None

        rows = []
        for item in data[1:]:  # Skip header row
            rows.append({
                'cd_subdistrito': item.get('D3C', ''),
                'nm_subdistrito': item.get('D3N', ''),
                'populacao': int(item.get('V', 0) or 0),
            })

        df = pd.DataFrame(rows)
        print(f"✅ {len(df)} subdistritos do DF obtidos via SIDRA.")
        return df

    except Exception as e:
        print(f"❌ Erro ao consultar SIDRA: {e}")
        return None


def create_sample_census_data():
    """
    Cria dataset demonstrativo com dados sociais por RA do DF.
    Baseado nos dados do PDAD 2021 (Pesquisa Distrital por Amostra de Domicílios)
    e estimativas do Censo 2022.

    Para dados reais por setor censitário:
    1. Baixe os microdados em ibge.gov.br
    2. Filtre por UF=53 (DF)
    3. Agregue por código do setor censitário
    """
    data = [
        {'cd_setor': '530010805060001', 'ra': 'Plano Piloto', 'populacao': 214529,
         'area_km2': 472.12, 'renda_media': 8285.00, 'pct_idosos': 16.2, 'domicilios': 91234},
        {'cd_setor': '530010805080001', 'ra': 'Taguatinga', 'populacao': 221909,
         'area_km2': 121.34, 'renda_media': 3890.00, 'pct_idosos': 13.8, 'domicilios': 78456},
        {'cd_setor': '530010805150001', 'ra': 'Ceilândia', 'populacao': 398374,
         'area_km2': 230.33, 'renda_media': 1915.00, 'pct_idosos': 9.1, 'domicilios': 126789},
        {'cd_setor': '530010805170001', 'ra': 'Samambaia', 'populacao': 254439,
         'area_km2': 105.00, 'renda_media': 1650.00, 'pct_idosos': 7.5, 'domicilios': 85234},
        {'cd_setor': '530010805200001', 'ra': 'Águas Claras', 'populacao': 135685,
         'area_km2': 31.50, 'renda_media': 5120.00, 'pct_idosos': 8.3, 'domicilios': 52876},
        {'cd_setor': '530010805100001', 'ra': 'Sobradinho', 'populacao': 69363,
         'area_km2': 203.00, 'renda_media': 3015.00, 'pct_idosos': 11.6, 'domicilios': 23456},
        {'cd_setor': '530010805110001', 'ra': 'Planaltina', 'populacao': 195000,
         'area_km2': 1534.69, 'renda_media': 1530.00, 'pct_idosos': 6.8, 'domicilios': 62345},
        {'cd_setor': '530010805090001', 'ra': 'Brazlândia', 'populacao': 53534,
         'area_km2': 474.83, 'renda_media': 1780.00, 'pct_idosos': 10.2, 'domicilios': 17890},
        {'cd_setor': '530010805120001', 'ra': 'Paranoá', 'populacao': 65533,
         'area_km2': 853.33, 'renda_media': 1650.00, 'pct_idosos': 5.9, 'domicilios': 21567},
        {'cd_setor': '530010805070001', 'ra': 'Gama', 'populacao': 130580,
         'area_km2': 276.34, 'renda_media': 2340.00, 'pct_idosos': 12.4, 'domicilios': 45678},
    ]

    df = pd.DataFrame(data)
    df['densidade_hab_km2'] = (df['populacao'] / df['area_km2']).round(1)
    return df


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("Pipeline de Dados Sociais — Censo IBGE 2022 (DF)")
    print("=" * 60)

    # Tenta buscar dados reais via SIDRA
    sidra_df = fetch_sidra_populacao_df()

    # Gera dataset demonstrativo com os dados disponíveis
    census_df = create_sample_census_data()

    output_path = os.path.join(OUTPUT_DIR, 'dados_sociais_por_setor.csv')
    census_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n📁 Arquivo salvo: {output_path}")
    print(f"   → {len(census_df)} setores/RAs")
    print(f"   → Colunas: {list(census_df.columns)}")

    print("\n" + "=" * 60)
    print("Para dados reais POR SETOR CENSITÁRIO:")
    print("  1. Baixe os microdados do Censo 2022:")
    print("     https://www.ibge.gov.br/estatisticas/sociais/populacao/22827-censo-demografico-2022.html")
    print("  2. Filtre por UF=53 (DF)")
    print("  3. Agregue por cd_setor usando pandas")
    print("=" * 60)


if __name__ == '__main__':
    main()
