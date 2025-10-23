/**
 * Test Sender Management
 * Tests adding a verified sender through the API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Step 1: Login
async function login() {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, {
    email: 'test@example.com',
    password: 'test123'
  });
  authToken = response.data.token;
  console.log('✅ Logged in');
}

// Step 2: Add verified sender
async function addSender() {
  try {
    const response = await axios.post(`${BASE_URL}/api/settings/sender`, {
      fromName: 'Aden Ahadi',
      fromEmail: 'ahadiaden3@gmail.com',
      replyTo: 'ahadiaden3@gmail.com',
      address: '123 Test St',
      city: 'Dar es Salaam',
      country: 'Tanzania'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Sender added:', response.data);
    console.log('📧 Check your email for verification link!');
    
    return response.data.senderId;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Step 3: Check status
async function checkStatus(senderId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/settings/sender/${senderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('\n📊 Sender Status:', response.data);
    
    if (response.data.verified) {
      console.log('✅ Email is VERIFIED! Ready to send campaigns.');
    } else {
      console.log('⏳ Email is PENDING verification. Check your inbox.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run test
async function runTest() {
  console.log('🧪 Testing Sender Management\n');
  
  await login();
  const senderId = await addSender();
  
  if (senderId) {
    console.log('\n⏳ Waiting 5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
    await checkStatus(senderId);
  }
}

runTest();
