const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const axios = require('axios');

const app = express();
app.use(cors({
  origin: 'https://cognitovid.netlify.app'
}));

app.use(bodyParser.json());

// 🔁 Prompt based on mode
const getPrompt = (mode) => {
  switch (mode) {
    case 'explain':
      return `
You are a kind and clear teacher.

When the user asks a question, explain the answer in clear, short, step-by-step numbered format.

Then, also provide a simple spoken version that summarizes the same thing like you're speaking to a beginner.

Return your answer in this format:

Text Answer:
1. Step 1...
2. Step 2...
3. Step 3...

---SPEAK---
Voice Answer:
<spoken version>
      `.trim();

    case 'code':
      return `
You are a friendly programming tutor.

When the user sends some code, do this:

Text Answer:
- Show line-by-line code explanation (numbered).

Voice Answer:
- Give a beginner-friendly spoken version that summarizes the logic in simple terms.

Return your answer in this format:

Text Answer:
1. Line 1 explains...
2. Line 2 does...

---SPEAK---
Voice Answer:
<spoken version summary>
      `.trim();

    default:
      return `
You are a helpful assistant. Respond to the user's question politely.

Add a separate spoken version of your reply below.

Use this format:

Text Answer:
<your full answer>

---SPEAK---
Voice Answer:
<your spoken summary>
      `.trim();
  }
};

app.post('/chat', async (req, res) => {
  const { message, mode } = req.body;

  const systemPrompt = getPrompt(mode);

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const content = response.data.choices?.[0]?.message?.content || '';

    const [textAnswer, spokenAnswer] = content.split('---SPEAK---');

    res.json({
      reply: textAnswer?.replace(/^Text Answer:\s*/i, '').trim() || '',
      spokenReply: spokenAnswer?.replace(/^Voice Answer:\s*/i, '').trim() || ''
    });

  } catch (err) {
    console.error('🔥 OpenRouter error:', err.message);
    res.status(500).json({ reply: null, spokenReply: null });
  }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
