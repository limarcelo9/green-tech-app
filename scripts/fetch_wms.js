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
        const fs = require('fs');
        fs.writeFileSync('wms_layers.json', JSON.stringify(layerNames, null, 2));
        console.log("Saved " + layerNames.length + " layers to wms_layers.json");
    });
}).on('error', err => console.error(err));
