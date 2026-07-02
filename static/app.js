const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");
const datasetInput = document.getElementById("dataset");
const fileNameEl = document.getElementById("fileName");
const chatLog = document.getElementById("chatLog");
const sendBtn = document.getElementById("sendBtn");

function appendBubble(role, text) {
  const article = document.createElement("article");
  article.className = `bubble ${role}`;

  const p = document.createElement("p");
  p.textContent = text;
  article.appendChild(p);

  chatLog.appendChild(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

datasetInput.addEventListener("change", () => {
  if (datasetInput.files.length > 0) {
    fileNameEl.textContent = datasetInput.files[0].name;
  } else {
    fileNameEl.textContent = "No file selected";
  }
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) {
    return;
  }

  appendBubble("user", message);
  sendBtn.disabled = true;
  sendBtn.textContent = "Thinking...";

  const formData = new FormData();
  formData.append("message", message);
  if (datasetInput.files.length > 0) {
    formData.append("dataset", datasetInput.files[0]);
  }

  messageInput.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      body: formData,
    });

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Server returned non-JSON response (${response.status}). ${text.slice(0, 120)}`);
    }

    if (!response.ok) {
      appendBubble("assistant", data.error || "Request failed.");
    } else {
      appendBubble("assistant", data.reply || "No response received.");
    }
  } catch (error) {
    appendBubble("assistant", `Network error: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});
