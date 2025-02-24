console.log("Popup script loaded!");
document.getElementById("toggle").addEventListener("click", () => {
    chrome.storage.sync.get("enabled", (data) => {
      const newState = !data.enabled;
      chrome.storage.sync.set({ enabled: newState }, () => {
        document.getElementById("toggle").textContent = newState ? "Disable" : "Enable";
      });
    });
  });
  

// document.addEventListener("DOMContentLoaded", () => {
//     document.getElementById("testButton").addEventListener("click", () => {
//         console.log("Button Clicked!");
//         chrome.runtime.sendMessage({ action: "test_message_from_popup" }, (response) => {
//             console.log("Response from background:", response);
//         });
//     });
// });
