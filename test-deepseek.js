require('dotenv').config({ path: '.env.local' });

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error("No DEEPSEEK_API_KEY found in .env.local");
    return;
  }

  try {
    console.log("Testing DeepSeek API Key over native fetch...");
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a test assistant.' },
          { role: 'user', content: 'Say hello and confirm you are connected.' }
        ],
        stream: false
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, payload: ${errorText}`);
    }

    const data = await response.json();
    console.log("Success! DeepSeek Response:");
    console.log(data.choices[0].message.content);
  } catch (err) {
    console.error("DeepSeek Test Failed:", err);
  }
}

testDeepSeek();
