export const environment = {
  production: true,
  nasaFirmsApiKey: '81f5a77fd25caf99e909b525f6c52014', // Será Injetado via CI/CD ou script de build
  endpoints: {
    inpeWms: 'https://terrabrasilis.dpi.inpe.br/geoserver/ows',
    icmbioWms: 'https://geoservicos.inde.gov.br/geoserver/ICMBio/ows',
    nasaFirmsWmsBase: 'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/'
  }
};
