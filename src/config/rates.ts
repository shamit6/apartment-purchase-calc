/**
 * Configuration for tax rates and brackets
 * Based on Israeli purchase tax law
 * Last updated: 2025
 */

export interface TaxBracket {
  from: number;
  to: number | null; // null means infinity
  rate: number;
}

export const config = {
  // Default brokerage fee rate (can be adjusted in UI)
  brokerageFeeRate: 0.02, // 2%

  // VAT rate
  vatRate: 0.18, // 18%

  // Advanced Study Fund (קרן השתלמות) loan rate
  pensionLoanRate: 0.6, // 60%

  // Israeli purchase tax brackets (מס רכישה)
  // Progressive tax on apartment price
  purchaseTaxBrackets: [
    { from: 0, to: 1978745, rate: 0 },           // 0% up to ₪1,978,745
    { from: 1978745, to: 2347040, rate: 0.035 }, // 3.5%
    { from: 2347040, to: 6055070, rate: 0.05 },  // 5%
    { from: 6055070, to: 20183565, rate: 0.08 }, // 8%
    { from: 20183565, to: null, rate: 0.10 },    // 10% above
  ] as TaxBracket[],
};
