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

console.log("👁️ DigiTracker: AI Engine Active and monitoring.");

// --- AI PRIVACY SCANNER ---
async function scanPageWithAI() {
    const pageText = document.body.innerText;
    const currentDomain = window.location.hostname;

    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') return;

    try {
        console.log("🚀 DigiTracker: Sending text to Background Script...");
        
        // NEW: Message the background script instead of fetching directly
        chrome.runtime.sendMessage(
            {
                action: "analyzePrivacy",
                domain: currentDomain,
                policy_text: pageText
            },
            (response) => {
                if (response && response.success) {
                    const aiResult = response.data;
                    console.log("🧠 DigiTracker: AI Response Received:", aiResult);

                    // Temporarily allow Grade A to show the banner for testing
                if (aiResult.grade === "A" || aiResult.grade === "C" || aiResult.grade === "F") {
                    console.log("⚠️ DigiTracker: Injecting banner for testing...");
                    injectAIBanner(aiResult);
                }
                } else {
                    console.error("🚨 DigiTracker AI Communication Error:", response?.error);
                }
            }
        );

    } catch (error) {
        console.error("🚨 DigiTracker Error:", error);
    }
}

// --- BALANCED AI UI INJECTOR ---
function injectAIBanner(aiResult) {
    if (!document.body) {
        setTimeout(() => injectAIBanner(aiResult), 100);
        return;
    }

    // Prevent duplicate banners
    if (document.getElementById('digitracker-grade-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'digitracker-grade-banner';

    // UI Theme configuration based on risk levels
    let brandColor = '#38a169'; // Default Green (Grade A or B)
    let safetyMessage = 'Login is Safe';
    
    if (aiResult.grade === 'C') {
        brandColor = '#dd6b20'; // Orange
        safetyMessage = 'Proceed with Caution';
    } else if (aiResult.grade === 'F') {
        brandColor = '#e53e3e'; // Red
        safetyMessage = 'Login Not Recommended';
    }

    // Fixed at Top-Right, clean white card design
    banner.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 260px;
        background-color: #ffffff;
        color: #1a202c;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border: 1px solid #e2e8f0;
        border-top: 4px solid ${brandColor};
        overflow: hidden;
    `;

    banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid #edf2f7; background-color: #f8fafc;">
            <strong style="font-size: 14px; color: #2d3748; letter-spacing: 0.5px;">DigiTracker</strong>
            <button id="dt-close-btn" style="background: none; border: none; color: #a0aec0; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;">&times;</button>
        </div>

        <div style="padding: 15px; text-align: center;">
            <div style="font-size: 46px; font-weight: 800; color: ${brandColor}; line-height: 1;">
                ${aiResult.grade}
            </div>
            <div style="margin-top: 8px; font-size: 13px; font-weight: 600; color: #4a5568;">
                ${safetyMessage}
            </div>
        </div>

        <div style="padding: 0 15px 12px 15px;">
            <a href="#" id="dt-explain-link" style="font-size: 12px; color: #3182ce; text-decoration: none; display: block; text-align: center; font-weight: 500;">
                How do we grade websites? ▾
            </a>
            <div id="dt-explain-panel" style="display: none; margin-top: 10px; font-size: 12px; color: #4a5568; background-color: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: left; line-height: 1.4;">
                Our AI engine scans the website's privacy policy using Natural Language Processing. It hunts for hidden predatory clauses—like data selling, third-party tracking, or indefinite data retention—to calculate this safety grade.
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    // Close button event
    document.getElementById('dt-close-btn').addEventListener('click', () => banner.remove());

    // Expandable link event
    const explainLink = document.getElementById('dt-explain-link');
    const explainPanel = document.getElementById('dt-explain-panel');

    explainLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (explainPanel.style.display === 'none') {
            explainPanel.style.display = 'block';
            explainLink.innerHTML = 'Hide explanation ▴';
        } else {
            explainPanel.style.display = 'none';
            explainLink.innerHTML = 'How do we grade websites? ▾';
        }
    });
}

// Wait for the page to load, then trigger the AI scan
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanPageWithAI);
} else {
    scanPageWithAI();
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
        const domain = window.location.hostname;

        // --- NEW: THE LOCALHOST BLOCKER ---
        if (domain === 'localhost' || domain === '127.0.0.1') {
            console.log("👁️ DigiTracker: Ignoring localhost environment.");
            return; // Stops the function immediately
        }

        sendRegistrationData({
            domain: domain,
            email: emailInput.value
        });
    }
});