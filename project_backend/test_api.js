const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ id: '69b1af167517dd22c2f3a2e3' }, process.env.JWT_SECRET, { expiresIn: '30d' });

async function test() {
  try {
    const res1 = await fetch('http://localhost:5001/api/ride/created', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    console.log('GET /api/ride/created status:', res1.status);
    const text1 = await res1.text();
    console.log('GET /api/ride/created response length:', text1.length);
    console.log('Sample:', text1.slice(0, 100)); // check first 100 chars
    
    // Test request
    const res2 = await fetch('http://localhost:5001/api/ride/69b3a6b73dc3c5e6fcbd02f4/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ seatsRequested: 1 })
    });
    console.log('POST /request status:', res2.status);
    const text2 = await res2.text();
    console.log('POST /request response:', text2);
    
  } catch(e) { console.error(e); }
}
test();
