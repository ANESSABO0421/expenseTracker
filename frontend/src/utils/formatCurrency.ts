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

/** Stored (base-currency) amount → amount in the display currency. */
export const toDisplayAmount = (amount: number, currency: string, rates: Record<string, number> | null) => {
  const rate = rates?.[currency];
  return rate ? amount * rate : amount;
};

/** Amount typed in the display currency → amount to store in the base currency. */
export const toBaseAmount = (amount: number, currency: string, rates: Record<string, number> | null) => {
  const rate = rates?.[currency];
  return rate ? Math.round((amount / rate) * 100) / 100 : amount;
};
