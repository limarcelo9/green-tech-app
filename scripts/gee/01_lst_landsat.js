// ============================================================
// 01_lst_landsat.js — LST Percentil 90 por Setor Censitário (DF)
// Executar em: https://code.earthengine.google.com
// ============================================================
// Produto final: lst_p90_por_setor.csv
// Fonte: Landsat 8/9 Collection 2, Band ST_B10 (Surface Temperature)
// Período: maio–setembro de 2022, 2023, 2024 (estação seca)

// 1. Malha de setores censitários do DF (IBGE)
// Opção A: usar asset público do IBGE no GEE
var setores = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/NIVEL_POLITICO/setor_censitario')
    .filter(ee.Filter.eq('sigla_uf', 'DF'));

// Opção B: se o asset acima não estiver disponível, faça upload do shapefile
// var setores = ee.FeatureCollection('users/SEU_USUARIO/setores_censitarios_df');

// 2. Bounding box do DF
var df = ee.Geometry.Rectangle([-48.3, -16.05, -47.3, -15.45]);

// 3. Função para converter DN para temperatura em Celsius (Landsat Collection 2)
function landsatLST(image) {
    // ST_B10 já vem em Kelvin * 0.00341802 + 149.0 (Collection 2 Level-2)
    var lst = image.select('ST_B10')
        .multiply(0.00341802)
        .add(149.0)
        .subtract(273.15) // Kelvin → Celsius
        .rename('LST');
    return image.addBands(lst);
}

// 4. Coleção Landsat 8 (período seco: maio-setembro, 2022-2024)
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterBounds(df)
    .filter(ee.Filter.calendarRange(5, 9, 'month'))
    .filter(ee.Filter.calendarRange(2022, 2024, 'year'))
    .filter(ee.Filter.lt('CLOUD_COVER', 20))
    .map(landsatLST)
    .select('LST');

// 5. Coleção Landsat 9 (mesmo filtro)
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
    .filterBounds(df)
    .filter(ee.Filter.calendarRange(5, 9, 'month'))
    .filter(ee.Filter.calendarRange(2022, 2024, 'year'))
    .filter(ee.Filter.lt('CLOUD_COVER', 20))
    .map(landsatLST)
    .select('LST');

// 6. Merge Landsat 8 + 9
var lstCollection = l8.merge(l9);
print('Total de imagens LST:', lstCollection.size());

// 7. Calcular Percentil 90
var lstP90 = lstCollection.reduce(ee.Reducer.percentile([90])).rename('LST_P90');

// 8. Visualizar no mapa
Map.centerObject(df, 10);
Map.addLayer(lstP90, { min: 25, max: 50, palette: ['blue', 'yellow', 'red'] }, 'LST P90 (°C)');

// 9. Reduzir por setor censitário (média do P90 dentro de cada setor)
var lstPorSetor = lstP90.reduceRegions({
    collection: setores,
    reducer: ee.Reducer.mean(),
    scale: 30
});

// 10. Exportar CSV
Export.table.toDrive({
    collection: lstPorSetor,
    description: 'lst_p90_por_setor',
    fileNamePrefix: 'lst_p90_por_setor',
    fileFormat: 'CSV',
    selectors: ['cd_setor', 'nm_municip', 'mean'] // ajustar nomes conforme asset
});

print('✅ Script pronto. Clique em "Run" e depois vá em "Tasks" para iniciar a exportação.');
