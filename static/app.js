const form = document.querySelector("#search-form");
const queryInput = document.querySelector("#q");
const statusNode = document.querySelector("#status");
const resultsNode = document.querySelector("#results");
const pagerNode = document.querySelector("#pager");
const libraryNode = document.querySelector("#library");
const folderNode = document.querySelector("#folder");
const openFolderButton = document.querySelector("#open-folder");

let currentQuery = "";
let currentPage = 1;
let latestSavedPath = "";

document.addEventListener("play", (event) => {
  for (const audio of document.querySelectorAll("audio")) {
    if (audio !== event.target) audio.pause();
  }
}, true);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  search(queryInput.value.trim(), 1);
});

for (const button of document.querySelectorAll("[data-query]")) {
  button.addEventListener("click", () => {
    queryInput.value = button.dataset.query;
    search(button.dataset.query, 1);
  });
}

openFolderButton.addEventListener("click", async () => {
  openFolderButton.disabled = true;
  try {
    await api("/api/open-folder", { method: "POST" });
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    openFolderButton.disabled = false;
  }
});

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }
  return data;
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("error", isError);
}

async function search(query, page) {
  currentQuery = query;
  currentPage = page;
  setStatus(query ? `Searching for “${query}”…` : "Loading free songs…");
  resultsNode.replaceChildren();
  pagerNode.replaceChildren();
  try {
    const data = await api(`/api/search?q=${encodeURIComponent(query)}&page=${page}`);
    renderResults(data);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function renderResults(data) {
  const count = data.albums.length;
  if (!count) {
    const arabic = /[\u0600-\u06FF]/u.test(data.query) || data.query.toLowerCase() === "arabic";
    setStatus(arabic
      ? "No free-license Arabic songs matched. Songs from the radio, YouTube, or streaming apps are not in this catalog. Press عربي for free-license Arabic and Middle Eastern releases."
      : "No free songs matched that singer or title. Try the singer's last name, or a word like piano or عربي.");
    return;
  }
  const start = (data.page - 1) * 12 + 1;
  const end = start + count - 1;
  setStatus(`Showing ${start}–${end} of ${data.total.toLocaleString()} free releases.`);
  for (const album of data.albums) {
    resultsNode.append(renderAlbum(album));
  }
  renderPager(data);
}

function renderAlbum(album) {
  const item = document.createElement("li");
  item.className = "album";

  const main = document.createElement("div");
  main.className = "album-main";

  const copy = document.createElement("div");
  const title = document.createElement("h2");
  title.dir = "auto";
  const meta = document.createElement("p");
  meta.className = "meta";
  meta.dir = "auto";
  const singer = album.creator && album.creator !== "Unknown artist" ? album.creator : "";
  if (singer) {
    title.textContent = singer;
    meta.textContent = [album.title, album.year].filter(Boolean).join(" · ");
  } else {
    title.textContent = album.title;
    meta.textContent = album.year || "Singer not listed";
  }
  const license = document.createElement("span");
  license.className = "license";
  license.textContent = album.license.label;
  const note = document.createElement("p");
  note.className = "license-note";
  note.textContent = album.license.note;
  copy.append(title, meta, license, note);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = "Show songs";
  let panel = null;
  toggle.addEventListener("click", async () => {
    if (panel) {
      panel.remove();
      panel = null;
      toggle.textContent = "Show songs";
      return;
    }
    toggle.disabled = true;
    toggle.textContent = "Loading songs…";
    try {
      const release = await api(`/api/items/${encodeURIComponent(album.identifier)}`);
      panel = renderTracks(release);
      item.append(panel);
      toggle.textContent = "Hide songs";
    } catch (error) {
      toggle.textContent = "Show songs";
      setStatus(error.message, true);
    } finally {
      toggle.disabled = false;
    }
  });

  main.append(copy, toggle);
  item.append(main);
  return item;
}

function renderTracks(release) {
  const list = document.createElement("ol");
  list.className = "tracks";
  const songs = release.tracks.concat(release.others || []);
  if (!release.tracks.length) {
    const note = document.createElement("p");
    note.className = "notice";
    note.textContent = "This release has no MP3. The files below may not play in a car.";
    list.append(note);
  }
  songs.forEach((track, index) => list.append(renderTrack(release.identifier, track, index)));
  return list;
}

function renderTrack(identifier, track, index) {
  const row = document.createElement("li");
  row.className = "track";

  const number = document.createElement("span");
  number.className = "track-number";
  number.textContent = track.number || String(index + 1).padStart(2, "0");

  const title = document.createElement("div");
  const name = document.createElement("p");
  name.className = "track-title";
  name.dir = "auto";
  name.textContent = track.title;
  const artist = document.createElement("p");
  artist.className = "meta";
  artist.textContent = track.creator;
  title.append(name, artist);

  const facts = document.createElement("p");
  facts.className = "track-facts";
  facts.textContent = [track.format, track.duration, track.size].filter(Boolean).join(" · ");

  const actions = document.createElement("div");
  actions.className = "track-actions";
  const play = document.createElement("button");
  play.type = "button";
  play.className = "play";
  play.textContent = "Play";
  const download = document.createElement("button");
  download.type = "button";
  download.className = "download";
  download.textContent = "Download";

  let player = null;
  play.addEventListener("click", () => {
    if (player) {
      player.remove();
      player = null;
      play.textContent = "Play";
      return;
    }
    player = document.createElement("div");
    player.className = "player";
    const audio = document.createElement("audio");
    audio.controls = true;
    audio.preload = "none";
    audio.src = track.url;
    player.append(audio);
    row.append(player);
    play.textContent = "Hide player";
    audio.play().catch(() => {});
  });

  download.addEventListener("click", async () => {
    const errorNode = row.querySelector(".track-error");
    if (errorNode) errorNode.remove();
    download.disabled = true;
    download.textContent = "Saving…";
    try {
      const saved = await api("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, file: track.file }),
      });
      download.textContent = saved.alreadySaved ? "Already saved" : "Saved";
      latestSavedPath = saved.path;
      await loadLibrary();
    } catch (error) {
      download.disabled = false;
      download.textContent = "Download";
      const message = document.createElement("p");
      message.className = "track-error";
      message.textContent = error.message;
      row.append(message);
    }
  });

  actions.append(play, download);
  row.append(number, title, facts, actions);
  return row;
}

function renderPager(data) {
  pagerNode.replaceChildren();
  const pages = Math.max(1, Math.ceil(data.total / 12));
  if (pages < 2) return;
  const previous = document.createElement("button");
  previous.type = "button";
  previous.textContent = "Previous";
  previous.disabled = data.page <= 1;
  previous.addEventListener("click", () => search(currentQuery, data.page - 1));
  const label = document.createElement("span");
  label.textContent = `Page ${data.page} of ${Math.min(pages, 40).toLocaleString()}`;
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "Next";
  next.disabled = data.page >= Math.min(pages, 40);
  next.addEventListener("click", () => search(currentQuery, data.page + 1));
  pagerNode.append(previous, label, next);
}

async function loadLibrary() {
  try {
    const data = await api("/api/library");
    folderNode.textContent = data.folder;
    libraryNode.replaceChildren();
    if (!data.items.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No songs saved yet. Search, open a release, and press Download.";
      libraryNode.append(empty);
      return;
    }
    for (const item of data.items) {
      const row = document.createElement("li");
      if (item.path === latestSavedPath) row.classList.add("is-new");
      const title = document.createElement("strong");
      title.textContent = item.title;
      const meta = document.createElement("span");
      meta.textContent = [item.creator, item.size].filter(Boolean).join(" · ");
      row.append(title, document.createElement("br"), meta);
      libraryNode.append(row);
    }
  } catch (error) {
    folderNode.textContent = error.message;
  }
}

search("", 1);
loadLibrary();
