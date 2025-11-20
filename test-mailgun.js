require('dotenv').config({ path: '.env.local' })

const Mailgun = require('mailgun.js')
const formData = require('form-data')

async function testMailgunConnection() {
  console.log('🔍 Testing Mailgun credentials...')
  
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const fromEmail = process.env.MAILGUN_FROM_EMAIL
  
  console.log('📧 Credentials:')
  console.log('- API Key:', apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET')
  console.log('- Domain:', domain || 'NOT SET')
  console.log('- From Email:', fromEmail || 'NOT SET')
  
  if (!apiKey || !domain || !fromEmail) {
    console.error('❌ Missing Mailgun credentials!')
    return
  }
  
  try {
    const mailgun = new Mailgun(formData)
    const mg = mailgun.client({
      username: 'api',
      key: apiKey,
    })
    
    console.log('\n📨 Sending test email...')
    
    const messageData = {
      from: `Test Zakazivač <${fromEmail}>`,
      to: ['jovicailic@yahoo.com'], // Test sa vašim email-om
      subject: 'Test Email - Mailgun Connection',
      html: `
        <h2>🎉 Mailgun Test Successful!</h2>
        <p>This is a test email to verify Mailgun configuration.</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this, Mailgun is working correctly! 🚀</p>
      `,
      text: `Mailgun Test Successful! Domain: ${domain}, Time: ${new Date().toISOString()}`,
    }

    const result = await mg.messages.create(domain, messageData)
    
    console.log('✅ Email sent successfully!')
    console.log('📧 Message ID:', result.id)
    console.log('📧 Message:', result.message)
    
    return true
  } catch (error) {
    console.error('❌ Failed to send email:')
    console.error('Error:', error.message)
    
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Response:', error.response.data)
    }
    
    return false
  }
}

testMailgunConnection()
  .then((success) => {
    if (success) {
      console.log('\n🎯 Mailgun configuration is working!')
      console.log('✅ You can now test the full registration flow.')
    } else {
      console.log('\n❌ Mailgun configuration has issues.')
      console.log('💡 Please check your credentials and try again.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })