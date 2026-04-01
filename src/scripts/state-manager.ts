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

    // Try to load from URL params first, then localStorage
    this.state = this.loadFromUrlParams() || this.loadFromStorage() || defaultState;
  }

  /**
   * Load state from URL query parameters
   */
  private loadFromUrlParams(): State | null {
    try {
      const params = new URLSearchParams(window.location.search);
      if (!params.has('share')) {
        return null;
      }

      const state: Partial<State> = {
        currentApartmentValue: Number(params.get('cav')) || 0,
        studyFundAmount: Number(params.get('sfa')) || 0,
        studyFundLoan: params.get('sfl') === '1',
        otherSavings: Number(params.get('os')) || 0,
        currentMortgage: Number(params.get('cm')) || 0,
        apartmentPrice: Number(params.get('ap')) || 0,
        brokerageFeeRate: Number(params.get('bfr')) || 0.02,
        additionalCosts: Number(params.get('ac')) || 0,
        mortgageAmount: Number(params.get('ma')) || 0,
        interestRate: Number(params.get('ir')) || 0.045,
        loanYears: Number(params.get('ly')) || 30,
        mode: 'FROM_APARTMENT_PRICE',
        results: null,
      };

      return state as State;
    } catch (error) {
      console.error('Failed to load from URL params:', error);
    }
    return null;
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

    // Always calculate from apartment price (no bidirectional mode)
    this.state.mode = 'FROM_APARTMENT_PRICE';

    // Recalculate
    this.recalculate();

    // If user changed something other than mortgage, update mortgage to required amount
    // and recalculate again to ensure balance/monthly payment are correct
    if (field !== 'mortgageAmount' && this.state.results) {
      const oldMortgage = this.state.mortgageAmount;
      const newMortgage = this.state.results.mortgage;

      // Only recalculate if mortgage amount actually changed
      if (Math.abs(oldMortgage - newMortgage) > 0.01) {
        this.state.mortgageAmount = newMortgage;
        this.recalculate();
      }
    }

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

    const purchaseInputs: PurchaseInputs = {
      apartmentPrice: this.state.apartmentPrice,
      brokerageFeeRate: this.state.brokerageFeeRate,
      additionalCosts: this.state.additionalCosts,
    };

    this.state.results = calculateFromApartmentPrice(
      equityInputs,
      purchaseInputs,
      this.state.interestRate,
      this.state.loanYears,
      this.state.mortgageAmount
    );
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

  /**
   * Generate shareable URL with current state as query parameters
   */
  getShareableUrl(): string {
    const params = new URLSearchParams();
    params.set('share', '1');
    params.set('cav', String(this.state.currentApartmentValue));
    params.set('sfa', String(this.state.studyFundAmount));
    params.set('sfl', this.state.studyFundLoan ? '1' : '0');
    params.set('os', String(this.state.otherSavings));
    params.set('cm', String(this.state.currentMortgage));
    params.set('ap', String(this.state.apartmentPrice));
    params.set('bfr', String(this.state.brokerageFeeRate));
    params.set('ac', String(this.state.additionalCosts));
    params.set('ma', String(this.state.mortgageAmount));
    params.set('ir', String(this.state.interestRate));
    params.set('ly', String(this.state.loanYears));

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  }
}
