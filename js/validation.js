export function validateForm(data) {
  const errors = [];

  if (!data.productName || data.productName.trim().length === 0) {
    errors.push({ field: 'product-name', message: 'Podaj nazwę produktu' });
  }

  if (data.purchasePrice === null || data.purchasePrice <= 0) {
    errors.push({ field: 'purchase-price', message: 'Cena zakupu musi być większa niż 0' });
  }

  if (data.shippingCost === null || data.shippingCost < 0) {
    errors.push({ field: 'shipping-cost', message: 'Koszt dostawy nie może być ujemny' });
  }

  if (data.sellingPrice === null || data.sellingPrice <= 0) {
    errors.push({ field: 'selling-price', message: 'Cena sprzedaży musi być większa niż 0' });
  }

  if (data.commissionRate === null || data.commissionRate < 0 || data.commissionRate > 100) {
    errors.push({ field: 'commission-rate', message: 'Prowizja musi być między 0 a 100%' });
  }

  if (data.adsCostPerItem !== null && data.adsCostPerItem < 0) {
    errors.push({ field: 'ads-cost', message: 'Koszt reklamy nie może być ujemny' });
  }

  if (data.packagingCost !== null && data.packagingCost < 0) {
    errors.push({ field: 'packaging-cost', message: 'Koszt pakowania nie może być ujemny' });
  }

  if (data.returnRate !== null && (data.returnRate < 0 || data.returnRate > 100)) {
    errors.push({ field: 'return-rate', message: 'Procent zwrotów musi być między 0 a 100' });
  }

  if (data.quantity !== null && data.quantity < 1) {
    errors.push({ field: 'quantity', message: 'Ilość musi wynosić co najmniej 1' });
  }

  if (data.foreignDropshipping && (!data.deliveryTime || data.deliveryTime.trim().length === 0)) {
    errors.push({ field: 'delivery-time', message: 'Podaj szacowany czas dostawy' });
  }

  return errors;
}

export function isFormFilled(data) {
  return (
    data.productName.trim().length > 0 &&
    data.purchasePrice !== null && data.purchasePrice > 0 &&
    data.shippingCost !== null && data.shippingCost >= 0 &&
    data.sellingPrice !== null && data.sellingPrice > 0 &&
    data.commissionRate !== null && data.commissionRate >= 0 && data.commissionRate <= 100
  );
}
