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

export default function Login() {
  const navigate = useNavigate();
  
  // Controls which screen the user sees: 'login', 'forgot', or 'reset'
  const [view, setView] = useState('login'); 

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // --- STANDARD LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', email); // Use local state email to ensure it saves correctly
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

  // --- STEP 1: REQUEST OTP ---
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      // NEW: Tell React to actually read the data from the backend
      const data = await response.json(); 

      if (response.ok) {
        setMessage("If this email exists, an OTP has been sent. Check your terminal!");
        setTimeout(() => {
          setView('reset');
          setMessage("");
        }, 2000);
      } else {
        // NEW: Display the specific error from the server instead of the generic one
        setError(data.error || "Failed to process request.");
      }
    } catch (err) {
      setError("Network error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- STEP 2: VERIFY AND RESET ---
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Password updated successfully! Redirecting...");
        setTimeout(() => {
          setView('login');
          setPassword("");
          setOtp("");
          setNewPassword("");
          setMessage("");
        }, 2000);
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch (err) {
      setError("Network error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable styles to keep code clean
  const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #eaeaea', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px' };
  const buttonStyle = { width: '100%', padding: '12px', backgroundColor: isLoading ? '#666' : '#000', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.95rem', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: '8px', transition: 'background-color 0.2s' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa' }}>
      <div style={{ backgroundColor: '#fff', padding: '48px', borderRadius: '12px', border: '1px solid #eaeaea', width: '100%', maxWidth: '420px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <img src={customLogo} alt="Logo" style={{ height: '32px' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.5px' }}>DigiTracker.</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            {view === 'login' && "Welcome back"}
            {view === 'forgot' && "Account Recovery"}
            {view === 'reset' && "Set New Password"}
          </h1>
          <p style={{ color: '#737373', fontSize: '0.95rem' }}>
            {view === 'login' && "Sign in to audit your identity footprints"}
            {view === 'forgot' && "Enter your email to receive a secure OTP"}
            {view === 'reset' && "Enter the 6-digit code from your terminal"}
          </p>
        </div>

        {error && <div style={{ padding: '12px', backgroundColor: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>{message}</div>}

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} style={inputStyle} />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={labelStyle}>Password</label>
                <span onClick={() => { setView('forgot'); setError(''); setMessage(''); }} style={{ fontSize: '0.8rem', color: '#737373', textDecoration: 'none', cursor: 'pointer' }}>Forgot password?</span>
              </div>
              
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                  style={{ ...inputStyle, paddingRight: '40px' }} 
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
            
            <button type="submit" disabled={isLoading} style={buttonStyle}>
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#737373' }}>
              Don't have an account? <Link to="/signup" style={{ color: '#000', fontWeight: '600', textDecoration: 'none' }}>Sign up</Link>
            </p>
          </form>
        )}

        {/* VIEW: REQUEST OTP */}
        {view === 'forgot' && (
          <form onSubmit={handleRequestOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} style={inputStyle} />
            </div>
            <button type="submit" disabled={isLoading} style={buttonStyle}>
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
              <span onClick={() => setView('login')} style={{ color: '#737373', cursor: 'pointer', fontWeight: '500' }}>&larr; Back to Login</span>
            </p>
          </form>
        )}

        {/* VIEW: VERIFY OTP & RESET */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>6-Digit Verification Code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="e.g., 123456" required disabled={isLoading} style={inputStyle} />
            </div>
            
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                  style={{ ...inputStyle, paddingRight: '40px' }} 
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#737373', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {showNewPassword ? <EyeClosed /> : <EyeOpen />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={buttonStyle}>
              {isLoading ? 'Verifying...' : 'Update Password'}
            </button>
            <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>
              <span onClick={() => { setView('login'); setPassword(''); setOtp(''); setNewPassword(''); }} style={{ color: '#737373', cursor: 'pointer', fontWeight: '500' }}>&larr; Cancel</span>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}