chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchCompletions") {
      fetch("https://api.example.com/autocomplete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: request.text })
      })
      .then(response => response.json())
      .then(data => sendResponse({ completions: data }))
      .catch(error => console.error("Error fetching completions:", error));
      return true;
    }
  });