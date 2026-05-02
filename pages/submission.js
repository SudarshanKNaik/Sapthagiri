import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Submission() {
  const router = useRouter()
  const [appId, setAppId] = useState('')
  const [submissionTime, setSubmissionTime] = useState('')

  useEffect(() => {
    const id = localStorage.getItem('submittedAppId')
    if (id) {
      setAppId(id)
      setSubmissionTime(new Date().toLocaleString('en-IN'))
    } else {
      router.push('/dashboard')
    }
  }, [router])

  const handleDownloadReceipt = () => {
    const receipt = `
WELFARE SCHEME APPLICATION - SUBMISSION RECEIPT
================================================

Application ID: ${appId}
Submission Date: ${submissionTime}
Status: Successfully Submitted

Your application has been received and is under review.
Processing time: 7-10 working days

Please keep this receipt for future reference.
Application Status: Pending Review

For inquiries, contact:
Government Welfare Portal Support
Email: support@welfare.gov.in
Phone: 1800-GOV-HELP (1800-468-4357)
    `
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receipt))
    element.setAttribute('download', `Receipt_${appId}.txt`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Application Submitted</div>
        </div>
      </header>

      {/* Success Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '3rem 1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅ Success!</h1>
        <p style={{ opacity: 0.95, fontSize: '1rem' }}>Your application has been submitted successfully</p>
      </section>

      {/* Success Message */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="card" style={{
          maxWidth: '750px',
          margin: '0 auto',
          textAlign: 'center',
          borderRadius: '10px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Success Icon */}
          <div style={{
            fontSize: '4.5rem',
            marginBottom: '1.5rem',
            color: '#10b981'
          }}>
            ✓
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: '#0b3d91',
            marginBottom: '1.5rem'
          }}>
            Application Submitted!
          </h2>

          {/* Application ID Box */}
          <div className="alert alert-success" style={{
            background: '#f0fdf4',
            borderLeft: '4px solid #10b981',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: '600', marginBottom: '0.5rem' }}>
                YOUR APPLICATION ID
              </p>
              <p style={{
                fontSize: '1.625rem',
                fontWeight: '700',
                color: '#10b981',
                fontFamily: 'monospace',
                letterSpacing: '0.1em'
              }}>
                {appId}
              </p>
              <p style={{ fontSize: '0.85rem', color: '#047857', marginTop: '0.75rem' }}>
                📅 Submitted: {submissionTime}
              </p>
            </div>
          </div>

          {/* Status Information */}
          <div className="review-section" style={{
            background: 'linear-gradient(135deg, #e8f0fd 0%, #f0f7ff 100%)',
            borderLeft: '4px solid #1e60d4',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div className="review-section-title" style={{ fontSize: '1.1rem', color: '#0b3d91' }}>
              <span>📋</span> What Happens Next?
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { num: '1', text: 'Application received and verified (2-3 days)' },
                { num: '2', text: 'Document review process (5-7 days)' },
                { num: '3', text: 'Final approval and notification (7-10 days total)' },
                { num: '4', text: 'Benefits disbursed to your account' }
              ].map((step) => (
                <div key={step.num} style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid rgba(59, 130, 246, 0.2)'
                }}>
                  <div style={{
                    background: '#3b82f6',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    flexShrink: 0
                  }}>
                    {step.num}
                  </div>
                  <p style={{ color: '#1e40af', fontWeight: '500' }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Information */}
          <div className="alert alert-info" style={{
            background: '#cffafe',
            borderLeft: '4px solid #0891b2',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              <div>
                <p style={{ fontWeight: '600', color: '#164e63', marginBottom: '0.5rem' }}>
                  Track Your Application Anytime
                </p>
                <p style={{ color: '#0e7490', fontSize: '0.9rem' }}>
                  Visit your dashboard and use your Application ID to check the status of your application at any time.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <button
              onClick={handleDownloadReceipt}
              className="btn-primary"
            >
              📥 Download Receipt
            </button>
            <Link href="/dashboard">
              <button className="btn-success">
                🏠 Back to Dashboard
              </button>
            </Link>
          </div>

          {/* Footer Note */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.6' }}>
              <strong>Important:</strong> A confirmation email has been sent to your registered email. 
              Save your Application ID for future reference. Do not share it with anyone.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
