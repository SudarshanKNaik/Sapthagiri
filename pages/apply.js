import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const formFields = {
  step1: {
    title: 'Personal Details',
    fields: [
      { id: 'full_name', label: 'Full Name', type: 'text', required: true, autofillKey: 'name' },
      { id: 'dob', label: 'DOB', type: 'text', required: true, autofillKey: 'dob' },
      { id: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, autofillKey: 'aadhaar' },
      { id: 'gender', label: 'Gender', type: 'text', required: true, autofillKey: 'gender' }
    ]
  },
  step2: {
    title: 'Address Details',
    fields: [
      { id: 'state', label: 'State', type: 'text', required: true, autofillKey: 'state' },
      { id: 'pincode', label: 'Pincode', type: 'text', required: true, autofillKey: 'pincode' }
    ]
  },
  step3: {
    title: 'Financial Details',
    fields: [
      { id: 'income', label: 'Annual Income (₹)', type: 'text', required: true, autofillKey: 'income' },
      { id: 'bank_account', label: 'Bank Account Number', type: 'text', required: true, autofillKey: 'accountNumber' },
      { id: 'ifsc', label: 'IFSC Code', type: 'text', required: true, autofillKey: 'ifsc' }
    ]
  }
}

export default function Apply() {
  const router = useRouter()
  const { schemeId } = router.query
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({ state: 'Karnataka' })
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [missingFields, setMissingFields] = useState({})
  const [autofilledFields, setAutofilledFields] = useState(new Set(['state']))

  // Autofill logic on component mount
  useEffect(() => {
    // 1. Initial check (if injected directly)
    if (typeof window !== 'undefined' && window.userData) {
      applyUserData(window.userData)
    }

    // 2. Listen for postMessage from parent iframe
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'AUTOFILL_DATA') {
        applyUserData(event.data.payload)
      }
    }
    window.addEventListener('message', handleMessage)
    
    // 3. Notify parent that iframe is ready to receive data
    if (window.parent) {
      window.parent.postMessage({ type: 'IFRAME_READY' }, '*')
    }

    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Initialize Voice Assistant
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('sahayak-voice-assist')) return;

    const btn = document.createElement('button');
    btn.id = 'sahayak-voice-assist';
    btn.title = 'Sahayak Voice Assistant';
    btn.style.position = 'fixed';
    btn.style.left = '16px';
    btn.style.bottom = '16px';
    btn.style.zIndex = '2147483647';
    btn.style.width = '56px';
    btn.style.height = '56px';
    btn.style.borderRadius = '28px';
    btn.style.background = '#0ea5a4';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '24px';
    btn.textContent = '🎤';
    document.body.appendChild(btn);

    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      btn.title = 'SpeechRecognition not supported';
      return;
    }

    const recog = new Speech();
    recog.lang = 'en-IN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;

    let listening = false;
    btn.addEventListener('click', () => {
      if (!listening) { 
        recog.start(); 
        listening = true; 
        btn.style.background = '#059669'; 
      } else { 
        recog.stop(); 
        listening = false; 
        btn.style.background = '#0ea5a4'; 
      }
    });

    recog.addEventListener('result', (ev) => {
      const text = (ev.results && ev.results[0] && ev.results[0][0] && ev.results[0][0].transcript) || '';
      console.log('sahayak: voice heard', text);
      const t = String(text).trim().toLowerCase();
      
      // Voice Commands Logic
      if (t.includes('fill')) {
        const m = t.match(/fill\s+(.+?)\s+(?:with\s+)?(.+)/i);
        if (m) {
           const field = m[1].trim();
           const val = m[2].trim();
           const inputs = Array.from(document.querySelectorAll('input, select'));
           const target = inputs.find(i => 
             i.id.toLowerCase().includes(field) || 
             (i.labels && i.labels[0] && i.labels[0].innerText.toLowerCase().includes(field))
           );
           if (target) {
              target.focus();
              target.value = val;
              target.dispatchEvent(new Event('input', { bubbles: true }));
              target.dispatchEvent(new Event('change', { bubbles: true }));
           }
        }
      } else if (t.includes('next')) {
         const btns = Array.from(document.querySelectorAll('button'));
         const nextBtn = btns.find(b => b.innerText.toLowerCase().includes('next'));
         if (nextBtn) nextBtn.click();
      } else if (t.includes('submit')) {
         const btns = Array.from(document.querySelectorAll('button'));
         const submitBtn = btns.find(b => b.innerText.toLowerCase().includes('submit'));
         if (submitBtn) submitBtn.click();
      } else if (t.includes('back') || t.includes('previous')) {
         const btns = Array.from(document.querySelectorAll('button'));
         const prevBtn = btns.find(b => b.innerText.toLowerCase().includes('back') || b.innerText.toLowerCase().includes('previous'));
         if (prevBtn) prevBtn.click();
      }
    });

    recog.addEventListener('end', () => { 
      listening = false; 
      btn.style.background = '#0ea5a4'; 
    });

    return () => {
      if (btn.parentNode) btn.parentNode.removeChild(btn);
    };
  }, []);

  const applyUserData = (userData) => {
    const newFormData = { ...formData }
    const newAutofilledFields = new Set()

    // Auto-fill all steps
    Object.keys(formFields).forEach(stepKey => {
      formFields[stepKey].fields.forEach(field => {
        if (field.autofillKey && userData[field.autofillKey] !== undefined && userData[field.autofillKey] !== null) {
          newFormData[field.id] = String(userData[field.autofillKey])
          newAutofilledFields.add(field.id)
        }
      })
    })

    setFormData(prev => {
      const updated = { ...prev, ...newFormData };
      console.log('Form data updated:', updated);
      return updated;
    })
    setAutofilledFields(prev => {
      const next = new Set(prev)
      newAutofilledFields.forEach(f => next.add(f))
      return next
    })
  }

  // Validate current step
  const validateStep = (step) => {
    const fields = formFields[`step${step}`].fields
    const missing = {}

    fields.forEach(field => {
      if (field.required && !formData[field.id]) {
        missing[field.id] = true
      }
    })

    return missing
  }

  // Handle step navigation
  const handleNextStep = () => {
    const missing = validateStep(currentStep)
    if (Object.keys(missing).length > 0) {
      setMissingFields(missing)
      return
    }
    setMissingFields({})
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setMissingFields({})
    setCurrentStep(currentStep - 1)
  }

  // Handle input change
  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    // Remove from missing when user fills it
    if (missingFields[fieldId]) {
      setMissingFields(prev => {
        const updated = { ...prev }
        delete updated[fieldId]
        return updated
      })
    }
  }

  // Handle file upload
  const handleFileUpload = (fieldId, file) => {
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [fieldId]: file.name
      }))
      if (missingFields[fieldId]) {
        setMissingFields(prev => {
          const updated = { ...prev }
          delete updated[fieldId]
          return updated
        })
      }
    }
  }

  // Handle Review & Submit
  const handleReviewSubmit = () => {
    const missing = validateStep(3)
    if (Object.keys(missing).length > 0) {
      setMissingFields(missing)
      return
    }
    // Navigate to review page with all data
    const allData = {
      formData,
      uploadedFiles,
      schemeId
    }
    localStorage.setItem('applicationData', JSON.stringify(allData))
    router.push('/review')
  }

  const renderStepContent = () => {
    const stepKey = `step${currentStep}`
    const step = formFields[stepKey]

    return (
      <div className="card" style={{ borderRadius: '10px', borderLeft: '4px solid #1e60d4', marginBottom: '2rem' }}>
        <div className="card-header" style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2rem' }}>
            {currentStep === 1 && '👤'}
            {currentStep === 2 && '📍'}
            {currentStep === 3 && '💰'}
          </span>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: '#0b3d91', marginBottom: '0.25rem' }}>{step.title}</h2>
            <p style={{ color: '#555555', fontSize: '0.9rem' }}>Step {currentStep} of 4</p>
          </div>
        </div>
        <div className="form-row">
          {step.fields.map(field => (
            <div key={field.id} className="form-group">
              <label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>

              {field.type === 'text' && (
                <input
                  id={field.id}
                  type="text"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={missingFields[field.id] ? 'missing-field' : autofilledFields.has(field.id) ? 'autofilled-field' : ''}
                />
              )}

              {field.type === 'number' && (
                <input
                  id={field.id}
                  type="number"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={missingFields[field.id] ? 'missing-field' : autofilledFields.has(field.id) ? 'autofilled-field' : ''}
                />
              )}

              {field.type === 'date' && (
                <input
                  id={field.id}
                  type="date"
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={missingFields[field.id] ? 'missing-field' : autofilledFields.has(field.id) ? 'autofilled-field' : ''}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  rows="4"
                  className={missingFields[field.id] ? 'missing-field' : autofilledFields.has(field.id) ? 'autofilled-field' : ''}
                />
              )}

              {field.type === 'select' && (
                <select
                  id={field.id}
                  value={formData[field.id] || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className={missingFields[field.id] ? 'missing-field' : autofilledFields.has(field.id) ? 'autofilled-field' : ''}
                >
                  <option value="">Select {field.label}</option>
                  {field.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'file' && (
                <div>
                  <input
                    id={field.id}
                    type="file"
                    onChange={(e) => handleFileUpload(field.id, e.target.files?.[0])}
                    className={missingFields[field.id] ? 'missing-field' : ''}
                  />
                  {uploadedFiles[field.id] && (
                    <p className="autofilled-field-info">✓ {uploadedFiles[field.id]} uploaded</p>
                  )}
                </div>
              )}

              {missingFields[field.id] && (
                <div className="missing-indicator">⚠️ This field is required</div>
              )}

              {autofilledFields.has(field.id) && !missingFields[field.id] && (
                <div className="autofilled-field-info">✓ Auto-filled from your data</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="header-nav-logo" style={{ cursor: 'pointer' }}>🏛️ Apply Now</div>
          </Link>
        </div>
      </header>

      {/* Page Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #0b3d91 0%, #1e60d4 100%)',
        color: 'white',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        borderBottom: '4px solid #e8f0fd'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝 Welfare Scheme Application</h1>
        <p style={{ opacity: 0.95, fontSize: '1rem' }}>Complete your application in 3 easy steps</p>
      </section>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        {/* Step Progress */}
        <div className="step-progress" style={{ marginBottom: '3rem' }}>
          {[1, 2, 3].map(step => (
            <div
              key={step}
              onClick={() => step <= currentStep && setCurrentStep(step)}
              className={`step-indicator ${step === currentStep ? 'active' : step < currentStep ? 'completed' : ''}`}
              style={{ cursor: step <= currentStep ? 'pointer' : 'default' }}
            >
              <div className="step-indicator-circle">
                {step < currentStep ? '✓' : step === currentStep ? '●' : step}
              </div>
              <div className="step-indicator-label">Step {step}</div>
              <div className="step-indicator-description">{['Personal', 'Address', 'Financial'][step - 1]}</div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '2.5rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            {currentStep > 1 && (
              <button
                onClick={handlePrevStep}
                className="btn btn-secondary"
                style={{ padding: '0.875rem 2rem' }}
              >
                ← Previous Step
              </button>
            )}
            
            {currentStep < 3 && (
              <button
                onClick={handleNextStep}
                className="btn btn-primary"
                style={{ padding: '0.875rem 2rem' }}
              >
                Next Step →
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                onClick={handleReviewSubmit}
                className="btn btn-success"
                style={{ padding: '0.875rem 2rem' }}
              >
                ✓ Review & Submit
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Info Footer */}
      <section style={{
        background: 'linear-gradient(135deg, #e8f0fd 0%, #f0f7ff 100%)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
        borderTop: '2px solid #e0e0e0'
      }}>
        <p style={{ color: '#0b3d91', marginBottom: '0.5rem' }}>💾 Your data is automatically saved at each step</p>
        <p style={{ color: '#555555', fontSize: '0.9rem' }}>Need help? Contact support at 1-800-WELFARE</p>
      </section>
    </div>
  )
}
