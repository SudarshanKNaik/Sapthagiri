# Technical Overview - Welfare Scheme Portal

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │           window.userData (JSON)                  │  │
│  │  {name, dob, aadhaar, address, income, ...}      │  │
│  └──────────────┬──────────────────────────────────┘  │
│                 │                                       │
│                 ▼                                       │
├─────────────────────────────────────────────────────────┤
│              Next.js Application (Client)               │
│                                                         │
│  Pages:                                                 │
│  • /login         - OTP authentication                │
│  • /dashboard     - Scheme listing                    │
│  • /scheme/[id]   - Scheme details                    │
│  • /apply         - 4-step form with autofill        │
│  • /review        - Data confirmation                │
│  • /submission    - Success page                     │
└─────────────────────────────────────────────────────────┘
        ▲                                      │
        │                                      │
        └──────── localStorage ────────────────┘
         (Form data, auth, app ID)
```

---

## 🔄 Application Flow

### 1. LOGIN FLOW
```
/login
  ↓
[Enter Mobile] → [Send OTP]
  ↓
[Enter OTP: 1234]
  ↓
✓ Verified → localStorage['isLoggedIn'] = 'true'
  ↓
/dashboard
```

**Code Location**: [`pages/login.js`](pages/login.js#L30-L40)

---

### 2. DASHBOARD FLOW
```
/dashboard
  ↓
[Display 5 Schemes]
  ↓
[Click View Details]
  ↓
/scheme/[id]
```

**Code Location**: [`pages/dashboard.js`](pages/dashboard.js#L50-L80)

---

### 3. SCHEME DETAILS FLOW
```
/scheme/[id]
  ↓
[Show Full Info]
  ↓
[Click Proceed to Apply]
  ↓
/apply?schemeId=[id]
```

**Code Location**: [`pages/scheme/[id].js`](pages/scheme/[id].js#L150-L160)

---

### 4. APPLICATION FORM FLOW (WITH AUTOFILL)

```
/apply?schemeId=[id]
  ↓
useEffect() → Check window.userData
  ↓
  ├─ If exists:
  │   ├─ Loop through formFields
  │   ├─ Check autofillKey property
  │   ├─ setFormData() with matched values
  │   └─ Add field IDs to autofilledFields Set
  │       (Mark with green background)
  │
  └─ If missing:
      └─ User fills manually
  ↓
Step 1: Personal Details (name, dob, aadhaar, gender)
  ↓
Step 2: Address Details (address, state, district, pincode)
  ↓
Step 3: Financial Details (income, bank_account, ifsc, occupation)
  ↓
Step 4: Document Upload (4 file inputs)
  ↓
[Review & Submit]
```

**Code Location**: [`pages/apply.js`](pages/apply.js#L59-L95)

---

## 🧠 Autofill Logic - Deep Dive

### How Autofill Works

The autofill mechanism is implemented in `/pages/apply.js`:

#### 1. Field Mapping Configuration (Lines 5-35)

```javascript
const formFields = {
  step1: {
    fields: [
      { 
        id: 'full_name',           // HTML field ID
        autofillKey: 'name'        // Matches window.userData.name
      },
      { 
        id: 'dob',
        autofillKey: 'dob'         // Matches window.userData.dob
      },
      // ... more fields
    ]
  }
}
```

**Key Property**: `autofillKey` - Maps HTML field to JSON property

#### 2. Auto-fill on Component Mount (Lines 76-95)

```javascript
useEffect(() => {
  if (typeof window !== 'undefined' && window.userData) {
    const userData = window.userData
    const newFormData = { ...formData }
    const newAutofilledFields = new Set()

    // Loop through ALL STEPS
    Object.keys(formFields).forEach(stepKey => {
      formFields[stepKey].fields.forEach(field => {
        // If field has autofillKey AND userData has this key
        if (field.autofillKey && userData[field.autofillKey]) {
          newFormData[field.id] = userData[field.autofillKey]
          newAutofilledFields.add(field.id)  // Track for green background
        }
      })
    })

    setFormData(newFormData)
    setAutofilledFields(newAutofilledFields)
  }
}, [])
```

#### 3. Visual Feedback - Green Background (Line 210)

```javascript
style={autofilledFields.has(field.id) ? { backgroundColor: '#ecfdf5' } : {}}
```

Green background + "✓ Auto-filled from your data" message

---

## ❌ Missing Field Detection

### How It Works

1. **Validation on Next Step** (Lines 110-120)

```javascript
const validateStep = (step) => {
  const fields = formFields[`step${step}`].fields
  const missing = {}

  fields.forEach(field => {
    if (field.required && !formData[field.id]) {
      missing[field.id] = true  // Mark as missing
    }
  })

  return missing
}
```

2. **Visual Indication** (CSS: Line in globals.css)

```css
.missing-field {
  border: 2px solid #dc2626 !important;  /* Red border */
  background-color: #fef2f2;              /* Light red bg */
}
```

3. **Error Message** (Line 260)

```javascript
{missingFields[field.id] && (
  <p className="missing-indicator">
    This field is missing. Please fill manually.
  </p>
)}
```

---

## 📊 Data Flow - From Form to Submission

### 1. Form Data Collection

**In Memory** (React state):
```javascript
formData = {
  full_name: "Ravi Kumar",
  dob: "1960-01-01",
  aadhaar: "123456789012",
  // ... all fields
}

uploadedFiles = {
  aadhaar_upload: "aadhaar.pdf",
  income_upload: "income-cert.pdf",
  // ... file names
}
```

### 2. Review Page

**Location**: `/pages/review.js`

Data retrieved from localStorage:
```javascript
const appData = localStorage.getItem('applicationData')
// {
//   formData: { ... },
//   uploadedFiles: { ... },
//   schemeId: 1
// }
```

### 3. Submission

**Location**: `/pages/submission.js`

Generate Application ID:
```javascript
const appId = 'APP' + Date.now()  // e.g., APP1625097234
localStorage.setItem('submittedAppId', appId)
```

---

## 🔐 Authentication System

### Simple OTP Validation

**Location**: `/pages/login.js` (Line 31)

```javascript
if (otp === '1234') {  // Test OTP
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('userMobile', mobile)
  router.push('/dashboard')
}
```

### Protected Routes

**Location**: `/pages/dashboard.js` (useEffect)

```javascript
useEffect(() => {
  const loggedIn = localStorage.getItem('isLoggedIn')
  if (!loggedIn) {
    router.push('/login')  // Redirect if not logged in
  }
}, [router])
```

---

## 📦 Form Field Types Supported

| Type | Component | Example |
|------|-----------|---------|
| `text` | `<input type="text" />` | Full Name, Address |
| `number` | `<input type="number" />` | Income, Pincode |
| `date` | `<input type="date" />` | Date of Birth |
| `textarea` | `<textarea></textarea>` | Address |
| `select` | `<select><option>` | Gender, Occupation |
| `file` | `<input type="file" />` | Document Upload |

**Code Location**: `/pages/apply.js` (Lines 160-200)

---

## 🎨 Styling System

### Tailwind CSS + Custom CSS

#### Global Styles
**File**: `/styles/globals.css`

Key classes:
- `.gov-header` - Government header with gradient
- `.missing-field` - Red border + light red background
- `.step-progress` - Step indicator bar
- `.step-indicator` - Individual step buttons

#### Responsive Grid
```javascript
// Dashboard scheme cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  // Responsive: 1 col on mobile, 2 on tablet, 3 on desktop
</div>
```

---

## 🔌 Integration Points

### External System → Portal

**Before Redirect:**
```javascript
// In your OCR/dashboard system
window.userData = {
  name: ocr_extracted_name,
  dob: ocr_extracted_dob,
  aadhaar: ocr_extracted_aadhaar,
  address: ocr_extracted_address,
  income: calculated_income,
  bank_account: extracted_account,
  ifsc: extracted_ifsc
}

// Then redirect
window.location.href = 'http://welfare-portal-url/login'
```

### Portal → External System

**After Submission:**
```javascript
// Your system can read from localStorage
const appData = JSON.parse(localStorage.getItem('applicationData'))
const appId = localStorage.getItem('submittedAppId')

// Send to backend/database
fetch('/api/submit-application', {
  method: 'POST',
  body: JSON.stringify({
    applicationId: appId,
    data: appData
  })
})
```

---

## 📝 localStorage Keys Used

| Key | Purpose | Example |
|-----|---------|---------|
| `isLoggedIn` | Authentication check | `'true'` |
| `userMobile` | Store user phone | `'9876543210'` |
| `applicationData` | Form data before submission | `{formData, uploadedFiles, schemeId}` |
| `submittedAppId` | Application ID after submission | `'APP1625097234'` |

---

## 🚀 Performance Optimizations

1. **Static Page Pre-rendering**: All pages are pre-rendered at build time
2. **Code Splitting**: Each page only loads necessary JavaScript
3. **Image Optimization**: Next.js handles image optimization
4. **CSS Optimization**: Tailwind CSS purges unused styles

**Build Stats:**
```
Total Bundle Size: ~101 KB per page
First Load JS: ~97-101 kB (shared)
Largest Page: /apply (2.22 KB)
```

---

## 🔍 Code Structure

```
welfare-scheme-portal/
├── pages/
│   ├── _app.js              # Next.js wrapper
│   ├── _document.js         # HTML template
│   ├── index.js             # Home redirect
│   ├── login.js             # OTP login (45 lines)
│   ├── dashboard.js         # Scheme listing (100 lines)
│   ├── scheme/
│   │   └── [id].js          # Scheme details (230 lines)
│   ├── apply.js             # Multi-step form (290 lines) ⭐
│   ├── review.js            # Review page (180 lines)
│   └── submission.js        # Success page (120 lines)
├── styles/
│   └── globals.css          # Tailwind + custom CSS
├── public/                  # Static assets (future)
└── [Config files]
```

---

## 🎯 Key Technical Decisions

### 1. **Why localStorage for State?**
- Simple client-side storage
- Persists across page reloads
- No backend required
- Perfect for form data preservation

### 2. **Why Tailwind CSS?**
- Rapid development
- Small production bundle
- Easy responsive design
- No CSS naming conflicts

### 3. **Why React Hooks?**
- `useState` for form state
- `useEffect` for autofill on mount
- `useRouter` for navigation
- Simpler than class components

### 4. **Why Pages Router?**
- Simpler file-based routing
- Better for straightforward flow
- Easier to understand for teams

---

## 🧪 Testing the Autofill Feature

### Verification Steps:

1. **Verify Field Mapping** (in browser console):
```javascript
// Check if userData is set
console.log(window.userData)

// Should have: name, dob, aadhaar, address, income, bank_account, ifsc
```

2. **Verify Form Population** (on apply page):
```javascript
// Check form inputs
console.log(document.getElementById('full_name').value)
// Should output: "Ravi Kumar" (if autofilled)
```

3. **Verify Green Background**:
- Autofilled fields show light green background: `#ecfdf5`
- Check element in DevTools → Inspect Element

4. **Verify autofilledFields Set**:
```javascript
// In React DevTools (need React DevTools extension)
// Inspect Apply component state
// autofilledFields should be a Set with field IDs
```

---

## 🚨 Common Implementation Mistakes to Avoid

1. ❌ **Setting userData AFTER navigation** → Must be set BEFORE redirect
2. ❌ **Using different field names** → Must match `autofillKey` exactly
3. ❌ **Clearing localStorage on page navigation** → We preserve it intentionally
4. ❌ **Making OTP validation complex** → Keep it simple for testing

---

## 📖 Documentation Files

- **README.md** - User guide and features overview
- **SETUP.md** - Complete testing workflow (THIS FILE)
- **TECHNICAL_OVERVIEW.md** - Architecture & implementation details (THIS FILE)

---

**End of Technical Overview**
