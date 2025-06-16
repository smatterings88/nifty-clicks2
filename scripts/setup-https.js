const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certDir = path.join(__dirname, '..', 'certs');

// Create certs directory
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
  console.log('📁 Created certs directory');
}

console.log('🔧 Setting up HTTPS certificates for local development...\n');

// Check if mkcert is available
try {
  execSync('mkcert --version', { stdio: 'ignore' });
  console.log('✅ mkcert found, creating certificates...');
  
  // Create certificates using mkcert
  process.chdir(certDir);
  execSync('mkcert localhost 127.0.0.1 ::1', { stdio: 'inherit' });
  
  // Rename files to expected names
  const files = fs.readdirSync(certDir);
  const certFile = files.find(f => f.includes('localhost') && f.endsWith('.pem') && !f.includes('key'));
  const keyFile = files.find(f => f.includes('localhost') && f.includes('key.pem'));
  
  if (certFile && keyFile) {
    fs.renameSync(path.join(certDir, certFile), path.join(certDir, 'cert.pem'));
    fs.renameSync(path.join(certDir, keyFile), path.join(certDir, 'key.pem'));
    console.log('✅ Certificates created successfully!');
    console.log('🔒 You can now run: npm run dev:https');
  }
  
} catch (error) {
  console.log('❌ mkcert not found. Installing mkcert...');
  
  try {
    // Try to install mkcert globally
    execSync('npm install -g mkcert', { stdio: 'inherit' });
    console.log('✅ mkcert installed successfully!');
    
    // Create CA
    execSync('mkcert create-ca', { stdio: 'inherit' });
    
    // Create certificates
    process.chdir(certDir);
    execSync('mkcert create-cert', { stdio: 'inherit' });
    
    console.log('✅ Certificates created successfully!');
    console.log('🔒 You can now run: npm run dev:https');
    
  } catch (installError) {
    console.log('❌ Failed to install mkcert automatically.');
    console.log('\n📝 Manual setup options:');
    console.log('\nOption 1 - Install mkcert manually:');
    console.log('  npm install -g mkcert');
    console.log('  mkcert create-ca');
    console.log('  cd certs && mkcert create-cert');
    
    console.log('\nOption 2 - Use OpenSSL:');
    console.log('  openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"');
    
    console.log('\nOption 3 - Use ngrok for HTTPS tunneling:');
    console.log('  npm install -g ngrok');
    console.log('  ngrok http 3000');
  }
}