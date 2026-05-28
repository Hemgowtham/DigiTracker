console.log("👁️ DigiTracker: Active and monitoring this webpage.");

// --- EXTENSION REPUTATION ENGINE ---
const knownRiskyDomains = [
  "instacourses.insightsonindia.com",
  "freemovies.xyz",
  "cheap-crypto-scam.io",
  "unverified-vendor.com",
  "example.com"
];

const isDomainRisky = (domain) => {
    const cleanDomain = domain.toLowerCase().replace("www.", "");
    return knownRiskyDomains.some(riskyDomain => {
        const cleanRisky = riskyDomain.toLowerCase().replace("www.", "");
        return cleanDomain.includes(cleanRisky);
    });
};

// --- BULLETPROOF UI INJECTOR ---
function injectSecurityBanner() {
    // 1. Double check that the website's body actually exists
    if (!document.body) {
        setTimeout(injectSecurityBanner, 100); // Check again in 100ms
        return;
    }

    console.warn(`🚨 DigiTracker: UNSAFE DOMAIN DETECTED! (${window.location.hostname})`);
    
    const warningBanner = document.createElement('div');
    
    // We use !important on everything so the website's CSS can't accidentally hide our banner
    warningBanner.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 340px !important;
        background-color: #b91c1c !important;
        color: #ffffff !important;
        padding: 16px 20px !important;
        border-radius: 8px !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.4) !important;
        z-index: 2147483647 !important; /* Maximum possible z-index */
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
        border: 1px solid #f87171 !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 8px !important;
    `;

    warningBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <strong style="font-size: 16px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">⚠️</span> Security Alert
            </strong>
            <button id="dt-close-btn" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 0; line-height: 1;">&times;</button>
        </div>
        <div>
            DigiTracker has flagged <b>${window.location.hostname}</b> as a potentially unsafe or unverified website. Proceed with caution.
        </div>
    `;

    document.body.appendChild(warningBanner);

    // 2. Bypass CSP blockades by animating directly with JavaScript instead of CSS
    warningBanner.animate([
        { transform: 'translateX(400px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
    ], {
        duration: 500,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    });

    // 3. Smooth fade-out when clicking the X
    document.getElementById('dt-close-btn').addEventListener('click', () => {
        const fadeOut = warningBanner.animate([
            { transform: 'translateX(0)', opacity: 1 },
            { transform: 'translateX(400px)', opacity: 0 }
        ], {
            duration: 300,
            easing: 'ease-in',
            fill: 'forwards'
        });
        fadeOut.onfinish = () => warningBanner.remove();
    });
}

// Check if we should inject, and wait for the page to be ready!
if (isDomainRisky(window.location.hostname)) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSecurityBanner);
    } else {
        injectSecurityBanner();
    }
}

// --- STANDARD REGISTRATION CAPTURE ENGINE ---
function sendRegistrationData(data, retryCount = 0) {
    try {
        chrome.runtime.sendMessage({ type: "NEW_REGISTRATION", data: data }, function(response) {
            if (chrome.runtime.lastError && retryCount < 1) {
                setTimeout(() => sendRegistrationData(data, retryCount + 1), 500);
            }
        });
    } catch (error) {
        console.error("DigiTracker Error: Extension context invalidated.");
    }
}

document.addEventListener('submit', function(event) {
    const form = event.target;
    const emailInput = form.querySelector('input[type="email"], input[name*="email" i], input[id*="email" i]');

    if (emailInput && emailInput.value) {
        sendRegistrationData({
            domain: window.location.hostname,
            email: emailInput.value
        });
    }
});