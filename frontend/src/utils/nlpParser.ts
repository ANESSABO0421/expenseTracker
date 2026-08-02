export const parseSpokenTransaction = (text: string) => {
  const lowercaseText = text.toLowerCase();
  
  // 1. Extract Amount
  // Matches "$45.50", "45 dollars", "45", etc.
  let amount = 0;
  const numberRegex = /\$?\d+(\.\d{1,2})?/;
  const match = text.match(numberRegex);
  if (match) {
    amount = parseFloat(match[0].replace('$', ''));
  }

  // 2. Extract Category based on keywords
  const categories = {
    'Food': ['food', 'grocery', 'groceries', 'dinner', 'lunch', 'breakfast', 'coffee', 'restaurant', 'cafe', 'snack', 'drink'],
    'Transport': ['transport', 'uber', 'lyft', 'taxi', 'bus', 'train', 'flight', 'gas', 'fuel', 'metro'],
    'Rent': ['rent', 'lease', 'apartment', 'housing'],
    'Salary': ['salary', 'paycheck', 'wage', 'bonus', 'income'],
    'Utilities': ['utility', 'utilities', 'electric', 'water', 'internet', 'wifi', 'phone', 'bill'],
    'Entertainment': ['movie', 'game', 'concert', 'ticket', 'fun', 'entertainment'],
    'Health': ['health', 'doctor', 'hospital', 'medicine', 'pharmacy', 'gym', 'workout'],
    'Shopping': ['shopping', 'clothes', 'shoes', 'amazon', 'mall', 'store'],
  };

  let detectedCategory = 'Other';
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowercaseText.includes(keyword))) {
      detectedCategory = category;
      break;
    }
  }

  // 3. Clean up description
  // Remove common filler words and amounts
  let description = text;
  if (match) {
    description = description.replace(match[0], '');
  }
  const fillerWords = ['i spent', 'i just spent', 'dollars on', 'dollars for', 'bucks on', 'on a', 'on an', 'on'];
  fillerWords.forEach(word => {
    description = description.replace(new RegExp(word, 'gi'), '');
  });
  
  // Capitalize first letter and trim
  description = description.trim();
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    amount: amount > 0 ? amount.toString() : '',
    category: detectedCategory,
    description: description || text
  };
};
