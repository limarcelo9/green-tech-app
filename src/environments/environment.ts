export const environment = {
  production: false,
  nasaFirmsApiKey: '81f5a77fd25caf99e909b525f6c52014', // Substituir futuramente ou via CI/CD
  endpoints: {
    inpeWms: 'https://terrabrasilis.dpi.inpe.br/geoserver/ows',
    icmbioWms: 'https://geoservicos.inde.gov.br/geoserver/ICMBio/ows',
    nasaFirmsWmsBase: 'https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/'
  }
};
