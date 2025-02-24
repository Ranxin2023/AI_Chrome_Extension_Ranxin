console.log("Content script loaded!");
document.addEventListener("input", (event) => {
  console.log("Text Content:", event.target.textContent);
  console.log("Event Target:", event.target);
  // if (event.target.tagName.toLowerCase() === "textarea" || event.target.type === "text") {
      chrome.runtime.sendMessage({ action: "fetchCompletions", text: event.target.textContent }, 
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("❌ Error sending message:", chrome.runtime.lastError);
            return;
          }
          console.log("✅ AI Suggestions:", response?.completions || "No suggestions received.");
          showAutocomplete(target, response.completions);
        }
      );
  // }
});

  function showAutocomplete(element, completions) {
    const suggestionBox = document.createElement("div");
    suggestionBox.className = "autocomplete-box";
    completions.forEach(suggestion => {
      const item = document.createElement("div");
      item.textContent = suggestion;
      item.onclick = () => {
        element.value = suggestion;
        document.body.removeChild(suggestionBox);
      };
      suggestionBox.appendChild(item);
    });
    document.body.appendChild(suggestionBox);
  }



// document.addEventListener("input", (event) => {
//   console.log("User input detected:", event.target.value);
//   console.log("Event Target:", event.target);
//   console.log("Text Content:", event.target.textContent);
//   chrome.runtime.sendMessage({ action: "fetchCompletions", text: event.target.textContent }, 
//     (response) => {
//       if (chrome.runtime.lastError) {
//         console.error("❌ Error sending message:", chrome.runtime.lastError);
//         return;
//       }
//       console.log("✅ AI Suggestions:", response?.completions || "No suggestions received.");
//     }
//   );
// });

// chrome.runtime.sendMessage({ action: "test_message" }, (response) => {
//   console.log("Response from background:", response);
// });
