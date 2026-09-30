"use strict";
(() => {
  const { escape: esc, icon, time, toast, copy, openMedia } = window.Coevo;
  const host = document.getElementById("case-content");
  const tabs = [...document.querySelectorAll("[data-case]")];
  const cache = new Map(),
    indices = { base: 2, evolved: 2 };
  const timers = { base: null, evolved: null };
  let data,
    activeCase = "motion",
    activeVariant = "evolved",
    scope = "global",
    request = 0;
  const labels = {
    setup: "Video metadata",
    prepare: "Media preparation",
    observe: "Visual observation",
    answer: "Final prediction",
  };
  const interval = (values) =>
    `[${values.map((n) => Number(n).toLocaleString("en-US", { maximumFractionDigits: 2, useGrouping: false })).join(", ")}] s`;
  const tokens = (n) => (n / 1000).toFixed(2) + "k";
  const summaries = {
    motion: {
      base: {
        3: "Sparse frames suggest a candidate near 900 s. The model then concentrates its video observations on this region.",
        5: "The first clip does not confirm the queried action. The next search remains centered on the same candidate.",
        7: "The model revisits the candidate without finding clear evidence of the requested skimmer action.",
        9: "Another overlapping clip is inspected as the model continues to interpret the scene as a possible match.",
        11: "The final clip contains a chute transfer, which the model mistakes for the requested scooping action.",
        12: "The model selects a chute transfer in the incorrect region. The predicted interval has no overlap with the target.",
      },
      evolved: {
        3: "Eight timestamped contact sheets support global comparison and identify the relevant food-preparation scene.",
        5: "Dense frames over 550–590 s narrow the candidate to the scooping action and its immediate context.",
        7: "A single 15-second clip verifies the complete scooping, lifting, and transfer sequence.",
        8: "The predicted interval matches the ground truth exactly, following focused image observations and one short video verification.",
      },
    },
    scene: {
      base: {
        3: "The first sparse overview spans almost the entire video but does not reveal the brief target scene.",
        5: "A second batch examines the earlier part of the video for a tree-lined path and golden light.",
        7: "The search moves to another set of widely spaced frames, including a visually similar outdoor candidate.",
        9: "Further sparse frames cover the middle of the video without locating the requested scene.",
        11: "The target falls between sampled frames at 5700 s and 5800 s and is missed in this batch.",
        13: "The model revisits the opening scenes before returning to a visually similar candidate near 1900 s.",
        15: "Local frames refine the visually similar candidate, but this region does not contain the target scene.",
        17: "Video inspection remains confined to the incorrect candidate near 1900 s.",
        18: "The model returns a visually similar scene, with no temporal overlap with the requested event.",
      },
      evolved: {
        3: "A global comparison of 192 frames in eight contact sheets reveals a candidate near 5708 s.",
        5: "A local contact sheet confirms the scene and narrows the remaining uncertainty to its temporal boundaries.",
        7: "Seven frames distinguish the target scene from the following black screen.",
        9: "Targeted boundary frames establish the start and end of the scene without a video observation.",
        10: "Image evidence alone identifies the exact target interval in this 100.1-minute video.",
      },
    },
  };

  function stop(variant) {
    clearInterval(timers[variant]);
    timers[variant] = null;
    const button = host.querySelector(`[data-replay="${variant}"]`);
    if (button) {
      button.innerHTML = icon("play") + " Replay";
      button.setAttribute("aria-pressed", "false");
    }
  }
  function stopAll() {
    stop("base");
    stop("evolved");
    host.querySelectorAll("video").forEach((v) => v.pause());
  }
  document.addEventListener("coevo:pause", stopAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAll();
  });

  function setStep(variant, index, { playing = false, focus = false } = {}) {
    if (!data) return;
    if (!playing) stopAll();
    indices[variant] = Math.max(
      0,
      Math.min(data.variants[variant].steps.length - 1, index),
    );
    activeVariant = variant;
    renderPanel(variant);
    renderTimeline();
    if (focus)
      document
        .getElementById(`trajectory-${variant}`)
        .scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function replay(variant) {
    if (timers[variant]) {
      stop(variant);
      return;
    }
    stopAll();
    indices[variant] = 0;
    activeVariant = variant;
    timers[variant] = setInterval(() => {
      if (indices[variant] >= data.variants[variant].steps.length - 1) {
        stop(variant);
        return;
      }
      setStep(variant, indices[variant] + 1, { playing: true });
      if (indices[variant] === data.variants[variant].steps.length - 1)
        stop(variant);
    }, 3400);
    renderPanel(variant);
    renderTimeline();
  }
  function mediaFor(variant, step) {
    const all = data.variants[variant].media;
    return step.media.map((id) => all.find((m) => m.id === id)).filter(Boolean);
  }

  function renderPanel(variant) {
    const variantData = data.variants[variant],
      steps = variantData.steps,
      index = indices[variant],
      step = steps[index];
    const panel = document.getElementById(`trajectory-${variant}`);
    panel.querySelectorAll("video").forEach((v) => v.pause());
    const media = mediaFor(variant, step),
      images = media.filter((m) => m.kind === "image"),
      clip = media.find((m) => m.kind === "video");
    const summary = summaries[activeCase][variant][step.number] || step.summary;
    let evidence = "",
      evidenceLabel = "";
    if (images.length) {
      const sheets = images.some((m) => m.frameCount);
      evidenceLabel = `${images.length} ${sheets ? "contact sheets" : "frames"} · ${step.phase === "prepare" ? "prepared for inspection" : "observed by the VLM"}<span>Click to enlarge</span>`;
      evidence = `<div class="media-grid ${sheets ? "sheets" : ""}">${images.map((m, i) => `<button class="media-tile" data-evidence="${i}" aria-label="View ${esc(m.caption)}"><img src="${esc(m.thumb)}" alt="${esc(m.caption)}" loading="eager" width="560" height="315"><span>${esc(m.caption)}</span></button>`).join("")}</div>`;
    } else if (clip) {
      evidenceLabel = `${clip.end - clip.start}-second clip · ${esc(clip.caption)}<span>Source timestamps</span>`;
      evidence = `<div class="clip-player"><video controls playsinline preload="none" poster="${esc(clip.thumb)}" src="${esc(clip.src)}" aria-label="${esc(variantData.name)}: video evidence over ${esc(clip.caption)}"></video><div class="clip-time"><span>Source video</span><span class="source-time">${time(clip.start)}</span></div></div>`;
    } else if (step.phase === "setup") {
      evidenceLabel = "Source video";
      evidence = `<div class="setup-card">${icon("paper")}<div><strong>${(data.duration / 60).toFixed(1)} min</strong><span>${data.duration.toLocaleString()} seconds · Source video duration</span></div></div>`;
    } else if (step.phase === "answer") {
      evidenceLabel = "Grounding result";
      evidence = `<div class="final-card"><small>PREDICTED INTERVAL</small><strong>${interval(variantData.metrics.prediction)}</strong><p class="iou">IoU ${variantData.metrics.iou.toFixed(2)}</p><small>Ground truth: ${interval(data.groundTruth)}</small></div>`;
    }
    const details = `<details class="reasoning-details"><summary>Recorded reasoning${step.focus && step.focus !== step.reasoning ? " and observation focus" : ""}</summary><div class="recorded-text">${esc(step.reasoning)}</div>${step.focus && step.focus !== step.reasoning ? `<p class="detail-label">Observation focus</p><div class="recorded-text">${esc(step.focus)}</div>` : ""}${step.answer ? `<p class="detail-label">Final response</p><div class="recorded-text">${esc(step.answer)}</div>` : ""}</details>${Object.keys(step.parameters).length ? `<details><summary>Tool call · <code>${esc(step.tool)}</code></summary><pre class="tool-parameters">${esc(JSON.stringify(step.parameters, null, 2))}</pre></details>` : ""}`;
    panel.innerHTML = `<div class="trajectory-heading"><div><h3>${variant === "base" ? "Base Skill" : "Evolved Skill"}<span class="version-label">${variant === "base" ? "v000" : "v100"}</span></h3><small>${steps.length} steps · ${variantData.metrics.image_observations} image / ${variantData.metrics.video_observations} video observations</small></div><div class="trajectory-controls"><button data-replay="${variant}" aria-pressed="${Boolean(timers[variant])}" title="Replay recorded steps">${icon("play")}${timers[variant] ? " Pause" : " Replay"}</button><button data-share aria-label="Copy a link to this step" title="Copy Step Link">↗</button></div></div><div class="step-dots" aria-label="${variant === "base" ? "Base" : "Evolved"} trajectory steps">${steps.map((s, i) => `<button class="step-dot ${i < index ? "visited" : ""} ${i === index ? "current" : ""}" data-step="${i}" data-kind="${s.phase}" ${i === index ? 'aria-current="step"' : ""} aria-label="Step ${s.number}: ${esc(s.title)}" title="${esc(s.title)}">${s.number}</button>`).join("")}</div><label class="sr-only" for="select-${variant}">Select a ${variant} skill step</label><select class="step-select" id="select-${variant}">${steps.map((s, i) => `<option value="${i}" ${i === index ? "selected" : ""}>${s.number}. ${esc(s.title)}</option>`).join("")}</select><div class="step-body"><div class="step-intro" tabindex="0" role="region" aria-label="Step overview"><div class="step-kicker"><span>STEP ${step.number} / ${steps.length}</span><span class="phase-tag ${step.phase}">${labels[step.phase]}</span></div><h4>${esc(step.title)}</h4><p class="step-summary">${esc(summary)}</p></div><div class="step-evidence"><div class="media-count">${evidenceLabel}</div><div class="evidence-viewport" tabindex="0" role="region" aria-label="Step evidence">${evidence}</div></div><div class="step-details" tabindex="0" role="region" aria-label="Recorded reasoning and tool parameters">${details}</div><div class="step-navigation"><button data-direction="-1" ${index === 0 ? "disabled" : ""}>← Previous</button><span>${esc(step.tool)}</span><button data-direction="1" ${index === steps.length - 1 ? "disabled" : ""}>Next →</button></div></div><details class="transcript"><summary>Read the complete trajectory · ${steps.length} steps</summary><ol tabindex="0" aria-label="Complete recorded trajectory">${steps.map((s, i) => `<li class="transcript-item"><div><strong>${s.number}. ${esc(s.title)}</strong><button data-step="${i}" aria-label="Open step ${s.number}">View step ↗</button></div><p>${esc(summaries[activeCase][variant][s.number] || s.summary)}</p><details><summary>Recorded reasoning</summary><div class="recorded-text">${esc(s.reasoning)}</div>${s.focus && s.focus !== s.reasoning ? `<p class="detail-label">Observation focus</p><div class="recorded-text">${esc(s.focus)}</div>` : ""}</details></li>`).join("")}</ol></details>`;
    panel
      .querySelectorAll("[data-step]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          setStep(variant, Number(b.dataset.step)),
        ),
      );
    panel
      .querySelector(".step-select")
      .addEventListener("change", (e) =>
        setStep(variant, Number(e.target.value)),
      );
    panel
      .querySelectorAll("[data-direction]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          setStep(variant, index + Number(b.dataset.direction)),
        ),
      );
    panel
      .querySelector("[data-replay]")
      .addEventListener("click", () => replay(variant));
    panel.querySelector("[data-share]").addEventListener("click", async () => {
      const url = new URL(location.href);
      url.hash = `case-${activeCase}-${variant}-step-${step.number}`;
      await copy(url.href);
      toast("Link to this step copied");
    });
    panel
      .querySelectorAll("[data-evidence]")
      .forEach((b) =>
        b.addEventListener("click", () =>
          openMedia(images, Number(b.dataset.evidence)),
        ),
      );
    const video = panel.querySelector("video");
    if (video) {
      video.addEventListener("play", () => {
        stop("base");
        stop("evolved");
        host.querySelectorAll("video").forEach((v) => {
          if (v !== video) v.pause();
        });
      });
      video.addEventListener(
        "timeupdate",
        () =>
          (panel.querySelector(".source-time").textContent = time(
            clip.start + video.currentTime,
          )),
      );
    }
  }

  function renderTimeline() {
    if (!data) return;
    let range = [0, data.duration];
    if (scope === "candidate") {
      const v = data.variants[activeVariant],
        s = v.steps[indices[activeVariant]];
      const media = mediaFor(activeVariant, s);
      const points = media
        .flatMap((m) => (m.time != null ? [m.time] : [m.start, m.end]))
        .filter(Number.isFinite);
      if (
        points.length &&
        Math.max(...points) - Math.min(...points) < data.duration / 2
      ) {
        const lo = Math.min(...points),
          hi = Math.max(...points),
          pad = Math.max(10, (hi - lo) * 0.12);
        range = [Math.max(0, lo - pad), Math.min(data.duration, hi + pad)];
      } else {
        const pred =
          s.phase === "answer" ? v.metrics.prediction : data.groundTruth;
        range = [
          Math.max(0, pred[0] - 30),
          Math.min(data.duration, pred[1] + 30),
        ];
      }
    }
    const compact = window.matchMedia("(max-width:760px)").matches;
    const svgWidth = compact
      ? Math.max(250, document.getElementById("timeline-host").clientWidth)
      : 968;
    const left = compact ? 48 : 78,
      width = svgWidth - left - (compact ? 15 : 30);
    const x = (t) => left + ((t - range[0]) / (range[1] - range[0])) * width;
    const elements = [];
    for (let i = 0; i <= 4; i++) {
      const t = range[0] + ((range[1] - range[0]) * i) / 4;
      elements.push(
        `<line x1="${x(t)}" x2="${x(t)}" y1="28" y2="114" stroke="#e8e2ee"/><text x="${x(t)}" y="137" text-anchor="middle" class="timeline-axis">${time(t)}</text>`,
      );
    }
    const gt = data.groundTruth;
    if (gt[1] >= range[0] && gt[0] <= range[1]) {
      const gx = x(Math.max(gt[0], range[0])),
        gw = Math.max(2, x(Math.min(gt[1], range[1])) - gx);
      elements.push(
        `<rect x="${gx}" y="25" width="${gw}" height="91" fill="#b2864f" fill-opacity=".08" stroke="#b2864f" stroke-dasharray="3 3"/><text x="${Math.min(svgWidth - 70, Math.max(100, gx + gw / 2))}" y="17" text-anchor="middle" class="timeline-axis" style="fill:#876337">Target ${gt[0]}–${gt[1]} s</text>`,
      );
    }
    ["base", "evolved"].forEach((variant, row) => {
      const y = row === 0 ? 52 : 95,
        v = data.variants[variant],
        current = v.steps[indices[variant]],
        color = row === 0 ? "#9b8fa9" : "#655099";
      elements.push(
        `<text x="2" y="${y + 4}" class="timeline-label">${row === 0 ? "Base" : "Evolved"}</text><line x1="${left}" x2="${left + width}" y1="${y}" y2="${y}" stroke="#dcd5e6"/>`,
      );
      const firstObservation = new Map();
      v.steps
        .filter((s) => s.phase === "observe")
        .forEach((s) =>
          s.media.forEach((id) => {
            if (!firstObservation.has(id))
              firstObservation.set(id, s.number - 1);
          }),
        );
      v.media.forEach((m) => {
        const stepIndex = firstObservation.get(m.id);
        if (stepIndex === undefined) return;
        const currentMedia = current.media.includes(m.id),
          seen = stepIndex <= indices[variant];
        const opacity = currentMedia ? 1 : seen ? 0.65 : 0.2;
        const attr = `data-timeline-variant="${variant}" data-timeline-step="${stepIndex}" role="button" tabindex="0" aria-label="${variant}: ${esc(m.caption)}, step ${stepIndex + 1}" style="cursor:pointer" opacity="${opacity}"`;
        if (m.time != null) {
          if (m.time >= range[0] && m.time <= range[1])
            elements.push(
              `<circle ${attr} cx="${x(m.time)}" cy="${y}" r="${currentMedia ? 4 : 3}" fill="${color}"><title>${esc(m.caption)} · Step ${stepIndex + 1}</title></circle>`,
            );
        } else if (
          m.start != null &&
          m.end != null &&
          m.end >= range[0] &&
          m.start <= range[1]
        ) {
          const a = x(Math.max(m.start, range[0])),
            b = x(Math.min(m.end, range[1]));
          if (m.kind === "video")
            elements.push(
              `<rect ${attr} x="${a}" y="${y + 6 + (stepIndex % 3) * 3}" width="${Math.max(2, b - a)}" height="5" rx="2" fill="${color}"><title>Video ${esc(m.caption)} · Step ${stepIndex + 1}</title></rect>`,
            );
          else
            elements.push(
              `<line ${attr} x1="${a}" x2="${b}" y1="${y - 8}" y2="${y - 8}" stroke="#388977" stroke-width="${currentMedia ? 4 : 3}" stroke-dasharray="4 3"><title>Sampled contact sheet: ${esc(m.caption)} · Step ${stepIndex + 1}</title></line>`,
            );
        }
      });
    });
    document.getElementById("timeline-host").innerHTML =
      `<svg class="evidence-timeline" viewBox="0 0 ${svgWidth} 145" role="group" aria-label="Evidence sampling across the source video">${elements.join("")}</svg>`;
    host.querySelectorAll("[data-timeline-step]").forEach((el) => {
      const activate = () =>
        setStep(el.dataset.timelineVariant, Number(el.dataset.timelineStep));
      el.addEventListener("click", activate);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
    host.querySelectorAll("[data-scope]").forEach((b) => {
      const active = b.dataset.scope === scope;
      b.classList.toggle("active", active);
      b.setAttribute("aria-pressed", String(active));
    });
  }

  async function chooseCase(id, deepLink) {
    if (!["motion", "scene"].includes(id)) return;
    const mine = ++request;
    stopAll();
    tabs.forEach((t) => {
      const selected = t.dataset.case === id;
      t.setAttribute("aria-selected", String(selected));
      t.tabIndex = selected ? 0 : -1;
    });
    host.setAttribute("aria-labelledby", `case-${id}-tab`);
    host.setAttribute("aria-busy", "true");
    try {
      if (!cache.has(id)) {
        const r = await fetch(`assets/data/cases/${id}.json`);
        if (!r.ok) throw new Error("Case unavailable");
        cache.set(id, await r.json());
      }
      if (mine !== request) return;
      data = cache.get(id);
      activeCase = id;
      indices.base = 2;
      indices.evolved = 2;
      scope = "global";
      activeVariant = "evolved";
      if (deepLink)
        indices[deepLink.variant] = Math.max(
          0,
          Math.min(
            data.variants[deepLink.variant].steps.length - 1,
            deepLink.step - 1,
          ),
        );
      const b = data.variants.base.metrics,
        e = data.variants.evolved.metrics;
      host.innerHTML = `<div class="case-query"><div class="query-icon">${icon("paper")}</div><div><small>${esc(data.benchmark)} · ${esc(data.model)}</small><h3>“${esc(data.query)}”</h3></div><div class="case-query-meta"><strong>${(data.duration / 60).toFixed(1)} min</strong>source video</div></div><div class="timeline-card"><div class="timeline-header"><span>EVIDENCE ALONG THE VIDEO TIMELINE</span><div class="segmented"><button class="active" aria-pressed="true" data-scope="global">Full video</button><button aria-pressed="false" data-scope="candidate">Local detail</button></div></div><div id="timeline-host"></div><div class="timeline-legend"><span><i class="frame-key"></i>Frame</span><span><i class="sheet-key"></i>Contact-sheet span</span><span><i></i>Video clip</span><span><i class="target-key"></i>Target interval</span></div></div><p class="trajectory-hint">Follow each recorded step, inspect the visual evidence, or replay the trajectory. Select a frame, contact-sheet span, or video-clip mark on the timeline to view the corresponding observation.</p><div class="trajectory-grid"><article id="trajectory-base" class="trajectory-panel base" aria-label="Base Skill trajectory"></article><article id="trajectory-evolved" class="trajectory-panel evolved" aria-label="Evolved Skill trajectory"></article></div><div class="case-outcome"><div class="outcome-metrics"><h4>More precise grounding · Lower visual cost</h4><div class="outcome-grid"><div class="outcome-accuracy">Temporal grounding IoU<strong>${b.iou.toFixed(2)} → ${e.iou.toFixed(2)}</strong></div><div class="outcome-cost">Visual token cost<strong>${tokens(b.cumulative_visual_tokens)} → ${tokens(e.cumulative_visual_tokens)}</strong></div></div></div><div class="outcome-insight"><p>${esc(data.insight)}</p><button data-lightbox="${esc(data.figure)}" data-caption="${esc(data.title)}">Trajectory Overview ${icon("arrow")}</button></div></div>`;
      renderPanel("base");
      renderPanel("evolved");
      renderTimeline();
      host.querySelectorAll("[data-scope]").forEach((b) =>
        b.addEventListener("click", () => {
          scope = b.dataset.scope;
          renderTimeline();
        }),
      );
      if (deepLink)
        document
          .getElementById(`trajectory-${deepLink.variant}`)
          .scrollIntoView({ block: "start" });
    } catch (error) {
      console.error(error);
      if (mine === request)
        host.innerHTML =
          '<p>The trajectories could not be loaded. Please refresh the page to try again.</p>';
    } finally {
      if (mine === request) host.removeAttribute("aria-busy");
    }
  }
  function followHash() {
    const match = location.hash.match(
      /^#case-(motion|scene)(?:-(base|evolved)-step-(\d+))?$/,
    );
    if (match) {
      chooseCase(
        match[1],
        match[2] ? { variant: match[2], step: Number(match[3]) } : null,
      );
      if (!match[2])
        document
          .getElementById("case-study")
          .scrollIntoView({ block: "start" });
      return true;
    }
    return false;
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => {
      history.replaceState(null, "", `#case-${tab.dataset.case}`);
      chooseCase(tab.dataset.case);
    });
    tab.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const next = e.key === "Home" ? 0 : e.key === "End" ? 1 : 1 - i;
      tabs[next].focus();
      tabs[next].click();
    });
  });
  document.querySelectorAll("[data-open-case]").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      history.pushState(null, "", `#case-${a.dataset.openCase}`);
      chooseCase(a.dataset.openCase);
      document
        .getElementById("case-study")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }),
  );
  window.addEventListener("hashchange", followHash);
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (data && document.getElementById("timeline-host")) renderTimeline();
    }, 150);
  });
  if (!followHash()) chooseCase("motion");
})();
