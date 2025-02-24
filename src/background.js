import { OPENAI_API_KEY } from "./config.js";  // Ensure config.js is in the same directory
console.log("Background script loaded!");
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ apiKey: OPENAI_API_KEY }, () => {
    console.log("API Key stored securely!");
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Trigger Event Listener")
  if (request.action === "fetchCompletions") {
    console.log("Trigger fetching completions", request.text)
    chrome.storage.local.get("apiKey", (data) => {
      if (!data.apiKey) {
        console.error("API Key not found!");
        sendResponse({ error: "API Key is missing." });
        return;
      }

      fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: request.text }],
          max_tokens: 50
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log("API Response:", data);
        if (!data.choices || !Array.isArray(data.choices)) {
          console.error("Error: `choices` array is missing in API response.", data);
          sendResponse({ error: "Invalid API response: `choices` missing." });
        } else {
          sendResponse({ completions: data.choices.map(choice => choice.text) });
        }
      })
      .catch(error => {
        console.error("Error fetching completions:", error);
        sendResponse({ error: "Failed to fetch completions." });
      });

      return true; // Required for async sendResponse
    });
  }
});

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("Received message:", request);
  
//   if (request.action === "test_message") {
//     sendResponse({ success: true });
//   }
// });
