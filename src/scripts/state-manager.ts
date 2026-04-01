import {
  calculateFromApartmentPrice,
  calculateFromMortgage,
  type EquityInputs,
  type PurchaseInputs,
  type CalculationResult,
} from './calculator';

export type CalculationMode = 'FROM_APARTMENT_PRICE' | 'FROM_MORTGAGE';

export interface SavingsItem {
  id: string;
  name: string;
  amount: number;
}

export interface State {
  // Part 1: Equity inputs
  currentApartmentValue: number;
  studyFundAmount: number;
  studyFundLoan: boolean;
  otherSavings: number; // Computed total, kept for backward compatibility
  otherSavingsList: SavingsItem[]; // Detailed list
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
  private mortgageManuallySet = false; // Track if user manually set mortgage
  private loadedFromUrl = false; // Track if loaded from URL params

  constructor() {
    // Default state
    const defaultState: State = {
      currentApartmentValue: 0,
      studyFundAmount: 0,
      studyFundLoan: false,
      otherSavings: 0,
      otherSavingsList: [],
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
    const loadedState = this.loadFromUrlParams();
    if (loadedState) {
      this.state = loadedState;
      this.loadedFromUrl = true;
      // Don't mark mortgage as manually set - allow it to auto-sync
      this.mortgageManuallySet = false;
      // Ensure otherSavingsList exists
      if (!this.state.otherSavingsList) {
        this.state.otherSavingsList = [];
      }
    } else {
      this.state = this.loadFromStorage() || defaultState;
      this.loadedFromUrl = false;
      // Ensure otherSavingsList exists (for backward compatibility)
      if (!this.state.otherSavingsList) {
        this.state.otherSavingsList = [];
      }
    }
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

      const otherSavingsTotal = Number(params.get('os')) || 0;

      // Load savings list from URL params (osn0, osa0, osn1, osa1, etc.)
      const otherSavingsList: SavingsItem[] = [];
      let index = 0;
      while (params.has(`osn${index}`) || params.has(`osa${index}`)) {
        const name = params.get(`osn${index}`) || '';
        const amountStr = params.get(`osa${index}`) || '';

        // Extract only numbers from the string (handles cases where text is appended)
        const numericOnly = amountStr.replace(/[^\d.]/g, '');
        const amount = Number(numericOnly) || 0;

        otherSavingsList.push({
          id: 'url-load-' + index + '-' + Date.now(),
          name,
          amount
        });

        index++;
      }

      // If no detailed list in URL but there's a total, create a placeholder
      if (otherSavingsList.length === 0 && otherSavingsTotal > 0) {
        otherSavingsList.push({
          id: 'url-load-' + Date.now(),
          name: 'חסכונות (מקישור)',
          amount: otherSavingsTotal
        });
      }

      const state: Partial<State> = {
        currentApartmentValue: Number(params.get('cav')) || 0,
        studyFundAmount: Number(params.get('sfa')) || 0,
        studyFundLoan: params.get('sfl') === '1',
        otherSavings: otherSavingsTotal,
        otherSavingsList,
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
        // Ensure otherSavingsList exists (for backward compatibility)
        if (!parsed.otherSavingsList) {
          parsed.otherSavingsList = [];
        }
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
    // Don't save to localStorage if we just loaded from URL (until user makes a change)
    if (this.loadedFromUrl) {
      return;
    }

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
      otherSavingsList: [],
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

    // Reset flags
    this.mortgageManuallySet = false;
    this.loadedFromUrl = false;

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
   * Add a new savings item
   */
  addSavingsItem(name: string = '', amount: number = 0): string {
    if (this.isUpdating) return '';

    this.isUpdating = true;

    // First user change after URL load - clear the flag
    if (this.loadedFromUrl) {
      this.loadedFromUrl = false;
    }

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newItem: SavingsItem = { id, name, amount };

    this.state.otherSavingsList.push(newItem);
    this.updateOtherSavingsTotalInternal();

    this.isUpdating = false;

    return id;
  }

  /**
   * Update a savings item
   */
  updateSavingsItem(id: string, name: string, amount: number): void {
    if (this.isUpdating) return;

    this.isUpdating = true;

    // First user change after URL load - clear the flag
    if (this.loadedFromUrl) {
      this.loadedFromUrl = false;
    }

    const item = this.state.otherSavingsList.find(item => item.id === id);
    if (item) {
      item.name = name;
      item.amount = amount;
      this.updateOtherSavingsTotalInternal();
    }

    this.isUpdating = false;
  }

  /**
   * Remove a savings item
   */
  removeSavingsItem(id: string): void {
    if (this.isUpdating) return;

    this.isUpdating = true;

    // First user change after URL load - clear the flag
    if (this.loadedFromUrl) {
      this.loadedFromUrl = false;
    }

    this.state.otherSavingsList = this.state.otherSavingsList.filter(item => item.id !== id);
    this.updateOtherSavingsTotalInternal();

    this.isUpdating = false;
  }

  /**
   * Update the total other savings from the list (internal use)
   */
  private updateOtherSavingsTotalInternal(): void {
    this.state.otherSavings = this.state.otherSavingsList.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    // Recalculate
    this.recalculate();

    // If mortgage hasn't been manually set, update it to the required amount
    if (!this.mortgageManuallySet && this.state.results) {
      const oldMortgage = this.state.mortgageAmount;
      const newMortgage = this.state.results.mortgage;

      if (Math.abs(oldMortgage - newMortgage) > 0.01) {
        this.state.mortgageAmount = newMortgage;
        this.recalculate();
      }
    }

    // Notify and save
    this.notify();
    this.saveToStorage();
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

    // First user change after URL load - clear the flag so we start saving to localStorage
    if (this.loadedFromUrl) {
      this.loadedFromUrl = false;
    }

    // Update the field
    (this.state as any)[field] = value;

    // Track if user manually set mortgage amount
    if (field === 'mortgageAmount') {
      this.mortgageManuallySet = true;
    }

    // Always calculate from apartment price (no bidirectional mode)
    this.state.mode = 'FROM_APARTMENT_PRICE';

    // Recalculate
    this.recalculate();

    // If user changed something other than mortgage AND hasn't manually set mortgage,
    // update mortgage to required amount and recalculate again
    if (field !== 'mortgageAmount' && !this.mortgageManuallySet && this.state.results) {
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

    // Save to localStorage (only if not loaded from URL, or after first change)
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

    // Add savings list items
    this.state.otherSavingsList.forEach((item, index) => {
      params.set(`osn${index}`, item.name);
      params.set(`osa${index}`, String(item.amount));
    });

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  }
}
