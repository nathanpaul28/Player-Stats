let players = [];
let currentFormat = "test";

const tabs = document.querySelectorAll(".tab");
const roleFilter = document.getElementById("roleFilter");
const countryFilter = document.getElementById("countryFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");
const playerContainer = document.getElementById("playerContainer");
const darkModeToggle = document.getElementById("darkModeToggle");

// ✅ Load player data
fetch("data/player.json") // make sure it's "players.json"
  .then(res => res.json())
  .then(data => {
    players = data;
    displayPlayers();
  })
  .catch(err => console.error("Error loading players:", err));

// ✅ Tab switching (Test / ODI / T20)
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    currentFormat = tab.getAttribute("data-format");
    displayPlayers();
  });
});

// ✅ Filters and search listeners
[roleFilter, countryFilter, sortFilter].forEach(filter => {
  if (filter) filter.addEventListener("change", displayPlayers);
});
if (searchInput) searchInput.addEventListener("input", displayPlayers);

// ✅ Dark Mode Toggle
if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkModeToggle.textContent =
      document.body.classList.contains("dark")
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
  });
}

// ✅ Display players
function displayPlayers() {
  playerContainer.innerHTML = "";

  const selectedRole = roleFilter ? roleFilter.value : "all";
  const selectedCountry = countryFilter ? countryFilter.value : "all";
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
  const sortBy = sortFilter ? sortFilter.value : "none";

  let filtered = players.filter(
    (p) =>
      (selectedRole === "all" || p.role === selectedRole) &&
      (selectedCountry === "all" || p.country === selectedCountry) &&
      p.name.toLowerCase().includes(searchTerm)
  );

  if (sortBy !== "none") {
    filtered.sort((a, b) => {
      const statsA = a.stats && a.stats[currentFormat] ? a.stats[currentFormat] : {};
      const statsB = b.stats && b.stats[currentFormat] ? b.stats[currentFormat] : {};
      return (statsB[sortBy] || 0) - (statsA[sortBy] || 0);
    });
  }

  if (filtered.length === 0) {
    playerContainer.innerHTML = `<p style="text-align:center;">No players found.</p>`;
    return;
  }

  filtered.forEach((player) => {
    const stats = player.stats && player.stats[currentFormat];
    if (!stats) return;

    const card = document.createElement("div");
    card.classList.add("player-card");
    card.innerHTML = `
      <img src="${player.image || ''}" alt="${player.name}" class="player-img">
      <div class="player-header">
        <img src="${getFlag(player.country)}" alt="${player.country} flag">
        <strong>${player.name}</strong>
      </div>
      <div class="player-stats">
        <p><b>Country:</b> ${player.country}</p>
        <p><b>Role:</b> ${capitalize(player.role)}</p>
        <p><b>Matches:</b> ${stats.matches ?? 0}</p>
        <p><b>Runs:</b> ${stats.runs ?? 0}</p>
        <p><b>Wickets:</b> ${stats.wickets ?? 0}</p>
      </div>
      <button class="compare-btn" data-name="${player.name}">⚔️ Compare</button>
    `;
    playerContainer.appendChild(card);
  });

  // ✅ Attach compare button handlers
  document.querySelectorAll(".compare-btn").forEach((btn) => {
    btn.addEventListener("click", () => handleCompare(btn.dataset.name));
  });
}

// ✅ Helpers
function capitalize(word) {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : "";
}

function getFlag(country) {
  const flags = {
    "India": "https://flagcdn.com/w20/in.png",
    "Australia": "https://flagcdn.com/w20/au.png",
    "England": "https://flagcdn.com/w20/gb-eng.png",
    "Pakistan": "https://flagcdn.com/w20/pk.png",
    "New Zealand": "https://flagcdn.com/w20/nz.png",
    "Afghanistan": "https://flagcdn.com/w20/af.png",
    "South Africa": "https://flagcdn.com/w20/za.png"
  };
  return flags[country] || "https://flagcdn.com/w20/un.png";
}

// ✅ Comparison Logic
let selectedPlayers = [];

function handleCompare(playerName) {
  const player = players.find((p) => p.name === playerName);
  if (!player) return;

  const exists = selectedPlayers.find((p) => p.name === player.name);
  if (exists) {
    selectedPlayers = selectedPlayers.filter((p) => p.name !== player.name);
    alert(`${player.name} removed from selection.`);
    return;
  } else if (selectedPlayers.length < 2) {
    selectedPlayers.push(player);
    if (selectedPlayers.length === 1) {
      alert(`${player.name} selected for comparison. Select one more player.`);
      return;
    }
  }

  if (selectedPlayers.length === 2) {
    openCompareModal(selectedPlayers[0], selectedPlayers[1]);
    selectedPlayers = [];
  }
}

function openCompareModal(p1, p2) {
  const modal = document.getElementById("compareModal");
  const container = document.getElementById("compareContainer");
  container.innerHTML = "";

  // Build player cards
  const pCardsHtml = `
    <div class="compare-card">
      <img src="${p1.image || ''}" alt="${p1.name}">
      <h3>${p1.name}</h3>
      <p>${p1.country}</p>
    </div>
    <div class="compare-card">
      <img src="${p2.image || ''}" alt="${p2.name}">
      <h3>${p2.name}</h3>
      <p>${p2.country}</p>
    </div>
  `;
  container.insertAdjacentHTML("beforeend", pCardsHtml);

  // Helper to compare and highlight values
  function compareValue(valA, valB) {
    if (valA == null && valB == null) return { a: `<span>—</span>`, b: `<span>—</span>` };
    const aNum = Number(valA) || 0;
    const bNum = Number(valB) || 0;
    if (aNum > bNum) {
      return { a: `<span class="better">${aNum}</span>`, b: `<span class="worse">${bNum}</span>` };
    } else if (bNum > aNum) {
      return { a: `<span class="worse">${aNum}</span>`, b: `<span class="better">${bNum}</span>` };
    } else {
      return { a: `<span>${aNum}</span>`, b: `<span>${bNum}</span>` };
    }
  }

  const formats = ["test", "odi", "t20"];
  const table = document.createElement("table");
  table.classList.add("compare-table");
  table.innerHTML = `<tr><th>Format</th><th>${p1.name}</th><th>${p2.name}</th></tr>`;

  formats.forEach(format => {
    const s1 = p1.stats?.[format] || { matches: 0, runs: 0, wickets: 0 };
    const s2 = p2.stats?.[format] || { matches: 0, runs: 0, wickets: 0 };

    const matchesCmp = compareValue(s1.matches, s2.matches);
    const runsCmp = compareValue(s1.runs, s2.runs);
    const wktsCmp = compareValue(s1.wickets, s2.wickets);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${format.toUpperCase()}</td>
      <td>Matches: ${matchesCmp.a}<br>Runs: ${runsCmp.a}<br>Wkts: ${wktsCmp.a}</td>
      <td>Matches: ${matchesCmp.b}<br>Runs: ${runsCmp.b}<br>Wkts: ${wktsCmp.b}</td>
    `;
    table.appendChild(row);
  });

  container.appendChild(table);
  if (modal) modal.classList.remove("hidden");
}

// Close Compare Modal
const closeBtn = document.getElementById("closeCompare");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    const modal = document.getElementById("compareModal");
    if (modal) modal.classList.add("hidden");
  });
}

/* =========================================================
   🏆 DREAM 11 GENERATOR LOGIC
   ========================================================= */
const buildBtn = document.getElementById("buildDreamBtn");
const dreamFormatSelect = document.getElementById("dreamFormat");
const dreamModal = document.getElementById("dreamModal");
const dreamContainer = document.getElementById("dreamContainer");
const closeDream = document.getElementById("closeDream");

if (buildBtn) {
  buildBtn.addEventListener("click", () => {
    const fmt = dreamFormatSelect ? dreamFormatSelect.value : currentFormat;
    const team = buildDream11(fmt);
    showDreamModal(team, fmt);
  });
}
if (closeDream) closeDream.addEventListener("click", () => dreamModal.classList.add("hidden"));

// scoring functions
function playerScoreForFormat(player, format) {
  const s = player.stats?.[format] || {matches:0, runs:0, wickets:0};
  const matches = s.matches || 0;
  const runs = s.runs || 0;
  const wkts = s.wickets || 0;
  if (player.role === "batsman") return runs + matches * 0.5;
  if (player.role === "bowler") return wkts * 12 + matches * 0.5;
  if (player.role === "allrounder") return runs * 0.6 + wkts * 9 + matches * 0.3;
  return runs + wkts * 10;
}

function buildDream11(format) {
  const TEAM_SIZE = 11;
  const minBats = 3, maxBats = 5;
  const minBowl = 3, maxBowl = 5;
  const minAll = 1, maxAll = 4;

  const candidates = players.map(p => ({...p, __score: playerScoreForFormat(p, format)}));
  const sortedOverall = [...candidates].sort((a,b) => b.__score - a.__score);
  const bats = sortedOverall.filter(p => p.role === "batsman");
  const bowls = sortedOverall.filter(p => p.role === "bowler");
  const alls = sortedOverall.filter(p => p.role === "allrounder");

  const team = [];
  const take = (arr, n) => arr.slice(0, n);

  team.push(...take(alls, minAll));
  team.push(...take(bats, minBats));
  team.push(...take(bowls, minBowl));

  while (team.length < TEAM_SIZE) {
    for (let p of sortedOverall) {
      if (team.length >= TEAM_SIZE) break;
      if (!team.find(t => t.name === p.name)) team.push(p);
    }
  }

  while (team.length > TEAM_SIZE) team.pop();

  team.sort((a,b) => b.__score - a.__score);

  return {
    team,
    captain: team[0]?.name || null,
    vice: team[1]?.name || null,
    format
  };
}

function showDreamModal(result, format) {
  if (!dreamContainer) return;
  dreamContainer.innerHTML = "";

  const header = document.createElement("div");
  header.innerHTML = `
    <p style="font-weight:700">Format: ${format.toUpperCase()} —
    Captain: <span class="dream-badge captain">${result.captain || '—'}</span>
    Vice: <span class="dream-badge vice">${result.vice || '—'}</span></p>`;
  dreamContainer.appendChild(header);

  const list = document.createElement("div");
  list.classList.add("dream-list");

  result.team.forEach((p, idx) => {
    const div = document.createElement("div");
    div.classList.add("dream-player");
    div.innerHTML = `
      <div style="display:flex;align-items:center;">
        <img src="${p.image || ''}" alt="${p.name}">
        <div class="dream-meta">
          <div style="font-weight:700">${idx+1}. ${p.name}</div>
          <div style="font-size:0.9rem;color:rgba(255,255,255,0.7)">${p.role} • ${p.country}</div>
        </div>
      </div>
      <div style="min-width:120px;text-align:right;">
        <div class="dream-badge">${Math.round(p.__score)}</div>
      </div>
    `;
    list.appendChild(div);
  });

  dreamContainer.appendChild(list);
  dreamModal.classList.remove("hidden");
}


