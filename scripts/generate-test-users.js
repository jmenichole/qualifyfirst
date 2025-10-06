// Generate Test User IDs for CPX Research Testing
// Creates realistic user IDs that match your system format

const crypto = require('crypto');

// Generate UUID v4 format (matches Supabase Auth user IDs)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Generate test user data
function generateTestUsers(count = 5) {
  const users = [];
  const testNames = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry'];
  
  for (let i = 0; i < count; i++) {
    const name = testNames[i] || `user${i + 1}`;
    const userId = generateUUID();
    
    users.push({
      id: userId,
      name: name,
      email: `${name}@example.com`
    });
  }
  
  return users;
}

// Generate CPX postback test URLs with real user IDs
function generateTestPostbackURLs(users) {
  const baseURL = 'https://qualifyfirst.vercel.app/api/webhooks/cpx';
  const securityHash = 'VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL';
  
  console.log('=== CPX Research Test Postback URLs ===\n');
  
  users.forEach((user, index) => {
    const transId = `test_${Date.now()}_${index + 1}`;
    const hashString = transId + '-' + securityHash;
    const secureHash = crypto.createHash('md5').update(hashString).digest('hex');
    
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🆔 User ID: ${user.id}`);
    console.log(`📊 Transaction ID: ${transId}`);
    console.log(`🔒 Secure Hash: ${secureHash}`);
    
    // Completed survey test URL
    const completedURL = `${baseURL}?status=1&trans_id=${transId}&user_id=${user.id}&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=1.50&amount_usd=1.50&offer_id=12345&hash=${secureHash}&ip_click=192.168.1.1&type=complete`;
    
    console.log('✅ COMPLETED Survey Test URL:');
    console.log(completedURL);
    
    // Screen out test URL
    const screenOutURL = `${baseURL}?status=2&trans_id=${transId}_screenout&user_id=${user.id}&sub_id=test_sub1&sub_id_2=test_sub2&amount_local=0&amount_usd=0&offer_id=12345&hash=${crypto.createHash('md5').update(`${transId}_screenout-${securityHash}`).digest('hex')}&ip_click=192.168.1.1&type=out`;
    
    console.log('❌ SCREEN OUT Test URL:');
    console.log(screenOutURL);
    console.log('\n' + '='.repeat(80) + '\n');
  });
}

// Main execution
console.log('🎯 CPX Research Test User Generator\n');

const testUsers = generateTestUsers(3);
generateTestPostbackURLs(testUsers);

console.log('📝 Instructions:');
console.log('1. Copy any of the test URLs above');
console.log('2. Paste them in your browser or use curl to test');
console.log('3. Check your database for recorded completions');
console.log('4. Verify postback processing in your logs');
console.log('\n✨ Happy testing! Your CPX integration is ready to go!');

// Export users for use in other scripts
module.exports = { generateTestUsers, generateUUID };