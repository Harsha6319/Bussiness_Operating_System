import fetch from 'node-fetch';

async function test() {
  try {
    // 1. Register a user
    const regRes = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessName: 'Test Biz', name: 'Test User', email: 'test1@test.com', password: 'password123' })
    });
    
    if (!regRes.ok) {
      console.log('Register failed', await regRes.text());
      return;
    }
    const data = await regRes.json();
    const token = data.accessToken;
    console.log('Registered, token:', token);
    
    // 2. Create customer
    const custRes = await fetch('http://localhost:5000/api/v1/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'New Customer', email: 'cust@test.com', phone: '123456789' })
    });
    
    if (!custRes.ok) {
      console.log('Customer create failed', await custRes.text());
      return;
    }
    console.log('Customer created', await custRes.json());
    
  } catch (err) {
    console.error(err);
  }
}

test();
