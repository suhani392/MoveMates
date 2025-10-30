# Bank UPI Limit Issue - Complete Explanation

## The Real Problem

**Both "Pay via UPI App" button AND QR code show the same "Limit Exceeded" error because they use the SAME payment method (UPI) and hit the SAME bank limits.**

### Why Both Methods Fail:
```
User's Bank Account
    ↓
Daily UPI Limit: ₹X (set by bank)
    ↓
┌─────────────────────────────────────┐
│  Both methods hit this same limit:  │
│  • Pay via UPI App button           │
│  • QR Code scan                     │
└─────────────────────────────────────┘
```

## Technical Details

### What the App Does:
1. Generates UPI deeplink: `upi://pay?pa=sahilpranjale2005@oksbi&am=50.00...`
2. **"Pay via UPI App" button** → Opens PhonePe/GPay with this deeplink
3. **QR Code** → Contains the same deeplink, scanned by PhonePe/GPay

**Result**: Both methods send the exact same payment request to your bank.

### The Bank's Response:
When your bank receives the UPI payment request (from either method):
- ✅ If within limits → Payment succeeds
- ❌ If limit exceeded → "Limit Exceeded" error

## Why You're Seeing This Error

### Common Reasons:
1. **Daily limit reached**: You've already made UPI payments today totaling your limit
2. **Monthly limit reached**: Your cumulative monthly UPI transactions hit the cap
3. **Low KYC limits**: Minimum KYC accounts often have ₹5,000-₹10,000 daily limits
4. **New account**: Recently opened accounts may have temporary restrictions
5. **Bank security**: Your bank flagged something and temporarily reduced limits

### Example Scenario:
```
Your Bank: State Bank of India (SBI)
Account Type: Savings (Minimum KYC)
Daily UPI Limit: ₹10,000

Today's Transactions:
- Morning: ₹3,000 (grocery shopping)
- Afternoon: ₹5,000 (bill payment)
- Evening: ₹2,500 (online shopping)
Total: ₹10,500 → LIMIT EXCEEDED

Now trying to pay ₹50 for MoveMates walk:
Result: "Limit Exceeded" (even though it's just ₹50!)
```

## Solutions

### Immediate (Use Right Now):

#### Option 1: Cash Payment ✅ RECOMMENDED
```
In MoveMates app:
1. Go back to payment screen
2. Select "Pay Cash" instead of UPI
3. Pay walker directly in cash
4. Both confirm receipt
```

#### Option 2: Different Bank Account
```
1. Link a different bank account to PhonePe/GPay
2. Try payment again with that account
3. Each bank account has separate limits
```

#### Option 3: Ask Someone Else
```
1. Have a friend/family member pay via their UPI
2. Reimburse them in cash later
3. Their bank limits are separate from yours
```

### Long-term (Fix for Future):

#### Step 1: Check Your Current Limits
```
Open your bank app → Settings → UPI Settings
Look for:
- Daily Transaction Limit
- Per Transaction Limit  
- Monthly Transaction Limit
```

#### Step 2: Increase Limits
**Method A: Bank App/Internet Banking**
- Most banks allow limit modification online
- Look for "UPI Settings" or "Transaction Limits"
- Increase to maximum allowed

**Method B: Call Customer Care**
```
Call your bank's customer care:
"I need to increase my UPI transaction limits.
Current limit is ₹X, I need it increased to ₹Y."
```

**Method C: Visit Branch**
- Go to your bank branch with ID proof
- Request UPI limit increase
- Complete Full KYC if you haven't already

#### Step 3: Complete Full KYC
```
Minimum KYC → Daily limit: ₹5,000-₹10,000
Full KYC → Daily limit: ₹1,00,000 or more

To upgrade:
1. Visit bank branch with:
   - Aadhaar card
   - PAN card
   - Address proof
2. Request Full KYC upgrade
3. Limits increase automatically
```

## Common Bank Limits (India)

| Bank | Minimum KYC | Full KYC |
|------|-------------|----------|
| SBI | ₹10,000/day | ₹1,00,000/day |
| HDFC | ₹10,000/day | ₹1,00,000/day |
| ICICI | ₹10,000/day | ₹2,00,000/day |
| Axis | ₹10,000/day | ₹1,00,000/day |
| Paytm Payments Bank | ₹10,000/day | ₹1,00,000/day |

*Note: Limits vary by account type and bank policy*

## What MoveMates App Now Shows

### 1. Payment Modal Warning
When you open UPI payment, you'll see:
```
⚠️ Getting "Limit Exceeded"?
This is a bank limit, not an app issue.
Check your daily UPI limit or use Cash payment.
[Tap here for solutions →]
```

### 2. Alert After Opening UPI App
After clicking "Pay via UPI App", you'll see:
```
Payment Tips

If you see "Limit Exceeded" error:
• Your bank has daily/monthly UPI limits
• Contact your bank to increase limits
• Try a different bank account
• Use Cash payment option instead

Tap "Help" (?) for more info
```

### 3. Help Screen
Tap the (?) icon in payment screen for:
- Complete troubleshooting guide
- How to check your limits
- How to increase limits
- Alternative payment methods

## Important Notes

### This is NOT:
- ❌ A MoveMates app bug
- ❌ A PhonePe/GPay issue
- ❌ A problem with the QR code
- ❌ A problem with the UPI deeplink

### This IS:
- ✅ Your bank's security limit
- ✅ A restriction on your specific account
- ✅ Designed to protect you from fraud
- ✅ Adjustable by contacting your bank

## Quick Decision Tree

```
Getting "Limit Exceeded"?
    ↓
Need to pay RIGHT NOW?
    ↓
YES → Use Cash Payment in app
    ↓
NO → Check bank limits
    ↓
    Increase limits or wait 24 hours
```

## Contact Information

### For Bank Limit Issues:
- Contact YOUR bank's customer care
- Visit YOUR bank branch
- Use YOUR bank's app/internet banking

### For App Issues:
- Only contact MoveMates support if:
  - App crashes during payment
  - Payment succeeds but app doesn't recognize it
  - Cash payment confirmation doesn't work
  - Other technical app problems

**Remember**: "Limit Exceeded" is a bank message, not an app error!
