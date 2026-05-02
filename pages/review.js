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
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Review Application</div>
        </div>
      </header>

      {/* Page Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '2.5rem 1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅ Review Your Application</h1>
        <p style={{ opacity: 0.95, fontSize: '1rem' }}>Please verify all details before final submission</p>
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
            <div className="review-section" style={{ background: 'linear-gradient(135deg, #e8f0fd 0%, #f0f7ff 100%)', borderLeft: '4px solid #1e60d4' }}>
              <div className="review-section-title" style={{ fontSize: '1.1rem', color: '#0b3d91' }}>
                <span>🎯</span> Selected Scheme
              </div>
              <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e60d4' }}>{scheme}</p>
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
              <div className="review-item">
                <span className="review-label">Occupation</span>
                <span className="review-value">{appData.formData.occupation || '—'}</span>
              </div>
            </div>

            {/* Documents */}
            <div className="review-section">
              <div className="review-section-title">
                <span>📄</span> Uploaded Documents
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {Object.entries(appData.uploadedFiles).map(([key, filename]) => (
                  <div key={key} style={{
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                    <span style={{ color: '#065f46', fontWeight: '500', fontSize: '0.9rem' }}>{filename}</span>
                  </div>
                ))}
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
              style={{ width: '100%', marginTop: '0.75rem', borderColor: '#3b82f6', color: '#3b82f6' }}
            >
              ← Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

           