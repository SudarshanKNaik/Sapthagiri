# SAHAYAK AI — Scholarship Navigator (Hackathon)

AI-first scholarship assistant for low-digital-literacy users (India-first UX).

## Prerequisites
- Node.js 18+ recommended

## Run (2 terminals)

### Backend

```powershell
cd backend
# Optional (Twilio): copy env vars in your terminal before starting
# $env:TWILIO_ACCOUNT_SID="..."
# $env:TWILIO_AUTH_TOKEN="..."
# $env:TWILIO_FROM_NUMBER="+1xxxxxxxxxx"

npm run dev
```

Backend runs on `http://localhost:3001`.

### Frontend

```powershell
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Notes
- OCR runs locally on the backend using `tesseract.js`.
- Privacy-first behavior: uploaded images are deleted after OCR unless **Reuse** is enabled.
- Eligibility rules are in `data/karnataka_scholarships.json` (3 Karnataka schemes).
