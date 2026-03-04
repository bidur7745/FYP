export function openDiagnosisReportPdf(payload) {
  if (!payload) return;
  const {
    title,
    diseaseNameDisplay,
    displayName,
    cropLabel,
    categoryLabel,
    severityLabel,
    confidencePercent,
    descriptionLabel,
    symptomsLabel,
    preventiveMeasures,
    treatments,
    recommendedMedicines,
    imageUrl,
  } = payload;

  const safeTitle = title || diseaseNameDisplay || displayName || "Disease Report";
  const printWindow = window.open("", "_blank", "width=900,height=1000");
  if (!printWindow) return;

  const esc = (v) => (v == null ? "" : String(v));
  const listHtml = (items) => {
    if (!items) return "";
    const arr = Array.isArray(items) ? items : [items];
    if (!arr.length) return "";
    return `<ul>${arr
      .filter(Boolean)
      .map((i) => `<li>${esc(i)}</li>`)
      .join("")}</ul>`;
  };

  printWindow.document.write(`
    <html>
      <head>
        <title>${esc(safeTitle)}</title>
        <style>
          @page {
            margin: 16mm;
          }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            margin: 0;
            background: #ffffff;
            color: #111827;
          }
          .container {
            max-width: 760px;
            margin: 18px auto 24px auto;
            padding: 0 8px;
          }
          h1 {
            font-size: 22px;
            margin: 0 0 4px 0;
          }
          h2 {
            font-size: 13px;
            margin: 16px 0 4px 0;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          p {
            margin: 0 0 10px 0;
            font-size: 13px;
            line-height: 1.6;
          }
          ul {
            margin: 0 0 10px 18px;
            padding: 0;
            font-size: 13px;
          }
          li {
            margin-bottom: 4px;
          }
          .meta {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          .chip-row {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 8px 0 16px 0;
          }
          .chip {
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            border: 1px solid rgba(16,185,129,0.4);
            background: rgba(16,185,129,0.08);
            color: #047857;
          }
          .chip-sev {
            border-color: rgba(245,158,11,0.5);
            background: rgba(245,158,11,0.08);
            color: #92400e;
          }
          .chip-conf {
            border-color: rgba(37,99,235,0.5);
            background: rgba(37,99,235,0.08);
            color: #1d4ed8;
          }
          .image {
            margin-bottom: 16px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            page-break-inside: avoid;
          }
          .image img {
            max-width: 100%;
            max-height: 320px;
            width: auto;
            display: block;
            object-fit: contain;
          }
          .section-block {
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${esc(diseaseNameDisplay || displayName)}</h1>
          <div class="meta">
            ${esc(displayName || "")}${cropLabel ? ` • ${esc(cropLabel)}` : ""}
          </div>
          <div class="chip-row">
            <span class="chip">${esc(categoryLabel || "-")}</span>
            <span class="chip chip-sev">${esc(severityLabel || "-")}</span>
            ${
              confidencePercent != null
                ? `<span class="chip chip-conf">Confidence: ${esc(confidencePercent)}%</span>`
                : ""
            }
          </div>
          ${
            imageUrl
              ? `<div class="image"><img src="${esc(imageUrl)}" alt="Leaf image" /></div>`
              : ""
          }
          <div class="section-block">
            <h2>Description</h2>
            <p>${esc(descriptionLabel || "-")}</p>
          </div>
          <div class="section-block">
            <h2>Symptoms</h2>
            <p>${esc(symptomsLabel || "-")}</p>
          </div>
          <div class="section-block">
            <h2>Preventive Measures</h2>
            ${listHtml(preventiveMeasures) || "<p>-</p>"}
          </div>
          <div class="section-block">
            <h2>Treatment</h2>
            ${listHtml(treatments) || "<p>-</p>"}
          </div>
          <div class="section-block">
            <h2>Recommended Medicines</h2>
            ${
              recommendedMedicines && recommendedMedicines.length
                ? `<p>${recommendedMedicines.map(esc).join(", ")}</p>`
                : "<p>-</p>"
            }
          </div>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

