import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import cors from 'cors';
import OpenAI from 'openai';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust proxy para rate limit funcionar atrás de Vercel/Render
app.set('trust proxy', 1);

// CORS restrito via env (default: produção Vercel)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://ayni-cgris.vercel.app')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['POST', 'OPTIONS'],
}));

// Payload limitado a 4kb
app.use(express.json({ limit: '4kb' }));

// Rate limit: 10 requisições por minuto por IP
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
});

const prompt = fs.readFileSync('./ayni-prompt.txt', 'utf8');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', chatLimiter, async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ error: 'Mensagem obrigatória.' });
  }

  const start = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 500,
      timeout: 30000,
    });
    const aiResponse = completion.choices[0].message.content;
    const latency = Date.now() - start;
    console.log(`[chat] status=200 latency=${latency}ms tokens=${completion.usage?.total_tokens ?? '?'}`);
    res.json({ response: aiResponse });
  } catch (err) {
    const latency = Date.now() - start;
    console.error(`[chat] status=500 latency=${latency}ms error=${err.message}`);
    res.status(500).json({ error: 'Erro interno no chat.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
