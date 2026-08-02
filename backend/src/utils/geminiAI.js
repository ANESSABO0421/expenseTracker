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

    const parsedInsights = JSON.parse(response.text());
    
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
};
