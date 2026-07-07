const bots = {
  support: {
    kicker: "Customer Care Bot",
    title: "Order support in seconds",
    status: "Online",
    placeholder: "Ask about an order...",
    messages: [
      ["bot", "Hi, I am Ava from support. Share your order number and I can check delivery, returns, or warranty status."],
      ["user", "My order is late. It was meant to arrive today."],
      ["bot", "I can help with that. Order #BF-2048 is in transit and the courier expects delivery between 3:00 PM and 5:30 PM."],
      ["bot", "Would you like me to send a tracking link or notify a human agent if it does not arrive?"]
    ],
    replies: [
      "Done. I created a support note and sent the tracking link to the customer.",
      "I can route this to a human agent with the full conversation summary and trigger a follow-up automation.",
      "Builds usually range from $200 to $800. Contact mugosammysam@gmail.com for a proper quote."
    ]
  },
  sales: {
    kicker: "Sales Assistant",
    title: "Qualify leads while you sleep",
    status: "Capturing leads",
    placeholder: "Ask for a product recommendation...",
    messages: [
      ["bot", "Welcome. Tell me what you are shopping for and I will recommend the right option."],
      ["user", "I need a chatbot for WhatsApp and my website."],
      ["bot", "Great fit. I would suggest a support and sales hybrid: FAQs, lead capture, quote request, and handoff to your team."],
      ["bot", "Can I collect your email and preferred launch date so the sales team can follow up?"]
    ],
    replies: [
      "Perfect. I saved the lead and tagged it as WhatsApp plus website.",
      "I would recommend a chatbot plus automation flow for lead capture, reminders, and team alerts.",
      "I can prepare a starter quote. Most chatbot builds range from $200 to $800."
    ]
  },
  hospital: {
    kicker: "Hospital Desk Bot",
    title: "Appointments with less waiting",
    status: "Desk open",
    placeholder: "Ask about booking...",
    messages: [
      ["bot", "Hello. I can help with appointments, departments, visiting hours, and billing questions."],
      ["user", "I want to book a dental appointment."],
      ["bot", "The dental clinic has openings tomorrow at 10:30 AM and 2:00 PM. Which time works for you?"],
      ["bot", "I can also send directions and a reminder two hours before the appointment."]
    ],
    replies: [
      "Booked. I sent a confirmation message and reminder to the patient.",
      "The next available dental slot is tomorrow at 10:30 AM, and the reminder can be automated.",
      "For a hospital desk bot, email mugosammysam@gmail.com to discuss the workflow."
    ]
  },
  furniture: {
    kicker: "Furniture Store Bot",
    title: "Guide buyers from catalog to delivery",
    status: "Catalog ready",
    placeholder: "Ask about furniture...",
    messages: [
      ["bot", "Hi. I can help you compare furniture, check stock, estimate delivery, or start a warranty claim."],
      ["user", "Do you have a compact sofa for a small apartment?"],
      ["bot", "Yes. I recommend the Luma two-seater: 162 cm wide, stain-resistant fabric, and delivery within 48 hours."],
      ["bot", "Would you like color options, a delivery quote, or a payment link?"]
    ],
    replies: [
      "I found three compact sofa options and can share photos, sizes, and prices.",
      "Delivery to your area is available this Friday between 9:00 AM and 1:00 PM, with automated updates.",
      "A store chatbot like this usually fits within the $200 to $800 development range."
    ]
  }
};

const pickerButtons = document.querySelectorAll(".bot-card");
const screen = document.querySelector(".phone__screen");
const chatLog = document.querySelector("#chatLog");
const botKicker = document.querySelector("#botKicker");
const botTitle = document.querySelector("#botTitle");
const botStatus = document.querySelector("#botStatus");
const messageInput = document.querySelector("#messageInput");
const composer = document.querySelector("#composer");

const labChatLog = document.querySelector("#labChatLog");
const labComposer = document.querySelector("#labComposer");
const labMessageInput = document.querySelector("#labMessageInput");

let activeBot = "support";
let replyIndex = 0;

const labStarterMessages = [
  ["bot", "Hi, I am the Automa Labs assistant. Ask me what we build, what we automate, or how much development costs."],
  ["user", "Can you help my business?"],
  ["bot", "Yes. I can explain chatbot ideas for support, sales, bookings, reminders, lead capture, and team handoffs."]
];

function getLabReply(message) {
  const text = message.toLowerCase();

  if (text.includes("price") || text.includes("cost") || text.includes("charge") || text.includes("budget") || text.includes("$")) {
    return "Automa Labs chatbot development usually ranges from $200 to $800 depending on channels, integrations, and conversation depth.";
  }

  if (text.includes("contact") || text.includes("email") || text.includes("call") || text.includes("reach")) {
    return "You can contact Automa Labs at mugosammysam@gmail.com. Share what you want the bot to do and which channel you need.";
  }

  if (text.includes("automation") || text.includes("automate") || text.includes("workflow") || text.includes("reminder")) {
    return "We can automate lead alerts, follow-up messages, appointment reminders, spreadsheet updates, CRM handoffs, and simple reporting flows.";
  }

  if (text.includes("whatsapp") || text.includes("telegram") || text.includes("website") || text.includes("web")) {
    return "We build bots for WhatsApp, Telegram, and websites. The best channel depends on where your customers already message you.";
  }

  if (text.includes("support") || text.includes("customer") || text.includes("faq") || text.includes("order")) {
    return "A support bot can answer FAQs, check order details, collect issue information, route requests, and prepare a summary for your team.";
  }

  if (text.includes("booking") || text.includes("appointment") || text.includes("hospital") || text.includes("calendar")) {
    return "A booking assistant can collect customer details, suggest available times, confirm appointments, and send automated reminders.";
  }

  if (text.includes("sales") || text.includes("lead") || text.includes("sell")) {
    return "A sales chatbot can qualify leads, recommend services, collect contact details, and notify your team when someone is ready to buy.";
  }

  return "Automa Labs builds chatbots and automations for real business tasks. Try asking about price, WhatsApp bots, booking bots, support bots, or workflow automation.";
}

function renderMessages(botKey) {
  const bot = bots[botKey];

  botKicker.textContent = bot.kicker;
  botTitle.textContent = bot.title;
  botStatus.textContent = bot.status;
  messageInput.placeholder = bot.placeholder;
  screen.dataset.theme = botKey;
  chatLog.innerHTML = "";

  bot.messages.forEach(([speaker, text]) => addMessage(speaker, text));
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addMessage(speaker, text) {
  const bubble = document.createElement("article");
  bubble.className = `bubble bubble--${speaker === "user" ? "user" : "bot"}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  bubble.appendChild(paragraph);
  chatLog.appendChild(bubble);
}

function addLabMessage(speaker, text) {
  const bubble = document.createElement("article");
  bubble.className = `bubble bubble--${speaker === "user" ? "user" : "bot"}`;

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  bubble.appendChild(paragraph);
  labChatLog.appendChild(bubble);
  labChatLog.scrollTop = labChatLog.scrollHeight;
}

function renderLabStarter() {
  labChatLog.innerHTML = "";
  labStarterMessages.forEach(([speaker, text]) => addLabMessage(speaker, text));
}

pickerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeBot = button.dataset.bot;
    replyIndex = 0;

    pickerButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    renderMessages(activeBot);
  });
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  messageInput.value = "";

  const bot = bots[activeBot];
  const reply = bot.replies[replyIndex % bot.replies.length];
  replyIndex += 1;

  window.setTimeout(() => {
    addMessage("bot", reply);
    chatLog.scrollTop = chatLog.scrollHeight;
  }, 380);

  chatLog.scrollTop = chatLog.scrollHeight;
});

labComposer.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = labMessageInput.value.trim();
  if (!message) return;

  addLabMessage("user", message);
  labMessageInput.value = "";

  window.setTimeout(() => {
    addLabMessage("bot", getLabReply(message));
  }, 320);
});

renderMessages(activeBot);
renderLabStarter();
