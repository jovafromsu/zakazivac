require('dotenv').config({ path: '.env.local' })
const fetch = require('node-fetch') // Možda ne postoji, koristićemo curl umesto toga

async function testSignupAPI() {
  console.log('🧪 Testing signup API with Mailgun integration...')
  
  const testData = {
    name: 'Test Verifikacija',
    email: 'jovicailic@yahoo.com',
    roles: ['client']
  }
  
  console.log('📤 Sending registration request...')
  console.log('Data:', testData)
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Registration successful!')
      console.log('Response:', result)
      console.log('📧 Check email inbox for verification link!')
    } else {
      console.log('❌ Registration failed:')
      console.log('Status:', response.status)
      console.log('Error:', result)
    }
    
  } catch (error) {
    console.error('💥 Request error:', error.message)
  }
}

testSignupAPI()