import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const schemes = [
  {
    id: 1,
    name: 'Old Age Pension',
    icon: '👴',
    benefits: 'Monthly pension for senior citizens',
    eligibility: 'Age 60+, Income below ₹50,000/month',
    shortDesc: 'Social security for elderly citizens'
  },
  {
    id: 2,
    name: 'Farmer Subsidy',
    icon: '🌾',
    benefits: 'Agricultural equipment subsidy',
    eligibility: 'Active farmer with valid land records',
    shortDesc: 'Support for agricultural activities'
  },
  {
    id: 3,
    name: 'Student Scholarship',
    icon: '📚',
    benefits: 'Tuition and living expenses',
    eligibility: 'Student with merit score >80%',
    shortDesc: 'Educational support for meritorious students'
  },
  {
    id: 4,
    name: 'Health Insurance Scheme',
    icon: '🏥',
    benefits: 'Coverage up to ₹5 lakhs per annum',
    eligibility: 'All citizens, free for below poverty line',
    shortDesc: 'Comprehensive health coverage'
  },
  {
    id: 5,
    name: 'Unemployment Assistance',
    icon: '💼',
    benefits: 'Monthly stipend during job search',
    eligibility: 'Unemployed for 6+ months',
    shortDesc: 'Financial aid during unemployment'
  }
]

export default function Dashboard() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userMobile, setUserMobile] = useState('')

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn')
    if (!loggedIn) {
      router.push('/login')
    } else {
      setIsLoggedIn(true)
      setUserMobile(localStorage.getItem('userMobile') || '')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userMobile')
    router.push('/login')
  }

  if (!isLoggedIn) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f7fb' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Government Welfare Services</h1>
            <p>Access various government schemes and social security benefits. Apply now and get support for your family's future.</p>
            <div className="hero-buttons">
              <button className="btn btn-primary" style={{ padding: '0.875rem 2rem' }}>
                ➤ Explore Schemes
              </button>
              <button className="btn btn-outline" style={{ padding: '0.875rem 2rem', borderColor: 'white', color: 'white' }}>
                📖 Learn More
              </button>
            </div>
          </div>
          <div className="hero-icon">🎯</div>
        </div>
      </section>

      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Welfare Portal</div>
          <div className="header-nav-actions">
            <span style={{ color: '#555555', fontSize: '0.95rem' }}>+91 {userMobile}</span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Card */}
      <section className="container-section">
        <div className="container">
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, #e8f0fd 0%, #f0f7ff 100%)',
            borderLeft: '4px solid #1e60d4',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
              <div>
                <h2 style={{ color: '#0b3d91', fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome back! 👋</h2>
                <p style={{ color: '#1e60d4', marginBottom: '0.5rem', fontSize: '1rem' }}>
                  <strong>Registered Mobile:</strong> +91 {userMobile}
                </p>
                <p style={{ color: '#555555' }}>
                  Explore available government welfare schemes and apply with just a few clicks. All information is secure and encrypted.
                </p>
              </div>
              <div style={{ fontSize: '4rem', opacity: 0.3, flexShrink: 0 }}>✓</div>
            </div>
          </div>

          {/* Section Title */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#0b3d91', fontSize: '2rem', marginBottom: '0.5rem' }}>Available Welfare Schemes</h2>
            <p style={{ color: '#555555', fontSize: '1rem' }}>Select a scheme to view details and apply online</p>
          </div>

          {/* Schemes Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {schemes.map((scheme) => (
              <Link key={scheme.id} href={`/scheme/${scheme.id}`}>
                <div className="scheme-card" style={{ cursor: 'pointer' }}>
                  <div className="scheme-icon">{scheme.icon}</div>
                  <h3 className="scheme-title">{scheme.name}</h3>
                  <p className="scheme-description">{scheme.shortDesc}</p>
                  <div className="scheme-details">
                    <strong>📋 Key Benefits:</strong>
                    <div>{scheme.benefits}</div>
                    <strong style={{ marginTop: '0.75rem' }}>✓ Eligibility:</strong>
                    <div>{scheme.eligibility}</div>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }}>
                    View Details & Apply →
                  </button>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <section style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '2px solid #e0e0e0' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '2rem'
            }}>
              <div className="card">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
                <h3 style={{ color: '#0b3d91', marginBottom: '0.75rem' }}>Easy to Use</h3>
                <p>Simple, step-by-step application process. No complicated forms or confusing requirements.</p>
              </div>
              <div className="card">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
                <h3 style={{ color: '#0b3d91', marginBottom: '0.75rem' }}>Secure & Private</h3>
                <p>Your data is encrypted and secure. We never share your information without permission.</p>
              </div>
              <div className="card">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                <h3 style={{ color: '#0b3d91', marginBottom: '0.75rem' }}>Fast Processing</h3>
                <p>Quick verification and approval. Most applications are processed within 5-10 working days.</p>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section style={{ marginTop: '3rem', padding: '2rem', background: 'linear-gradient(135deg, #e8f0fd 0%, #f0f7ff 100%)', borderRadius: '10px', textAlign: 'center' }}>
            <h3 style={{ color: '#0b3d91', marginBottom: '0.75rem' }}>Need Help?</h3>
            <p style={{ color: '#555555', marginBottom: '1rem' }}>Our support team is available 24/7 to assist you</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="tel:18001234567" style={{ color: '#1e60d4', fontWeight: 600 }}>📞 1-800-WELFARE</a>
              <span style={{ color: '#ddd' }}>•</span>
              <a href="mailto:support@welfare.gov" style={{ color: '#1e60d4', fontWeight: 600 }}>✉️ support@welfare.gov</a>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
