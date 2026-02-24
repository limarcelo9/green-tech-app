const https = require('https');
const fs = require('fs');

const query = `
query {
  __schema {
    queryType {
      fields {
        name
        description
        args {
          name
        }
      }
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
        fs.writeFileSync('schema_queries.json', JSON.stringify(JSON.parse(data), null, 2));
        console.log('Done');
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(JSON.stringify({ query }));
req.end();
