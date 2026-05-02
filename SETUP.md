# Welfare Scheme Portal - Setup & Testing Guide

## ✅ Project Status

**Build Status**: ✓ SUCCESSFUL  
**Status**: Ready to Run  
**Framework**: Next.js 15.5.15 + React 19 + Tailwind CSS 3  
**All Pages Compiled**: 9/9 routes ✓

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start Development Server
```bash
npm run dev
```

**Output should show:**
```
> welfare-scheme-portal@1.0.0 dev
> next dev

  ▲ Next.js 15.5.15
  - Local:        http://localhost:3000
```

### Step 2: Open Browser
Navigate to: **http://localhost:3000**

---

## 🧪 Complete Testing Workflow

### Test 1: Login with OTP
1. **URL**: `http://localhost:3000/login`
2. **Enter Mobile**: `9876543210` (any 10 digits)
3. **Click**: "Send OTP"
4. **Enter OTP**: `1234` (test OTP)
5. **Expected**: Redirects to dashboard

---

### Test 2: Dashboard & Scheme Browsing
1. **Current Page**: Dashboard shows 5 schemes
2. **Available Schemes**:
   - 👴 Old Age Pension
   - 🌾 Farmer Subsidy
   - 📚 Student Scholarship
   - 🏥 Health Insurance Scheme
   - 💼 Unemployment Assistance
3. **Action**: Click "View Details" on any scheme
4. **Expected**: Navigate to scheme details page

---

### Test 3: Scheme Details Page
1. **URL**: `/scheme/[id]` (e.g., `/scheme/1`)
2. **Content Shown**:
   - Full description
   - Benefits list
   - Eligibility criteria
   - Required documents
   - "Proceed to Apply" button
3. **Action**: Click "Proceed to Apply"
4. **Expected**: Navigate to application form (Step 1)

---

### Test 4: Multi-Step Application Form (WITHOUT AUTOFILL)

#### Step 1: Personal Details
- **Full Name**: Enter any name (e.g., "John Doe")
- **Date of Birth**: Select any date
- **Aadhaar Number**: Enter 12 digits
- **Gender**: Select from dropdown
- **Click**: "Next →"

#### Step 2: Address Details
- **Street Address**: Enter any address
- **State**: Enter state name
- **District**: Enter district name
- **Pincode**: Enter 6 digits
- **Click**: "Next →"

#### Step 3: Financial Details
- **Annual Income**: Enter income amount
- **Bank Account**: Enter 10-12 digits
- **IFSC Code**: Enter IFSC (e.g., SBIN0001234)
- **Occupation**: Enter occupation
- **Click**: "Next →"

#### Step 4: Document Upload
- **Aadhaar Card**: Click to upload any file
- **Income Certificate**: Click to upload any file
- **Bank Passbook**: Click to upload any file
- **Click**: "Review & Submit"

**Expected**: All required fields filled, proceeds to review page

---

### Test 5: Autofill Feature (IMPORTANT!)

This is the KEY FEATURE - JSON-based autofill from external system.

#### How to Enable Autofill:

1. **Open browser DevTools**: Press `F12`
2. **Go to Console tab**
3. **Paste this code**:
```javascript
window.userData = {
  name: "Ravi Kumar",
  dob: "1960-01-01",
  aadhaar: "123456789012",
  address: "123 Main Street, Bangalore",
  income: "50000",
  bank_account: "123456789",
  ifsc: "SBIN0001234"
}
```
4. **Press Enter**
5. **Navigate to**: Dashboard → Select Scheme → Click Apply
6. **Expected**:
   - Personal Details auto-populate with green background
   - Income, Bank Account, IFSC auto-filled
   - Other fields remain empty (to be filled manually)

#### Test Missing Field Detection:

While on the form:
1. **Required fields marked with**: `*` red asterisk
2. **Leave a required field empty**
3. **Click**: "Next →"
4. **Expected**:
   - Unfilled required field shows **RED BORDER**
   - Message appears: "This field is missing. Please fill manually."
   - Form does NOT proceed to next step

---

### Test 6: Review Page

1. **Current Page**: After all 4 steps complete
2. **Content Shown**:
   - Scheme name
   - All entered personal details
   - Address details
   - Financial details
   - Uploaded document confirmations
   - Application summary sidebar
3. **Action**: Click "✓ Confirm & Submit"
4. **Expected**: Navigate to submission confirmation

---

### Test 7: Submission Confirmation

1. **URL**: `/submission`
2. **Content Shown**:
   - ✓ Success message
   - Application ID (e.g., `APP1625097234`)
   - Submission timestamp
   - Next steps (verification timeline)
   - How to track application
3. **Actions Available**:
   - 📥 Download Receipt
   - 🏠 Back to Dashboard
4. **Download Receipt**: Should download a text file with application details

---

### Test 8: Logout & Re-login

1. **From Dashboard**: Click "Logout" button
2. **Expected**: Redirects to login page
3. **localStorage data cleared**: 
   - `isLoggedIn` removed
   - `userMobile` removed
4. **Attempt** to access `/dashboard` directly
5. **Expected**: Redirects to login page (auth guard working)

---

## 🔌 Integration with External System

### Your OCR/Dashboard System Should:

1. **Extract user data** from documents using OCR
2. **Store in JSON object**:
```javascript
window.userData = {
  name: extractedName,
  dob: extractedDOB,
  aadhaar: extractedAadhaar,
  address: extractedAddress,
  income: extractedIncome,
  bank_account: extractedBankAcc,
  ifsc: extractedIFSC,
  // Optional:
  documents: {
    aadhaar: base64EncodedString,
    income: base64EncodedString
  }
}
```
3. **Set this before redirecting**:
```javascript
window.location.href = 'http://localhost:3000/login'
```

### After User Submits (Get Data Back):

```javascript
// From localStorage after submission
const appData = JSON.parse(localStorage.getItem('applicationData'))
console.log(appData)
// Returns: { formData: {...}, uploadedFiles: {...}, schemeId: 1 }

// Application ID
const appId = localStorage.getItem('submittedAppId')
console.log(appId) // APP1625097234
```

---

## 🧪 Quick Test Checklist

Run through these in order:

- [ ] Login page loads and OTP verification works
- [ ] Dashboard shows all 5 schemes
- [ ] Can view scheme details
- [ ] Can start application
- [ ] Can fill all 4 steps manually
- [ ] Missing field highlighting works (red border)
- [ ] Can upload documents
- [ ] Review page shows all data correctly
- [ ] Can submit application
- [ ] Application ID generated
- [ ] Can download receipt
- [ ] Can logout
- [ ] Auto-redirect to login on unauthorized access
- [ ] **AUTOFILL TEST**: Set window.userData and verify auto-population
- [ ] Autofilled fields have green background
- [ ] Can still edit autofilled fields
- [ ] Form validation still works with autofilled data

---

## 📱 Mobile Testing

The portal is fully responsive. Test on:
- Desktop (1920x1080)
- Tablet (768px)
- Mobile (375px)

**Command to test responsiveness:**
- Open DevTools (F12)
- Click Device Toolbar icon (Ctrl+Shift+M)
- Select device from dropdown

---

## 🐛 Troubleshooting

### Issue: Server not starting
```bash
# Kill any existing process
npx kill-port 3000
# Try again
npm run dev
```

### Issue: Changes not reflecting
```bash
# Clear Next.js cache
rm -r .next
npm run dev
```

### Issue: Autofill not working
1. **Check**: `window.userData` is set in console
2. **Check**: Reload the form page AFTER setting userData
3. **Verify**: Field names match exactly:
   - ✓ `name` → `full_name`
   - ✓ `dob` → `dob`
   - ✓ `aadhaar` → `aadhaar`
   - ✓ `income` → `income`
   - ✓ `bank_account` → `bank_account`
   - ✓ `ifsc` → `ifsc`

---

## 🔧 Development Commands

```bash
# Start development server (recommended for testing)
npm run dev

# Build production version
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 📁 Key Files for Integration

| File | Purpose |
|------|---------|
| `/pages/apply.js` | Autofill logic (lines 76-95) |
| `/pages/review.js` | Data review before submission |
| `/pages/submission.js` | Retrieve submitted data |
| `/styles/globals.css` | Missing field styling (red border) |

---

## ✨ Key Features Implemented

✅ **OTP Authentication** - Test OTP: 1234  
✅ **Scheme Listing** - 5 complete schemes with details  
✅ **4-Step Form** - Personal, Address, Financial, Documents  
✅ **Auto-fill from JSON** - window.userData integration  
✅ **Missing Field Detection** - Red highlighting  
✅ **Document Upload** - Multiple file upload simulation  
✅ **Review & Confirmation** - Full data preview  
✅ **Application ID** - Random ID generation  
✅ **Submission Receipt** - Download text receipt  
✅ **Mobile Responsive** - All breakpoints covered  
✅ **Form Validation** - Required field enforcement  

---

## 📊 Build Output

```
Route (pages)                      Size  First Load JS    
┌ ○ / (637 ms)                    436 B      97.2 kB
├   /_app                           0 B      96.7 kB
├ ○ /404                        2.28 kB        99 kB
├ ○ /apply (637 ms)             2.22 kB       101 kB
├ ○ /dashboard (641 ms)          1.5 kB       101 kB
├ ○ /login (638 ms)             1.19 kB      97.9 kB
├ ○ /review (637 ms)            1.68 kB      98.4 kB
├ ○ /scheme/[id] (636 ms)       2.37 kB       101 kB
└ ○ /submission (637 ms)        1.73 kB       101 kB
```

All pages compiled successfully ✓

---

## 🎯 Next Steps

1. **Start the dev server**: `npm run dev`
2. **Test each feature** in order (use checklist above)
3. **Integrate with your OCR system**:
   - Set `window.userData` before redirecting
   - Retrieve submitted data from localStorage
4. **Customize schemes** if needed (edit `/pages/dashboard.js`)
5. **Deploy** to production with `npm run build && npm start`

---

**Ready to go! Happy testing! 🚀**
