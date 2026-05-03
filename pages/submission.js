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
    <div className="page-bg">
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Application Submitted</div>
        </div>
      </header>

      <section className="page-hero">
        <div className="hero-icon">✅</div>
        <h1>Success!</h1>
        <p>Your application has been submitted successfully</p>
      </section>

      {/* Success Message */}
      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className="card" style={{
          maxWidth: '750px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          {/* Success Icon */}
          <div style={{
            fontSize: '4.5rem',
            marginBottom: '1.5rem',
            color: 'var(--success)'
          }}>
            ✓
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: '700',
            color: 'var(--primary-blue-dark)',
            marginBottom: '1.5rem'
          }}>
            Application Submitted!
          </h2>

          {/* Application ID Box */}
          <div className="alert alert-success" style={{
            background: '#f0fdf4',
            borderLeft: '4px solid var(--success)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: '600', marginBottom: '0.5rem' }}>
                YOUR APPLICATION ID
              </p>
                <p style={{
                fontSize: '1.625rem',
                fontWeight: '700',
                color: 'var(--success)',
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
            <div className="review-section accent-border-left" style={{
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div className="review-section-title" style={{ fontSize: '1.1rem', color: 'var(--primary-blue-dark)' }}>
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
                    background: 'var(--primary-blue-main)',
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
                  <p style={{ color: 'var(--primary-blue-dark)', fontWeight: '500' }}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Information */}
            <div className="alert alert-info" style={{
            background: '#cffafe',
            borderLeft: '4px solid var(--info)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.2rem' }}>🔍</span>
              <div>
                <p style={{ fontWeight: '600', color: 'var(--info)', marginBottom: '0.5rem' }}>
                  Track Your Application Anytime
                </p>
                <p style={{ color: 'var(--info)', fontSize: '0.9rem' }}>
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
