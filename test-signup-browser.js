// Test script za testiranje signup form-e kroz browser console
// Kopirajte i nalepite u browser console na http://localhost:3000/auth/signup

async function testSignupForm() {
  console.log('🧪 Testing signup form with Mailgun...')
  
  // Najdi form elemente
  const nameInput = document.querySelector('input[id="name"]')
  const emailInput = document.querySelector('input[id="email"]')
  const submitButton = document.querySelector('button[type="submit"]')
  
  if (!nameInput || !emailInput || !submitButton) {
    console.error('❌ Cannot find form elements')
    return
  }
  
  // Popuni form
  nameInput.value = 'Test Verifikacija'
  emailInput.value = 'jovicailic@yahoo.com'
  
  // Trigger input events
  nameInput.dispatchEvent(new Event('input', { bubbles: true }))
  emailInput.dispatchEvent(new Event('input', { bubbles: true }))
  
  console.log('📝 Form filled with test data')
  console.log('Name:', nameInput.value)
  console.log('Email:', emailInput.value)
  
  // Submit form
  console.log('📤 Submitting form...')
  submitButton.click()
  
  // Wait for response and check console for logs
  setTimeout(() => {
    console.log('✅ Check browser Network tab and console logs for registration result')
  }, 1000)
}

// Run test
testSignupForm()