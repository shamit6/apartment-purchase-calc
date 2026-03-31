import { config } from '../config/rates';

export interface EquityInputs {
  currentApartmentValue: number;
  studyFundAmount: number;
  studyFundLoan: boolean;
  otherSavings: number;
  currentMortgage: number;
}

export interface PurchaseInputs {
  apartmentPrice: number;
  brokerageFeeRate: number;
  additionalCosts: number;
}

export interface CalculationResult {
  equity: number;
  brokerageFee: number;
  purchaseTax: number;
  totalPurchaseCost: number;
  mortgage: number;
  apartmentPrice: number;
  monthlyPayment: number;
}

/**
 * Calculate monthly payment using Spitzer method (fixed payment)
 * Formula: M = P × [r(1 + r)^n] / [(1 + r)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  years: number
): number {
  if (principal <= 0 || annualInterestRate <= 0 || years <= 0) {
    return 0;
  }

  const monthlyRate = annualInterestRate / 12;
  const numberOfPayments = years * 12;

  // Special case: if interest rate is 0, simple division
  if (monthlyRate === 0) {
    return principal / numberOfPayments;
  }

  // Spitzer formula
  const x = Math.pow(1 + monthlyRate, numberOfPayments);
  const monthly = principal * (monthlyRate * x) / (x - 1);

  return monthly;
}

/**
 * Calculate total equity (Part 1)
 */
export function calculateEquity(inputs: EquityInputs): number {
  const studyFundContribution = inputs.studyFundLoan
    ? inputs.studyFundAmount * config.pensionLoanRate
    : inputs.studyFundAmount;

  return (
    inputs.currentApartmentValue +
    studyFundContribution +
    inputs.otherSavings -
    inputs.currentMortgage
  );
}

/**
 * Calculate brokerage fee with VAT
 */
export function calculateBrokerageFee(
  apartmentPrice: number,
  brokerageFeeRate: number
): number {
  return apartmentPrice * brokerageFeeRate * (1 + config.vatRate);
}

/**
 * Calculate progressive purchase tax (מס רכישה)
 */
export function calculatePurchaseTax(apartmentPrice: number): number {
  let totalTax = 0;

  for (const bracket of config.purchaseTaxBrackets) {
    const bracketStart = bracket.from;
    const bracketEnd = bracket.to ?? Infinity;

    // Skip if price doesn't reach this bracket
    if (apartmentPrice <= bracketStart) {
      break;
    }

    // Calculate taxable amount in this bracket
    const taxableInBracket = Math.min(apartmentPrice, bracketEnd) - bracketStart;
    totalTax += taxableInBracket * bracket.rate;
  }

  return totalTax;
}

/**
 * Calculate total purchase cost
 */
export function calculateTotalPurchaseCost(
  apartmentPrice: number,
  brokerageFeeRate: number,
  additionalCosts: number
): number {
  const brokerageFee = calculateBrokerageFee(apartmentPrice, brokerageFeeRate);
  const purchaseTax = calculatePurchaseTax(apartmentPrice);

  return apartmentPrice + brokerageFee + purchaseTax + additionalCosts;
}

/**
 * Forward calculation: Apartment price → Mortgage amount
 */
export function calculateFromApartmentPrice(
  equityInputs: EquityInputs,
  purchaseInputs: PurchaseInputs,
  interestRate: number,
  loanYears: number
): CalculationResult {
  const equity = calculateEquity(equityInputs);
  const brokerageFee = calculateBrokerageFee(
    purchaseInputs.apartmentPrice,
    purchaseInputs.brokerageFeeRate
  );
  const purchaseTax = calculatePurchaseTax(purchaseInputs.apartmentPrice);
  const totalPurchaseCost = calculateTotalPurchaseCost(
    purchaseInputs.apartmentPrice,
    purchaseInputs.brokerageFeeRate,
    purchaseInputs.additionalCosts
  );
  const mortgage = totalPurchaseCost - equity;
  const monthlyPayment = calculateMonthlyPayment(mortgage, interestRate, loanYears);

  return {
    equity,
    brokerageFee,
    purchaseTax,
    totalPurchaseCost,
    mortgage,
    apartmentPrice: purchaseInputs.apartmentPrice,
    monthlyPayment,
  };
}

/**
 * Reverse calculation: Mortgage amount → Apartment price
 * Uses iterative solver to find apartment price that results in target mortgage
 */
export function calculateFromMortgage(
  equityInputs: EquityInputs,
  targetMortgage: number,
  brokerageFeeRate: number,
  additionalCosts: number,
  interestRate: number,
  loanYears: number
): CalculationResult {
  const equity = calculateEquity(equityInputs);
  const targetPurchaseCost = equity + targetMortgage;

  // Initial estimate: assume fees/tax are ~10% of price
  let estimatedPrice = targetPurchaseCost / 1.1;

  // Newton-Raphson style iterative solver
  const maxIterations = 10;
  const convergenceThreshold = 1; // ₪1

  for (let i = 0; i < maxIterations; i++) {
    const calculatedCost = calculateTotalPurchaseCost(
      estimatedPrice,
      brokerageFeeRate,
      additionalCosts
    );

    const difference = targetPurchaseCost - calculatedCost;

    // Check convergence
    if (Math.abs(difference) < convergenceThreshold) {
      break;
    }

    // Adjust price estimate with damping factor
    estimatedPrice += difference * 0.9;
  }

  // Calculate final values with converged price
  const brokerageFee = calculateBrokerageFee(estimatedPrice, brokerageFeeRate);
  const purchaseTax = calculatePurchaseTax(estimatedPrice);
  const totalPurchaseCost = calculateTotalPurchaseCost(
    estimatedPrice,
    brokerageFeeRate,
    additionalCosts
  );
  const mortgage = totalPurchaseCost - equity;
  const monthlyPayment = calculateMonthlyPayment(mortgage, interestRate, loanYears);

  return {
    equity,
    brokerageFee,
    purchaseTax,
    totalPurchaseCost,
    mortgage,
    apartmentPrice: Math.round(estimatedPrice),
    monthlyPayment,
  };
}
