const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

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

    // Prepare data for the prompt (limit to recent 50 to save tokens/time)
    const recentTransactions = transactions.slice(0, 50).map(t => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date
    }));

    const prompt = `
      You are an expert financial AI assistant. I will provide a user's recent transaction history.
      Analyze their spending and income patterns and provide exactly 3 brief, highly personalized insights or tips.
      
      Output your response ONLY as a JSON object with a single key "insights" containing an array of 3 objects. Do not wrap it in markdown code blocks.
      
      Example output format:
      {
        "insights": [
          {
            "title": "A short, punchy title (max 4 words)",
            "message": "A detailed 1-2 sentence personalized insight based on their data.",
            "icon": "A valid Ionicons icon name (e.g., 'warning', 'trending-up', 'restaurant', 'cart', 'cash', 'star')",
            "color": "One of these exact strings: 'red', 'green', 'blue', 'orange', 'purple'"
          }
        ]
      }

      Here is the transaction history (JSON format):
      ${JSON.stringify(recentTransactions)}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a JSON-only API. You output raw JSON arrays and nothing else.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      response_format: { type: 'json_object' } // We want JSON, but Llama3 8b doesn't strictly support json_object in all endpoints, so we rely on system prompt. Wait, Groq SDK supports json_object for Llama3 8b!
    });

    let content = chatCompletion.choices[0]?.message?.content || "[]";
    
    // Safety fallback for markdown stripping
    content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    const parsedInsights = JSON.parse(content);
    
    // Ensure we return an array (if the LLM wrapped it in an object like { "insights": [...] })
    if (Array.isArray(parsedInsights)) {
      return parsedInsights.slice(0, 3);
    } else if (parsedInsights.insights && Array.isArray(parsedInsights.insights)) {
      return parsedInsights.insights.slice(0, 3);
    } else {
      // Fallback if structure is weird
      const keys = Object.keys(parsedInsights);
      if (keys.length > 0 && Array.isArray(parsedInsights[keys[0]])) {
         return parsedInsights[keys[0]].slice(0, 3);
      }
      throw new Error("Invalid JSON structure returned by LLM");
    }
  } catch (error) {
    console.error('Groq AI Error:', error);
    // Return graceful fallback
    return [
      {
        title: "AI Analysis Temporarily Unavailable",
        message: "We're having trouble connecting to our AI brain right now. Try again later.",
        icon: "warning",
        color: "red"
      }
    ];
  }
};

module.exports = {
  generateInsights,
};
