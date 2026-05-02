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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b3d91 0%, #1e60d4 50%, #5b8ce8 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      {/* Logo and Title */}
      <div style={{
        textAlign: 'center',
        marginBottom: '3rem',
        color: 'white'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏛️</div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welfare Portal</h1>
        <p style={{ fontSize: '1rem', opacity: 0.95 }}>Government Benefits & Services</p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ 
        maxWidth: '450px', 
        width: '100%',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
      }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '2rem', 
          paddingBottom: '1.5rem', 
          borderBottom: '2px solid #e0e0e0'
        }}>
          <h2 style={{ fontSize: '1.5rem', color: '#0b3d91', marginBottom: '0.5rem' }}>
            {step === 'mobile' ? 'Sign In' : 'Verify OTP'}
          </h2>
          <p style={{ color: '#555555', fontSize: '0.95rem' }}>
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
              <label htmlFor="mobile" style={{ marginBottom: '0.75rem' }}>
                Mobile Number
                <span className="required">*</span>
              </label>
              <input
                id="mobile"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength="10"
                style={{
                  fontSize: '1.1rem',
                  padding: '0.875rem 1rem',
                  borderRadius: '6px'
                }}
              />
              <p style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.5rem' }}>
                We'll send an OTP to verify your identity
              </p>
            </div>

            <button
              onClick={handleSendOTP}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem' }}
            >
              Send OTP
            </button>

            <p style={{ 
              fontSize: '0.85rem', 
              color: '#666666', 
              marginTop: '1.5rem', 
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        ) : (
          <div>
            <div className="form-group">
              <label htmlFor="otp" style={{ marginBottom: '0.75rem' }}>
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
                  padding: '0.875rem 1rem',
                  borderRadius: '6px',
                  textAlign: 'center',
                  letterSpacing: '0.25rem',
                  fontWeight: 600
                }}
              />
              <p style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.5rem' }}>
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
                borderColor: '#1e60d4',
                color: '#1e60d4'
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
          borderTop: '1px solid #e0e0e0',
          textAlign: 'center',
          color: '#666666',
          fontSize: '0.85rem'
        }}>
          <p>📞 Support: 1800-WELFARE</p>
          {step === 'mobile' && <p style={{ marginTop: '0.5rem' }}>🔐 Demo OTP: 1234</p>}
        </div>
      </div>
    </div>
  )
}
