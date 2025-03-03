import { OPENAI_API_KEY } from "./config.js";  // Ensure config.js is in the same directory
console.log("Background script loaded!");
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ apiKey: OPENAI_API_KEY }, () => {
    console.log("API Key stored securely!");
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Trigger Event Listener");
  
  if (request.action === "fetchCompletions") {
    console.log("Trigger fetching completions", request.text);

    chrome.storage.local.get("apiKey", async (data) => {
      if (!data.apiKey) {
        console.error("API Key not found!");
        sendResponse({ error: "API Key is missing." });
        return;
      }

      try {
        const apiKey = data.apiKey;
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are an autocomplete assistant. Complete the given sentence with multiple possible endings." },
              { role: "user", content: `Complete this sentence with multiple possible endings: "${request.text}"` }
            ],
            temperature: 0.7,
            max_tokens: 50,
            n: 5,  // Request multiple completions
          })
        });

        const responseData = await response.json();
        console.log("API Response:", responseData);

        // if (!responseData.choices || !Array.isArray(responseData.choices)) {
        //   console.error("Error: `choices` array is missing in API response.", responseData);
        //   sendResponse({ error: "Invalid API response: `choices` missing." });
        // } else {
        //   sendResponse({ completions: responseData.choices[0].message.content });
        // }
        if (!responseData.choices || !Array.isArray(responseData.choices)) {
          console.error("Error: `choices` array is missing in API response.", responseData);
          sendResponse({ error: "Invalid API response: `choices` missing." });
        } else {
          // Extract the response text
          const rawText = responseData.choices[0].message.content.trim();

          // Split suggestions based on numbering (1., 2., etc.) or dash lists (- )
          let completionsList = rawText
            .split(/\s*-\s*|\s*\d+\.\s*/) // 🔴 Split on numbered or dash-based lists
            .map(text => text.trim().replace(/^"(.*)"$/, "$1")) // 🔴 Remove unnecessary quotes
            .filter(text => text.length > 0) // 🔴 Remove empty entries
            .map((text, index) => ({ id: index, text })); // Convert to structured array format

          sendResponse({ completions: completionsList });

        }
      } catch (error) {
        console.error("Error fetching completions:", error);
        sendResponse({ error: "Failed to fetch completions." });
      }
    });

    return true; // Required for async sendResponse
  }
});


// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   console.log("Received message:", request);
  
//   if (request.action === "test_message") {
//     sendResponse({ success: true });
//   }
// });
