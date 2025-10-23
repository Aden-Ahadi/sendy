/**
 * Quick API Test Script
 * Tests the Sendy API endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n🧪 Test 1: Health Check');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  console.log('\n🧪 Test 2: Login');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log('   Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Test 3: Send Campaign (requires CSV file)
async function testSendCampaign() {
  console.log('\n🧪 Test 3: Send Campaign');
  
  // Check if CSV file exists
  if (!fs.existsSync('./data/emails.csv')) {
    console.log('⚠️  Skipping - CSV file not found');
    return true;
  }
  
  try {
    const formData = new FormData();
    formData.append('csv', fs.createReadStream('./data/emails.csv'));
    formData.append('subject', 'Test Campaign - Sendy API');
    
    const response = await axios.post(`${BASE_URL}/api/campaigns/send`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Campaign created:', response.data);
    return response.data.campaignId;
  } catch (error) {
    console.error('❌ Campaign creation failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 4: Get Campaign Status
async function testGetCampaign(campaignId) {
  if (!campaignId) {
    console.log('\n⚠️  Test 4: Get Campaign Status - Skipped (no campaign ID)');
    return true;
  }
  
  console.log('\n🧪 Test 4: Get Campaign Status');
  try {
    const response = await axios.get(`${BASE_URL}/api/campaigns/${campaignId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    console.log('✅ Campaign status retrieved:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Get campaign failed:', error.response?.data || error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   🧪 Sendy API Test Suite            ║');
  console.log('╚═══════════════════════════════════════╝');
  
  const tests = [];
  
  // Run tests sequentially
  tests.push(await testHealthCheck());
  tests.push(await testLogin());
  
  const campaignId = await testSendCampaign();
  tests.push(campaignId !== false);
  
  tests.push(await testGetCampaign(campaignId));
  
  // Summary
  const passed = tests.filter(t => t).length;
  const total = tests.length;
  
  console.log('\n╔═══════════════════════════════════════╗');
  console.log(`║   Test Results: ${passed}/${total} passed ${' '.repeat(15 - (passed.toString().length + total.toString().length))}║`);
  console.log('╚═══════════════════════════════════════╝\n');
  
  if (passed === total) {
    console.log('🎉 All tests passed! Your API is ready.\n');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.\n');
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  runTests();
} catch (e) {
  console.log('❌ axios not found. Installing...');
  console.log('Run: npm install axios form-data');
  process.exit(1);
}
