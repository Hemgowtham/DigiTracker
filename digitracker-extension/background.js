// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "analyzePrivacy") {
        console.log("Background: Received text, sending to Python AI...");

        fetch("http://localhost:8000/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                domain: request.domain,
                policy_text: request.policy_text
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data }); 
        })
        .catch(error => {
            console.error("Background fetch error:", error);
            sendResponse({ success: false, error: error.message });
        });

        return true; 
    }
});