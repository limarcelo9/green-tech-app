const https = require('https');

const query = `
query {
  __type(name: "MvAlertStatusByBiome") {
    fields {
      name
    }
  }
}
`;

const options = {
    hostname: 'plataforma.alerta.mapbiomas.org',
    port: 443,
    path: '/api/v2/graphql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify({ query }))
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (d) => {
        data += d;
    });
    res.on('end', () => {
        console.log(data);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(JSON.stringify({ query }));
req.end();
