document.getElementById("toggle").addEventListener("click", () => {
    chrome.storage.sync.get("enabled", (data) => {
      const newState = !data.enabled;
      chrome.storage.sync.set({ enabled: newState }, () => {
        document.getElementById("toggle").textContent = newState ? "Disable" : "Enable";
      });
    });
  });
  