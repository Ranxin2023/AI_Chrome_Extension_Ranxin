console.log("Content script loaded!");
let latestQuery = ""; // Store the latest query to prevent outdated results
let completions = [];
let selectedIndex = -1; // Keep track of selected suggestion globally
let suggestionBox = null; // Track the suggestion box globally
let activeElement=null;
document.addEventListener("input", (event) => {
    const target = event.target;

    // Use `value` instead of `textContent` for text inputs
    const inputText = target.value || target.textContent; 
    // console.log("Text Content:", inputText);

    if (!inputText.trim()) {
        hideSuggestionBox(); // Close suggestions if input is empty
        return;
    }

    latestQuery = inputText; // Store the latest text input

    chrome.runtime.sendMessage({ action: "fetchCompletions", text:inputText }, (response) => {
        if (!response || !response.completions) {
            console.log("No suggestions received.");
            hideSuggestionBox(); // Hide suggestions if none received
            return;
        }

        // Ensure only the latest completion request is used
        if (inputText !== latestQuery) {
            console.log("Ignoring outdated completion result.");
            return;
        }

        // console.log("✅ AI Suggestions:", response.completions);
        
        // Reset selectedIndex to avoid inserting old suggestions
        selectedIndex = -1;
        
        showAutocomplete(target, response.completions || []);
    });
});

function hideSuggestionBox() {
  if (suggestionBox) {
      suggestionBox.remove();
      suggestionBox = null; // Reset global reference
      selectedIndex = -1; // Reset selection index
  }
}

function showAutocomplete(element, newCompletions) {
  // console.log("Completions: ", newCompletions)
    // Remove any existing suggestion box
    hideSuggestionBox()
    if(!newCompletions||newCompletions.length==0){
      return;
    }
    completions = newCompletions;
    activeElement=element
    // Create suggestion box
    suggestionBox = document.createElement("div");
    suggestionBox.className = "autocomplete-box";
    suggestionBox.style.position = "absolute";
    suggestionBox.style.background = "#fff";
    suggestionBox.style.border = "1px solid #ccc";
    suggestionBox.style.padding = "5px";
    suggestionBox.style.boxShadow = "0px 4px 6px rgba(0,0,0,0.1)";
    suggestionBox.style.zIndex = "1000";
    suggestionBox.style.cursor = "pointer";
    suggestionBox.style.maxWidth = "300px"; // Optional: Set max width for better visibility
    suggestionBox.style.wordWrap = "break-word";

    // Get cursor position in text area
    const rect = getCaretCoordinates(element);
    suggestionBox.style.left = `${rect.left}px`;
    suggestionBox.style.top = `${rect.top + rect.height + 5}px`; // Position below cursor
    
    // Populate suggestions
    completions.forEach((suggestion, index) => {
        const item = document.createElement("div");
        item.textContent = suggestion.text;
        item.style.padding = "5px";
        item.style.borderBottom = "1px solid #eee";
        item.style.background = "#fff";

        // Mouse hover updates `selectedIndex`
        item.onmouseover = () => {
            selectedIndex = index;
            highlightItem(selectedIndex);
            // console.log("Mouse hover selected index:", selectedIndex);
        };

        // Click event to insert suggestion
        item.onclick = () => {
            insertAtCursor(element, suggestion.text);
            element.focus();
            suggestionBox.remove();
            selectedIndex = -1;
        };

        suggestionBox.appendChild(item);
    });

    document.body.appendChild(suggestionBox);

    // Ensure no duplicate keydown event listeners
    window.addEventListener("keydown", handleKeydown, true);

    // Close the suggestion box when clicking outside
    document.addEventListener("click", (event) => {
        if (!suggestionBox.contains(event.target)) {
            suggestionBox.remove();
            selectedIndex = -1;
        }
    }, { once: true });
}

function handleKeydown(event) {
  
  // console.log("Key is", event.key)
  // console.log("Selected index is ", selectedIndex)
  event.stopImmediatePropagation(); // Prevent duplicate event firing
  const items = suggestionBox.querySelectorAll("div");
  const itemLength=items.length
  // console.log("Item length is", itemLength)
  if (itemLength === 0) return;

  if (event.key === "ArrowDown") {
      event.preventDefault(); // Prevent cursor from moving
      selectedIndex = (selectedIndex + 1) % itemLength;
      highlightItem(selectedIndex);
      // console.log("Key is ArrowDown. Selected index:", selectedIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectedIndex = (selectedIndex - 1 + itemLength) % itemLength;
      highlightItem(selectedIndex);
      // console.log("Key is ArrowUp. Selected index:", selectedIndex);
  } else if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      // console.log("Enter key of text is", completions[selectedIndex].text)
      // console.log("Completion in enter is", completions)
      insertAtCursor(activeElement, completions[selectedIndex].text);
      activeElement.focus();
      suggestionBox.remove();
      selectedIndex = -1;
  } else if (event.key === "Escape") {
      suggestionBox.remove();
      selectedIndex = -1;
  }

  // Remove listener when suggestion box is removed
  if (!document.body.contains(suggestionBox)) {
      document.removeEventListener("keydown", handleKeydown);
      document.keydownListenerAdded = false;
  }
}

function highlightItem(index) {
  const items = suggestionBox.querySelectorAll("div");
  items.forEach((item, i) => {
      item.style.background = i === index ? "#d3d3d3" : "#fff";
  });
}

function getCaretCoordinates(element) {
  const rect = element.getBoundingClientRect();
  const selection = window.getSelection();

  if (!selection.rangeCount) {
      return { left: rect.left, top: rect.top, height: 20 };
  }

  const range = selection.getRangeAt(0);
  const dummy = document.createElement("span");
  range.insertNode(dummy);

  const dummyRect = dummy.getBoundingClientRect();
  dummy.remove();

  return {
      left: dummyRect.left + window.scrollX,
      top: dummyRect.top + window.scrollY,
      height: dummyRect.height
  };
}

// function insertAtCursor(element, text) {
//   if (document.activeElement !== element) {
//       element.focus();
//   }

//   if (element.setRangeText) {
//       // For textarea and input fields
//       const start = element.selectionStart;
//       const end = element.selectionEnd;

//       element.setRangeText(text, start, end, "end");
//       element.selectionStart = element.selectionEnd = start + text.length;
//   } else if (document.execCommand) {
//       // For content-editable elements
//       document.execCommand("insertText", false, text);
//   } else {
//       // Fallback for unsupported cases
//       element.value += text;
//   }
// }



function insertAtCursor(element, suggestionText) {
  if (document.activeElement !== element) {
      element.focus();
  }
  // console.log("Element nodename is", element.nodeName)
  // console.log("suggestion text is", suggestionText)
  if (element.nodeName === "INPUT" || element.nodeName === "TEXTAREA") {
      // Handle input and textarea fields
      const currentText = element.value || "";
      const cursorPosition = element.selectionStart || 0;

      // Extract existing text before and after cursor
      const textBeforeCursor = currentText.substring(0, cursorPosition);
      const textAfterCursor = currentText.substring(cursorPosition);
      // console.log("Text Before Cursor", textBeforeCursor)
      // console.log("Text After Cursor", textAfterCursor)
      // Find common prefix and remove it from completion
      const wordsBeforeCursor = textBeforeCursor.split(/\s+/);
      const lastWord = wordsBeforeCursor[wordsBeforeCursor.length - 1]; // Get last word
      let completionPart = suggestionText.startsWith(lastWord)
          ? suggestionText.substring(lastWord.length).trim()
          : suggestionText; // Remove prefix if it matches

      if (completionPart.trim() === "") return; // Prevent inserting if nothing new

      // Insert only the new part of the suggestion
      const newText = textBeforeCursor + completionPart + textAfterCursor;
      element.value = newText;

      // Move cursor after inserted text
      element.selectionStart = element.selectionEnd = textBeforeCursor.length + completionPart.length;
  } else if (element.isContentEditable) {
      // Handle contenteditable divs (e.g., Gmail, chat editors)
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      const cursorPosition = range.startOffset;

      // Get existing text before the cursor
      const textBeforeCursor = node.textContent.substring(0, cursorPosition);
      // console.log("Text Before Cursor", textBeforeCursor)
      // Extract the last word before the cursor
      // const lastWord = textBeforeCursor.split(/\s+/).slice(-1)[0];
      
      // console.log("Last word", lastWord)
      // // Remove the existing part of the suggestion
      // let completionPart = suggestionText.startsWith(lastWord)
      //     ? suggestionText.substring(lastWord.length).trim()
      //     : suggestionText;
      let completionPart=suggestionText.substring(cursorPosition)
      // console.log("Completion part", completionPart)
      if (completionPart.trim() === "") return;

      // Insert only the remaining completion
      const newText = textBeforeCursor + completionPart;

      // Replace text in the node
      node.textContent = newText;

      // Move cursor after the inserted text
      const newRange = document.createRange();
      newRange.setStart(node, newText.length);
      newRange.setEnd(node, newText.length);
      selection.removeAllRanges();
      selection.addRange(newRange);
  }
}
