import {
  calculateFromApartmentPrice,
  calculateFromMortgage,
  type EquityInputs,
  type PurchaseInputs,
  type CalculationResult,
} from './calculator';

export type CalculationMode = 'FROM_APARTMENT_PRICE' | 'FROM_MORTGAGE';

export interface State {
  // Part 1: Equity inputs
  currentApartmentValue: number;
  studyFundAmount: number;
  studyFundLoan: boolean;
  otherSavings: number;
  currentMortgage: number;

  // Part 2: Purchase inputs
  apartmentPrice: number;
  brokerageFeeRate: number;
  additionalCosts: number;

  // Part 3: Mortgage input
  mortgageAmount: number;
  interestRate: number;
  loanYears: number;

  // Calculation mode
  mode: CalculationMode;

  // Results
  results: CalculationResult | null;
}

type StateListener = (state: State) => void;

const STORAGE_KEY = 'apartment-calc-state';

export class StateManager {
  private state: State;
  private listeners: Set<StateListener> = new Set();
  private isUpdating = false; // Prevent circular updates

  constructor() {
    // Default state
    const defaultState: State = {
      currentApartmentValue: 0,
      studyFundAmount: 0,
      studyFundLoan: false,
      otherSavings: 0,
      currentMortgage: 0,
      apartmentPrice: 0,
      brokerageFeeRate: 0.02, // 2%
      additionalCosts: 0,
      mortgageAmount: 0,
      interestRate: 0.045, // 4.5%
      loanYears: 30,
      mode: 'FROM_APARTMENT_PRICE',
      results: null,
    };

    // Load from localStorage if available
    this.state = this.loadFromStorage() || defaultState;
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): State | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Don't restore results, recalculate them
        parsed.results = null;
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      // Don't save results, only input values
      const toSave = { ...this.state };
      toSave.results = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Clear all data and reset to defaults
   */
  clearAll(): void {
    this.state = {
      currentApartmentValue: 0,
      studyFundAmount: 0,
      studyFundLoan: false,
      otherSavings: 0,
      currentMortgage: 0,
      apartmentPrice: 0,
      brokerageFeeRate: 0.02,
      additionalCosts: 0,
      mortgageAmount: 0,
      interestRate: 0.045,
      loanYears: 30,
      mode: 'FROM_APARTMENT_PRICE',
      results: null,
    };

    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }

    // Recalculate and notify
    this.recalculate();
    this.notify();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Get current state
   */
  getState(): State {
    return { ...this.state };
  }

  /**
   * Update a single field and recalculate
   */
  updateField(field: keyof State, value: any): void {
    if (this.isUpdating) return;

    this.isUpdating = true;

    // Update the field
    (this.state as any)[field] = value;

    // Determine calculation mode based on which field changed
    if (field === 'apartmentPrice') {
      this.state.mode = 'FROM_APARTMENT_PRICE';
    } else if (field === 'mortgageAmount') {
      this.state.mode = 'FROM_MORTGAGE';
    }

    // Recalculate
    this.recalculate();

    // Notify listeners
    this.notify();

    // Save to localStorage
    this.saveToStorage();

    this.isUpdating = false;
  }

  /**
   * Recalculate results based on current mode
   */
  private recalculate(): void {
    const equityInputs: EquityInputs = {
      currentApartmentValue: this.state.currentApartmentValue,
      studyFundAmount: this.state.studyFundAmount,
      studyFundLoan: this.state.studyFundLoan,
      otherSavings: this.state.otherSavings,
      currentMortgage: this.state.currentMortgage,
    };

    if (this.state.mode === 'FROM_APARTMENT_PRICE') {
      const purchaseInputs: PurchaseInputs = {
        apartmentPrice: this.state.apartmentPrice,
        brokerageFeeRate: this.state.brokerageFeeRate,
        additionalCosts: this.state.additionalCosts,
      };

      this.state.results = calculateFromApartmentPrice(
        equityInputs,
        purchaseInputs,
        this.state.interestRate,
        this.state.loanYears
      );

      // Update mortgage amount field to match calculation
      this.state.mortgageAmount = this.state.results.mortgage;
    } else {
      // FROM_MORTGAGE mode
      this.state.results = calculateFromMortgage(
        equityInputs,
        this.state.mortgageAmount,
        this.state.brokerageFeeRate,
        this.state.additionalCosts,
        this.state.interestRate,
        this.state.loanYears
      );

      // Update apartment price field to match calculation
      this.state.apartmentPrice = this.state.results.apartmentPrice;
    }
  }

  /**
   * Force recalculation (useful when multiple fields change)
   */
  forceRecalculate(): void {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.recalculate();
    this.notify();
    this.saveToStorage();
    this.isUpdating = false;
  }
}
