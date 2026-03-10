const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testKey() {
  const apiKey = process.env.GEMINI_API_KEY; // Dynamically pull tested key
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello, this is a test.");
    console.log("Success! Response:");
    console.log(result.response.text());
  } catch (err) {
    console.error("API Key Test Failed:");
    if (err.message) {
      require('fs').writeFileSync('gemini-test-error.log', err.message);
      console.log('Wrote error to gemini-test-error.log');
    }
  }
}

testKey();
