import fetch from 'node-fetch';

async function testOrders() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test1@test.com', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed', await loginRes.text());
      return;
    }
    const data = await loginRes.json();
    const token = data.accessToken;
    console.log('Logged in.');
    
    const ordersRes = await fetch('http://localhost:5000/api/v1/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!ordersRes.ok) {
      console.log('Orders failed', await ordersRes.text());
      return;
    }
    console.log('Orders fetched:', await ordersRes.json());
  } catch (err) {
    console.error(err);
  }
}

testOrders();
