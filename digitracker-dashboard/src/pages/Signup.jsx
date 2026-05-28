import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import customLogo from '../assets/logo.png';

// Professional SVG Icons for the Password Toggle
const EyeOpen = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeClosed = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function Signup() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Verification code sent to your email!');
        setStep(2);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', data.email);
        navigate('/dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
      <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #eaeaea', width: '100%', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src={customLogo} alt="Logo" style={{ height: '32px' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>DigiTracker.</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {step === 1 ? 'Create an account' : 'Verify your email'}
          </h1>
          <p style={{ color: '#737373', fontSize: '0.95rem' }}>
            {step === 1 ? 'Start auditing your identity footprints' : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ padding: '12px', backgroundColor: '#f0fff4', border: '1px solid #ccffdd', color: '#00802b', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}

        {step === 1 ? (
          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eaeaea', outline: 'none', fontSize: '0.95rem' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>Create Password</label>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength="6"
                  disabled={isLoading}
                  style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '6px', border: '1px solid #eaeaea', outline: 'none', fontSize: '0.95rem' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: isLoading ? '#666' : '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.95rem', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s' }}>
              {isLoading ? 'Creating account...' : 'Continue'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem', color: '#737373' }}>
              Already have an account? <Link to="/login" style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' }}>6-Digit Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength="6" placeholder="000000" disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eaeaea', outline: 'none', fontSize: '1.2rem', letterSpacing: '0.5em', textAlign: 'center' }} />
            </div>
            
            <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '12px', backgroundColor: isLoading ? '#666' : '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.95rem', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s' }}>
              {isLoading ? 'Verifying...' : 'Verify & Complete Signup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}