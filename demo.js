const MODEL_META = {
  phon_60:              { label: "Phoneme SFT",           group: "ours" },
  phon_60_dpo_replay:   { label: "Phoneme SFT + DPO",    group: "ours" },
  cosyvoice3:           { label: "CosyVoice 3",          group: "baseline" },
  voxcpm2:              { label: "VoxCPM 2",             group: "baseline" },
  inworld_tts2:         { label: "Inworld TTS 2",        group: "baseline" },
  elevenlabs_turbo_v2:  { label: "ElevenLabs Turbo v2",  group: "baseline" },
  firered_base:         { label: "FireRedTTS (base)",     group: "baseline" },
};

const MODEL_ORDER = [
  "phon_60", "phon_60_dpo_replay",
  "cosyvoice3", "voxcpm2", "inworld_tts2",
  "elevenlabs_turbo_v2", "firered_base",
];

function scoreClass(s) {
  return s === 3 ? "score-good" : s === 2 ? "score-ok" : "score-bad";
}

function scoreLabel(s) {
  return s === 3 ? "Correct" : s === 2 ? "Minor error" : "Wrong";
}

function buildModelCard(modelKey, samples, pickId) {
  const meta = MODEL_META[modelKey];
  const card = document.createElement("div");
  card.className = "model-card";
  if (meta.group === "ours") card.classList.add("model-ours");

  const avgScore = (samples.reduce((a, s) => a + s.score, 0) / samples.length).toFixed(1);

  const header = document.createElement("div");
  header.className = "model-header";
  header.innerHTML =
    `<span class="model-name">${meta.label}</span>` +
    (meta.group === "ours" ? '<span class="model-badge">Ours</span>' : "") +
    `<span class="model-avg">avg ${avgScore}/3</span>`;
  card.appendChild(header);

  const playerRow = document.createElement("div");
  playerRow.className = "player-row";

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.preload = "none";
  audio.src = `assets/${pickId}/${samples[0].file}`;

  const annotation = document.createElement("div");
  annotation.className = "sample-annotation";

  const scoreBadge = document.createElement("span");
  scoreBadge.className = `score-badge ${scoreClass(samples[0].score)}`;
  scoreBadge.textContent = scoreLabel(samples[0].score);

  const heardAs = document.createElement("span");
  heardAs.className = "heard-as";

  function updateAnnotation(idx) {
    const s = samples[idx];
    scoreBadge.className = `score-badge ${scoreClass(s.score)}`;
    scoreBadge.textContent = scoreLabel(s.score);
    if (s.heard_as) {
      heardAs.textContent = `Heard as: "${s.heard_as}"`;
      heardAs.style.display = "";
    } else {
      heardAs.textContent = "";
      heardAs.style.display = "none";
    }
  }

  annotation.appendChild(scoreBadge);
  annotation.appendChild(heardAs);
  updateAnnotation(0);

  const sampleBtns = document.createElement("div");
  sampleBtns.className = "sample-btns";

  samples.forEach((s, i) => {
    const btn = document.createElement("button");
    btn.className = `sample-btn ${scoreClass(s.score)}`;
    if (i === 0) btn.classList.add("active");
    btn.textContent = i + 1;
    btn.title = `Sample ${i + 1} — ${scoreLabel(s.score)}`;
    btn.addEventListener("click", () => {
      audio.src = `assets/${pickId}/${s.file}`;
      audio.load();
      sampleBtns.querySelectorAll(".sample-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      updateAnnotation(i);
    });
    sampleBtns.appendChild(btn);
  });

  playerRow.appendChild(audio);
  card.appendChild(playerRow);
  card.appendChild(sampleBtns);
  card.appendChild(annotation);

  return card;
}

function buildDrugPanel(entry) {
  const panel = document.createElement("div");
  panel.className = "drug-panel";
  panel.dataset.drug = entry.pick_id;

  const sentence = document.createElement("div");
  sentence.className = "drug-sentence";
  sentence.innerHTML =
    `<span class="drug-label">${entry.drug_name}</span>` +
    `<q>${entry.sentence}</q>`;
  panel.appendChild(sentence);

  const refBlock = document.createElement("div");
  refBlock.className = "reference-block";
  refBlock.innerHTML =
    `<div class="ref-label">Reference (human recording)</div>` +
    `<audio controls preload="none" src="assets/${entry.pick_id}/${entry.reference.file}"></audio>`;
  panel.appendChild(refBlock);

  const oursLabel = document.createElement("div");
  oursLabel.className = "group-label";
  oursLabel.textContent = "Our Models";
  panel.appendChild(oursLabel);

  const baselineLabel = document.createElement("div");
  baselineLabel.className = "group-label";
  baselineLabel.textContent = "Baselines";

  let addedBaselineLabel = false;
  for (const key of MODEL_ORDER) {
    if (!addedBaselineLabel && MODEL_META[key].group === "baseline") {
      panel.appendChild(baselineLabel);
      addedBaselineLabel = true;
    }
    const samples = entry.models[key];
    if (samples) {
      panel.appendChild(buildModelCard(key, samples, entry.pick_id));
    }
  }

  return panel;
}

async function init() {
  const resp = await fetch("assets/manifest.jsonl");
  const text = await resp.text();
  const entries = text.trim().split("\n").map(l => JSON.parse(l));

  const container = document.getElementById("drug-panels");

  entries.forEach((entry, i) => {
    const panel = buildDrugPanel(entry);
    if (i !== 0) panel.style.display = "none";
    container.appendChild(panel);
  });

  document.querySelectorAll(".drug-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".drug-tab").forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      container.querySelectorAll(".drug-panel").forEach(p => {
        p.style.display = p.dataset.drug === tab.dataset.drug ? "" : "none";
      });
    });
  });
}

init();
