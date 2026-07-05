const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");
const datasetInput = document.getElementById("dataset");
const fileNameEl = document.getElementById("fileName");
const chatLog = document.getElementById("chatLog");
const sendBtn = document.getElementById("sendBtn");
const templateButtons = document.querySelectorAll("[data-template]");
const eyebrowEl = document.getElementById("eyebrow");
const heroTitleEl = document.getElementById("heroTitle");
const subcopyEl = document.getElementById("subcopy");
const phoneShell = document.querySelector(".phone");

const templates = {
  "data-analysis": {
    label: "Data Analysis Agent",
    title: "Chat With Your Data Copilot",
    subcopy:
      "Ask for statistics, data cleaning strategies, SQL, chart ideas, and model interpretation. Upload a CSV for richer context.",
    placeholder: "Ask a data analysis question...",
    intro:
      "Ready to help with data analysis. Try: \"Summarize trends in this CSV\" or \"Write pandas code for outlier detection\".",
    theme: "data-analysis",
    useServer: true,
  },
  "furniture-care": {
    label: "Furniture Customer Care",
    title: "Furniture Care & Sales Desk",
    subcopy:
      "Use this demo to show order help, delivery updates, materials, pricing, and warranty support for furniture customers.",
    placeholder: "Ask about sofas, delivery, or warranty...",
    intro:
      "Hello. I can help with furniture sales, delivery status, returns, materials, and product guidance.",
    theme: "furniture-care",
    useServer: false,
  },
  "hospital-care": {
    label: "Hospital Customer Care",
    title: "Hospital Support Desk",
    subcopy:
      "Use this demo to show appointment help, department guidance, billing support, and patient care information.",
    placeholder: "Ask about appointments or support...",
    intro:
      "Welcome to hospital support. I can help with appointments, department directions, billing, and patient assistance.",
    theme: "hospital-care",
    useServer: false,
  },
};

let activeTemplate = "data-analysis";

function clearChat() {
  chatLog.innerHTML = "";
}

function appendBubble(role, text) {
  const article = document.createElement("article");
  article.className = `bubble ${role}`;

  const p = document.createElement("p");
  p.textContent = text;
  article.appendChild(p);

  chatLog.appendChild(article);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setActiveTemplate(templateKey) {
  const template = templates[templateKey] || templates["data-analysis"];
  activeTemplate = templateKey in templates ? templateKey : "data-analysis";

  document.body.dataset.theme = template.theme;
  phoneShell.dataset.theme = template.theme;
  eyebrowEl.textContent = template.label;
  heroTitleEl.textContent = template.title;
  subcopyEl.textContent = template.subcopy;
  messageInput.placeholder = template.placeholder;

  templateButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.template === activeTemplate);
  });

  clearChat();
  appendBubble("assistant", template.intro);
}

function furnitureReply(message) {
  const lowered = message.toLowerCase();

  if (lowered.includes("price") || lowered.includes("cost") || lowered.includes("sale")) {
    return "I can help with current pricing, bundle offers, and sale items. Tell me which furniture piece you want, and I’ll show options.";
  }

  if (lowered.includes("deliver") || lowered.includes("shipping") || lowered.includes("order")) {
    return "I can check delivery timelines and order status for you. Share your order number or the product name to continue.";
  }

  if (lowered.includes("warranty") || lowered.includes("return")) {
    return "I can explain warranty coverage, returns, and replacement steps for furniture items.";
  }

  return "Thanks for contacting furniture customer care. I can help with product options, delivery, warranties, and sales questions.";
}

function hospitalReply(message) {
  const lowered = message.toLowerCase();

  if (lowered.includes("appointment") || lowered.includes("book")) {
    return "I can help with appointment booking, rescheduling, and visit timing. Tell me the department or preferred date.";
  }

  if (lowered.includes("bill") || lowered.includes("payment") || lowered.includes("insurance")) {
    return "I can guide you on billing, payment, and insurance support. Share the question and I’ll point you to the right desk.";
  }

  if (lowered.includes("emergency") || lowered.includes("urgent")) {
    return "If this is urgent, contact emergency services or your nearest hospital immediately. I can still help with non-emergency guidance.";
  }

  return "Thank you for reaching hospital support. I can help with appointments, billing, department directions, and patient assistance.";
}

datasetInput.addEventListener("change", () => {
  if (datasetInput.files.length > 0) {
    fileNameEl.textContent = datasetInput.files[0].name;
  } else {
    fileNameEl.textContent = "No file selected";
  }
});

templateButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTemplate(button.dataset.template);
  });
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

  const template = templates[activeTemplate] || templates["data-analysis"];
  let replyPromise;

  messageInput.value = "";

  try {
    if (template.useServer) {
      const formData = new FormData();
      formData.append("message", message);
      if (datasetInput.files.length > 0) {
        formData.append("dataset", datasetInput.files[0]);
      }

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
        replyPromise = Promise.resolve(data.error || "Request failed.");
      } else {
        replyPromise = Promise.resolve(data.reply || "No response received.");
      }
    } else {
      replyPromise = Promise.resolve(
        activeTemplate === "furniture-care" ? furnitureReply(message) : hospitalReply(message)
      );
    }

    const reply = await replyPromise;
    appendBubble("assistant", reply);
  } catch (error) {
    appendBubble("assistant", `Network error: ${error.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});

setActiveTemplate(activeTemplate);
