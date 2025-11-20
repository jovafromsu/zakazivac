// Test booking API
async function testBooking() {
  try {
    // First get session
    const sessionResponse = await fetch('http://localhost:3000/api/auth/session');
    const session = await sessionResponse.json();
    console.log('Session:', session);

    if (!session.user) {
      console.log('❌ User not logged in');
      return;
    }

    // Test booking
    const bookingResponse = await fetch('http://localhost:3000/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionResponse.headers.get('set-cookie') || ''
      },
      body: JSON.stringify({
        providerId: '691c7eba096b62592336a830',
        serviceId: '691c91107c0f2192c8765001', 
        start: new Date('2024-11-19T14:00:00.000Z').toISOString(),
        note: 'Test booking from API'
      })
    });

    const bookingResult = await bookingResponse.json();
    console.log('Booking response status:', bookingResponse.status);
    console.log('Booking result:', bookingResult);

  } catch (error) {
    console.error('Test error:', error);
  }
}

testBooking();