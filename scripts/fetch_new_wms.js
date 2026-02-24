const http = require('http');
const https = require('https');

function fetchWMS(urlStr) {
    return new Promise((resolve, reject) => {
        const req = https.get(urlStr, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
    });
}

async function run() {
    try {
        console.log("Fetching INPE Queimadas capabilities...");
        const inpeData = await fetchWMS('https://queimadas.dgi.inpe.br/queimadas/mapas/ows?service=WMS&version=1.3.0&request=GetCapabilities');
        console.log("INPE Data length:", inpeData.length);

        // Extract a few layer names using basic regex
        const layerMatches = inpeData.match(/<Name>([^<]+)<\/Name>/g);
        if (layerMatches) {
            console.log("Sample INPE Layers:", layerMatches.slice(0, 10).map(l => l.replace(/<\/?Name>/g, '')));
        }
    } catch (e) {
        console.error("INPE Error:", e.message);
    }
}

run();
