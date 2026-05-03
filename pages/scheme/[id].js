import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const schemeDetails = {
  1: {
    name: 'Old Age Pension',
    icon: '👴',
    description: 'A comprehensive social security scheme designed to provide financial assistance to senior citizens who are unable to support themselves.',
    benefits: [
      'Monthly pension of ₹2,000 - ₹3,000',
      'Healthcare coverage',
      'Priority in government housing schemes',
      'Concessions on utility bills'
    ],
    eligibility: [
      'Age 60 years or above',
      'Resident of the state for 15+ years',
      'Annual family income below ₹50,000',
      'Not receiving any other pension'
    ],
    requiredDocuments: [
      'Birth Certificate or Age Proof',
      'Address Proof (Aadhaar, Voter ID)',
      'Income Certificate',
      'Bank Account Details'
    ]
  },
  2: {
    name: 'Farmer Subsidy',
    icon: '🌾',
    description: 'Government initiative to support farmers with subsidies on modern agricultural equipment and sustainable farming practices.',
    benefits: [
      '50% subsidy on equipment purchase',
      'Interest-free loans for farm improvements',
      'Free training on modern farming',
      'Insurance coverage for crops'
    ],
    eligibility: [
      'Must be an active farmer',
      'Land ownership or farming lease document',
      'Registration with agricultural department',
      'Not availed this subsidy in last 3 years'
    ],
    requiredDocuments: [
      'Land Records (Patta/FMB)',
      'Aadhaar Card',
      'Agricultural Department Registration',
      'Bank Account Details'
    ]
  },
  3: {
    name: 'Student Scholarship',
    icon: '📚',
    description: 'Merit-based scholarship scheme for academically brilliant students to support their higher education.',
    benefits: [
      'Full tuition fee coverage',
      'Monthly stipend of ₹5,000',
      'Free educational materials',
      'Internship opportunities'
    ],
    eligibility: [
      'Minimum 80% marks in last exam',
      'Family income below ₹8 lakhs per annum',
      'Pursuing higher education',
      'Not receiving scholarship from other sources'
    ],
    requiredDocuments: [
      'Mark Sheets (last 3 years)',
      'Income Certificate',
      'Enrollment Certificate from College',
      'Bank Account Details'
    ]
  },
  4: {
    name: 'Health Insurance Scheme',
    icon: '🏥',
    description: 'Universal health coverage scheme providing comprehensive medical benefits to all eligible citizens.',
    benefits: [
      'Coverage up to ₹5 lakhs per annum',
      'Free treatment at network hospitals',
      'Ambulance services',
      'Pre-existing disease coverage'
    ],
    eligibility: [
      'All Indian citizens',
      'Free for Below Poverty Line (BPL) families',
      'Subsidized for Above Poverty Line (APL)',
      'No age limit'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Address Proof',
      'Income Certificate',
      'Bank Account Details'
    ]
  },
  5: {
    name: 'Unemployment Assistance',
    icon: '💼',
    description: 'Financial support scheme for individuals who are currently unemployed and actively seeking employment.',
    benefits: [
      'Monthly stipend of ₹10,000',
      'Job training and skill development',
      'Employment counseling',
      'Loan assistance for self-employment'
    ],
    eligibility: [
      'Unemployed for minimum 6 months',
      'Age between 18-65 years',
      'Not receiving other financial assistance',
      'Should be actively job seeking'
    ],
    requiredDocuments: [
      'Aadhaar Card',
      'Educational Certificates',
      'Previous Employment Letters',
      'Bank Account Details'
    ]
  }
}

export default function SchemeDetail() {
  const router = useRouter()
  const { id } = router.query
  const [scheme, setScheme] = useState(null)

  useEffect(() => {
    if (id && schemeDetails[id]) {
      setScheme(schemeDetails[id])
    }
  }, [id])

  if (!scheme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading scheme details...</p>
      </div>
    )
  }

  return (
    <div className="page-bg">
      {/* Header Navigation */}
      <header className="header-nav">
        <div className="header-nav-container">
          <div className="header-nav-logo">🏛️ Scheme Details</div>
        </div>
      </header>

      <section className="page-hero">
        <div className="hero-icon">{scheme.icon}</div>
        <h1>{scheme.name}</h1>
        <p>{scheme.description}</p>
      </section>

      {/* Content */}
      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '2.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: '2rem',
          maxWidth: '1100px',
          margin: '0 auto'
        }}>
          {/* Main Content */}
          <div>
            {/* Benefits */}
            <div className="card" style={{ marginBottom: '2rem' }}>
              <div className="card-header" style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem' }}>🎁</span>
                <div>
                  <h2 style={{ fontSize: '1.375rem', color: 'var(--primary-blue-dark)' }}>Key Benefits</h2>
                </div>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {scheme.benefits.map((benefit, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '0.75rem 0',
                    borderBottom: idx < scheme.benefits.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <span style={{ color: 'var(--success)', marginRight: '0.75rem', fontWeight: '700', fontSize: '1.25rem' }}>✓</span>
                    <span style={{ color: '#555555' }}>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Eligibility */}
            <div className="card" style={{ marginBottom: '2rem', borderRadius: '10px' }}>
              <div className="card-header" style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem' }}>✓</span>
                <div>
                  <h2 style={{ fontSize: '1.375rem', color: 'var(--primary-blue-dark)' }}>Eligibility Criteria</h2>
                </div>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {scheme.eligibility.map((criteria, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '0.75rem 0',
                    borderBottom: idx < scheme.eligibility.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <span style={{ color: 'var(--primary-blue-main)', marginRight: '0.75rem', fontWeight: '700', fontSize: '1.25rem' }}>•</span>
                    <span style={{ color: '#555555' }}>{criteria}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Documents */}
            <div className="card" style={{ marginBottom: '2rem', borderRadius: '10px' }}>
              <div className="card-header" style={{ borderBottom: '2px solid #e0e0e0', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2rem' }}>📄</span>
                <div>
                  <h2 style={{ fontSize: '1.375rem', color: 'var(--primary-blue-dark)' }}>Required Documents</h2>
                </div>
              </div>
              <ul style={{ listStyle: 'none' }}>
                {scheme.requiredDocuments.map((doc, idx) => (
                  <li key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '0.75rem 0',
                    borderBottom: idx < scheme.requiredDocuments.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <span style={{ color: '#f59e0b', marginRight: '0.75rem', fontWeight: '700', fontSize: '1.25rem' }}>✓</span>
                    <span style={{ color: '#555555' }}>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
            <div className="card accent-border-left" style={{ borderRadius: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--primary-blue-dark)', marginBottom: '1rem' }}>Ready to Apply?</h3>
              <p style={{ color: '#555555', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Fill out the application form to apply for this scheme. You can use your existing data for faster completion.
              </p>
              <Link href={`/apply?schemeId=${id}`}>
                <button className="btn btn-success" style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem' }}>
                  ➤ Proceed to Apply
                </button>
              </Link>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary-blue-dark)', marginTop: '1rem', textAlign: 'center', fontWeight: '500' }}>
                📅 Processing time: 7-10 working days
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
