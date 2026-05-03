import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const schemes = {
  1: 'Old Age Pension',
  2: 'Farmer Subsidy',
  3: 'Student Scholarship',
  4: 'Health Insurance Scheme',
  5: 'Unemployment Assistance'
}

export default function Review() {
  const router = useRouter()
  const [appData, setAppData] = useState(null)
  const [scheme, setScheme] = useState('')

  useEffect(() => {
    const savedData = localStorage.getItem('applicationData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setAppData(data)
      setScheme(schemes[data.schemeId] || 'Unknown Scheme')
    } else {
      router.push('/dashboard')
    }
  }, [router])

  const handleConfirmSubmit = () => {
    const appId = 'APP' + Date.now()
    localStorage.setItem('submittedAppId', appId)
    localStorage.removeItem('applicationData')
    router.push('/submission')
  }

  if (!appData) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>
  }

  return (
    <div className="page-bg">
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Review Application</div>
        </div>
      </header>

      <section className="page-hero">
        <div className="hero-icon">✅</div>
        <h1>Review Your Application</h1>
        <p>Please verify all details before final submission</p>
      </section>

      {/* Content */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '2rem',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {/* Main Review Content */}
          <div>
            {/* Scheme Info */}
            <div className="review-section accent-border-left">
              <div className="review-section-title" style={{ fontSize: '1.1rem', color: 'var(--primary-blue-dark)' }}>
                <span>🎯</span> Selected Scheme
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--primary-blue-main)' }}>{scheme}</p>
            </div>

            {/* Personal Details */}
            <div className="review-section">
              <div className="review-section-title">
                <span>👤</span> Personal Details
              </div>
              <div className="review-item">
                <span className="review-label">Full Name</span>
                <span className="review-value">{appData.formData.full_name || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Date of Birth</span>
                <span className="review-value">{appData.formData.dob || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Aadhaar Number</span>
                <span className="review-value">{appData.formData.aadhaar || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Gender</span>
                <span className="review-value">{appData.formData.gender || '—'}</span>
              </div>
            </div>

            {/* Address Details */}
            <div className="review-section">
              <div className="review-section-title">
                <span>📍</span> Address Details
              </div>
              <div className="review-item">
                <span className="review-label">Address</span>
                <span className="review-value">{appData.formData.address || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">State</span>
                <span className="review-value">{appData.formData.state || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">District</span>
                <span className="review-value">{appData.formData.district || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Pincode</span>
                <span className="review-value">{appData.formData.pincode || '—'}</span>
              </div>
            </div>

            {/* Financial Details */}
            <div className="review-section">
              <div className="review-section-title">
                <span>💰</span> Financial Details
              </div>
              <div className="review-item">
                <span className="review-label">Annual Income</span>
                <span className="review-value">₹{appData.formData.income || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">Bank Account</span>
                <span className="review-value">{appData.formData.bank_account || '—'}</span>
              </div>
              <div className="review-item">
                <span className="review-label">IFSC Code</span>
                <span className="review-value">{appData.formData.ifsc || '—'}</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Summary */}
          <div className="sidebar">
            <div className="sidebar-item">
              <div className="sidebar-label">Application ID</div>
              <div className="sidebar-value" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                (Generated on Submit)
              </div>
            </div>

            <div className="divider"></div>

            <div className="sidebar-item">
              <div className="sidebar-label">Status</div>
              <div style={{ marginTop: '0.5rem' }}>
                <span className="badge badge-info">Ready to Submit</span>
              </div>
            </div>

            <div className="divider"></div>

            <div className="sidebar-item">
              <div className="sidebar-label">Next Step</div>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', marginTop: '0.5rem' }}>
                Click "Confirm & Submit" to proceed. Your application will be processed within 15-20 days.
              </p>
            </div>

            <div className="divider"></div>

            <button
              onClick={handleConfirmSubmit}
              className="btn-success"
              style={{ width: '100%' }}
            >
              ✓ Confirm & Submit
            </button>

            <button
              onClick={() => router.back()}
              className="btn-outline"
              style={{ width: '100%', marginTop: '0.75rem', borderColor: 'var(--primary-blue-main)', color: 'var(--primary-blue-main)' }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

           