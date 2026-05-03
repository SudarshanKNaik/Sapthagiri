import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [step, setStep] = useState('mobile') // mobile or otp
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleSendOTP = () => {
    if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
      setMessage('Please enter a valid 10-digit mobile number')
      setMessageType('error')
      return
    }
    setMessage('OTP sent to +91 ' + mobile + ' (Test OTP: 1234)')
    setMessageType('success')
    setStep('otp')
  }

  const handleVerifyOTP = () => {
    if (otp === '1234') {
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userMobile', mobile)
      router.push('/dashboard')
    } else {
      setMessage('Invalid OTP. Please try again. (Hint: 1234)')
      setMessageType('error')
    }
  }

  return (
    <div className="page-bg login-shell" style={{
      background: 'radial-gradient(circle at 12% 15%, rgba(42,168,154,0.12) 0%, transparent 40%), radial-gradient(circle at 88% 85%, rgba(238,122,74,0.1) 0%, transparent 38%), var(--light-bg)'
    }}>
      <aside className="login-sidebar" aria-label="Portal navbar">
        <div className="login-sidebar-title">Welfare Portal</div>
      </aside>

      <div className="login-main">
      {/* Logo and Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2.2rem',
        color: 'var(--text-primary)'
      }}>
        <h1 style={{ fontSize: '3.4rem', fontWeight: 800, marginBottom: '0.7rem', color: 'var(--primary-blue-dark)', letterSpacing: '-0.03em', fontFamily: 'Poppins, Inter, sans-serif' }}>Welfare Portal</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Government Benefits & Services</p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ 
        maxWidth: '520px', 
        width: '100%',
        borderRadius: '16px',
        boxShadow: '0 14px 34px rgba(10, 31, 28, 0.12)',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '1.75rem', 
          paddingBottom: '1.1rem', 
          borderBottom: '1px solid rgba(15,107,95,0.12)'
        }}>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--primary-blue-dark)', marginBottom: '0.5rem' }}>
            {step === 'mobile' ? 'Sign In' : 'Verify OTP'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {step === 'mobile' 
              ? 'Enter your mobile number to get started' 
              : `OTP has been sent to +91 ${mobile}`}
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className={`alert alert-${messageType}`} style={{ marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>
              {messageType === 'success' ? '✓' : '✕'}
            </span>
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                {messageType === 'success' ? 'Success' : 'Error'}
              </strong>
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        {step === 'mobile' ? (
          <div>
            <div className="form-group">
              <label htmlFor="mobile" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                Mobile Number
                <span className="required">*</span>
              </label>
              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'stretch' }}>
                <div className="country-select" aria-label="Country code">
                  <span>+91</span>
                </div>
                <input
                  id="mobile"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength="10"
                  style={{
                    flex: 1,
                    fontSize: '1.1rem',
                    height: '54px',
                    borderRadius: '10px',
                    border: '1px solid rgba(15,107,95,0.18)',
                    padding: '0.75rem 1rem'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                We'll send an OTP to verify your identity
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.05rem' }}
            >
              Send OTP
            </button>

            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              marginTop: '1.5rem', 
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              By signing in, you agree to our
              <a href="#" style={{ color: 'var(--primary-blue-dark)', fontWeight: 600, marginLeft: '0.35rem' }}>Terms</a>
              <span style={{ margin: '0 0.4rem', color: 'var(--gray-400)' }}>•</span>
              <a href="#" style={{ color: 'var(--primary-blue-dark)', fontWeight: 600 }}>Privacy</a>
            </p>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label htmlFor="otp" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>
                One-Time Password (OTP)
                <span className="required">*</span>
              </label>
              <input
                id="otp"
                type="text"
                placeholder="Enter 4-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength="4"
                style={{
                  fontSize: '1.5rem',
                  padding: '0.95rem 1rem',
                  borderRadius: '10px',
                  textAlign: 'center',
                  letterSpacing: '0.25rem',
                  fontWeight: 600,
                  border: '1px solid rgba(15,107,95,0.18)'
                }}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Enter the 4-digit code sent to your mobile
              </p>
            </div>

            <button
              onClick={handleVerifyOTP}
              className="btn btn-success"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem' }}
            >
              ✓ Verify & Continue
            </button>

            <button
              onClick={() => {
                setStep('mobile')
                setOtp('')
                setMessage('')
              }}
              className="btn btn-outline"
              style={{ 
                width: '100%', 
                marginTop: '0.75rem', 
                padding: '0.875rem',
                borderColor: 'var(--primary-blue-main)',
                color: 'var(--primary-blue-main)'
              }}
            >
              ← Change Mobile Number
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(15,107,95,0.12)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem'
        }}>
          <p>📞 Support: 1800-WELFARE</p>
          {step === 'mobile' && <p style={{ marginTop: '0.5rem' }}>🔐 Demo OTP: 1234</p>}
        </div>
      </div>
      </div>
    </div>
  )
}
