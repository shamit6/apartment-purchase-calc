import {
  calculateEquity,
  calculateBrokerageFee,
  calculatePurchaseTax,
  calculateFromApartmentPrice,
  calculateFromMortgage,
  type EquityInputs,
  type PurchaseInputs,
} from './src/scripts/calculator';

console.log('🧪 Testing Real Estate Calculator\n');

// Test 1: Equity calculation
console.log('Test 1: Equity Calculation');
const equityInputs: EquityInputs = {
  currentApartmentValue: 2000000,
  studyFundAmount: 500000,
  studyFundLoan: false,
  otherSavings: 200000,
  currentMortgage: 800000,
};
const equity = calculateEquity(equityInputs);
console.log(`Expected: ₪1,900,000 | Actual: ₪${equity.toLocaleString('he-IL')}`);
console.log(`✓ Passed: ${equity === 1900000}\n`);

// Test 2: Equity with loan
console.log('Test 2: Equity with Study Fund Loan (60%)');
const equityInputsWithLoan: EquityInputs = {
  ...equityInputs,
  studyFundLoan: true,
};
const equityWithLoan = calculateEquity(equityInputsWithLoan);
const expected = 2000000 + 500000 * 0.6 + 200000 - 800000;
console.log(`Expected: ₪${expected.toLocaleString('he-IL')} | Actual: ₪${equityWithLoan.toLocaleString('he-IL')}`);
console.log(`✓ Passed: ${equityWithLoan === expected}\n`);

// Test 3: Brokerage fee
console.log('Test 3: Brokerage Fee (2% + 18% VAT)');
const brokerageFee = calculateBrokerageFee(3000000, 0.02);
const expectedBrokerage = 3000000 * 0.02 * 1.18;
console.log(`Expected: ₪${expectedBrokerage.toLocaleString('he-IL')} | Actual: ₪${brokerageFee.toLocaleString('he-IL')}`);
console.log(`✓ Passed: ${brokerageFee === expectedBrokerage}\n`);

// Test 4: Purchase tax (test each bracket)
console.log('Test 4: Purchase Tax Brackets');

const testPrices = [
  { price: 1500000, expectedTax: 0 },
  { price: 2000000, expectedTax: (2000000 - 1978745) * 0.035 },
  { price: 3000000, expectedTax: (2347040 - 1978745) * 0.035 + (3000000 - 2347040) * 0.05 },
];

testPrices.forEach(({ price, expectedTax }) => {
  const actualTax = calculatePurchaseTax(price);
  console.log(`Price: ₪${price.toLocaleString('he-IL')}`);
  console.log(`Expected Tax: ₪${Math.round(expectedTax).toLocaleString('he-IL')}`);
  console.log(`Actual Tax: ₪${Math.round(actualTax).toLocaleString('he-IL')}`);
  console.log(`✓ Passed: ${Math.abs(actualTax - expectedTax) < 1}\n`);
});

// Test 5: Forward calculation (apartment price → mortgage)
console.log('Test 5: Forward Calculation (Apartment Price → Mortgage)');
const purchaseInputs: PurchaseInputs = {
  apartmentPrice: 3000000,
  brokerageFeeRate: 0.02,
  additionalCosts: 50000,
};
const forwardResult = calculateFromApartmentPrice(equityInputs, purchaseInputs);
console.log(`Apartment Price: ₪${forwardResult.apartmentPrice.toLocaleString('he-IL')}`);
console.log(`Equity: ₪${forwardResult.equity.toLocaleString('he-IL')}`);
console.log(`Brokerage Fee: ₪${Math.round(forwardResult.brokerageFee).toLocaleString('he-IL')}`);
console.log(`Purchase Tax: ₪${Math.round(forwardResult.purchaseTax).toLocaleString('he-IL')}`);
console.log(`Total Cost: ₪${Math.round(forwardResult.totalPurchaseCost).toLocaleString('he-IL')}`);
console.log(`Mortgage: ₪${Math.round(forwardResult.mortgage).toLocaleString('he-IL')}\n`);

// Test 6: Reverse calculation (mortgage → apartment price)
console.log('Test 6: Reverse Calculation (Mortgage → Apartment Price)');
const targetMortgage = 1500000;
const reverseResult = calculateFromMortgage(
  equityInputs,
  targetMortgage,
  0.02,
  50000
);
console.log(`Target Mortgage: ₪${targetMortgage.toLocaleString('he-IL')}`);
console.log(`Calculated Apartment Price: ₪${reverseResult.apartmentPrice.toLocaleString('he-IL')}`);
console.log(`Equity: ₪${reverseResult.equity.toLocaleString('he-IL')}`);
console.log(`Brokerage Fee: ₪${Math.round(reverseResult.brokerageFee).toLocaleString('he-IL')}`);
console.log(`Purchase Tax: ₪${Math.round(reverseResult.purchaseTax).toLocaleString('he-IL')}`);
console.log(`Total Cost: ₪${Math.round(reverseResult.totalPurchaseCost).toLocaleString('he-IL')}`);
console.log(`Actual Mortgage: ₪${Math.round(reverseResult.mortgage).toLocaleString('he-IL')}`);
console.log(`✓ Converged: ${Math.abs(reverseResult.mortgage - targetMortgage) < 100}\n`);

// Test 7: Bidirectional consistency
console.log('Test 7: Bidirectional Consistency Test');
const testPrice = 3500000;
const forwardCalc = calculateFromApartmentPrice(equityInputs, {
  apartmentPrice: testPrice,
  brokerageFeeRate: 0.02,
  additionalCosts: 50000,
});
const reverseCalc = calculateFromMortgage(
  equityInputs,
  forwardCalc.mortgage,
  0.02,
  50000
);
console.log(`Original Price: ₪${testPrice.toLocaleString('he-IL')}`);
console.log(`Forward → Mortgage: ₪${Math.round(forwardCalc.mortgage).toLocaleString('he-IL')}`);
console.log(`Reverse → Price: ₪${reverseCalc.apartmentPrice.toLocaleString('he-IL')}`);
console.log(`Price Difference: ₪${Math.abs(reverseCalc.apartmentPrice - testPrice).toLocaleString('he-IL')}`);
console.log(`✓ Passed: ${Math.abs(reverseCalc.apartmentPrice - testPrice) < 1000}\n`);

console.log('✅ All tests completed!');
