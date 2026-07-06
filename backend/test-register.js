import axios from 'axios';

async function testAuth() {
  try {
    const start = Date.now();
    const res = await axios.post('http://127.0.0.1:5000/api/v1/auth/login', {
      email: 'test_register2@test.com', password: 'Password123!'
    });
    console.log('Status:', res.status, 'Time:', Date.now() - start, 'ms');
  } catch (err) {
    console.error('Error Status:', err.response?.status);
    console.error('Error Data:', err.response?.data);
  }
}

testAuth();
