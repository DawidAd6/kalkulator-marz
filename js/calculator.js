export const PLATFORM_DEFAULTS = {
  allegro: 12,
  temu: 5,
  aliexpress: 8,
  other: 0,
};

export const CURRENCY_RATES = {
  PLN: 1,
  USD: 4.05,
  EUR: 4.35,
  CNY: 0.56,
  GBP: 5.10,
};

export function calculate({
  purchasePrice,
  shippingCost,
  sellingPrice,
  commissionRate,
  adsCostPerItem = 0,
  packagingCost = 0,
  returnRate = 0,
  vatRate = 0,
  includeVat = false,
  purchaseCurrency = 'PLN',
  quantity = 1,
}) {
  // Convert purchase price to PLN if needed
  const rate = CURRENCY_RATES[purchaseCurrency] || 1;
  const purchasePLN = purchasePrice * rate;
  const shippingPLN = shippingCost * rate;

  const commission = sellingPrice * (commissionRate / 100);
  const returnCost = sellingPrice * (returnRate / 100);
  const fixedCosts = purchasePLN + shippingPLN + adsCostPerItem + packagingCost;
  const totalCost = fixedCosts + commission + returnCost;

  let vatAmount = 0;
  if (includeVat && vatRate > 0) {
    vatAmount = sellingPrice * vatRate / (100 + vatRate);
  }

  const profit = sellingPrice - totalCost - vatAmount;
  const marginPercent = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

  // Break-even selling price (for desired profit of 0)
  const variableRate = (commissionRate + returnRate) / 100;
  const vatFactor = includeVat && vatRate > 0 ? vatRate / (100 + vatRate) : 0;
  const breakEvenPrice = variableRate + vatFactor < 1
    ? fixedCosts / (1 - variableRate - vatFactor)
    : 0;

  return {
    purchasePLN: round2(purchasePLN),
    shippingPLN: round2(shippingPLN),
    commission: round2(commission),
    adsCostPerItem: round2(adsCostPerItem),
    packagingCost: round2(packagingCost),
    returnCost: round2(returnCost),
    vatAmount: round2(vatAmount),
    totalCost: round2(totalCost + vatAmount),
    profit: round2(profit),
    marginPercent: Math.round(marginPercent * 10) / 10,
    totalProfit: round2(profit * quantity),
    quantity,
    breakEvenPrice: round2(breakEvenPrice),
  };
}

export function calculateBreakEven({
  purchasePrice,
  shippingCost,
  commissionRate,
  adsCostPerItem = 0,
  packagingCost = 0,
  returnRate = 0,
  desiredProfit = 0,
  purchaseCurrency = 'PLN',
  vatRate = 0,
  includeVat = false,
}) {
  const rate = CURRENCY_RATES[purchaseCurrency] || 1;
  const purchasePLN = purchasePrice * rate;
  const shippingPLN = shippingCost * rate;

  const fixedCosts = purchasePLN + shippingPLN + adsCostPerItem + packagingCost;
  const variableRate = (commissionRate + returnRate) / 100;
  const vatFactor = includeVat && vatRate > 0 ? vatRate / (100 + vatRate) : 0;

  if (variableRate + vatFactor >= 1) return null;

  const requiredPrice = (fixedCosts + desiredProfit) / (1 - variableRate - vatFactor);
  return round2(requiredPrice);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function getProfitTier(profit) {
  if (profit < 5) return 'bad';
  if (profit <= 15) return 'mid';
  return 'good';
}

export function getInterpretationText(profit) {
  if (profit < 5) {
    return 'Uwaga: Bardzo niski zysk. Ta oferta może być nieopłacalna po uwzględnieniu zwrotów i reklam.';
  }
  if (profit <= 15) {
    return 'OK, ale zastanów się, czy ta marża pokryje koszty reklam i ewentualnych zwrotów.';
  }
  return 'Dobra marża. Oferta wygląda na potencjalnie rentowną.';
}
