// Listen for messages coming from our content.js script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    if (request.type === "NEW_REGISTRATION") {
        console.log("Background Worker woke up and received data:", request.data);

        // Immediately tell Chrome we got the message so it doesn't throw an error!
        sendResponse({ status: "received", message: "Data securely caught by worker." });

        // Now, quietly send the data to your Node.js backend in the background
        fetch('http://localhost:3000/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request.data)
        })
        .then(response => response.json())
        .then(data => console.log("✅ Successfully beamed to backend!", data))
        .catch(error => console.error("❌ Failed to contact backend:", error));
    }

    // Return true to indicate we wish to send a response asynchronously (best practice)
    return true; 
});