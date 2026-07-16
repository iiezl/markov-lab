const $ = (selector) => document.querySelector(selector);

// ---------------------------
// Elements
// ---------------------------

const trainingEntries = $("#trainingEntries");
const addEntry = $("#addEntry");
const fileInput = $("#fileInput");

const trainBtn = $("#trainBtn");
const order = $("#order");

const generateBtn = $("#generate");
const generatedText = $("#generatedText");
const startWord = $("#startWord");
const length = $("#length");
const copyOutput = $("#copyOutput");

const chat = $("#chat");
const chatInput = $("#chatInput");
const sendChat = $("#sendChat");

const walkBox = $("#walked");
const walkChoices = $("#choices");
const startWalk = $("#startWalk");
const resetWalk = $("#resetWalk");
const autoWalk = $("#autoWalk");

const statWords = $("#statWords");
const statStates = $("#statStates");
const statTransitions = $("#statTransitions");
const statBranching = $("#statBranching");
const statDeadEnds = $("#statDeadEnds");

const saveModel = $("#saveModel");
const loadModel = $("#loadModel");
const loadModelInput = $("#loadModelInput");
const trainingProgress = $("#trainingProgress");
const trainingProgressText = $("#trainingProgressText");

const graphView = $("#graphView");
const themeToggle = $("#themeToggle");

// ---------------------------
// App
// ---------------------------

const trainer = new Trainer(Number(order.value));
let generator = new Generator(trainer.model);
let chatbot = new ChatBot(trainer.model);
const walk = new WalkSession(trainer.model);
const graph = new Graph(graphView);

// ---------------------------
// Helpers
// ---------------------------

function refreshModel() {
  generator.setModel(trainer.model);
  chatbot.setModel(trainer.model);
  walk.setModel(trainer.model);

  graph.render(trainer.model);
  updateStatistics();
}

function renderWalk() {
  walkBox.textContent =
    walk.text() || "No active walk. Start a new sequence to continue.";
  walkChoices.innerHTML = "";
  graph.focus(walk.state);

  for (const choice of walk.getChoices()) {
    const button = document.createElement("button");
    button.className = "choice";
    button.textContent = `${choice.word} (${(choice.probability * 100).toFixed(1)}%)`;

    button.onclick = () => {
      walk.choose(choice.word);
      renderWalk();
    };

    walkChoices.appendChild(button);
  }
}

function updateStatistics() {
  const stats = Statistics.analyze(trainer.model);

  statWords.textContent = stats.words.toLocaleString();
  statStates.textContent = stats.states.toLocaleString();
  statTransitions.textContent = stats.transitions.toLocaleString();
  statBranching.textContent = stats.averageBranching.toFixed(2);
  statDeadEnds.textContent = stats.deadEnds.toLocaleString();
}

function addMessage(type, text) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  div.textContent = text;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function setTrainingProgress(percent, label) {
  if (!trainingProgress || !trainingProgressText) return;

  trainingProgress.value = percent;
  trainingProgressText.textContent = label;
}

function showTrainingProgress() {
  trainingProgress?.parentElement?.classList.remove("hidden");
}

function hideTrainingProgress() {
  trainingProgress?.parentElement?.classList.add("hidden");
}

function download(filename, text) {
  const blob = new Blob([text], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

// ---------------------------
// Training entries
// ---------------------------

let entrySeq = 0;
const entries = [];

function summarize(text, wordLimit = 10) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const count = words.length;

  if (!count) {
    return { preview: "(empty — bold strategy)", count };
  }

  const preview =
    words.slice(0, wordLimit).join(" ") + (count > wordLimit ? "…" : "");

  return { preview, count };
}

function renderEntries() {
  trainingEntries.innerHTML = "";

  entries.forEach((entry) => {
    const details = document.createElement("details");
    details.className = "entry";
    details.open = entry.open;

    const summary = document.createElement("summary");
    const preview = document.createElement("span");
    preview.className = "entry-preview";

    const count = document.createElement("span");
    count.className = "entry-count";

    summary.appendChild(preview);
    summary.appendChild(count);
    details.appendChild(summary);

    const body = document.createElement("div");
    body.className = "entry-body";

    const textarea = document.createElement("textarea");
    textarea.placeholder =
      "Paste source text here. The model will analyze the provided material.";
    textarea.value = entry.text;

    function refreshSummary() {
      const { preview: text, count: n } = summarize(entry.text);
      preview.textContent = text;
      count.textContent = `${n.toLocaleString()} word${n === 1 ? "" : "s"}`;
    }

    textarea.oninput = () => {
      entry.text = textarea.value;
      refreshSummary();
    };

    body.appendChild(textarea);

    if (entries.length > 1) {
      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "entry-remove";
      removeBtn.textContent = "Remove passage";

      removeBtn.onclick = () => {
        const idx = entries.indexOf(entry);

        if (idx !== -1) entries.splice(idx, 1);

        renderEntries();
      };

      body.appendChild(removeBtn);
    }

    details.appendChild(body);
    details.addEventListener("toggle", () => {
      entry.open = details.open;
    });

    refreshSummary();
    trainingEntries.appendChild(details);
  });
}

function addTrainingEntry(text = "") {
  entries.push({ id: entrySeq++, text, open: true });
  renderEntries();
}

addEntry.onclick = () => addTrainingEntry();

// Start with one open passage so there's something to type into.
addTrainingEntry();

// ---------------------------
// Training
// ---------------------------

trainBtn.onclick = async () => {
  trainer.setOrder(order.value);

  const sources = entries.map((entry) => entry.text.trim()).filter(Boolean);

  if (fileInput.files.length) {
    const files = await trainer.readFiles(fileInput.files);
    sources.push(...files);
  }

  if (!sources.length) {
    alert(
      "Please provide at least one source passage before training the model.",
    );
    return;
  }

  trainBtn.disabled = true;
  showTrainingProgress();
  setTrainingProgress(0, "Preparing training...");

  for (let index = 0; index < sources.length; index += 1) {
    trainer.train(sources[index]);

    const percent = Math.round(((index + 1) / sources.length) * 100);
    setTrainingProgress(
      percent,
      `Training ${index + 1} of ${sources.length} (${percent}%)`,
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  refreshModel();
  setTrainingProgress(100, "Training complete");

  await new Promise((resolve) => setTimeout(resolve, 300));

  hideTrainingProgress();
  trainBtn.disabled = false;

  alert("Training complete. The model has been updated.");
};

// ---------------------------
// Generator
// ---------------------------

generateBtn.onclick = () => {
  generatedText.textContent = generator.generate(startWord.value, length.value);
};

copyOutput.onclick = async () => {
  if (!generatedText.textContent) return;

  const ok = await generator.copy(generatedText.textContent);

  if (ok) {
    copyOutput.textContent = "Copied ✓";

    setTimeout(() => {
      copyOutput.textContent = "Copy";
    }, 1200);
  }
};

// ---------------------------
// Chat
// ---------------------------

function send() {
  const message = chatInput.value.trim();

  if (!message) return;

  addMessage("user", message);

  const reply = chatbot.reply(message);
  addMessage("bot", reply);

  chatInput.value = "";
}

sendChat.onclick = send;

chatInput.onkeydown = (event) => {
  if (event.key === "Enter") {
    send();
  }
};

// ---------------------------
// Walk
// ---------------------------
startWalk.onclick = () => {
  walk.randomStart();
  renderWalk();
};

resetWalk.onclick = () => {
  walk.reset();
  renderWalk();
};

autoWalk.onclick = () => {
  walk.auto();
  renderWalk();
};

// ---------------------------
// Save
// ---------------------------

saveModel.onclick = () => {
  download("markov-model.json", trainer.exportModel());
};

// ---------------------------
// Load
// ---------------------------

loadModel.onclick = () => {
  loadModelInput.click();
};

loadModelInput.onchange = async () => {
  const file = loadModelInput.files[0];

  if (!file) return;

  const text = await file.text();
  trainer.importModel(text);

  refreshModel();

  alert("Model loaded. Hope you remember what you fed it.");
};

// ---------------------------
// Theme
// ---------------------------

const THEME_KEY = "markov-lab-theme";

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);

  themeToggle.textContent = theme === "dark" ? "☀ Light mode" : "◐ Dark mode";
  graph.applyTheme();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
}

// Sync the button label / graph colors with whatever the inline
// head script already applied, so there's no flash or mismatch.
setTheme(document.documentElement.getAttribute("data-theme") || "light");

themeToggle.onclick = toggleTheme;

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "q") return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const target = document.activeElement;
  const typing =
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable);

  if (typing) return;

  toggleTheme();
});
