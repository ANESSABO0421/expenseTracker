export const formatCurrency = (amount: number, currency: string, rates: Record<string, number> | null) => {
  let convertedAmount = amount;
  
  if (rates && rates[currency]) {
    convertedAmount = amount * rates[currency];
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
};
