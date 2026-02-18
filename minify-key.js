const fs = require('fs');

try {
    const serviceAccount = fs.readFileSync('./service-account.json', 'utf8');
    const minified = JSON.stringify(JSON.parse(serviceAccount));
    console.log('\n=== COPY THE LINE BELOW FOR VERCEL (FIREBASE_SERVICE_ACCOUNT_KEY) ===\n');
    console.log(minified);
    console.log('\n=====================================================================\n');
} catch (error) {
    console.error('Error reading service-account.json:', error.message);
    console.log('Make sure service-account.json is in the root directory.');
}
