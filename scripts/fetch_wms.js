const https = require('https');
https.get('https://production.alerta.mapbiomas.org/geoserver/wms?request=GetCapabilities&service=WMS', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const layerNames = [];
        const regex = /<Layer(?:[^>]*)>[\s\S]*?<Name>(.*?)<\/Name>/g;
        let match;
        while ((match = regex.exec(data)) !== null) {
            layerNames.push(match[1]);
        }
        console.log("Found layers:", layerNames.slice(0, 30));
    });
}).on('error', err => console.error(err));
