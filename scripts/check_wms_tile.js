const https = require('https');
const fs = require('fs');

const url = 'https://production.alerta.mapbiomas.org/geoserver/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=mapbiomas-alertas:dashboard_alerts-shapefile&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=-47,-16,-46,-15';

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    let data = [];
    res.on('data', chunk => data.push(chunk));
    res.on('end', () => {
        const buffer = Buffer.concat(data);
        if (res.headers['content-type'] && res.headers['content-type'].includes('xml')) {
            console.log('XML Error:', buffer.toString());
        } else {
            console.log('Image received, size:', buffer.length);
            fs.writeFileSync('tile.png', buffer);
        }
    });
}).on('error', err => console.error(err));
