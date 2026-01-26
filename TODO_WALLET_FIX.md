# Wallet Page Fix - TODO

## Task: Fix My Wallet table display with proper calculations and formatting

### Changes to be made:

1. [x] Fix P&L cell display - show amount and percentage with proper formatting
2. [x] Fix Summary Cards - add descriptive text below values
3. [x] Improve table formatting with better alignment and spacing
4. [x] Add Current Value column to table
5. [x] Test the implementation - Verified backend is running properly

### Completed Changes:
1. **P&L Cell Display:**
   - Shows profit/loss amount with + or - sign (e.g., +₹45.10 or -₹35.00)
   - Shows percentage on next line (e.g., +0.33% or -0.15%)
   - Green color for profit, red for loss

2. **Summary Cards:**
   - Added "Total portfolio value" text under Current Value
   - Added "Total amount invested" text under Invested Amount
   - Added "Profit" or "Loss" text under Returns
   - Fixed double display of profit/loss amount (now shows once with + sign)
   - Fixed percentage display to show absolute value with sign

3. **Table Improvements:**
   - Better alignment and spacing
   - Consistent number formatting with ₹ symbol
   - Clear visual hierarchy with proper colors

### Current Implementation Analysis:
- Total Value = Qty × Current Price ✓
- P&L = (Current Price - Buy Price) × Qty ✓
- P&L % = (P&L / Invested) × 100 ✓

### Example Output:
```
Stock          Qty   Buy Price   Current Price   Total Value   P&L
AXISBANK.NS    11    ₹1,253.90   ₹1,258.00      ₹13,838.00    +₹45.10
                                                    +0.33%
HINDUNILVR.NS  10    ₹2,406.00   ₹2,409.50      ₹24,095.00    +₹35.00
                                                    +0.15%

Summary:
Current Value: ₹48,926.20 (Total portfolio value)
Invested:      ₹48,782.50 (Total amount invested)
Profit/Loss:   +₹143.70
Returns:       +0.29% (Profit)
```

