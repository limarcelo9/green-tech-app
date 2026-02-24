const https = require('https');
const fs = require('fs');

async function checkNasa() {
    const bbox = '-8500000,-4000000,-3500000,1000000'; // Web Mercator bbox approx Brazil
    // Wait, MapBiomas was EPSG:4326 (lat/lng). Google Maps WMS usually uses EPSG:3857 or 4326.
    // Let's test standard 4326
    const url = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&LAYERS=MODIS_Terra_LST_Day_8Day&STYLES=&WIDTH=256&HEIGHT=256&SRS=EPSG:4326&BBOX=-74,-34,-34,5`;

    console.log("Checking NASA GIBS WMS...");
    https.get(url, (res) => {
        console.log("Status:", res.statusCode);
        console.log("Headers:", res.headers);
        const file = fs.createWriteStream("nasa_test.png");
        res.pipe(file);
        res.on('end', () => console.log("Done downloading image."));
    });
}
checkNasa();
