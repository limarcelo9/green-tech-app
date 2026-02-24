const https = require('https');
const query = `
query {
  alertStatusByBiomes {
    biome
    total
    totalNotprocessed
    totalProcessed
  }
}
`;
const options = {
    hostname: 'plataforma.alerta.mapbiomas.org', port: 443, path: '/api/v2/graphql', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify({ query })) }
};
const req = https.request(options, (res) => {
    let data = ''; res.on('data', d => data += d);
    res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});
req.write(JSON.stringify({ query })); req.end();
