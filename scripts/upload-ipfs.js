const fs = require('fs');
const path = require('path');
const https = require('https');

const API_KEY = 'f4339e0e.39f94d92d89547da9d6201d83d1420cf';
const FILE_PATH = path.join(__dirname, '../soulsign.mov');

async function uploadToIPFS() {
  console.log('Reading file:', FILE_PATH);

  const fileBuffer = fs.readFileSync(FILE_PATH);
  const fileName = path.basename(FILE_PATH);

  console.log('File size:', (fileBuffer.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('Uploading to nft.storage...');

  // Create a simple JSON with base64 content for nft.storage
  const requestBody = {
    content: fileBuffer.toString('base64'),
    name: fileName,
  };

  const body = JSON.stringify(requestBody);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.nft.storage',
      path: '/upload',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.ok) {
            const cid = result.value.cid;
            console.log('\n✅ Upload successful!');
            console.log('CID:', cid);
            console.log('URL: https://ipfs.io/ipfs/' + cid);
          } else {
            console.error('Upload failed:', data);
          }
          resolve(result);
        } catch (e) {
          console.error('Parse error:', data);
          resolve(null);
        }
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e);
      reject(e);
    });

    req.write(body);
    req.end();
  });
}

uploadToIPFS().catch(console.error);
