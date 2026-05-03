import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const formFields = {
  step1: {
    title: 'Personal Details',
    fields: [
      { id: 'full_name', label: 'Full Name', type: 'text', required: true, autofillKey: 'name' },
      { id: 'dob', label: 'Date of Birth', type: 'date', required: true, autofillKey: 'dob' },
      { id: 'aadhaar', label: 'Aadhaar Number', type: 'text', required: true, autofillKey: 'aadhaar' },
      { id: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'Other'] }
    ]
  },
  step2: {
    title: 'Address Details',
    fields: [
      { id: 'address', label: 'Street Address', type: 'textarea', required: true, autofillKey: 'address' },
      { id: 'state', label: 'State', type: 'text', required: true },
      { id: 'district', label: 'District', type: 'text', required: true },
      { id: 'pincode', label: 'Pincode', type: 'text', required: true }
    ]
  },
  step3: {
    title: 'Financial Details',
    fields: [
      { id: 'income', label: 'Annual Income (₹)', type: 'number', required: true, autofillKey: 'income' },
      { id: 'bank_account', label: 'Bank Account Number', type: 'text', required: true, autofillKey: 'bank_account' },
      { id: 'ifsc', label: 'IFSC Code', type: 'text', required: true, autofillKey: 'ifsc' }
    ]
  }
}

export default function Apply() {
  const router = useRouter()
  const { schemeId } = router.query
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState({})
  const [missingFields, setMissingFields] = useState({})
  const [autofilledFields, setAutofilledFields] = useState(new Set())

  // Autofill logic on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.userData) {
      const userData = window.userData
      const newFormData = { ...formData }
      const newAutofilledFields = new Set()

      // Auto-fill all steps
      Object.keys(formFields).forEach(stepKey => {
        formFields[stepKey].fields.forEach(field => {
          if (field.autofillKey && userData[field.autofillKey]) {
            newFormData[field.id] = userData[field.autofillKey]
            newAutofilledFields.add(field.id)
          }
        })
      })

      setFormData(newFormData)
      setAutofilledFields(newAutofilledFields)
    }
  }, [])

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
      <div className="card accent-border-left" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1.75rem' }}>
          <span style={{ fontSize: '2rem' }}>
            {currentStep === 1 && '👤'}
            {currentStep === 2 && '📍'}
            {currentStep === 3 && '💰'}
          </span>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary-blue-dark)', marginBottom: '0.25rem' }}>{step.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Step {currentStep} of 4</p>
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
    <div className="page-bg">
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <div className="header-nav-logo" style={{ cursor: 'pointer' }}>🏛️ Apply Now</div>
          </Link>
        </div>
      </header>

      {/* Page Hero */}
      <section className="page-hero">
        <div className="hero-icon">📝</div>
        <h1>Welfare Scheme Application</h1>
        <p>Complete your application in 3 easy steps</p>
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
      <section className="page-footer">
        <p style={{ color: 'var(--primary-blue-dark)', marginBottom: '0.5rem' }}>💾 Your data is automatically saved at each step</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Need help? Contact support at 1-800-WELFARE</p>
      </section>
    </div>
  )
}
