document.addEventListener("input", (event) => {
    if (event.target.tagName.toLowerCase() === "textarea" || event.target.type === "text") {
      chrome.runtime.sendMessage({ action: "fetchCompletions", text: event.target.value }, (response) => {
        if (response && response.completions) {
          showAutocomplete(event.target, response.completions);
        }
      });
    }
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