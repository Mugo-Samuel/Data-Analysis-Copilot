const GREETINGS = [
  "hi", "hi there", "hello","hae", "hello there", "hey", "hey there", "heya",
  "hiya", "yo", "sup", "whats up", "what's up", "howdy", "greetings",
  "good morning", "good afternoon", "good evening", "morning", "evening",
  "hola", "afternoon"
];

const THANKS = ["thanks", "thank you", "thx", "ty", "appreciate it", "cheers"];
const BYES = ["bye", "goodbye", "see you", "later", "cya", "farewell"];

const CONTACT_EMAIL = "automatebots.io@gmail.com";

// Normalize a message for matching: lowercase, strip punctuation, collapse spaces.
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[!?.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGreeting(text) {
  const clean = normalize(text);
  return GREETINGS.some(
    (g) => clean === g || clean.startsWith(g + " ") || clean.endsWith(" " + g)
  );
}

function isThanks(text) {
  const clean = normalize(text);
  return THANKS.some((t) => clean.includes(t));
}

function isBye(text) {
  const clean = normalize(text);
  return BYES.some((b) => clean === b || clean.startsWith(b + " "));
}

// Find the best matching topic reply for a bot given raw user text.
// Falls back to a message that restates what the bot handles and points
// to the contact email for anything outside that scope.
function findReply(bot, rawText) {
  const clean = normalize(rawText);

  if (isGreeting(rawText)) {
    return bot.greeting;
  }

  if (isThanks(rawText)) {
    return bot.thanks || "You're welcome! Let me know if there's anything else I can help with.";
  }

  if (isBye(rawText)) {
    return bot.goodbye || "Thanks for chatting! Reach out any time you need help.";
  }

  const topic = bot.topics.find((t) => t.keywords.some((k) => clean.includes(k)));
  if (topic) {
    return topic.reply;
  }

  return bot.fallback;
}

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
    greeting: "Hi there! I'm Ava from support. I can help with order tracking, returns, or warranty questions — what do you need?",
    thanks: "Happy to help! Let me know if there's anything else about your order.",
    goodbye: "Take care! Reach back out any time you need an order checked.",
    topics: [
      { keywords: ["track", "order", "delivery", "shipping", "late", "where is", "arrive"], reply: "I can pull that up. Order #BF-2048 is in transit and the courier expects delivery between 3:00 PM and 5:30 PM." },
      { keywords: ["return", "refund", "exchange", "send back"], reply: "No problem. I can start a return for you — just confirm the order number and the reason, and I'll email a prepaid label." },
      { keywords: ["warranty", "broken", "damaged", "defect", "not working"], reply: "Sorry to hear that. I can open a warranty claim now — could you share a quick photo of the issue and your order number?" },
      { keywords: ["human", "agent", "person", "someone", "representative"], reply: "Of course, I can route this to a human agent along with a summary of our conversation. One moment." },
      { keywords: ["cancel"], reply: "I can help cancel an order as long as it hasn't shipped yet. What's the order number?" }
    ],
    fallback: `I'm Ava, a support bot — I handle order tracking, returns, and warranty claims. That question is outside what I can look up here, so please email ${CONTACT_EMAIL} and our team will help directly.`
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
    greeting: "Hey! Welcome in. Tell me a bit about what you're shopping for and I'll point you to the right option.",
    thanks: "Anytime! I'll save these details so the sales team has context when they follow up.",
    goodbye: "Thanks for stopping by — I've saved your details and someone will follow up soon.",
    topics: [
      { keywords: ["whatsapp", "telegram", "website", "web", "channel"], reply: "Good choice. I'd suggest a support and sales hybrid: FAQs, lead capture, quote requests, and handoff to your team." },
      { keywords: ["price", "cost", "budget", "quote", "$"], reply: "I can prepare a starter quote. Most chatbot builds range from $200 to $800 depending on scope." },
      { keywords: ["email", "contact", "follow up", "reach out"], reply: "Great — could you share your email and preferred launch date so the sales team can follow up?" },
      { keywords: ["automation", "automate", "workflow", "reminder"], reply: "We can pair the chatbot with automations for lead alerts, reminders, and CRM updates." },
      { keywords: ["demo", "trial", "test"], reply: "I can set up a quick demo — what's the best email to send it to?" }
    ],
    fallback: `I'm the sales assistant — I help with product recommendations, pricing, and lead capture. For anything outside that, email ${CONTACT_EMAIL} and our team can help directly.`
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
    greeting: "Hello! I can help with appointments, departments, visiting hours, or billing — what do you need today?",
    thanks: "You're welcome! Let me know if you'd like anything else arranged.",
    goodbye: "Take care, and see you at your appointment!",
    topics: [
      { keywords: ["appointment", "book", "booking", "schedule", "dental", "doctor", "clinic"], reply: "I can help with that. The next available slot is tomorrow at 10:30 AM or 2:00 PM — which works better for you?" },
      { keywords: ["visiting hours", "visit", "hours"], reply: "Visiting hours are 9:00 AM to 8:00 PM daily. Some wards may have different rules, so let me know which department." },
      { keywords: ["bill", "billing", "invoice", "payment", "insurance"], reply: "I can pull up billing details if you share your patient ID, or connect you to the billing desk directly." },
      { keywords: ["emergency", "urgent"], reply: "For a medical emergency, please call emergency services or go to the nearest ER right away — I'm not able to handle urgent care requests here." },
      { keywords: ["reminder", "confirm", "cancel appointment"], reply: "I can send a confirmation and a reminder two hours before your appointment, or help cancel/reschedule it." }
    ],
    fallback: `I'm the front desk bot — I handle appointments, departments, visiting hours, and billing questions. That's outside what I can help with here, so please email ${CONTACT_EMAIL} for more clarification.`
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
    greeting: "Hi there! I can help you compare pieces, check stock, or estimate delivery — what are you shopping for?",
    thanks: "Glad I could help! Let me know if you'd like anything else sorted out.",
    goodbye: "Thanks for stopping by — happy to help again whenever you're ready to order.",
    topics: [
      { keywords: ["sofa", "couch", "chair", "table", "bed", "compact", "apartment"], reply: "I recommend the Luma two-seater: 162 cm wide, stain-resistant fabric, and delivery within 48 hours. Want to see color options?" },
      { keywords: ["stock", "available", "in stock"], reply: "Let me check — could you tell me the item name or SKU so I can confirm stock?" },
      { keywords: ["delivery", "shipping", "arrive"], reply: "Delivery to your area is available this Friday between 9:00 AM and 1:00 PM, with automated updates along the way." },
      { keywords: ["warranty", "damaged", "broken", "defect"], reply: "Sorry about that. I can start a warranty claim now — could you share your order number and a photo of the issue?" },
      { keywords: ["price", "cost", "how much"], reply: "Prices vary by piece — tell me which item you're interested in and I'll pull up the exact price." },
      { keywords: ["payment", "pay", "checkout"], reply: "I can send a secure payment link once you've picked your item and color." }
    ],
    fallback: `I'm the furniture store bot — I help with product recommendations, stock, delivery, and warranty questions. For anything else, email ${CONTACT_EMAIL} and our team can clarify.`
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

const labStarterMessages = [
  ["bot", "Hi, I am the Omisbots assistant. Ask me what we build, what we automate, or how much development costs."],
  ["user", "Can you help my business?"],
  ["bot", "Yes. We build AI-powered chatbots that help businesses automate support, increase sales, manage bookings, and deliver better customer experiences"]
];

const labBot = {
  greeting: "Hey there! I'm the Omisbots assistant. Ask me about pricing and automations, or the kind of bot you need.",
  thanks: "You're welcome! Anything else you'd like to know?",
  goodbye: "Thanks for chatting — reach out any time you're ready to build.",
  topics: [
    { keywords: ["price","pricing", "cost", "charge", "budget", "$"], reply: "Chatbot development usually ranges from $200 to $800 depending on channels, integrations, and conversation depth." },
    { keywords: ["contact", "email", "call", "reach"], reply: `You can reach us at ${CONTACT_EMAIL}. Share what you want the bot to do and which channel you need.` },
    { keywords: ["automation", "automate", "workflow", "reminder"], reply: "We can automate lead alerts, follow-up messages, appointment reminders, spreadsheet updates, CRM handoffs, and simple reporting flows." },
    { keywords: ["whatsapp","channels", "telegram", "website", "web"], reply: "We build bots for WhatsApp, Telegram, and websites. The best channel depends on where your customers already message you." },
    { keywords: ["support", "customer", "faq", "order"], reply: "A support bot can answer FAQs, check order details, collect issue information, route requests, and prepare a summary for your team." },
    { keywords: ["booking", "appointment", "hospital", "calendar"], reply: "A booking assistant can collect customer details, suggest available times, confirm appointments, and send automated reminders." },
    { keywords: ["sales", "lead", "sell"], reply: "A sales chatbot can qualify leads, recommend services, collect contact details, and notify your team when someone is ready to buy." },
    { keywords: ["time", "how long", "timeline", "turnaround"], reply: "Most builds take one to two weeks depending on complexity and how many integrations are involved." }
  ],
  fallback: `I'm the Omsibots assistant — I explain chatbot builds, automations, and pricing, so I'm not able to help with that here. For more clarification, email ${CONTACT_EMAIL}.`
};

function getLabReply(message) {
  return findReply(labBot, message);
}

// --- Typing indicator helpers -------------------------------------------
// Shows a bouncing three-dot bubble in the given log while a reply is
// "being written", then removes it right before the real bubble appends.
function showTyping(logEl) {
  const typing = document.createElement("div");
  typing.className = "typing";
  typing.innerHTML = "<span></span><span></span><span></span>";
  logEl.appendChild(typing);
  logEl.scrollTop = logEl.scrollHeight;
  return typing;
}

function removeTyping(typingEl) {
  if (typingEl && typingEl.parentNode) {
    typingEl.parentNode.removeChild(typingEl);
  }
}
// --------------------------------------------------------------------------

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
  chatLog.scrollTop = chatLog.scrollHeight;

  const bot = bots[activeBot];
  const reply = findReply(bot, message);

  const typingEl = showTyping(chatLog);

  window.setTimeout(() => {
    removeTyping(typingEl);
    addMessage("bot", reply);
    chatLog.scrollTop = chatLog.scrollHeight;
  }, 900);
});

labComposer.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = labMessageInput.value.trim();
  if (!message) return;

  addLabMessage("user", message);
  labMessageInput.value = "";

  const typingEl = showTyping(labChatLog);

  window.setTimeout(() => {
    removeTyping(typingEl);
    addLabMessage("bot", getLabReply(message));
  }, 850);
});

renderMessages(activeBot);
renderLabStarter();
