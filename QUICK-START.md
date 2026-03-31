# Quick Start Guide

## 🚀 The Application is Ready!

The development server is currently running at: **http://localhost:4321**

## What You Can Do Right Now

### 1. Test the Application
Open your browser and go to: http://localhost:4321

### 2. Try These Test Scenarios

#### Scenario A: Basic Purchase
1. Current apartment value: ₪2,000,000
2. Study fund: ₪500,000 (no loan)
3. Other savings: ₪200,000
4. Current mortgage: ₪800,000
5. Apartment price: ₪3,000,000
6. Expected equity: ₪1,900,000
7. Expected mortgage: ~₪1,266,338

#### Scenario B: With Study Fund Loan
1. Same as above, but check "לקיחת הלוואה (60%)"
2. Expected equity: ₪1,700,000 (only 60% of study fund counted)
3. Expected mortgage will be higher

#### Scenario C: Reverse Calculation
1. Set up equity (same as Scenario A)
2. Go to Part 3 and enter desired mortgage: ₪1,500,000
3. Watch the apartment price update automatically!
4. Expected price: ~₪3,217,643

### 3. Features to Test

- ✅ Type in any input field - results update instantly
- ✅ Toggle study fund loan checkbox
- ✅ Change brokerage fee percentage
- ✅ Edit apartment price - mortgage updates
- ✅ Edit mortgage amount - apartment price updates
- ✅ Watch the mode indicator change
- ✅ Check Hebrew formatting (₪ symbol, right-to-left)
- ✅ Try on mobile (responsive design)

## Commands Reference

```bash
# Development server (already running)
bun run dev

# Run calculation tests
bun run test-calculator.ts

# Build for production
bun run build

# Preview production build
bun run preview

# Stop dev server
# Press Ctrl+C in the terminal running the dev server
```

## Project Location

```
/Users/amit.shalev/code/temp/apartment-purchase-calc/
```

## Documentation Files

- `README.md` - Full documentation in Hebrew
- `IMPLEMENTATION.md` - Technical implementation details
- `QUICK-START.md` - This file

## Need to Change Something?

### Update Tax Brackets
Edit: `src/config/rates.ts`

### Modify Calculations
Edit: `src/scripts/calculator.ts`

### Change UI Layout
Edit: `src/pages/index.astro`

### Update Styling
Edit: `src/styles/calculator.css`

## Verification Checklist

Use this to verify everything works:

- [ ] Open http://localhost:4321 in browser
- [ ] Page loads with Hebrew interface
- [ ] All input fields are editable
- [ ] Enter current apartment value → equity updates
- [ ] Toggle study fund loan → equity updates
- [ ] Enter apartment price → all results update
- [ ] Brokerage fee shows correct calculation
- [ ] Purchase tax shows correct calculation
- [ ] Change mortgage amount → apartment price recalculates
- [ ] Mode indicator shows correct mode
- [ ] Summary section shows all values
- [ ] Numbers format as Hebrew currency (₪)
- [ ] Layout works on mobile (resize browser)

## Production Deployment (When Ready)

When you're satisfied with testing:

1. Stop the dev server (Ctrl+C)
2. Run `bun run build`
3. Test with `bun run preview`
4. Follow GitHub Pages deployment instructions in README.md

## Getting Help

- Run tests to verify calculations: `bun run test-calculator.ts`
- Check implementation details: `IMPLEMENTATION.md`
- Full documentation: `README.md`

---

**Status**: Development server running ✓
**URL**: http://localhost:4321
**All tests**: Passing ✓
