const http = require('http');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const token = jwt.sign({ id: '69b1af167517dd22c2f3a2e3' }, process.env.JWT_SECRET, { expiresIn: '30d' });

function makeReq(method, path, body) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  let log = '';
  try {
    const r1 = await makeReq('GET', '/api/ride/created');
    log += `GET /created: ${r1.status}\n`;
    log += `${r1.data.slice(0, 500)}\n`;
    
    if (r1.status === 200) {
      const rides = JSON.parse(r1.data);
      log += `Rides count: ${rides.length}\n`;
    }

    const r2 = await makeReq('POST', '/api/ride/69cd51ca1419d4c3c9401961/request', { seatsRequested: 1 });
    log += `POST /request: ${r2.status}\n`;
    log += `${r2.data}\n`;
  } catch (e) {
    log += `Error: ${e.message}\n`;
  }
  fs.writeFileSync('test_output.txt', log);
}
test();
