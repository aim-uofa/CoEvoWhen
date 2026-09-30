"use strict";
(() => {
  const escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const time = (s) => {
    const n = Number(s),
      h = Math.floor(n / 3600),
      m = Math.floor((n % 3600) / 60),
      sec = Math.floor(n % 60);
    return (
      (h ? `${h}:` : "") +
      `${h ? String(m).padStart(2, "0") : m}:${String(sec).padStart(2, "0")}`
    );
  };
  let toastTimer;
  function toast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
  }
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.append(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
  }

  const dialog = document.getElementById("media-dialog");
  let gallery = [],
    selected = 0,
    returnFocus;
  function renderMedia() {
    const item = gallery[selected];
    if (!item) return;
    const host = document.getElementById("dialog-media");
    host.querySelectorAll("video").forEach((v) => v.pause());
    host.classList.remove("zoomed");
    document.getElementById("media-zoom").textContent = "Zoom";
    document.getElementById("dialog-caption").textContent =
      item.caption || "Figure";
    document.getElementById("media-original").href = item.src;
    document.getElementById("media-count").textContent =
      gallery.length > 1 ? `${selected + 1} / ${gallery.length}` : "";
    for (const id of ["media-prev", "media-next"])
      document.getElementById(id).hidden = gallery.length < 2;
    document.getElementById("media-prev").disabled = selected === 0;
    document.getElementById("media-next").disabled =
      selected === gallery.length - 1;
    document.getElementById("media-zoom").hidden = item.kind === "video";
    host.innerHTML =
      item.kind === "video"
        ? `<div class="clip-player"><video controls playsinline preload="metadata" ${item.thumb ? `poster="${escape(item.thumb)}"` : ""} src="${escape(item.src)}"></video><div class="clip-time"><span>Source video</span><span class="source-time">${time(item.start || 0)}</span></div></div>`
        : `<img src="${escape(item.src)}" alt="${escape(item.caption || "Expanded figure")}" draggable="false">`;
    const video = host.querySelector("video");
    if (video)
      video.addEventListener(
        "timeupdate",
        () =>
          (host.querySelector(".source-time").textContent = time(
            (item.start || 0) + video.currentTime,
          )),
      );
  }
  function openMedia(items, index = 0) {
    document.dispatchEvent(new CustomEvent("coevo:pause"));
    gallery = items;
    selected = index;
    returnFocus = document.activeElement;
    renderMedia();
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  document
    .getElementById("media-close")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    dialog.querySelectorAll("video").forEach((v) => v.pause());
    document.body.style.overflow = "";
    returnFocus?.focus();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  document.getElementById("media-prev").addEventListener("click", () => {
    if (selected > 0) {
      selected--;
      renderMedia();
    }
  });
  document.getElementById("media-next").addEventListener("click", () => {
    if (selected < gallery.length - 1) {
      selected++;
      renderMedia();
    }
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.target.tagName === "VIDEO") return;
    if (e.key === "ArrowLeft" && selected > 0) {
      e.preventDefault();
      selected--;
      renderMedia();
    }
    if (e.key === "ArrowRight" && selected < gallery.length - 1) {
      e.preventDefault();
      selected++;
      renderMedia();
    }
  });
  document.getElementById("media-zoom").addEventListener("click", (e) => {
    const enlarged = document
      .getElementById("dialog-media")
      .classList.toggle("zoomed");
    e.currentTarget.textContent = enlarged ? "Fit" : "Zoom";
  });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-lightbox]");
    if (btn)
      openMedia([
        {
          src: btn.dataset.lightbox,
          caption: btn.dataset.caption,
          kind: "image",
        },
      ]);
  });
  window.Coevo = { escape, icon, time, toast, copy, openMedia };

  const menu = document.querySelector(".menu-toggle"),
    nav = document.getElementById("main-nav");
  menu.addEventListener("click", () => {
    const active = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(active));
    menu.setAttribute(
      "aria-label",
      active ? "Close navigation" : "Open navigation",
    );
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      nav.classList.remove("open");
      menu.setAttribute("aria-expanded", "false");
    }
  });
  window.addEventListener(
    "scroll",
    () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      document.querySelector(".reading-progress").style.width =
        `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    },
    { passive: true },
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting)
          nav
            .querySelectorAll("a")
            .forEach((a) =>
              a.classList.toggle("active", a.hash === "#" + entry.target.id),
            );
    },
    { rootMargin: "-15% 0px -65% 0px" },
  );
  ["abstract", "method", "results", "analysis", "case-study"].forEach((id) =>
    observer.observe(document.getElementById(id)),
  );

  document.querySelectorAll("[data-tabs]").forEach((list) => {
    const buttons = [...list.querySelectorAll("[role=tab]")];
    function select(button) {
      buttons.forEach((b) => {
        const active = b === button;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
        document.getElementById(b.dataset.panel).hidden = !active;
      });
    }
    buttons.forEach((button) => {
      button.addEventListener("click", () => select(button));
      button.addEventListener("keydown", (e) => {
        let i = buttons.indexOf(button);
        if (e.key === "ArrowRight") i = (i + 1) % buttons.length;
        else if (e.key === "ArrowLeft")
          i = (i - 1 + buttons.length) % buttons.length;
        else if (e.key === "Home") i = 0;
        else if (e.key === "End") i = buttons.length - 1;
        else return;
        e.preventDefault();
        select(buttons[i]);
        buttons[i].focus();
      });
    });
  });
  const citation = document.getElementById("bibtex");
  const copyCitation = document.getElementById("copy-citation");
  copyCitation.disabled = !citation.textContent.trim();
  copyCitation.addEventListener("click", async () => {
    const value = citation.textContent.trim();
    if (!value) return;
    await copy(value);
    toast("BibTeX copied");
  });

  fetch("assets/data/results.json")
    .then((r) => {
      if (!r.ok) throw new Error("Results unavailable");
      return r.json();
    })
    .then((data) => {
      // Keep the paper's complete column groups and displayed numeric precision.
      const metric = (
        label,
        digits = 4,
        direction = "up",
        relativeDigits = 1,
      ) => ({
        label,
        digits,
        direction,
        relativeDigits,
      });
      const boundary = (i, splits) =>
        splits.includes(i) ? " metric-group-start" : "";
      const metricHeads = (metrics, splits = []) =>
        metrics
          .map(
            (m, i) =>
              `<th scope="col" class="metric-heading${boundary(i, splits)}">${m.label}${m.direction ? ` <span class="metric-direction">${m.direction === "down" ? "↓" : "↑"}</span>` : ""}</th>`,
          )
          .join("");
      function groupedHead(labels, groups, metrics) {
        const splits = [];
        let offset = 0;
        for (const g of groups) {
          splits.push(offset);
          offset += g.count;
        }
        return `<thead><tr>${labels.map((l) => `<th scope="col" rowspan="2" class="label-heading">${l}</th>`).join("")}${groups.map((g) => `<th scope="colgroup" colspan="${g.count}" class="benchmark-heading metric-group-start">${g.label}${g.note ? `<span class="benchmark-detail">${g.note}</span>` : ""}</th>`).join("")}</tr><tr>${metricHeads(metrics, splits)}</tr></thead>`;
      }
      function flatHead(label, metrics) {
        return `<thead><tr><th scope="col" class="label-heading">${label}</th><th scope="col" class="label-heading">Method</th>${metricHeads(metrics, [0])}</tr></thead>`;
      }
      function deltaCells(base, evolved, metrics, splits = [0], cost = false) {
        return metrics
          .map((m, i) => {
            const scale = 10 ** m.digits;
            const delta =
              (Math.round(evolved[i] * scale) - Math.round(base[i] * scale)) /
              scale;
            const better =
              m.direction === "down" || cost ? delta < 0 : delta > 0;
            const tone = cost
              ? delta < 0
                ? "cost-decrease"
                : delta > 0
                  ? "cost-increase"
                  : ""
              : better
                ? "gain-improvement"
                : "gain-neutral";
            const sign = delta < 0 ? "−" : delta > 0 ? "+" : "";
            const relative =
              base[i] === 0
                ? ""
                : `${delta < 0 ? "↓" : delta > 0 ? "↑" : ""}${((Math.abs(delta) / base[i]) * 100).toFixed(m.relativeDigits)}%`;
            return `<td class="change-cell ${tone}${boundary(i, splits)}"><span class="absolute-change">${sign}${Math.abs(delta).toFixed(m.digits)}</span>${relative ? `<span class="relative-change">${relative}</span>` : ""}</td>`;
          })
          .join("");
      }
      function pairedBody(
        rows,
        metrics,
        {
          cost = false,
          splits = [0],
          groupNote = () => "",
          prefix = "+ ",
          changeLabel = "Evolution Gain",
        } = {},
      ) {
        return rows
          .map(
            (row) =>
              `<tbody class="comparison-group">${["base", "evolved"]
                .map(
                  (v, vi) =>
                    `<tr class="${v}-row">${vi === 0 ? `<th rowspan="3" scope="rowgroup" class="rowgroup-label">${escape(row.name)}${groupNote(row)}</th>` : ""}<th scope="row" class="method-label">${prefix}${vi === 0 ? "Base Skill" : "Evolved Skill"}</th>${row[
                      v
                    ]
                      .map((n, i) => {
                        const other = row[vi === 0 ? "evolved" : "base"][i];
                        const best =
                          metrics[i].direction === "down" || cost
                            ? n <= other
                            : n >= other;
                        return `<td class="${boundary(i, splits)}" data-value="${n.toFixed(metrics[i].digits)}">${best ? "<strong>" : ""}${n.toFixed(metrics[i].digits)}${best ? "</strong>" : ""}</td>`;
                      })
                      .join("")}</tr>`,
                )
                .join(
                  "",
                )}<tr class="comparison-change"><th scope="row" class="method-label">${changeLabel}</th>${deltaCells(row.base, row.evolved, metrics, splits, cost)}</tr></tbody>`,
          )
          .join("");
      }
      function paperTable({
        id,
        title,
        caption = "",
        head,
        body,
        wide = false,
      }) {
        return `<section class="result-table-block" aria-labelledby="${id}-title"><p class="result-table-caption" id="${id}-caption"><strong id="${id}-title">${title}</strong>${caption ? ` ${caption}` : ""}</p><p class="table-scroll-hint">Scroll to view all columns →</p><div class="table-scroll paper-table-scroll" tabindex="0" role="region" aria-labelledby="${id}-title"><table class="paper-results-table${wide ? " wide-results-table" : ""}" id="${id}" aria-labelledby="${id}-title">${head}${body}</table></div></section>`;
      }
      const durations = (b) =>
        `${escape(b.duration)}<br>(${escape(b.meanDuration)})`;
      const groundingMetrics = [
        metric("Precision<br>AUC"),
        metric("Recall<br>AUC"),
        metric("IoU<br>AUC"),
        metric("IoU@0.5"),
        metric("Mean<br>IoU"),
        metric("Recall@0.5"),
        metric("Mean<br>IoU"),
        metric("Recall@0.5"),
        metric("F1@0.5"),
        metric("Rejection<br>F1", 2),
      ];
      const splits = [0, 4, 6];
      const best = groundingMetrics.map((_, i) =>
        Math.max(...data.grounding.map((r) => r.values[i])),
      );
      const groundingRows = data.grounding
        .map((r, i) => {
          const label =
            i < 7
              ? `<th scope="row" class="method-label">${escape(r.method)}</th><td class="setting-cell">${escape(r.setting)}</td>`
              : `<th scope="row" colspan="2" class="method-label">${escape(r.method)}</th>`;
          return `<tr class="${i === 7 ? "base-row" : i === 8 ? "evolved-row" : ""}${i === 5 || i === 7 ? " group-divider" : ""}">${label}${r.values.map((v, j) => `<td class="${boundary(j, splits)}" data-value="${v.toFixed(groundingMetrics[j].digits)}">${v === best[j] ? "<strong>" : ""}${v.toFixed(groundingMetrics[j].digits)}${v === best[j] ? "</strong>" : ""}</td>`).join("")}</tr>`;
        })
        .join("");
      document.getElementById("grounding-content").innerHTML = paperTable({
        id: "grounding-table",

        title:
          "Gains from policy–tool coevolution on ultra-long video temporal grounding.",
        caption:
          '<strong>Bold</strong>: best; <span class="caption-blue">blue</span>: gains over the base skill, with <span class="caption-blue">↑</span> indicating relative improvements.',
        head: groupedHead(
          ["Method", "Setting"],
          data.benchmarks.map((b) => ({
            label: escape(b.name),
            count: b.metrics.length,
            note: durations(b),
          })),
          groundingMetrics,
        ),
        body: `<tbody>${groundingRows}<tr class="comparison-change"><th scope="row" colspan="2" class="method-label">Evolution Gain</th>${deltaCells(data.grounding[7].values, data.grounding[8].values, groundingMetrics, splits)}</tr></tbody>`,
        wide: true,
      });

      const efficiencyMetrics = [
        metric("Visual<br>Tokens", 2, "down", 2),
        metric("Image<br>Tokens", 2, "", 2),
        metric("Video<br>Tokens", 2, "", 2),
        metric("Model<br>Calls", 2, ""),
        metric("Local Tool<br>Calls", 2, ""),
        metric("Visual<br>Obs.", 2, ""),
        metric("Image<br>Obs.", 2, ""),
        metric("Video<br>Obs.", 2, ""),
      ];
      const costCards = `<p class="chart-context">Average visual token cost · k/query · Qwen3.5-27B</p><div class="efficiency-grid">${data.efficiency.map((e) => `<article class="cost-card"><h3>${escape(e.name)}</h3><div class="cost-reduction">−${((1 - e.evolved[0] / e.base[0]) * 100).toFixed(1)}%<span>visual token cost</span></div>${["base", "evolved"].map((v) => `<div class="cost-row"><div class="cost-row-label"><span>${v === "base" ? "Base" : "Evolved"}</span><strong>${e[v][0].toFixed(2)}k</strong></div><div class="cost-bar-track" aria-hidden="true"><span class="cost-total-bar ${v}" style="width:${(e[v][0] / e.base[0]) * 100}%"></span></div></div>`).join("")}<div class="cost-call"><span>Model calls / query</span><strong>${e.base[3].toFixed(2)} → ${e.evolved[3].toFixed(2)}</strong></div></article>`).join("")}</div>`;
      document.getElementById("efficiency-content").innerHTML =
        costCards +
        paperTable({
          id: "efficiency-table",

          title: "Inference efficiency with the base and evolved skills.",
          caption:
            '<span class="caption-green">Green (↓)</span> and <span class="caption-purple">purple (↑)</span> indicate decreases and increases relative to the base skill.',
          head: groupedHead(
            ["Benchmark", "Method"],
            [
              { label: "Token Efficiency", count: 3, note: "k/query" },
              {
                label: "Interaction Efficiency",
                count: 5,
                note: "count/query",
              },
            ],
            efficiencyMetrics,
          ),
          body: pairedBody(data.efficiency, efficiencyMetrics, {
            cost: true,
            splits: [0, 3],
            prefix: "",
            changeLabel: "Δ (Evolved − Base)",
            groupNote: (r) =>
              `<span class="rowgroup-detail">${durations(data.benchmarks.find((b) => b.name === r.name))}</span>`,
          }),
          wide: true,
        });

      const transferMetrics = [
        groundingMetrics[0],
        groundingMetrics[1],
        groundingMetrics[2],
        groundingMetrics[4],
        groundingMetrics[5],
        groundingMetrics[6],
        groundingMetrics[9],
        metric("Overall<br>Acc. (%)", 2),
        metric("Overall<br>Acc. (%)", 2),
      ];
      document.getElementById("transfer-content").innerHTML = paperTable({
        id: "transfer-table",

        title: "Generalization across VLMs and transfer to long-video QA.",
        caption:
          '<strong>Bold</strong>: results with the evolved skill; <span class="caption-blue">blue</span>: gains over the base skill, with <span class="caption-blue">↑</span> indicating relative improvements.',
        head: groupedHead(
          ["VLM", "Method"],
          [
            ...data.benchmarks.map((b, i) => ({
              label: escape(b.name),
              count: i === 0 ? 3 : 2,
              note: durations(b),
            })),
            { label: "LVBench", count: 1, note: "Long-video QA" },
            { label: "LSDBench", count: 1, note: "Long-video QA" },
          ],
          transferMetrics,
        ),
        body: pairedBody(data.generalization, transferMetrics, {
          splits: [0, 3, 5, 7, 8],
        }),
        wide: true,
      });

      const dimensionTables = [
        {
          id: "category-table",

          title: "Grounding results by query category on ExtremeWhenBench.",
          caption:
            'Each column reports mIoU (↑) for the corresponding category. <strong>Bold</strong>: better results; <span class="caption-blue">blue</span>: gains over the base skill. Evolution Gain reports absolute changes, with arrows indicating relative changes.',
          rows: data.more.categories,
          metrics: ["Action", "Environment", "Object", "Reaction", "Scene"].map(
            (m) => metric(m),
          ),
        },
        {
          id: "counting-table",

          title: "Event counting results on CoMET-Bench.",
          caption:
            '<strong>Bold</strong>: better results; <span class="caption-blue">blue</span>: gains over the base skill. Evolution Gain reports absolute changes, with arrows indicating relative changes.',
          rows: data.more.counting,
          metrics: [metric("MAE", 4, "down"), metric("OBO"), metric("Pearson")],
        },
        {
          id: "rejection-table",

          title:
            "Rejection and positive-query coverage results on CoMET-Bench.",
          caption:
            'Rejection-F1 is reported on a 0–100 scale, while FPR and PosCoverage use a 0–1 scale. <strong>Bold</strong>: better results; <span class="caption-blue">blue</span>: gains over the base skill. Evolution Gain reports absolute changes, with arrows indicating relative changes.',
          rows: data.more.rejection,
          metrics: [
            metric("Rejection-F1", 2),
            metric("FPR", 4, "down"),
            metric("PosCoverage"),
          ],
        },
        {
          id: "event-count-table",

          title: "Grounding results by target-event count on CoMET-Bench.",
          caption:
            'Groups are defined by the ground-truth event count, and each column reports macro-averaged F1@0.5 over the corresponding subset of positive queries. <strong>Bold</strong>: better results; <span class="caption-blue">blue</span>: gains over the base skill. Evolution Gain reports absolute changes, with arrows indicating relative changes.',
          rows: data.more.eventCounts,
          metrics: [
            "1 event",
            "2–3 events",
            "4–7 events",
            "8–15 events",
            "≥16 events",
          ].map((m) => metric(m)),
        },
      ];
      document.getElementById("more-dimensions-content").innerHTML =
        dimensionTables
          .map((t) =>
            paperTable({
              ...t,
              head: flatHead("VLM", t.metrics),
              body: pairedBody(t.rows, t.metrics),
            }),
          )
          .join("");
      const modalityMetrics = [
        metric("Precision<br>AUC"),
        metric("Recall<br>AUC"),
        metric("IoU<br>AUC"),
        metric("Visual<br>Tokens", 2, "down"),
        metric("Image / Video<br>Tokens", 2, ""),
      ];
      const joint = data.modality[2];
      const showToken = (n) => (n === null ? "—" : n.toFixed(2));
      const signedDifference = (a, b, digits) => {
        const scale = 10 ** digits;
        const n = (Math.round(a * scale) - Math.round(b * scale)) / scale;
        return `${n < 0 ? "−" : n > 0 ? "+" : ""}${Math.abs(n).toFixed(digits)}`;
      };
      const observationFlag = (enabled, rows, name) =>
        `<th scope="rowgroup" rowspan="${rows}" class="observation-cell" aria-label="${name} observations ${enabled ? "enabled" : "disabled"}"><span aria-hidden="true" class="observation-flag ${enabled ? "enabled" : "disabled"}">${enabled ? "✓" : "×"}</span></th>`;
      const modalityBody = data.modality
        .map((m, i) => {
          const rows = ["base", "evolved"]
            .map((v, vi) => {
              const best = i === 2 && vi === 1;
              const wrap = (value) =>
                best ? `<strong>${value}</strong>` : value;
              return `<tr class="${v}-row${best ? " best-modality" : ""}">${vi === 0 ? observationFlag(i !== 1, i === 2 ? 4 : 2, "Image") + observationFlag(i !== 0, i === 2 ? 4 : 2, "Video") : ""}<th scope="row" class="method-label">+ ${vi === 0 ? "Base Skill" : "Evolved Skill"}</th>${m[v].map((value, j) => `<td class="${boundary(j, [0])}" data-value="${value.toFixed(j === 3 ? 2 : 4)}">${wrap(value.toFixed(j === 3 ? 2 : 4))}</td>`).join("")}<td class="token-components">${wrap(m.tokens[v].map(showToken).join(" / "))}</td></tr>`;
            })
            .join("");
          const comparisons =
            i !== 2
              ? ""
              : data.modality
                  .slice(0, 2)
                  .map(
                    (single, index) =>
                      `<tr class="comparison-change modality-change"><th scope="row" class="method-label">Δ vs. ${index === 0 ? "Image-only" : "Video-only"}</th>${joint.evolved.map((value, j) => `<td class="${j === 3 ? "cost-decrease" : "gain-improvement"}${boundary(j, [0])}"><span class="absolute-change">${signedDifference(value, single.evolved[j], j === 3 ? 2 : 4)}</span></td>`).join("")}<td class="token-components cost-decrease">${joint.tokens.evolved.map((value, j) => (single.tokens.evolved[j] === null ? "—" : `<span class="component-change">${signedDifference(value, single.tokens.evolved[j], 2)}</span>`)).join(" / ")}</td></tr>`,
                  )
                  .join("");
          return `<tbody class="comparison-group">${rows}${comparisons}</tbody>`;
        })
        .join("");
      document.getElementById("modality-content").innerHTML = paperTable({
        id: "modality-table",
        title: "Image–video coordination ablation",
        caption:
          'on the VUE-LVTR held-out set. <strong>Bold</strong> marks results with the evolved image+video skill; <span class="caption-blue">blue</span> and <span class="caption-green">green</span> denote its performance gains and reductions in visual token cost relative to evolved single-modality skills. Tokens: k/query.',
        head: `<thead><tr><th scope="col">Image<br>Obs.</th><th scope="col">Video<br>Obs.</th><th scope="col" class="label-heading">Qwen3.5-27B</th>${metricHeads(modalityMetrics, [0])}</tr></thead>`,
        body: modalityBody,
      });
    })
    .catch((error) => {
      console.error(error);
      for (const id of [
        "grounding-content",
        "efficiency-content",
        "transfer-content",
        "more-dimensions-content",
        "modality-content",
      ]) {
        document.getElementById(id).innerHTML =
          '<p>Results could not be loaded. Please refresh the page to try again.</p>';
      }
    });
})();
