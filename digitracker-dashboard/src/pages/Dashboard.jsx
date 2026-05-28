import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js'; // 1. Import the PDF Engine
import '../App.css';
import customLogo from '../assets/logo.png'; 

const knownRiskyDomains = [
  "instacourses.insightsonindia.com",
  "freemovies.xyz",
  "cheap-crypto-scam.io",
  "unverified-vendor.com",
  "example.com" 
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('dashboard');
  const [footprints, setFootprints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isDownloading, setIsDownloading] = useState(false); // PDF loading state
  
  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!userEmail) return;
    
    fetch(`http://localhost:3000/api/footprints?email=${encodeURIComponent(userEmail)}`)
      .then(response => response.json())
      .then(data => setFootprints(data))
      .catch(error => console.error("Error fetching data:", error));
  }, [userEmail]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handlePurgeData = async () => {
    const isConfirmed = window.confirm("⚠️ DANGER: This will permanently erase ALL tracking logs associated with your email. This cannot be undone.\n\nAre you sure you want to proceed?");
    if (!isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:3000/api/user/footprints/${encodeURIComponent(userEmail)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setFootprints([]); 
        alert("Success: Your data footprint has been completely erased.");
        setActivePage('dashboard');
      } else {
        alert("Error: Could not purge data. Please try again.");
      }
    } catch (error) {
      console.error("Error purging data:", error);
    }
  };

  // --- 2. THE PDF GENERATION FUNCTION ---
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    const element = document.getElementById('pdf-report-template');

    const opt = {
      margin:       0.5,
      filename:     `DigiTracker_Audit_${userEmail}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false }, // useCORS allows logo fetching!
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      setIsDownloading(false);
    }).catch(err => {
      console.error("PDF Generation failed", err);
      setIsDownloading(false);
      alert("Failed to generate PDF. Please try again.");
    });
  };

  const processedFootprints = footprints
    .filter(site => {
      const lowerCaseQuery = searchQuery.toLowerCase();
      return site.domain.toLowerCase().includes(lowerCaseQuery) || site.email.toLowerCase().includes(lowerCaseQuery);
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const isDomainRisky = (domain) => {
    const cleanDomain = domain.toLowerCase().replace("www.", "");
    
    // Instead of looking for an exact match, this checks if the captured 
    // domain contains ANY of the risky domains in your list.
    return knownRiskyDomains.some(riskyDomain => {
      const cleanRisky = riskyDomain.toLowerCase().replace("www.", "");
      return cleanDomain.includes(cleanRisky);
    });
  };

  return (
    <div className="app-wrapper">
      
      <nav className="top-nav">
        <div className="nav-brand" onClick={() => setActivePage('dashboard')} style={{ cursor: 'pointer' }}>
          <img src={customLogo} alt="DigiTracker Logo" className="nav-logo-img" />
          DigiTracker
        </div>
        <div className="nav-links">
          <a href="#" className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('dashboard'); }}>Dashboard</a>
          <a href="#" className={`nav-link ${activePage === 'settings' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('settings'); }}>Settings</a>
          <a href="#" className={`nav-link ${activePage === 'docs' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActivePage('docs'); }}>Documentation</a>
          <a href="#" className="nav-link" style={{ color: '#ef4444' }} onClick={handleLogout}>Log Out</a>
        </div>
      </nav>

      <main className="page-content">
        
        {/* VIEW 1: DASHBOARD */}
        {activePage === 'dashboard' && (
          <div className="dashboard-container">
            <header className="dashboard-header">
              <h1 className="dashboard-title">Identity Audit</h1>
              <p className="dashboard-subtitle">Monitor and manage your credential exposure across the web.</p>
            </header>

            <div className="controls-container">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search domains or email addresses..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select 
                className="sort-select" 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
            
            {processedFootprints.length === 0 ? (
              <div className="empty-state">
                <h2>No footprints discovered.</h2>
                <p>Your tracking ecosystem is active and waiting for new registrations.</p>
              </div>
            ) : (
              <ul className="footprint-list">
                {processedFootprints.map((site, index) => {
                  const formattedDate = new Date(site.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                  const isRisky = isDomainRisky(site.domain);

                  return (
                    <li key={index} className="footprint-card" style={isRisky ? { borderLeftColor: '#ef4444', backgroundColor: '#fffcfc' } : {}}>
                      <div className="card-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                          <img 
                            src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`} 
                            alt={`${site.domain} logo`} 
                            style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                          <h2 className="domain-name" style={{ margin: 0 }}>{site.domain}</h2>
                        </div>
                        <div className="meta-data">
                          <span style={{ color: '#111', fontWeight: '500' }}>{site.email}</span>
                          <span className="meta-divider">•</span>
                          <span>Logged {formattedDate}</span>
                        </div>
                      </div>

                      <div className="card-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {isRisky && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#fee2e2', padding: '6px 12px', borderRadius: '6px' }}>
                            <span style={{ fontSize: '1.1rem' }}>⚠️</span> Unsafe Site
                          </div>
                        )}
                        <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer" className="action-btn" style={isRisky ? { backgroundColor: '#fff', color: '#111', borderColor: '#eaeaea' } : {}}>
                          Go to Website ↗
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* VIEW 2: SETTINGS */}
        {activePage === 'settings' && (
          <div className="dashboard-container" style={{ maxWidth: '800px' }}>
            <header className="dashboard-header">
              <h1 className="dashboard-title">Account Settings</h1>
              <p className="dashboard-subtitle">Manage your preferences, data exports, and tracking rules.</p>
            </header>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Active Profile</h3>
                <p style={{ color: '#737373', fontSize: '0.95rem', marginBottom: '16px' }}>The current identity linked to this session.</p>
                <div style={{ display: 'inline-block', backgroundColor: '#fafafa', border: '1px solid #eaeaea', padding: '10px 16px', borderRadius: '6px', fontWeight: '600' }}>
                  {userEmail}
                </div>
              </div>

              {/* 3. NEW PDF DOWNLOAD BLOCK */}
              <div style={{ backgroundColor: '#fff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Data Portability</h3>
                <p style={{ color: '#737373', fontSize: '0.95rem', marginBottom: '16px' }}>Download a complete, labeled PDF report of your identity footprint map, including timestamps and security status.</p>
                <button 
                  className="action-btn" 
                  onClick={handleDownloadPDF} 
                  disabled={isDownloading || footprints.length === 0}
                  style={{ backgroundColor: (isDownloading || footprints.length === 0) ? '#999' : '#000' }}
                >
                  {isDownloading ? 'Generating PDF...' : 'Download My Data ↓'}
                </button>
              </div>

              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ marginBottom: '8px', fontSize: '1.1rem', color: '#b91c1c' }}>Danger Zone</h3>
                <p style={{ color: '#991b1b', fontSize: '0.95rem', marginBottom: '16px' }}>Permanently erase all tracked records associated with this email. This action cannot be undone.</p>
                <button 
                  onClick={handlePurgeData}
                  style={{ backgroundColor: '#b91c1c', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                  Purge My Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ... (Docs and Privacy Views remain here) ... */}
        {activePage === 'docs' && (
          <div className="dashboard-container" style={{ maxWidth: '800px' }}>
             <header className="dashboard-header"><h1 className="dashboard-title">Documentation</h1></header>
            <div style={{ lineHeight: '1.8', color: '#444' }}><p>DigiTracker utilizes a strict zero-knowledge pipeline...</p></div>
          </div>
        )}

        {activePage === 'privacy' && (
           <div className="dashboard-container" style={{ maxWidth: '800px' }}>
             <header className="dashboard-header"><h1 className="dashboard-title">Privacy Policy</h1></header>
            <div style={{ lineHeight: '1.8', color: '#444' }}><p>Your data belongs entirely to you...</p></div>
          </div>
        )}

      </main>

      <footer className="app-footer">
        <div className="footer-left"><p>© {new Date().getFullYear()} DigiTracker Open Source Ecosystem.</p></div>
        <div className="footer-right">
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); setActivePage('docs'); }}>Documentation</a>
          <a href="#" className="footer-link" onClick={(e) => { e.preventDefault(); setActivePage('privacy'); }}>Privacy Policy</a>
        </div>
      </footer>

      {/* =========================================================================
          4. THE HIDDEN PDF TEMPLATE 
          (This is placed completely off-screen so the user never sees it, 
          but the PDF engine captures it flawlessly.)
          ========================================================================= */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        <div id="pdf-report-template" style={{ width: '800px', padding: '40px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
          
          {/* PDF Header */}
          <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>Identity Audit Report</h1>
              <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '14px' }}>Generated by DigiTracker Ecosystem</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#777' }}>
              <strong>Date:</strong> {new Date().toLocaleDateString()}<br/>
              <strong>Time:</strong> {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Target Identity Summary */}
          <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#777' }}>Target Identity Monitored</p>
            <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#111' }}>{userEmail}</p>
            <p style={{ margin: '8px 0 0 0', color: '#555', fontSize: '14px' }}><strong>Total Active Footprints:</strong> {footprints.length}</p>
          </div>

          {/* Footprint Data Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px', fontWeight: '700', color: '#333' }}>Service Domain</th>
                <th style={{ padding: '12px', fontWeight: '700', color: '#333' }}>Security Status</th>
                <th style={{ padding: '12px', fontWeight: '700', color: '#333', textAlign: 'right' }}>Last Detected</th>
              </tr>
            </thead>
            <tbody>
              {footprints.map(site => {
                const isRisky = isDomainRisky(site.domain);
                return (
                  <tr key={site._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Logo embedded in PDF */}
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=64`} 
                        crossOrigin="anonymous"
                        style={{ width: '18px', height: '18px', borderRadius: '3px' }} 
                        alt="logo"
                      />
                      <span style={{ fontWeight: '600', color: '#111' }}>{site.domain}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isRisky 
                        ? <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>⚠️ Unsafe / Flagged</span> 
                        : <span style={{ color: '#059669', fontWeight: '500' }}>✓ Verified</span>
                      }
                    </td>
                    <td style={{ padding: '12px', color: '#555', textAlign: 'right' }}>
                      {new Date(site.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eaeaea', textAlign: 'center', fontSize: '11px', color: '#999' }}>
            End of Report. Data is provided "as is" based on current local footprint captures.
          </div>

        </div>
      </div>

    </div>
  )
}