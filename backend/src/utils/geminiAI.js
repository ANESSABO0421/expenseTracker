const { GoogleGenAI, Type, Schema } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const generateInsights = async (transactions) => {
  try {
    // If no transactions, return a default mock
    if (!transactions || transactions.length === 0) {
      return [
        {
          title: "Welcome to Insights",
          message: "Add some transactions to get personalized AI financial advice.",
          icon: "information-circle",
          color: "blue"
        }
      ];
    }

    // Prepare data for the prompt (limit to recent 50)
    const recentTransactions = transactions.slice(0, 50).map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date
    }));

    const prompt = `
      You are an expert financial AI assistant. I will provide a user's recent transaction history.
      Analyze their spending and income patterns and provide exactly 3 brief, highly personalized insights or tips.
      
      Here is the transaction history (JSON format):
      ${JSON.stringify(recentTransactions)}
    `;

    const responseSchema = {
      type: Type.ARRAY,
      description: "List of exactly 3 financial insights",
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "A short, punchy title (max 4 words)"
          },
          message: {
            type: Type.STRING,
            description: "A detailed 1-2 sentence personalized insight based on their data."
          },
          icon: {
            type: Type.STRING,
            description: "A valid Ionicons icon name (e.g., 'warning', 'trending-up', 'restaurant', 'cart', 'cash', 'star')"
          },
          color: {
            type: Type.STRING,
            description: "One of these exact strings: 'red', 'green', 'blue', 'orange', 'purple'"
          }
        },
        required: ["title", "message", "icon", "color"]
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    let parsedInsights = JSON.parse(response.text);
    
    // Gemini sometimes wraps the array in another array when using strict JSON schema
    if (Array.isArray(parsedInsights) && Array.isArray(parsedInsights[0])) {
      parsedInsights = parsedInsights[0];
    }

    // Safety check just in case
    if (Array.isArray(parsedInsights)) {
      return parsedInsights.slice(0, 3);
    }

    throw new Error("Invalid structure returned by LLM");
  } catch (error) {
    console.error('Gemini AI Error:', error);
    // Return graceful fallback
    return [
      {
        title: "AI Analysis Temporarily Unavailable",
        message: "We're having trouble connecting to our Gemini AI brain right now. Try again later.",
        icon: "warning",
        color: "red"
      }
    ];
  }
};

module.exports = {
  generateInsights,
  scanReceiptWithAI,
  chatWithAI,
  generateGoalPlan,
  generateCoachMessage,
  generateImpactLine,
};

// ─── Receipt Scanner ─────────────────────────────────────────────────────────
async function scanReceiptWithAI(base64Image) {
  try {
    // Strip the data URI prefix if present (Gemini takes raw base64)
    const rawBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are an expert receipt analyzer. Look at this receipt image carefully and extract the transaction details.

Return a JSON object with EXACTLY these fields:
- "amount": the total amount as a number (e.g., 124.50). Extract the final total/grand total.
- "category": a single short category from this list: Food, Transport, Shopping, Bills, Health, Entertainment, Travel, Groceries, Restaurant, Other
- "description": a brief description of what was purchased (1-10 words, e.g., "Whole Foods grocery shopping")

Respond ONLY with valid JSON, no explanation.`;

    const responseSchema = {
      type: 'object',
      properties: {
        amount:      { type: 'number',  description: 'Total amount from the receipt' },
        category:    { type: 'string',  description: 'Transaction category' },
        description: { type: 'string',  description: 'Short description of the purchase' },
      },
      required: ['amount', 'category', 'description'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: rawBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const parsed = JSON.parse(response.text);
    return {
      amount:      parsed.amount      ?? 0,
      category:    parsed.category    ?? 'Other',
      description: parsed.description ?? '',
    };
  } catch (error) {
    console.error('Receipt AI scan error:', error);
    // Return safe fallback — frontend will show an error toast
    throw new Error('Could not extract receipt details. Please enter them manually.');
  }
}

// ─── Finance Chatbot ─────────────────────────────────────────────────────────
// `history` is an array of prior turns: [{ role: 'user'|'model', text: string }, ...]
// `transactions` is the user's transaction list, used as grounding context so the
// assistant can answer questions about their actual spending.
async function chatWithAI(question, transactions, history = []) {
  try {
    const recentTransactions = (transactions || []).slice(0, 200).map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
    }));

    const systemContext = `You are Spendova's built-in AI finance assistant, a friendly and concise personal finance helper inside an expense tracker app.
You can see the user's transaction history below (JSON). Use it to answer questions accurately — do the math yourself (sums, averages, comparisons, trends) rather than guessing.
If the answer requires data that isn't in the transaction history, say so honestly instead of making it up.
Keep answers short and conversational (2-5 sentences unless the user asks for a detailed breakdown). Use the user's currency-less numeric amounts as-is (don't invent a currency symbol).

User's transaction history (JSON, most recent first):
${JSON.stringify(recentTransactions)}`;

    const contents = [
      { role: 'user', parts: [{ text: systemContext }] },
      { role: 'model', parts: [{ text: "Got it — I've reviewed the transaction history and I'm ready to help. What would you like to know?" }] },
      ...history.map(turn => ({
        role: turn.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: turn.text }],
      })),
      { role: 'user', parts: [{ text: question }] },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents,
    });

    return response.text?.trim() || "Sorry, I couldn't come up with an answer for that. Try rephrasing?";
  } catch (error) {
    console.error('Chatbot AI error:', error);
    throw new Error('The assistant is temporarily unavailable. Please try again in a moment.');
  }
}

// ─── Goal Journey: creation plan (step 5) ────────────────────────────────────
async function generateGoalPlan({ title, targetAmount, deadline, avgMonthlySaving }) {
  try {
    const prompt = `Given a savings goal of ₹${targetAmount} for "${title}"${deadline ? ` by ${deadline}` : ' with no fixed deadline'},
and this user's trailing average monthly saving of ₹${avgMonthlySaving ?? 0}:
Compute the required monthly, weekly, and daily saving amounts to hit the target by the deadline (or a realistic pace if no deadline is set).
Also give a realistic projected completion date (ISO 8601, e.g. "2026-12-31"), and ONE short, warm, specific motivational line (max 18 words) about this exact goal.
If the deadline is unrealistic at the user's current saving rate, say so honestly in the motivational line instead of inflating the plan.`;

    const responseSchema = {
      type: 'object',
      properties: {
        requiredMonthly: { type: 'number' },
        requiredWeekly: { type: 'number' },
        requiredDaily: { type: 'number' },
        projectedCompletionDate: { type: 'string', description: 'ISO 8601 date' },
        motivationalLine: { type: 'string' },
      },
      required: ['requiredMonthly', 'requiredWeekly', 'requiredDaily', 'projectedCompletionDate', 'motivationalLine'],
    };

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error('Goal plan AI error:', error);
    // Deterministic fallback so goal creation never hard-fails on an AI outage.
    const days = deadline ? Math.max(1, Math.ceil((new Date(deadline) - new Date()) / 86400000)) : 180;
    return {
      requiredMonthly: Math.ceil((targetAmount / days) * 30),
      requiredWeekly: Math.ceil((targetAmount / days) * 7),
      requiredDaily: Math.ceil(targetAmount / days),
      projectedCompletionDate: deadline || new Date(Date.now() + days * 86400000).toISOString(),
      motivationalLine: `Stay consistent and "${title}" is within reach.`,
    };
  }
}

// ─── Goal Journey: AI coach message (goal hub, rate-limited 1/session) ───────
async function generateCoachMessage({ goalTitle, savedAmount, targetAmount, recentTransactions, recentMessages = [] }) {
  try {
    const txSummary = (recentTransactions || []).slice(0, 30).map(t => ({
      amount: t.amount, type: t.type, category: t.category, date: t.date,
    }));

    const prompt = `Given this user's last 30 transactions (JSON below) and their goal progress
(₹${savedAmount} saved of ₹${targetAmount} toward "${goalTitle}"),
write ONE short coach message (max 24 words) referencing a REAL pattern in their data —
an under-spent category, a saving streak, or a comparison to typical spending.
Never repeat the meaning of any of these previous messages: ${JSON.stringify(recentMessages)}.
Tone: warm, specific, never guilt-inducing.

Transactions: ${JSON.stringify(txSummary)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    return response.text?.trim().replace(/^"|"$/g, '') || `You're making steady progress toward ${goalTitle}. Keep going.`;
  } catch (error) {
    console.error('Coach message AI error:', error);
    return `You're making steady progress toward ${goalTitle}. Keep going.`;
  }
}

// ─── Goal Journey: expense/contribution impact line (toast) ─────────────────
async function generateImpactLine({ amount, category, goalTitle, dayDelta, direction }) {
  try {
    const verb = direction === 'boost' ? 'moved you closer to' : 'delayed';
    const prompt = `An amount of ₹${amount}${category ? ` in "${category}"` : ''} was just ${direction === 'boost' ? 'added toward' : 'spent, affecting'} the goal "${goalTitle}".
This ${verb} the goal by ${dayDelta} day(s). State this plainly and warmly in under 12 words. Never sound guilt-inducing or alarmed.`;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
    });

    return response.text?.trim().replace(/^"|"$/g, '') ||
      (direction === 'boost'
        ? `You moved ${dayDelta} day(s) closer to ${goalTitle}.`
        : `This delays ${goalTitle} by ${dayDelta} day(s).`);
  } catch (error) {
    console.error('Impact line AI error:', error);
    return direction === 'boost'
      ? `You moved ${dayDelta} day(s) closer to ${goalTitle}.`
      : `This delays ${goalTitle} by ${dayDelta} day(s).`;
  }
}
