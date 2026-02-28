const http = require('http');

async function testGeolocation() {
    console.log('--- Testing Geolocation API ---');

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/geolocation',
        method: 'GET'
    };

    const runTest = (path) => {
        return new Promise((resolve, reject) => {
            console.log(`Testing: ${path}`);
            http.get(`http://localhost:3000${path}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        try {
                            const json = JSON.parse(data);
                            console.log(`✅ Success for ${path}: IP ${json.ip} located in ${json.city}, ${json.country}`);
                            resolve(true);
                        } catch (e) {
                            console.log(`❌ Failed to parse JSON for ${path}`);
                            resolve(false);
                        }
                    } else {
                        console.log(`❌ Failed for ${path}: Status ${res.statusCode}`);
                        try {
                            console.log(`   Response: ${data}`);
                        } catch (e) { }
                        resolve(false);
                    }
                });
            }).on('error', (err) => {
                console.log(`❌ Error connecting to server: ${err.message}`);
                resolve(false);
            });
        });
    };

    const success1 = await runTest('/api/geolocation');
    const success2 = await runTest('/api/geolocation?ip=8.8.8.8');

    if (success1 && success2) {
        console.log('\n--- All Tests Passed! ---');
        process.exit(0);
    } else {
        console.log('\n--- Some Tests Failed ---\nMake sure `npm run dev` is running.');
        process.exit(1);
    }
}

testGeolocation();
