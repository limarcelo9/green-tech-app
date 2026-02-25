// ============================================================
// 02_ndvi_sentinel.js — NDVI Médio por Setor Censitário (DF)
// Executar em: https://code.earthengine.google.com
// ============================================================
// Produto final: ndvi_medio_por_setor.csv
// Fonte: Sentinel-2 SR Harmonized (Bands B8, B4)
// Período: últimos 12 meses

// 1. Setores censitários do DF
var setores = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/NIVEL_POLITICO/setor_censitario')
    .filter(ee.Filter.eq('sigla_uf', 'DF'));

// Alternativa: upload manual
// var setores = ee.FeatureCollection('users/SEU_USUARIO/setores_censitarios_df');

// 2. Bounding box DF
var df = ee.Geometry.Rectangle([-48.3, -16.05, -47.3, -15.45]);

// 3. Função para calcular NDVI e mascarar nuvens
function addNDVI(image) {
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    return image.addBands(ndvi);
}

function maskS2clouds(image) {
    var qa = image.select('QA60');
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask);
}

// 4. Coleção Sentinel-2 (últimos 12 meses)
var endDate = ee.Date(Date.now());
var startDate = endDate.advance(-12, 'month');

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(df)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(maskS2clouds)
    .map(addNDVI)
    .select('NDVI');

print('Total de imagens Sentinel-2:', s2.size());

// 5. NDVI médio temporal
var ndviMean = s2.mean().rename('NDVI_MEAN');

// 6. Visualizar
Map.centerObject(df, 10);
Map.addLayer(ndviMean, { min: -0.1, max: 0.8, palette: ['red', 'yellow', 'green', 'darkgreen'] }, 'NDVI Médio');

// 7. Reduzir por setor
var ndviPorSetor = ndviMean.reduceRegions({
    collection: setores,
    reducer: ee.Reducer.mean(),
    scale: 10 // Sentinel-2 = 10m
});

// 8. Exportar
Export.table.toDrive({
    collection: ndviPorSetor,
    description: 'ndvi_medio_por_setor',
    fileNamePrefix: 'ndvi_medio_por_setor',
    fileFormat: 'CSV',
    selectors: ['cd_setor', 'nm_municip', 'mean']
});

print('✅ Script pronto. Clique em "Run" e vá em "Tasks" para exportar.');
