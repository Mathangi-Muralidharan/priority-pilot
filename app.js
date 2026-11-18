/* PriorityPilot: feature prioritization for product managers.
   Plain JavaScript, no build step. Data is stored in localStorage. */
(() => {
  "use strict";

  const STORAGE_KEY = "prioritypilot.v1";
  const FRAMEWORKS = {
    RICE: { label: "RICE", hint: "Score = Reach × Impact × Confidence ÷ Effort. Higher is better." },
    ICE: { label: "ICE", hint: "Score = Impact × Confidence × Ease (each 1–10). Higher is better." },
    MOSCOW: { label: "MoSCoW", hint: "Ranked by category (Must → Won't), then by RICE score inside each category." },
  };
  const MOSCOW_ORDER = { Must: 0, Should: 1, Could: 2, Wont: 3 };
  const MOSCOW_LABEL = { Must: "Must have", Should: "Should have", Could: "Could have", Wont: "Won't have" };
  const IMPACT_LABEL = { 3: "Massive", 2: "High", 1: "Medium", 0.5: "Low", 0.25: "Minimal" };

  const SAMPLE = [
    { title: "Onboarding checklist", problem: "New teams stall after day 2 and never invite colleagues.", requestedBy: "Data", status: "Test",
      reach: 1800, impact: 2, confidence: 0.5, effort: 0.5, iceImpact: 7, iceConfidence: 4, iceEase: 9, moscow: "Must",
      notes: "Activation drops 40% after day 2 (product analytics). Cause is a hypothesis, so confidence is 50%: test before building fully." },
    { title: "Bulk CSV import", problem: "New accounts spend days re-typing projects from spreadsheets.", requestedBy: "Customer", status: "Prioritize",
      reach: 1200, impact: 2, confidence: 0.8, effort: 1, iceImpact: 8, iceConfidence: 7, iceEase: 7, moscow: "Must",
      notes: "Reach = trial accounts per quarter that start from a spreadsheet (onboarding survey). Effort from eng estimate." },
    { title: "Slack notifications", problem: "Teams miss task updates because they live in Slack, not our app.", requestedBy: "Sales", status: "Test",
      reach: 2000, impact: 1, confidence: 0.8, effort: 1, iceImpact: 6, iceConfidence: 7, iceEase: 8, moscow: "Should",
      notes: "Raised in 3 open deals. Validate with a beta integration before a full build." },
    { title: "Recurring tasks", problem: "Users recreate the same weekly tasks by hand.", requestedBy: "Data", status: "Prioritize",
      reach: 2500, impact: 1, confidence: 1, effort: 2, iceImpact: 7, iceConfidence: 8, iceEase: 6, moscow: "Should",
      notes: "38% of tasks created are near-duplicates of last week's (product data)." },
    { title: "Dark mode", problem: "Users working late find the bright UI tiring.", requestedBy: "Engineering", status: "Defer",
      reach: 3000, impact: 0.25, confidence: 0.8, effort: 1.5, iceImpact: 3, iceConfidence: 6, iceEase: 7, moscow: "Could",
      notes: "Popular in feedback but low impact on retention." },
    { title: "SSO for enterprise", problem: "IT teams block company-wide rollout without single sign-on.", requestedBy: "Leadership", status: "Defer",
      reach: 150, impact: 3, confidence: 1, effort: 3, iceImpact: 7, iceConfidence: 9, iceEase: 4, moscow: "Should",
      notes: "Unblocks 2 enterprise deals, but only ~150 accounts. Revisit next quarter with the enterprise pipeline." },
    { title: "Custom report builder", problem: "Managers export data to build their own reports.", requestedBy: "Sales", status: "Defer",
      reach: 400, impact: 2, confidence: 0.5, effort: 6, iceImpact: 6, iceConfidence: 4, iceEase: 2, moscow: "Could",
      notes: "Strong ask from one large customer; demand beyond them is unproven." },
    { title: "Offline mobile mode", problem: "Field teams lose work when they have no signal.", requestedBy: "Customer", status: "Rejected",
      reach: 600, impact: 1, confidence: 0.5, effort: 5, iceImpact: 4, iceConfidence: 4, iceEase: 2, moscow: "Wont",
      notes: "Only field teams need it today. Revisit if mobile usage grows past 20%." },
  ];

  /* ---------- State ---------- */
  let state = load();

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function withIds(items) { return items.map((it) => ({ id: uid(), ...it })); }
  function freshState() { return { framework: "RICE", items: withIds(SAMPLE), orders: {}, moved: {} }; }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) return { framework: "RICE", orders: {}, moved: {}, ...parsed };
      }
    } catch (_) { /* storage unavailable: fall through to sample data */ }
    return freshState();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* ignore */ }
  }

  /* ---------- Scoring ---------- */
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const riceScore = (it) => (num(it.effort) > 0 ? (num(it.reach) * num(it.impact) * num(it.confidence)) / num(it.effort) : 0);
  const iceScore = (it) => num(it.iceImpact) * num(it.iceConfidence) * num(it.iceEase);
  const valueOf = (it) => num(it.reach) * num(it.impact) * num(it.confidence);

  function scoreOf(it, fw = state.framework) {
    if (fw === "ICE") return iceScore(it);
    return riceScore(it);
  }

  function scoreOrder(fw = state.framework) {
    const items = [...state.items];
    if (fw === "MOSCOW") {
      items.sort((a, b) => (MOSCOW_ORDER[a.moscow] ?? 9) - (MOSCOW_ORDER[b.moscow] ?? 9) || riceScore(b) - riceScore(a));
    } else {
      items.sort((a, b) => scoreOf(b, fw) - scoreOf(a, fw));
    }
    return items.map((it) => it.id);
  }

  /* Final order: the manual order (if any) for this framework, with new items slotted in by score. */
  function rankedItems() {
    const byScore = scoreOrder();
    const manual = state.orders[state.framework];
    let ids = byScore;
    if (manual && manual.length) {
      const existing = new Set(state.items.map((i) => i.id));
      ids = manual.filter((id) => existing.has(id));
      byScore.forEach((id) => { if (!ids.includes(id)) ids.splice(byScore.indexOf(id), 0, id); });
    }
    const map = new Map(state.items.map((i) => [i.id, i]));
    const moved = new Set(state.moved[state.framework] || []);
    return ids.map((id, idx) => {
      const rank = idx + 1, scoreRank = byScore.indexOf(id) + 1;
      return { item: map.get(id), rank, scoreRank, overridden: moved.has(id) && rank !== scoreRank };
    });
  }

  /* ---------- Formatting ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmt(n) {
    if (!Number.isFinite(n)) return "–";
    if (n >= 100) return Math.round(n).toLocaleString("en-US");
    if (n >= 10) return n.toFixed(1).replace(/\.0$/, "");
    return n.toFixed(2).replace(/\.?0+$/, "");
  }
  const pct = (c) => `${Math.round(num(c) * 100)}%`;

  function scoreDisplay(it) {
    if (state.framework === "MOSCOW") return MOSCOW_LABEL[it.moscow] || "–";
    return fmt(scoreOf(it));
  }
  function inputsDisplay(it) {
    if (state.framework === "ICE") return `I ${it.iceImpact} · C ${it.iceConfidence} · E ${it.iceEase}`;
    return `${fmt(num(it.reach))} × ${it.impact} × ${pct(it.confidence)} ÷ ${it.effort}`;
  }

  /* ---------- Render ---------- */
  const $ = (sel) => document.querySelector(sel);

  function render() {
    document.querySelectorAll(".segmented button").forEach((b) => {
      b.setAttribute("aria-selected", String(b.dataset.fw === state.framework));
    });
    $("#formulaHint").textContent = FRAMEWORKS[state.framework].hint;
    renderSummary();
    renderTable();
    renderChart();
  }

  function renderSummary() {
    const items = state.items;
    const count = (s) => items.filter((i) => i.status === s).length;
    const top = rankedItems()[0];
    const withNotes = items.filter((i) => (i.notes || "").trim()).length;
    const quick = quadrants().filter((q) => q.quadrant === "Quick Win").length;
    $("#summaryStrip").innerHTML = `
      <div class="stat"><div class="label">Top priority</div><div class="value top-title">${esc(top ? top.item.title : "–")}</div><div class="sub">${top ? esc(FRAMEWORKS[state.framework].label + " " + scoreDisplay(top.item)) : "Add a feature to begin"}</div></div>
      <div class="stat"><div class="label">Decisions</div><div class="value">${count("Prioritize")}<span style="font-size:14px;color:var(--muted)"> go</span></div><div class="sub">${count("Test")} test · ${count("Defer")} defer · ${count("Rejected")} rejected</div></div>
      <div class="stat"><div class="label">Quick wins</div><div class="value">${quick}</div><div class="sub">High value, low effort</div></div>
      <div class="stat"><div class="label">Assumptions recorded</div><div class="value">${items.length ? Math.round((withNotes / items.length) * 100) : 0}%</div><div class="sub">${withNotes} of ${items.length} items explain their score</div></div>`;
  }

  function renderTable() {
    const fw = state.framework;
    const scoreHead = fw === "MOSCOW" ? "Category" : `${FRAMEWORKS[fw].label} score`;
    $("#backlogHead").innerHTML = `<tr>
      <th>Rank</th><th>Feature / problem it solves</th><th>Requested by</th>
      <th class="num">${scoreHead}</th><th>Status</th><th>Why this score?</th></tr>`;

    const rows = rankedItems();
    const anyOverride = !!(state.orders[fw] && state.orders[fw].length);
    $("#resetOrderBtn").hidden = !anyOverride;
    $("#emptyState").hidden = rows.length > 0;
    $("#backlog").hidden = rows.length === 0;

    $("#backlogBody").innerHTML = rows.map(({ item: it, rank, scoreRank, overridden }, i) => {
      return `<tr data-id="${it.id}">
        <td class="rank-cell">
          <span class="rank">${rank}</span>
          <button class="row-btn" data-move="-1" aria-label="Move ${esc(it.title)} up" ${i === 0 ? "disabled" : ""}>▲</button>
          <button class="row-btn" data-move="1" aria-label="Move ${esc(it.title)} down" ${i === rows.length - 1 ? "disabled" : ""}>▼</button>
        </td>
        <td>
          <div class="feat-title">${esc(it.title)}${overridden ? `<span class="badge-override" title="Score order would put this at #${scoreRank}">Overridden · score says #${scoreRank}</span>` : ""}</div>
          ${it.problem ? `<div class="feat-problem">${esc(it.problem)}</div>` : ""}
        </td>
        <td><span class="tag">${esc(it.requestedBy)}</span></td>
        <td class="num"><div class="score">${esc(scoreDisplay(it))}</div><div class="inputs">${esc(fw === "MOSCOW" ? "RICE " + fmt(riceScore(it)) : inputsDisplay(it))}</div></td>
        <td><span class="tag status-${esc(it.status)}">${esc(it.status)}</span></td>
        <td class="notes-cell">${esc(it.notes || "")}</td>
      </tr>`;
    }).join("");
  }

  function median(arr) {
    if (!arr.length) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function quadrants() {
    const items = state.items;
    const vMed = median(items.map(valueOf));
    const eMed = median(items.map((i) => num(i.effort)));
    return items.map((it) => {
      const highV = valueOf(it) >= vMed, lowE = num(it.effort) <= eMed;
      const quadrant = highV && lowE ? "Quick Win" : highV ? "Big Bet" : lowE ? "Fill-in" : "Money Pit";
      return { it, quadrant, vMed, eMed };
    });
  }

  function renderChart() {
    const el = $("#chart");
    const items = state.items;
    if (!items.length) { el.innerHTML = `<p class="empty">Nothing to plot yet.</p>`; return; }
    const W = 900, H = 420, P = { l: 56, r: 24, t: 24, b: 44 };
    const iw = W - P.l - P.r, ih = H - P.t - P.b;
    const maxE = Math.max(...items.map((i) => num(i.effort)), 1) * 1.1;
    const maxV = Math.max(...items.map(valueOf), 1);
    // Square-root scale keeps big and small values readable on one chart.
    const x = (e) => P.l + (num(e) / maxE) * iw;
    const y = (v) => P.t + ih - (Math.sqrt(Math.max(v, 0)) / Math.sqrt(maxV * 1.12)) * ih;
    const q = quadrants();
    const vx = x(q[0].eMed), vy = y(q[0].vMed);
    const rankOf = new Map(rankedItems().map((r) => [r.item.id, r.rank]));
    const statusColor = { Prioritize: "var(--s-prioritize)", Test: "var(--s-test)", Defer: "var(--s-defer)", Rejected: "var(--s-rejected)" };

    // Nudge overlapping dots apart so every rank number stays readable.
    const pts = q.map(({ it, quadrant }) => ({ it, quadrant, cx: x(it.effort), cy: y(valueOf(it)) }));
    for (let pass = 0; pass < 30; pass++) {
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.hypot(dx, dy) || 0.01;
        if (d < 28) { const k = (28 - d) / 2, ux = dx / d, uy = dy / d; a.cx -= ux * k; a.cy -= uy * k; b.cx += ux * k; b.cy += uy * k; }
      }
    }
    const dots = pts.map(({ it, cx, cy }) => {
      const r = rankOf.get(it.id);
      return `<g class="dot" tabindex="0" data-id="${it.id}" role="button" aria-label="#${r} ${esc(it.title)}: value ${fmt(valueOf(it))}, effort ${it.effort}">
        <title>#${r} ${esc(it.title)} · value ${fmt(valueOf(it))}, effort ${it.effort} person-months · ${esc(it.status)}</title>
        <circle cx="${cx}" cy="${cy}" r="13" fill="${statusColor[it.status] || "var(--accent)"}"/>
        <text x="${cx}" y="${cy + 4}" text-anchor="middle">${r}</text>
      </g>`;
    }).join("");

    const groups = ["Quick Win", "Big Bet", "Fill-in", "Money Pit"].map((name) => {
      const list = q.filter((p) => p.quadrant === name).sort((a, b) => rankOf.get(a.it.id) - rankOf.get(b.it.id));
      return `<div class="legend-group"><h4 class="lg-${name.replace(" ", "")}">${name}s</h4>${list.length
        ? list.map((p) => `<button class="legend-item" data-id="${p.it.id}"><span class="lg-rank">${rankOf.get(p.it.id)}</span>${esc(p.it.title)}</button>`).join("")
        : `<p class="lg-none">None</p>`}</div>`;
    }).join("");
    const statusKey = Object.entries(statusColor).map(([k, c]) => `<span><i style="background:${c}"></i>${k}</span>`).join("");

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Value versus effort chart">
      <rect x="${P.l}" y="${P.t}" width="${vx - P.l}" height="${vy - P.t}" fill="var(--quick)" opacity=".07"/>
      <rect x="${vx}" y="${vy}" width="${P.l + iw - vx}" height="${P.t + ih - vy}" fill="var(--pit)" opacity=".07"/>
      <line x1="${vx}" y1="${P.t}" x2="${vx}" y2="${P.t + ih}" stroke="var(--line-strong)" stroke-dasharray="5 5"/>
      <line x1="${P.l}" y1="${vy}" x2="${P.l + iw}" y2="${vy}" stroke="var(--line-strong)" stroke-dasharray="5 5"/>
      <line x1="${P.l}" y1="${P.t + ih}" x2="${P.l + iw}" y2="${P.t + ih}" stroke="var(--ink)"/>
      <line x1="${P.l}" y1="${P.t}" x2="${P.l}" y2="${P.t + ih}" stroke="var(--ink)"/>
      <text class="quad-label" x="${P.l + 12}" y="${P.t + 20}" fill="var(--quick)">Quick wins</text>
      <text class="quad-label" x="${P.l + iw - 12}" y="${P.t + 20}" text-anchor="end" fill="var(--ink)">Big bets</text>
      <text class="quad-label" x="${P.l + 12}" y="${P.t + ih - 12}" fill="var(--muted)">Fill-ins</text>
      <text class="quad-label" x="${P.l + iw - 12}" y="${P.t + ih - 12}" text-anchor="end" fill="var(--pit)">Money pits</text>
      <text class="axis-label" x="${P.l + iw / 2}" y="${H - 10}" text-anchor="middle">Effort (person-months) →</text>
      <text class="axis-label" transform="translate(18 ${P.t + ih / 2}) rotate(-90)" text-anchor="middle">Value (reach × impact × confidence) →</text>
      ${dots}
    </svg>
    <div class="status-key">Dot color shows status: ${statusKey}<span>Numbers show rank.</span></div>
    <div class="legend">${groups}</div>`;
  }

  /* ---------- Feature form ---------- */
  const dlg = $("#featureDialog");
  const form = $("#featureForm");
  let editingId = null;

  function openForm(id = null) {
    editingId = id;
    const it = id ? state.items.find((i) => i.id === id) : null;
    $("#featureDialogTitle").textContent = it ? "Edit feature" : "Add feature";
    $("#deleteBtn").hidden = !it;
    form.reset();
    if (it) {
      for (const el of form.elements) {
        if (el.name && it[el.name] !== undefined) el.value = String(it[el.name]);
      }
    }
    // Show the active framework's inputs first; others stay available.
    const sets = [...form.querySelectorAll(".score-set")];
    sets.sort((a, b) => (b.dataset.fw === state.framework) - (a.dataset.fw === state.framework));
    const anchor = form.querySelector('[name="notes"]').closest(".field");
    sets.forEach((s) => anchor.before(s));
    dlg.showModal();
    form.elements.title.focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const data = {
      title: f.title.value.trim(), problem: f.problem.value.trim(), requestedBy: f.requestedBy.value,
      status: f.status.value, notes: f.notes.value.trim(),
      reach: Math.max(0, num(f.reach.value)), impact: num(f.impact.value, 1), confidence: num(f.confidence.value, 0.8),
      effort: Math.max(0.1, num(f.effort.value, 1)),
      iceImpact: clamp(f.iceImpact.value), iceConfidence: clamp(f.iceConfidence.value), iceEase: clamp(f.iceEase.value),
      moscow: f.moscow.value,
    };
    if (!data.title) { f.title.focus(); return; }
    if (editingId) {
      Object.assign(state.items.find((i) => i.id === editingId), data);
      toast("Feature updated");
    } else {
      state.items.push({ id: uid(), ...data });
      toast("Feature added");
    }
    save(); render(); dlg.close();
  });
  const clamp = (v) => Math.min(10, Math.max(1, Math.round(num(v, 5))));

  $("#deleteBtn").addEventListener("click", () => {
    const it = state.items.find((i) => i.id === editingId);
    if (!it || !confirm(`Delete "${it.title}"? This can't be undone.`)) return;
    state.items = state.items.filter((i) => i.id !== editingId);
    save(); render(); dlg.close(); toast("Feature deleted");
  });

  /* ---------- Table interactions ---------- */
  $("#backlogBody").addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    const mv = e.target.closest("[data-move]");
    if (mv) {
      e.stopPropagation();
      const ids = rankedItems().map((r) => r.item.id);
      const i = ids.indexOf(tr.dataset.id), j = i + Number(mv.dataset.move);
      if (j < 0 || j >= ids.length) return;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      state.orders[state.framework] = ids;
      const moved = new Set(state.moved[state.framework] || []);
      moved.add(tr.dataset.id);
      state.moved[state.framework] = [...moved];
      save(); render();
      toast("Rank overridden. The badge keeps it visible.");
      return;
    }
    openForm(tr.dataset.id);
  });

  $("#chart").addEventListener("click", (e) => {
    const g = e.target.closest(".dot, .legend-item");
    if (g) openForm(g.dataset.id);
  });
  $("#chart").addEventListener("keydown", (e) => {
    const g = e.target.closest(".dot");
    if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openForm(g.dataset.id); }
  });

  $("#resetOrderBtn").addEventListener("click", () => {
    delete state.orders[state.framework];
    delete state.moved[state.framework];
    save(); render(); toast("Back to score order");
  });

  document.querySelectorAll(".segmented button").forEach((b) =>
    b.addEventListener("click", () => { state.framework = b.dataset.fw; save(); render(); })
  );
  $("#addBtn").addEventListener("click", () => openForm());

  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]") || e.target === d) d.close();
    });
  });

  /* ---------- Compare ---------- */
  function renderCompare() {
    const a = state.items.find((i) => i.id === $("#cmpA").value);
    const b = state.items.find((i) => i.id === $("#cmpB").value);
    if (!a || !b) { $("#compareTable").innerHTML = ""; return; }
    const rows = [
      ["RICE score", riceScore(a), riceScore(b), "high", fmt],
      ["ICE score", iceScore(a), iceScore(b), "high", fmt],
      ["Reach", num(a.reach), num(b.reach), "high", fmt],
      ["Impact", num(a.impact), num(b.impact), "high", (v) => `${v} · ${IMPACT_LABEL[v] || ""}`],
      ["Confidence", num(a.confidence), num(b.confidence), "high", pct],
      ["Effort (person-months)", num(a.effort), num(b.effort), "low", fmt],
      ["MoSCoW", MOSCOW_ORDER[a.moscow], MOSCOW_ORDER[b.moscow], "low", (v) => MOSCOW_LABEL[Object.keys(MOSCOW_ORDER)[v]]],
    ];
    let winsA = 0, winsB = 0;
    const body = rows.map(([label, va, vb, better, f]) => {
      const aWins = better === "high" ? va > vb : va < vb;
      const bWins = better === "high" ? vb > va : vb < va;
      winsA += aWins; winsB += bWins;
      return `<tr><th>${label}</th><td class="${aWins ? "win" : ""}"><span class="mono">${esc(f(va))}</span></td><td class="${bWins ? "win" : ""}"><span class="mono">${esc(f(vb))}</span></td></tr>`;
    }).join("");
    const text = (label, va, vb) => `<tr><th>${label}</th><td>${esc(va) || "–"}</td><td>${esc(vb) || "–"}</td></tr>`;
    const verdict = a.id === b.id ? "Pick two different features to compare."
      : winsA === winsB ? "An even split. Use the problem statements and assumptions below to decide, and record why."
      : `<strong>${esc(winsA > winsB ? a.title : b.title)}</strong> wins on ${Math.max(winsA, winsB)} of ${rows.length} criteria. Check the assumptions before treating that as the answer.`;
    $("#compareTable").innerHTML = `<table class="cmp">
      <tr><th></th><th>${esc(a.title)}</th><th>${esc(b.title)}</th></tr>
      ${body}
      ${text("Requested by", a.requestedBy, b.requestedBy)}
      ${text("Status", a.status, b.status)}
      ${text("Problem it solves", a.problem, b.problem)}
      ${text("Why this score?", a.notes, b.notes)}
    </table><p class="cmp-verdict">${verdict}</p>`;
  }

  $("#compareBtn").addEventListener("click", () => {
    if (state.items.length < 2) { toast("Add at least two features to compare"); return; }
    const ranked = rankedItems();
    const opts = ranked.map((r) => `<option value="${r.item.id}">#${r.rank} ${esc(r.item.title)}</option>`).join("");
    $("#cmpA").innerHTML = opts; $("#cmpB").innerHTML = opts;
    $("#cmpA").value = ranked[0].item.id; $("#cmpB").value = ranked[1].item.id;
    renderCompare();
    $("#compareDialog").showModal();
  });
  $("#cmpA").addEventListener("change", renderCompare);
  $("#cmpB").addEventListener("change", renderCompare);

  /* ---------- Share summary ---------- */
  function buildSummary() {
    const fw = FRAMEWORKS[state.framework].label;
    const ranked = rankedItems();
    const by = (s) => ranked.filter((r) => r.item.status === s);
    const line = (r) => {
      const it = r.item;
      const score = state.framework === "MOSCOW" ? MOSCOW_LABEL[it.moscow] : `${fw} ${fmt(scoreOf(it))}`;
      const ovr = r.overridden ? ` [manually moved; score order is #${r.scoreRank}]` : "";
      return `${r.rank}. ${it.title} (${score}, requested by ${it.requestedBy})${ovr}\n   Problem: ${it.problem || "not recorded"}\n   Why: ${it.notes || "no assumptions recorded"}`;
    };
    const section = (title, list) => (list.length ? `\n${title}\n${list.map(line).join("\n")}\n` : "");
    const overrides = ranked.filter((r) => r.overridden).length;
    return [
      `Backlog priorities (${fw}), ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      `${ranked.length} items scored. ${overrides ? `${overrides} rank override(s) applied and flagged below.` : "Order follows the scores, with no manual overrides."}`,
      section("PRIORITIZE (building next)", by("Prioritize")),
      section("TEST FIRST (validate before committing)", by("Test")),
      section("DEFER (not now, revisit later)", by("Defer")),
      section("REJECTED", by("Rejected")),
      `Questions or a different read on these assumptions? Reply here and let's discuss.`,
    ].filter(Boolean).join("\n");
  }

  $("#shareBtn").addEventListener("click", () => {
    $("#shareText").value = buildSummary();
    $("#shareDialog").showModal();
  });
  $("#copyShareBtn").addEventListener("click", async () => {
    const t = $("#shareText");
    try { await navigator.clipboard.writeText(t.value); }
    catch (_) { t.select(); document.execCommand("copy"); }
    toast("Summary copied");
  });

  /* ---------- CSV ---------- */
  const CSV_FIELDS = ["title", "problem", "requestedBy", "status", "reach", "impact", "confidence", "effort",
    "iceImpact", "iceConfidence", "iceEase", "moscow", "notes"];

  function toCSV() {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = [...CSV_FIELDS, "riceScore", "iceScore", "rank"].join(",");
    const rows = rankedItems().map(({ item, rank }) =>
      [...CSV_FIELDS.map((f) => q(item[f])), fmt(riceScore(item)).replace(/,/g, ""), iceScore(item), rank].join(","));
    return [head, ...rows].join("\n");
  }

  function parseCSV(text) {
    const rows = []; let row = [], cell = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') inQ = false;
        else cell += c;
      } else if (c === '"') inQ = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim()));
  }

  $("#exportBtn").addEventListener("click", () => {
    const blob = new Blob([toCSV()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prioritypilot-${state.framework.toLowerCase()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("CSV downloaded");
  });

  $("#importInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const rows = parseCSV(await file.text());
    if (rows.length < 2) { toast("That CSV has no rows"); return; }
    const head = rows[0].map((h) => h.trim());
    if (!head.includes("title")) { toast('CSV needs a "title" column'); return; }
    const added = rows.slice(1).map((r) => {
      const o = Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()]));
      return {
        id: uid(), title: o.title || "Untitled", problem: o.problem || "", notes: o.notes || "",
        requestedBy: o.requestedBy || "Customer", status: o.status || "Prioritize",
        reach: num(o.reach, 100), impact: num(o.impact, 1), confidence: num(o.confidence, 0.8), effort: Math.max(0.1, num(o.effort, 1)),
        iceImpact: clamp(o.iceImpact), iceConfidence: clamp(o.iceConfidence), iceEase: clamp(o.iceEase),
        moscow: MOSCOW_ORDER[o.moscow] !== undefined ? o.moscow : "Should",
      };
    }).filter((it) => it.title);
    state.items.push(...added);
    save(); render(); toast(`Imported ${added.length} feature${added.length === 1 ? "" : "s"}`);
  });

  $("#sampleBtn").addEventListener("click", () => {
    if (state.items.length && !confirm("Replace your current backlog with the sample data?")) return;
    state = { ...freshState(), framework: state.framework };
    save(); render(); toast("Sample data loaded");
  });
  $("#clearBtn").addEventListener("click", () => {
    if (!confirm("Delete every feature in this backlog? Export a CSV first if you want a copy.")) return;
    state.items = []; state.orders = {}; state.moved = {};
    save(); render(); toast("Backlog cleared");
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* Exposed for automated checks of the scoring logic. */
  window.PriorityPilot = { riceScore, iceScore, valueOf, rankedItems, buildSummary, toCSV, parseCSV };

  render();
})();
