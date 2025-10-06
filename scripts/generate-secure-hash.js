// CPX Secure Hash Generator
// Use this to generate secure hashes for testing CPX postbacks

const crypto = require('crypto');

// Your security hash from CPX
const SECURITY_HASH = 'VlS4csbvdjWxI6J6AZwwsOD3BTC1pkKL';

function generateSecureHash(transId) {
  // CPX secure hash format: MD5(trans_id + '-' + security_hash)
  const hashString = transId + '-' + SECURITY_HASH;
  const secureHash = crypto.createHash('md5').update(hashString).digest('hex');
  
  console.log(`Transaction ID: ${transId}`);
  console.log(`Security Hash: ${SECURITY_HASH}`);
  console.log(`String to hash: ${hashString}`);
  console.log(`Secure Hash: ${secureHash}`);
  console.log('');
  
  return secureHash;
}

// Example usage
console.log('=== CPX Secure Hash Generator ===\n');

// Generate hashes for test transaction IDs
generateSecureHash('12345678');
generateSecureHash('87654321');
generateSecureHash('test123');

// Generate hash for a specific transaction ID
const customTransId = process.argv[2];
if (customTransId) {
  console.log('=== Custom Transaction ID ===');
  generateSecureHash(customTransId);
}

console.log('Usage: node generate-secure-hash.js [trans_id]');