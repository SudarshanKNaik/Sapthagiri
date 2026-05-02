# Quick Reference Card - Welfare Scheme Portal

## 🚀 Start Server
```bash
npm run dev
# http://localhost:3000
```

## 🧪 Test Credentials
- **Test OTP**: `1234`
- **Mobile**: Any 10 digits

## ✨ Autofill Test
```javascript
window.userData = {
  name: "Ravi Kumar",
  dob: "1960-01-01",
  aadhaar: "123456789012",
  address: "Bangalore",
  income: "50000",
  bank_account: "123456789",
  ifsc: "SBIN0001234"
}
```

## 📍 Routes
| Path | Purpose |
|------|---------|
| `/` | Home (redirect) |
| `/login` | OTP login |
| `/dashboard` | Scheme listing |
| `/scheme/[id]` | Scheme details |
| `/apply` | Application form |
| `/review` | Review data |
| `/submission` | Success page |

## 🎯 Test Flow
1. `/login` → Enter OTP: 1234
2. `/dashboard` → Click scheme
3. `/scheme/1` → Click Apply
4. `/apply` → Fill form or use autofill
5. `/review` → Review data
6. `/submission` → Success!

## 📁 Key Files
- **Form**: `/pages/apply.js` (autofill logic)
- **Validation**: `/pages/apply.js` (lines 110-120)
- **Styling**: `/styles/globals.css`
- **Config**: `tailwind.config.js`, `next.config.js`

## 🔧 Commands
```bash
npm run dev     # Start dev server
npm run build   # Production build
npm start       # Start prod server
npm run lint    # Run linter
```

## 💾 localStorage Keys
- `isLoggedIn` - Auth status
- `userMobile` - User phone
- `applicationData` - Form data
- `submittedAppId` - Application ID

## 📚 Documentation
- **README.md** - Overview
- **SETUP.md** - Testing guide
- **TECHNICAL_OVERVIEW.md** - Architecture
- **INTEGRATION_GUIDE.md** - OCR integration
- **BUILD_COMPLETE.md** - Build summary

## ⚡ Quick Fixes
```bash
# Port in use?
npx kill-port 3000

# Cache issues?
rm -r .next

# Reinstall?
rm -r node_modules package-lock.json
npm install
```

## 🌐 Environment
- Node.js: Latest
- npm: Latest
- Browser: Chrome, Firefox, Safari (latest)
- Mobile: All responsive breakpoints supported

## ✅ Key Features
✓ OTP Auth | ✓ 5 Schemes | ✓ 4-Step Form | ✓ Autofill | ✓ Validation | ✓ Mobile Responsive

## 🎨 Colors
- **Primary**: Blue (#3b82f6)
- **Success**: Green (#10b981)
- **Error**: Red (#dc2626)
- **Auto-fill**: Light Green (#ecfdf5)

## 📊 Schemes
1. Old Age Pension (👴)
2. Farmer Subsidy (🌾)
3. Student Scholarship (📚)
4. Health Insurance (🏥)
5. Unemployment Assistance (💼)

## 🔐 Auth Flow
Mobile → OTP (1234) → localStorage['isLoggedIn'] = true → Dashboard

## 📤 Integration
1. Set `window.userData`
2. Redirect to `/login`
3. Form auto-fills
4. User completes & submits
5. Read from `localStorage['applicationData']`

---

**Version**: 1.0.0 | **Build**: 9/9 pages | **Status**: ✅ READY
