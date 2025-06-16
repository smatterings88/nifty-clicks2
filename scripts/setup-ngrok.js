const { execSync } = require('child_process');

console.log('🌐 Setting up ngrok for HTTPS tunneling...\n');

try {
  // Check if ngrok is installed
  execSync('ngrok --version', { stdio: 'ignore' });
  console.log('✅ ngrok is already installed');
} catch (error) {
  console.log('📦 Installing ngrok...');
  try {
    execSync('npm install -g ngrok', { stdio: 'inherit' });
    console.log('✅ ngrok installed successfully!');
  } catch (installError) {
    console.log('❌ Failed to install ngrok automatically.');
    console.log('Please install manually: npm install -g ngrok');
    process.exit(1);
  }
}

console.log('\n🚀 Starting your application and ngrok tunnel...');
console.log('\nInstructions:');
console.log('1. Start your app: npm run dev');
console.log('2. In another terminal, run: ngrok http 3000');
console.log('3. Use the HTTPS URL provided by ngrok for testing');
console.log('\nExample ngrok output:');
console.log('  Forwarding: https://abc123.ngrok.io -> http://localhost:3000');
console.log('\nThen test with:');
console.log('  curl "https://abc123.ngrok.io/health"');
console.log('  curl "https://abc123.ngrok.io/track-click?referrer=CONTACT_ID"');