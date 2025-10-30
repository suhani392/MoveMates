# How to Add Your QR Code (100% FREE!)

## ✅ No Firebase Storage Needed - Store Locally!

Your QR code will be stored **inside your app** - completely FREE, no hosting costs!

---

## Step-by-Step Guide

### **Step 1: Get Your QR Code Screenshot**

#### **Option A: From PhonePe**
1. Open PhonePe app
2. Tap your profile picture (top left)
3. Tap "My QR Code"
4. Take screenshot
5. Crop to just the QR code (square)
6. Save as: `movemates-qr.png`

#### **Option B: From Google Pay**
1. Open Google Pay app
2. Tap your profile picture
3. Tap "QR Code"
4. Take screenshot
5. Crop to just the QR code
6. Save as: `movemates-qr.png`

#### **Option C: Generate Online**
1. Go to: https://www.qr-code-generator.com/
2. Select "Text"
3. Enter: `upi://pay?pa=sahilpranjale2005@oksbi&pn=MoveMates`
4. Download QR code
5. Save as: `movemates-qr.png`

---

### **Step 2: Add QR to Your Project**

#### **Where to Put It:**
```
e:\MoveMates\
├── assets\
│   └── images\
│       └── movemates-qr.png  ← PUT YOUR QR HERE!
├── screens\
├── services\
└── ...
```

#### **How to Add:**

**Method 1: Copy via File Explorer**
1. Open File Explorer
2. Navigate to: `e:\MoveMates\assets\images\`
3. Copy your `movemates-qr.png` file there

**Method 2: Copy via Command**
```powershell
# If your QR is on Desktop:
copy "C:\Users\YourName\Desktop\movemates-qr.png" "e:\MoveMates\assets\images\"
```

---

### **Step 3: Verify It's There**

Check the file exists:
```
e:\MoveMates\assets\images\movemates-qr.png
```

File should be:
- ✅ PNG format
- ✅ Square (recommended: 500x500 or 1000x1000)
- ✅ Clear and scannable
- ✅ Named exactly: `movemates-qr.png`

---

## That's It! ✅

### **The code is already updated to use:**
```typescript
const STATIC_QR_IMAGE = require('../assets/images/movemates-qr.png');
```

### **No hosting needed!**
- ❌ No Firebase Storage costs
- ❌ No Imgur
- ❌ No external URLs
- ✅ Image bundled with your app
- ✅ Works offline
- ✅ Completely FREE!

---

## Testing

### **After adding your QR:**

1. **Run the app:**
   ```bash
   npx expo start
   ```

2. **Complete a walk as walker**

3. **Check payment screen shows:**
   - Your QR code image
   - UPI ID below it
   - "Payment Received" button

4. **Test scanning:**
   - Have someone scan the QR with PhonePe/GPay
   - Verify it opens payment to: sahilpranjale2005@oksbi
   - Verify amount can be entered

---

## Troubleshooting

### **If QR doesn't show:**

1. **Check file name is exact:**
   ```
   movemates-qr.png  ✅
   MoveMates-QR.png  ❌ (wrong case)
   movemates-qr.jpg  ❌ (wrong format)
   qr-code.png       ❌ (wrong name)
   ```

2. **Check file location:**
   ```
   e:\MoveMates\assets\images\movemates-qr.png  ✅
   e:\MoveMates\assets\movemates-qr.png         ❌
   e:\MoveMates\images\movemates-qr.png         ❌
   ```

3. **Restart Expo:**
   ```bash
   # Stop the server (Ctrl+C)
   # Clear cache and restart:
   npx expo start --clear
   ```

### **If QR is blurry:**

Use a higher resolution image:
- Minimum: 500x500 pixels
- Recommended: 1000x1000 pixels
- Maximum: 2000x2000 pixels

---

## Alternative: Generate QR in Code (No Image Needed!)

If you don't want to use an image, you can generate the QR dynamically:

### **Option: Use react-native-qrcode-svg (Already installed!)**

Replace the Image component with:

```typescript
// Instead of Image, use QRCode component
<QRCode
  value={`upi://pay?pa=${pricingConfig?.platformVpa}&pn=MoveMates`}
  size={250}
  backgroundColor="white"
  color="black"
/>
```

**Pros:**
- ✅ No image file needed
- ✅ Always up-to-date
- ✅ Can change UPI ID dynamically

**Cons:**
- ❌ Can't customize QR design
- ❌ Basic black & white only

---

## Recommendation

### **Use Local Image (Current Implementation):**

**Why:**
- ✅ Can use branded QR (PhonePe/GPay logo)
- ✅ Can customize colors
- ✅ Professional look
- ✅ Completely FREE
- ✅ No internet needed

**Just add your QR image to:**
```
e:\MoveMates\assets\images\movemates-qr.png
```

**And you're done!** 🎉

---

## Summary

### **What You Need:**
1. ✅ Screenshot your PhonePe/GPay QR code
2. ✅ Save as: `movemates-qr.png`
3. ✅ Copy to: `e:\MoveMates\assets\images\`
4. ✅ Test the app

### **Cost:**
- ✅ **₹0** (Completely FREE!)

### **Time:**
- ✅ **2 minutes**

### **Result:**
- ✅ Walker shows QR on screen
- ✅ Wanderer scans and pays
- ✅ No ₹2k limit
- ✅ No errors
- ✅ Simple and reliable!
