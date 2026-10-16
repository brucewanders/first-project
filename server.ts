import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callGeminiWithFallback(options: { prompt: string; schema?: any }) {
  if (!ai) throw new Error('Gemini API is not configured on the server');
  const models = ['gemini-2.5-flash', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {};
      if (options.schema) {
        config.responseMimeType = 'application/json';
        config.responseSchema = options.schema;
      }
      const response = await ai.models.generateContent({
        model,
        contents: options.prompt,
        ...(options.schema ? { config } : {}),
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${model} failed, attempting next:`, err?.message || err);
    }
  }
  throw lastError;
}

// 1. Natural Language Transaction Parser
app.post('/api/gemini/parse-transactions', async (req, res) => {
  try {
    const { text, categories = [], currencyCode = 'UGX' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API is not configured on the server (missing GEMINI_API_KEY)',
        fallback: true,
      });
    }

    const categoryListStr = categories
      .map((c: any) => `- ID: "${c.id}", Name: "${c.name}", Type: "${c.type}", Emoji: "${c.emoji || '🏷️'}"`)
      .join('\n');

    const prompt = `You are a financial transaction extractor for the Centra spending app.
The user speaks or writes in natural language, often mentioning everyday purchases like airtime, internet data, food, matatu/boda/fuel, electricity tokens, rent, or income.
Extract all distinct financial transactions from the user input into a JSON array.

Input Text: "${text}"
Current Currency: ${currencyCode}

Available Categories:
${categoryListStr}

Common payment methods: "Mobile Money (M-Pesa / MTN / Airtel)", "Cash", "Bank Transfer", "Debit/Credit Card".
Common emojis:
- Airtime / Internet: 📱
- Food & Snacks: 🍔
- Commute / Fuel / Rideshare: 🚗
- Electricity & Utilities: ⚡
- Cinema & Entertainment: 🎬
- Consulting & Web Design / Income: 💻
- Kids & Family: 🧸
- Rent & Housing: 🏠
- Shopping: 🛍️
- Health: 💊
- Salary: 💼

Rules:
1. Extract numeric amounts accurately. If user writes "2,000" or "2k", parse as 2000. If "10,000" or "10k", parse as 10000.
2. Select the closest matching categoryId from the provided list.
3. Determine if it is 'expense' or 'income'.
4. Suggest a clean short title (e.g., "Airtime Top-up", "Supermarket Food", "Electricity Yaka Token").
5. Return a JSON array matching the schema.`;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          categoryId: { type: Type.STRING },
          emoji: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['expense', 'income'] },
          paymentMethod: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ['title', 'amount', 'categoryId', 'emoji', 'type', 'paymentMethod'],
      },
    };

    const response = await callGeminiWithFallback({ prompt, schema });
    const parsedJson = JSON.parse(response.text || '[]');
    return res.json({ items: parsedJson });
  } catch (err: any) {
    console.error('Error in parse-transactions:', err);
    return res.status(500).json({ error: err.message || 'Failed to parse transactions' });
  }
});

// 2. Automated AI Spending Insights
app.post('/api/gemini/spending-insights', async (req, res) => {
  try {
    const {
      totalBudget = 0,
      totalSpent = 0,
      totalIncome = 0,
      savingsRate = 0,
      currencySymbol = 'USh',
      topCategories = [],
      dailyAllowance = 0,
      daysRemaining = 15,
    } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API not configured on server',
        fallback: true,
      });
    }

    const catSummary = topCategories
      .map((c: any) => `${c.name}: ${currencySymbol} ${c.amount} (${c.percentage}%)`)
      .join(', ');

    const prompt = `You are a personal financial advisor embedded in the Centra spending app.
Generate an insightful, encouraging, and razor-sharp EXACTLY 2-SENTENCE financial summary for the user's current month.

Current Month Financial State:
- Master Monthly Budget: ${currencySymbol} ${totalBudget}
- Total Spent So Far: ${currencySymbol} ${totalSpent} (${Math.round((totalSpent / (totalBudget || 1)) * 100)}% of budget)
- Total Income: ${currencySymbol} ${totalIncome}
- Net Savings Rate: ${savingsRate}%
- Safe Daily Spending Allowance Left: ${currencySymbol} ${dailyAllowance} per day for the next ${daysRemaining} days
- Top Spending Categories: ${catSummary || 'None logged yet'}

Guidelines:
- Length: STRICTLY 2 sentences. No bullet points, no markdown headers.
- Sentence 1: Analyze current spending pacing relative to their Master Budget and Net Savings Rate.
- Sentence 2: Provide one practical, direct financial tip based on their top categories (e.g. optimizing airtime/internet bundles, dining, or maintaining daily allowance pace).
- Tone: Professional, clear, motivating.`;

    const response = await callGeminiWithFallback({ prompt });
    const insightText = (response.text || '').trim();
    return res.json({ insight: insightText });
  } catch (err: any) {
    console.error('Error in spending-insights:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate insights' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Centra server listening at http://0.0.0.0:${port}`);
  });
}

startServer();
