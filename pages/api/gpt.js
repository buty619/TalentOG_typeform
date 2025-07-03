// /pages/api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message },
        ],
      }),
    });

    const data = await response.json();
    console.log('[GPT]:', data);
    res.status(200).json({ reply: data.choices?.[0]?.message?.content || '' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from OpenAI API' });
  }
}

// ejemplo para consumir el GPT
// fetch('/api/gpt', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({ message: 'estoy conecetado a GPT?' }),
// })
//   .then((res) => res.json())
//   .then((data) => {
//     console.log(data);
//   });
