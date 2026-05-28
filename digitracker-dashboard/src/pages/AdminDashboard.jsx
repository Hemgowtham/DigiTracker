import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import customLogo from '../assets/logo.png';

// --- MOCK REPUTATION ENGINE (Admin Sync) ---
const knownRiskyDomains = [
  "instacourses.insightsonindia.com",
  "freemovies.xyz",
  "cheap-crypto-scam.io",
  "unverified-vendor.com",
  "example.com"
];

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
  </svg>
);

export default function AdminDashboard() {
  const [footprints, setFootprints] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const navigate = useNavigate();
  const hasPrompted = useRef(false);

  const fetchGlobalData = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/footprints');
      const data = await response.json();
      setFootprints(data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); 
    }
  };

  useEffect(() => {
    if (hasPrompted.current) return; 
    hasPrompted.current = true;

    const devPasscode = window.prompt("Enter System Admin Passcode:");
    if (devPasscode !== "admin123") {
      alert("Unauthorized access.");
      navigate('/login');
      return;
    }
    
    setIsAuthenticated(true);
    fetchGlobalData();
  }, [navigate]);

  const handleDelete = async (footprintId) => {
    if (!window.confirm("CRITICAL WARNING: This will permanently purge this record from the global database. Proceed?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/footprints/${footprintId}`, { method: 'DELETE' });
      if (response.ok) {
        setFootprints(prev => prev.filter(site => site._id !== footprintId));
      }
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  // The Smarter Detection Engine
  const isDomainRisky = (domain) => {
    const cleanDomain = domain.toLowerCase().replace("www.", "");
    return knownRiskyDomains.some(riskyDomain => {
      const cleanRisky = riskyDomain.toLowerCase().replace("www.", "");
      return cleanDomain.includes(cleanRisky);
    });
  };

  if (!isAuthenticated) return null;

  const processedFootprints = footprints
    .filter(site => {
      const lowerQuery = searchQuery.toLowerCase();
      return site.domain.toLowerCase().includes(lowerQuery) || site.email.toLowerCase().includes(lowerQuery);
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="app-wrapper">
      <nav className="top-nav admin-nav">
        <div className="nav-brand">
          <img src={customLogo} alt="DigiTracker Logo" className="nav-logo-img" style={{ filter: 'invert(1)' }} />
          DigiTracker
          <span className="admin-badge">Global Admin</span>
        </div>
        <div className="nav-links">
          <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>Exit Admin Mode</a>
        </div>
      </nav>

      <main className="page-content">
        <div className="dashboard-container">
          
          <header className="dashboard-header">
            <h1 className="dashboard-title">System Overseer</h1>
            <p className="dashboard-subtitle">Manage global footprint logs and prune database anomalies.</p>
          </header>

          <div className="controls-container">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Query by domain or targeted user email..." 
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

            <button 
              onClick={fetchGlobalData} 
              disabled={isRefreshing}
              style={{
                backgroundColor: '#fff',
                color: isRefreshing ? '#999' : '#111',
                border: '1px solid #eaeaea',
                width: '46px',
                height: '46px',
                borderRadius: '6px',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                opacity: isRefreshing ? 0.5 : 1,
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}
              title="Sync Latest Data"
            >
              <RefreshIcon />
            </button>
          </div>
          
          {processedFootprints.length === 0 ? (
            <div className="empty-state">
              <h2>Database is clean.</h2>
              <p>No global records match your current query parameters.</p>
            </div>
          ) : (
            <ul className="footprint-list">
              {processedFootprints.map((site) => {
                const isRisky = isDomainRisky(site.domain);
                
                return (
                  <li 
                    key={site._id} 
                    className="footprint-card admin-card"
                    // Dark red background for flagged sites in Admin mode
                    style={isRisky ? { backgroundColor: '#2d0a0a', borderLeftColor: '#ef4444' } : {}}
                  >
                    <div className="card-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`} 
                          alt={`${site.domain} logo`} 
                          style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <h2 className="domain-name" style={{ margin: 0 }}>{site.domain}</h2>
                        
                        {/* Admin Security Badge */}
                        {isRisky && (
                          <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            THREAT DETECTED
                          </span>
                        )}
                      </div>
                      
                      <div className="meta-data">
                        <span style={{ color: isRisky ? '#fca5a5' : '#b91c1c', fontWeight: '600' }}>User ID: {site.email}</span>
                        <span className="meta-divider">•</span>
                        <span style={{ color: isRisky ? '#ccc' : '' }}>Last Seen: {new Date(site.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <button onClick={() => handleDelete(site._id)} className="action-btn btn-danger">
                        Purge Record
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}