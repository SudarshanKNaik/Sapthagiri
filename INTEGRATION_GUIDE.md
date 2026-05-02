# Integration Guide - OCR Dashboard ↔ Welfare Portal

## Overview

This guide shows how to integrate your **OCR/Dashboard System** with the **Welfare Scheme Portal**.

The integration is **unidirectional but reversible**:
1. **OCR System → Portal**: Send extracted data via `window.userData`
2. **Portal → OCR System**: Retrieve submitted application from localStorage

---

## 🔄 Integration Flow

```
┌──────────────────────────┐
│  Your OCR/Dashboard      │
│  System                  │
│                          │
│ 1. Extract data from     │
│    document              │
│ 2. Set window.userData   │
│ 3. Redirect to portal    │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Welfare Portal          │
│                          │
│ 1. Read window.userData  │
│ 2. Auto-fill form        │
│ 3. User completes app    │
│ 4. Submit application    │
│ 5. Store in localStorage │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Back to Your System     │
│  (read localStorage)     │
│                          │
│ 1. Read applicationData  │
│ 2. Store in database     │
│ 3. Process application   │
└──────────────────────────┘
```

---

## 📤 Step 1: Send Data to Portal

### Your OCR System Code

```javascript
// Step 1: Perform OCR and extract data
const extractedData = performOCR(document_image)

// Step 2: Create userData object
window.userData = {
  name: extractedData.full_name,           // e.g., "Ravi Kumar"
  dob: extractedData.date_of_birth,        // e.g., "1960-01-15"
  aadhaar: extractedData.aadhaar_number,   // e.g., "123456789012"
  address: extractedData.address,          // e.g., "123 Main St, Bangalore"
  income: extractedData.annual_income,     // e.g., "50000"
  bank_account: extractedData.account_no,  // e.g., "123456789"
  ifsc: extractedData.ifsc_code            // e.g., "SBIN0001234"
}

// Step 3: Optional - Store documents as base64
window.userData.documents = {
  aadhaar: base64EncodeFile(document_files.aadhaar),
  income: base64EncodeFile(document_files.income),
  // ... more documents
}

// Step 4: Redirect to Welfare Portal
// Option A: Navigate (if same window)
window.location.href = 'http://localhost:3000/login'

// Option B: Open in new tab/window
window.open('http://localhost:3000/login', '_blank')

// Option C: In an iframe
document.getElementById('portal-iframe').src = 'http://localhost:3000/login'
```

### Expected `window.userData` Structure

```javascript
{
  name: "Ravi Kumar",                    // ✓ Auto-fills full_name
  dob: "1960-01-15",                     // ✓ Auto-fills dob
  aadhaar: "123456789012",               // ✓ Auto-fills aadhaar
  address: "123 Main Street, Bangalore", // ✓ Auto-fills address
  income: "50000",                       // ✓ Auto-fills income
  bank_account: "123456789",             // ✓ Auto-fills bank_account
  ifsc: "SBIN0001234",                   // ✓ Auto-fills ifsc
  
  // Optional document documents
  documents: {
    aadhaar: "base64string...",
    income: "base64string..."
  }
}
```

### Data Mapping Reference

| Your Field | OCR Property | Portal Field ID | Type |
|------------|--------------|-----------------|------|
| Full Name | `full_name` | `full_name` | text |
| Date of Birth | `date_of_birth` | `dob` | date |
| Aadhaar | `aadhaar_number` | `aadhaar` | text |
| Address | `address` | `address` | textarea |
| Income | `annual_income` | `income` | number |
| Bank Account | `account_no` | `bank_account` | text |
| IFSC Code | `ifsc_code` | `ifsc` | text |

---

## 📥 Step 2: Portal Auto-fills & User Completes

### What Happens in Portal

1. **User logs in** with OTP (test: 1234)
2. **Portal detects** `window.userData`
3. **Form auto-fills** with extracted data
4. **User reviews** auto-filled fields
5. **User fills remaining** fields (e.g., gender, state, district)
6. **User uploads documents** (simulated click in demo)
7. **User reviews** all data on review page
8. **User confirms** and submits

### Auto-filled vs Manual Fields

```
Step 1: Personal Details
├── Full Name             ✓ Auto-filled (from userData.name)
├── Date of Birth         ✓ Auto-filled (from userData.dob)
├── Aadhaar Number        ✓ Auto-filled (from userData.aadhaar)
└── Gender                ✗ Manual (not in OCR data)

Step 2: Address Details
├── Street Address        ✓ Auto-filled (from userData.address)
├── State                 ✗ Manual
├── District              ✗ Manual
└── Pincode               ✗ Manual

Step 3: Financial Details
├── Annual Income         ✓ Auto-filled (from userData.income)
├── Bank Account          ✓ Auto-filled (from userData.bank_account)
├── IFSC Code             ✓ Auto-filled (from userData.ifsc)
└── Occupation            ✗ Manual

Step 4: Document Upload
├── Aadhaar Card          ? Optional from userData.documents
├── Income Certificate    ? Optional from userData.documents
├── Mark Sheets           ✗ Manual
└── Bank Passbook         ✗ Manual
```

---

## 📤 Step 3: Read Submitted Application

### After User Submits

The portal stores submitted data in **localStorage**:

```javascript
// Application data (before submission confirmed)
const appData = JSON.parse(localStorage.getItem('applicationData'))
console.log(appData)

// Output:
// {
//   formData: {
//     full_name: "Ravi Kumar",
//     dob: "1960-01-15",
//     aadhaar: "123456789012",
//     gender: "Male",
//     address: "123 Main Street, Bangalore",
//     state: "Karnataka",
//     district: "Bengaluru",
//     pincode: "560001",
//     income: "50000",
//     bank_account: "123456789",
//     ifsc: "SBIN0001234",
//     occupation: "Retired"
//   },
//   uploadedFiles: {
//     aadhaar_upload: "aadhaar.pdf",
//     income_upload: "income-cert.pdf",
//     passbook_upload: "passbook.pdf"
//   },
//   schemeId: 1
// }

// Application ID (after submission)
const appId = localStorage.getItem('submittedAppId')
console.log(appId)
// Output: "APP1625097234"
```

### Getting Data Back to Your System

```javascript
// Method 1: In an iframe - Parent reads child iframe localStorage
function getPortalSubmission() {
  try {
    const iframe = document.getElementById('portal-iframe')
    const iframeWindow = iframe.contentWindow
    
    const appData = JSON.parse(
      iframeWindow.localStorage.getItem('applicationData')
    )
    const appId = iframeWindow.localStorage.getItem('submittedAppId')
    
    return { appData, appId }
  } catch (error) {
    console.log('Waiting for user to submit...')
  }
}

// Poll every second
setInterval(getPortalSubmission, 1000)
```

---

## 🔗 Implementation Example

### Complete End-to-End Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>OCR Dashboard - Integration Example</title>
</head>
<body>
  <button id="upload-btn">Upload Document</button>
  <div id="portal-container"></div>

  <script>
    // OCR System - Extract and send to portal
    document.getElementById('upload-btn').onclick = async () => {
      // Step 1: Simulate OCR extraction
      const extractedData = {
        full_name: "Ravi Kumar",
        date_of_birth: "1960-01-15",
        aadhaar_number: "123456789012",
        address: "123 Main Street, Bangalore",
        annual_income: "50000",
        account_no: "123456789",
        ifsc_code: "SBIN0001234"
      }

      // Step 2: Create iframe
      const iframe = document.createElement('iframe')
      iframe.id = 'welfare-portal'
      iframe.src = 'about:blank' // Start empty
      iframe.style.width = '100%'
      iframe.style.height = '100vh'
      iframe.style.border = 'none'
      document.getElementById('portal-container').appendChild(iframe)

      // Step 3: Wait for iframe to load, then set userData
      iframe.onload = () => {
        const iframeWindow = iframe.contentWindow
        
        // Set userData in iframe context
        iframeWindow.userData = {
          name: extractedData.full_name,
          dob: extractedData.date_of_birth,
          aadhaar: extractedData.aadhaar_number,
          address: extractedData.address,
          income: extractedData.annual_income,
          bank_account: extractedData.account_no,
          ifsc: extractedData.ifsc_code
        }

        // Navigate to portal
        iframeWindow.location.href = 'http://localhost:3000/login'
      }

      // Step 4: Poll for submission
      const pollInterval = setInterval(() => {
        try {
          const appId = iframe.contentWindow.localStorage
            .getItem('submittedAppId')
          
          if (appId) {
            const appData = JSON.parse(
              iframe.contentWindow.localStorage
                .getItem('applicationData')
            )

            console.log('User submitted!')
            console.log('Application ID:', appId)
            console.log('Form Data:', appData.formData)
            console.log('Uploaded Files:', appData.uploadedFiles)

            // TODO: Send to your backend
            submitToBackend(appId, appData)

            clearInterval(pollInterval)
          }
        } catch (error) {
          // Portal not ready yet
        }
      }, 1000)

      // Stop polling after 30 minutes
      setTimeout(() => clearInterval(pollInterval), 30 * 60 * 1000)
    }

    // Send to your backend
    async function submitToBackend(appId, appData) {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: appId,
          form_data: appData.formData,
          uploaded_files: appData.uploadedFiles,
          scheme_id: appData.schemeId
        })
      })
      
      alert('Application submitted! ID: ' + appId)
    }
  </script>
</body>
</html>
```

---

## 🔐 Cross-Origin Considerations

### If Portal is on Different Domain

```javascript
// IMPORTANT: Portal must be same origin OR use postMessage

// Option 1: Same domain (simpler)
// OCR System: http://localhost:3001
// Portal: http://localhost:3000
// ✓ Can read localStorage directly

// Option 2: Different domain (requires postMessage)
// OCR System: https://yourdomain.com
// Portal: https://welfare-portal.com
// ✗ Cannot read localStorage
// ✓ Use postMessage instead

// postMessage example:
iframe.contentWindow.postMessage({
  type: 'SET_USER_DATA',
  userData: {
    name: "Ravi Kumar",
    dob: "1960-01-15",
    // ...
  }
}, '*')

// In portal (pages/_app.js):
window.addEventListener('message', (event) => {
  if (event.data.type === 'SET_USER_DATA') {
    window.userData = event.data.userData
  }
})
```

---

## 🧪 Testing the Integration

### Step 1: Start Portal
```bash
cd welfare-scheme-portal
npm run dev
# Portal running at http://localhost:3000
```

### Step 2: Test Data Injection
```javascript
// In browser console of any page
window.userData = {
  name: "Test User",
  dob: "1980-05-15",
  aadhaar: "111111111111",
  address: "Test Address",
  income: "50000",
  bank_account: "9876543210",
  ifsc: "SBIN0002469"
}

// Navigate to apply page
window.location.href = '/apply?schemeId=1'
```

### Step 3: Verify Autofill
- Form fields should be populated
- Green background indicates autofilled fields
- Check DevTools → Inspect form inputs

### Step 4: Complete Application
- Fill remaining fields manually
- Upload documents
- Review and submit
- Check localStorage for results:
  ```javascript
  console.log(localStorage.getItem('submittedAppId'))
  console.log(localStorage.getItem('applicationData'))
  ```

---

## 📋 Integration Checklist

### Before Going Live

- [ ] Extract all required fields with OCR
- [ ] Map OCR fields to userData object keys
- [ ] Set window.userData before redirect
- [ ] Verify autofill works (green backgrounds)
- [ ] Handle missing OCR fields (mark for manual entry)
- [ ] Set up listener for submission in parent window
- [ ] Store submitted application in your database
- [ ] Send confirmation to user
- [ ] Handle errors (OCR failure, user abandonment)
- [ ] Test on production URL
- [ ] Test with real documents

---

## 🚨 Troubleshooting

### Issue: Autofill not working

**Check 1**: Is `window.userData` set?
```javascript
console.log(window.userData) // Should not be undefined
```

**Check 2**: Are field names correct?
```javascript
// Should use exact keys:
window.userData = {
  name: "...",      // ✓ NOT 'full_name'
  dob: "...",       // ✓ NOT 'date_of_birth'
  aadhaar: "...",   // ✓ NOT 'aadhaar_number'
  // ...
}
```

**Check 3**: Reload after setting
```javascript
window.userData = {...}
location.reload() // Reload so portal sees it
```

### Issue: Cannot read localStorage from iframe

**Solution**: Use same domain or postMessage
```javascript
// Same domain (simple):
iframe.src = 'http://localhost:3000'

// Different domain (complex):
// Use postMessage instead of localStorage
```

### Issue: Data lost after refresh

**Solution**: Data is preserved in localStorage intentionally
```javascript
// Data persists even after page reload
const saved = localStorage.getItem('applicationData')
console.log(saved) // Still there
```

---

## 📞 Support & Customization

### To Add New Fields

1. **Edit `/pages/apply.js`** - Add to formFields
2. **Add autofillKey** - If available in window.userData
3. **Update window.userData** structure in your OCR
4. **Test autofill** with new field

### To Modify Schemes

1. **Edit `/pages/dashboard.js`** - Scheme data
2. **Edit `/pages/scheme/[id].js`** - Scheme details

### To Customize Styling

1. **Edit `/styles/globals.css`** - Custom CSS
2. **Modify Tailwind classes** in components

---

## 🎯 Next Steps

1. **Implement data extraction** in your OCR system
2. **Create `window.userData` object** before redirect
3. **Test with sample data** using browser console
4. **Set up listener** for submitted applications
5. **Store in database** after submission
6. **Deploy to production** when ready

---

**Happy integrating! 🚀**
