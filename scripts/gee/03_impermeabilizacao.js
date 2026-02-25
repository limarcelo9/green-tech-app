// ============================================================
// 03_impermeabilizacao.js — % Impermeabilização por Setor (DF)
// Executar em: https://code.earthengine.google.com
// ============================================================
// Produto final: impermeabilizacao_pct_por_setor.csv
// Fonte: MapBiomas Collection 9 — Uso e Cobertura do Solo
// Classes impermeáveis: 24 (Área Urbana), 30 (Mineração), 25 (Não Vegetado/Solo Exposto)

// 1. Setores censitários do DF
var setores = ee.FeatureCollection('projects/mapbiomas-workspace/AUXILIAR/ESTATISTICAS/COLECAO8/NIVEL_POLITICO/setor_censitario')
    .filter(ee.Filter.eq('sigla_uf', 'DF'));

// 2. MapBiomas Collection 9 (último ano disponível = 2023)
var mapbiomas = ee.Image('projects/mapbiomas-public/assets/brazil/lulc/collection9/mapbiomas_collection90_integration_v1')
    .select('classification_2023');

// 3. Bounding box DF
var df = ee.Geometry.Rectangle([-48.3, -16.05, -47.3, -15.45]);

// 4. Criar máscara binária de áreas impermeáveis
// Classes MapBiomas:
//   24 = Área Urbana / infraestrutura urbana
//   30 = Mineração
//   25 = Outra Área não Vegetada (solo exposto)
var classesImpermeaveis = [24, 25, 30];

var impermeavel = mapbiomas.remap(
    classesImpermeaveis,
    [1, 1, 1],
    0 // tudo que não é impermeável = 0
).rename('impermeavel');

// 5. Visualizar
Map.centerObject(df, 10);
Map.addLayer(impermeavel.selfMask(), { palette: ['red'] }, 'Áreas Impermeáveis');
Map.addLayer(mapbiomas.clip(df), {
    min: 0, max: 62,
    palette: [
        '#1f8d49', '#7dc975', '#006400', '#32cd32', '#687537',
        '#76a5af', '#45c2a5', '#b8af4f', '#f1c232', '#ffffb2',
        '#ffd966', '#e974ed', '#d5a6bd', '#c27ba0', '#fff3bf',
        '#ea9999', '#dd7e6b', '#aa0000', '#ff3d3d', '#cc0000',
        '#ff99ff', '#0000ff', '#d5d5e5', '#af2a2a', '#ff0000',
        '#8a2be2'
    ]
}, 'MapBiomas LULC 2023');

// 6. Calcular % impermeável por setor
var impPorSetor = impermeavel.reduceRegions({
    collection: setores,
    reducer: ee.Reducer.mean(), // mean de 0/1 = proporção
    scale: 30
}).map(function (f) {
    return f.set('pct_impermeavel', ee.Number(f.get('mean')).multiply(100));
});

// 7. Exportar
Export.table.toDrive({
    collection: impPorSetor,
    description: 'impermeabilizacao_pct_por_setor',
    fileNamePrefix: 'impermeabilizacao_pct_por_setor',
    fileFormat: 'CSV',
    selectors: ['cd_setor', 'nm_municip', 'mean', 'pct_impermeavel']
});

print('✅ Script pronto. Clique em "Run" e vá em "Tasks" para exportar.');
