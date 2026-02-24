const https = require('https');

https.get('https://servicodados.ibge.gov.br/api/v1/localidades/estados/53/subdistritos', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const subdistritos = JSON.parse(data);
        console.log(`Found ${subdistritos.length} subdistricts in DF.`);
        subdistritos.slice(0, 10).forEach(sd => {
            console.log(`ID: ${sd.id}, Name: ${sd.nome}`);
        });
    });
}).on('error', err => console.error(err));
