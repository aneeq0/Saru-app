import Decimal from 'decimal.js';

function canDispatch(available: Decimal.Value, requested: Decimal.Value) {
  return new Decimal(available).gte(requested);
}

function remainingContractQty(
  awarded: Decimal.Value,
  dispatched: Decimal.Value,
) {
  return new Decimal(awarded).minus(dispatched);
}

describe('inventory math', () => {
  it('prevents oversell when available is insufficient', () => {
    expect(canDispatch(100, 80)).toBe(true);
    expect(canDispatch(100, 50)).toBe(true);
    expect(canDispatch(20, 50)).toBe(false);
  });

  it('computes remaining contract quantity with decimals', () => {
    expect(remainingContractQty('100.5', '40.25').toFixed(2)).toBe('60.25');
  });

  it('treats exact available as dispatchable', () => {
    expect(canDispatch('12.000000', '12.000000')).toBe(true);
  });
});
