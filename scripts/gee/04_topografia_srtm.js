// ============================================================
// 04_topografia_srtm.js — Declividade + TWI por Setor (DF)
// Executar em: https://code.earthengine.google.com
// ============================================================
// Produtos finais:
//   declividade_por_setor.csv
//   twi_por_setor.csv
// Fonte: SRTM 30m (USGS/SRTMGL1_003)

// 1. Setores censitários do DF
var setores = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/NIVEL_POLITICO/setor_censitario')
    .filter(ee.Filter.eq('sigla_uf', 'DF'));

// 2. DEM SRTM 30m
var dem = ee.Image('USGS/SRTMGL1_003');

// 3. Bounding box DF
var df = ee.Geometry.Rectangle([-48.3, -16.05, -47.3, -15.45]);

// ============ DECLIVIDADE ============

// 4. Calcular declividade (graus)
var slope = ee.Terrain.slope(dem).rename('slope_deg');

// 5. Visualizar
Map.centerObject(df, 10);
Map.addLayer(slope.clip(df), { min: 0, max: 30, palette: ['green', 'yellow', 'red'] }, 'Declividade (°)');

// 6. Declividade média por setor
var slopePorSetor = slope.reduceRegions({
    collection: setores,
    reducer: ee.Reducer.mean(),
    scale: 30
});

// 7. Exportar declividade
Export.table.toDrive({
    collection: slopePorSetor,
    description: 'declividade_por_setor',
    fileNamePrefix: 'declividade_por_setor',
    fileFormat: 'CSV',
    selectors: ['cd_setor', 'nm_municip', 'mean']
});

// ============ TWI (Topographic Wetness Index) ============
// TWI = ln(a / tan(β))
// a = contributing area (flow accumulation * cell area)
// β = slope in radians

// 8. Calcular slope em radianos
var slopeRad = slope.multiply(Math.PI / 180);

// 9. Flow accumulation (usando MERIT Hydro ou aproximação)
// GEE não tem flow accumulation nativo, mas podemos usar o MERIT Hydro dataset
var meritFlow = ee.Image('MERIT/Hydro/v1_0_1')
    .select('upg') // upstream drainage area (km²)
    .rename('flow_acc');

// 10. TWI = ln(flow_acc / tan(slope))
// Evitar divisão por zero: slope mínima de 0.01 rad
var slopeClamp = slopeRad.max(0.01);
var twi = meritFlow.log().subtract(slopeClamp.tan().log()).rename('TWI');

// 11. Visualizar TWI
Map.addLayer(twi.clip(df), { min: 0, max: 20, palette: ['brown', 'yellow', 'cyan', 'blue'] }, 'TWI');

// 12. TWI médio por setor
var twiPorSetor = twi.reduceRegions({
    collection: setores,
    reducer: ee.Reducer.mean(),
    scale: 30
});

// 13. Exportar TWI
Export.table.toDrive({
    collection: twiPorSetor,
    description: 'twi_por_setor',
    fileNamePrefix: 'twi_por_setor',
    fileFormat: 'CSV',
    selectors: ['cd_setor', 'nm_municip', 'mean']
});

print('✅ Scripts prontos. Clique em "Run" e vá em "Tasks" — serão 2 exportações (declividade + TWI).');
