const STORAGE_KEY = "yeasuCatOperatorJournal";
const journalStatus = document.querySelector("#journalStatus");
const journalList = document.querySelector("#journalList");
const refreshButton = document.querySelector("#refreshButton");
const exitButton = document.querySelector("#exitButton");

refreshButton.addEventListener("click", renderJournal);
exitButton.addEventListener("click", closeJournal);
window.addEventListener("focus", renderJournal);
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    renderJournal();
  }
});

renderJournal();

function closeJournal() {
  window.close();
  setTimeout(() => {
    if (!window.closed) {
      window.location.href = "/";
    }
  }, 120);
}

function loadEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(entries)
      ? entries.filter((entry) => String(entry?.note ?? "").trim())
      : [];
  } catch {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.filter((entry) => String(entry?.note ?? "").trim())));
}

function removeEntry(id) {
  const noteId = String(id ?? "");
  if (!noteId) {
    return;
  }

  const entries = loadEntries();
  const nextEntries = entries.filter((entry) => String(entry.id ?? "") !== noteId);
  if (nextEntries.length === entries.length) {
    return;
  }

  saveEntries(nextEntries);
  renderJournal();
}

function renderJournal() {
  const entries = loadEntries();
  journalList.replaceChildren();
  journalStatus.textContent = entries.length === 0
    ? "No stamped notes yet"
    : entries.length === 1
    ? "1 stamped note"
    : `${entries.length} stamped notes`;

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "journal-empty";
    empty.textContent = "Stamp notes from the run page and they will appear here newest first.";
    journalList.append(empty);
    return;
  }

  entries.forEach((entry, index) => {
    journalList.append(createJournalEntry(entry, index === 0));
  });
}

function createJournalEntry(entry, isCurrent) {
  const item = document.createElement("article");
  item.className = isCurrent ? "journal-entry current" : "journal-entry";

  const meta = document.createElement("div");
  meta.className = "journal-meta";

  const time = document.createElement("time");
  time.dateTime = entry.createdAt ?? "";
  time.textContent = formatTimestamp(entry.createdAt);

  const context = document.createElement("span");
  context.textContent = [
    entry.bandName ?? entry.bandId,
    entry.frequency,
    entry.mode
  ].filter(Boolean).join(" | ");

  const body = document.createElement("p");
  body.textContent = entry.note ?? "";

  const actions = document.createElement("div");
  actions.className = "journal-entry-actions";
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "Remove";
  removeButton.addEventListener("click", () => removeEntry(entry.id));
  actions.append(removeButton);

  meta.append(time, context);
  item.append(meta, body, actions);
  return item;
}

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}
