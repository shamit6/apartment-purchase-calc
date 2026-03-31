import { calculateMonthlyPayment } from './src/scripts/calculator';

console.log('🧪 Testing Monthly Payment (Spitzer Method)\n');

// Test 1: Standard mortgage
console.log('Test 1: ₪1,000,000 mortgage at 4.5% for 30 years');
const monthly1 = calculateMonthlyPayment(1000000, 0.045, 30);
console.log(`Monthly payment: ₪${Math.round(monthly1).toLocaleString('he-IL')}`);
console.log(`Expected: ~₪5,067 (approximately)`);
console.log();

// Test 2: Different rate
console.log('Test 2: ₪1,500,000 mortgage at 5% for 25 years');
const monthly2 = calculateMonthlyPayment(1500000, 0.05, 25);
console.log(`Monthly payment: ₪${Math.round(monthly2).toLocaleString('he-IL')}`);
console.log();

// Test 3: Shorter term
console.log('Test 3: ₪800,000 mortgage at 4% for 15 years');
const monthly3 = calculateMonthlyPayment(800000, 0.04, 15);
console.log(`Monthly payment: ₪${Math.round(monthly3).toLocaleString('he-IL')}`);
console.log();

// Test 4: Zero interest (edge case)
console.log('Test 4: ₪1,200,000 mortgage at 0% for 30 years');
const monthly4 = calculateMonthlyPayment(1200000, 0, 30);
console.log(`Monthly payment: ₪${Math.round(monthly4).toLocaleString('he-IL')}`);
console.log(`Expected: ₪${Math.round(1200000 / (30 * 12)).toLocaleString('he-IL')} (1,200,000 / 360)`);
console.log();

// Manual verification for Test 1
console.log('Manual verification for Test 1:');
const P = 1000000;
const r = 0.045 / 12; // 0.00375
const n = 30 * 12; // 360
const x = Math.pow(1 + r, n);
const M = P * (r * x) / (x - 1);
console.log(`Using formula: M = ${Math.round(M).toLocaleString('he-IL')}`);
console.log();

console.log('✅ Monthly payment calculations complete!');
