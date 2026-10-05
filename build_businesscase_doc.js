const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle,
  Table, TableRow, TableCell, WidthType, ShadingType,
} = require("docx");

const ACCENT = "1F4E79";
const MUTED = "555555";

function h1(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    border: { bottom: { color: "CCCCCC", space: 2, style: BorderStyle.SINGLE, size: 6 } },
    children: [new TextRun({ text, bold: true, color: ACCENT, size: 24, font: "Calibri" })],
  });
}

function p(text, opts = {}) {
  const runs = typeof text === "string"
    ? [new TextRun({ text, size: opts.size ?? 20, font: "Calibri", bold: opts.bold, italics: opts.italics, color: opts.color ?? "222222" })]
    : text;
  return new Paragraph({ spacing: { after: opts.after ?? 120 }, children: runs });
}

function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: [new TextRun({ text, size: 19, font: "Calibri" })] });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: { size: opts.width ?? 25, type: WidthType.PERCENTAGE },
    shading: opts.header ? { type: ShadingType.CLEAR, fill: "1F4E79" } : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: [new Paragraph({
      children: [new TextRun({
        text, bold: !!opts.header, size: 18, font: "Calibri",
        color: opts.header ? "FFFFFF" : "222222",
      })],
    })],
  });
}

function dataTable(headers, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((h, i) => cell(h, { header: true, width: widths[i] / 100 })) }),
      ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] / 100 })) })),
    ],
  });
}

const doc = new Document({
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 700, bottom: 700, left: 900, right: 900 } } },
    children: [
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: "Business Case: Aftersales Service No-Show Risk Flagging", bold: true, size: 30, font: "Calibri", color: ACCENT })],
      }),
      p("Illustrative business case on synthetic data.", { italics: true, size: 17, color: MUTED, after: 240 }),

      h1("1. Problem"),
      p(
        "Service departments lose revenue and technician capacity when customers who booked an " +
        "appointment don't show up. No-show slots can rarely be filled on short notice, so the " +
        "capacity is simply lost for that day. In this illustrative dataset, service no-shows occur " +
        "at 27.2% of booked appointments — broadly in line with published aftersales industry ranges."
      ),

      h1("2. Proposed AI Use Case"),
      p(
        "A no-show risk classifier trained on appointment attributes already captured at booking time " +
        "(lead time, prior no-show history, reminder status, booking channel, distance to dealer) " +
        "flags the riskiest appointments in advance, so the service team can intervene — an extra " +
        "reminder call, a proactive reschedule offer, or light overbooking of that slot — before the " +
        "appointment window, rather than discovering the no-show after the fact."
      ),

      h1("3. Evidence: Model Performance (Measured, Not Assumed)"),
      p("A logistic regression classifier was trained and evaluated on a held-out test split:"),
      dataTable(
        ["Metric", "Result"],
        [
          ["Held-out ROC-AUC", "0.78"],
          ["Flagging threshold", "Top ~25% of appointments by predicted risk"],
          ["Recall at this threshold", "50% of true no-shows caught"],
          ["Precision at this threshold", "55% (vs. 27% base rate — 2x lift)"],
        ],
        [50, 50]
      ),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      p(
        "0.78 AUC reflects genuine, useful signal — not a suspiciously perfect model. No-show " +
        "behavior is inherently noisy; this model is not presented as a precise individual predictor, " +
        "but as a way to prioritize a limited pool of intervention capacity toward higher-risk " +
        "appointments.",
        { italics: true, size: 18, color: MUTED }
      ),

      h1("4. Cost-Benefit (Illustrative Assumptions, Stated Explicitly)"),
      dataTable(
        ["Assumption", "Value"],
        [
          ["Illustrative annual appointment volume (single region)", "40,000"],
          ["Value at risk per idle service slot", "€180"],
          ["Cost per intervention (reminder call/SMS)", "€3"],
          ["Share of flagged true no-shows recovered by intervention", "35% (headline) — see sensitivity below"],
        ],
        [65, 35]
      ),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      dataTable(
        ["Result (at headline assumptions)", "Value"],
        [
          ["Appointments flagged annually", "~9,800"],
          ["True no-shows caught", "~5,400"],
          ["Appointments recovered by intervention", "~1,900"],
          ["Total intervention cost", "€29,400"],
          ["Value recovered", "€342,900"],
          ["Net benefit", "€313,500"],
          ["ROI", "10.6x"],
        ],
        [65, 35]
      ),

      h1("5. Sensitivity — Because the Recovery-Rate Assumption Is the Least Certain Number"),
      p(
        "The intervention recovery rate (35% headline) has no real data behind it and is the most " +
        "uncertain input. Rather than present a single point estimate, the net benefit is shown " +
        "across a conservative range:"
      ),
      dataTable(
        ["Recovery rate", "Net benefit", "ROI"],
        [
          ["15% (conservative)", "€117,500", "4.0x"],
          ["25%", "€215,500", "7.3x"],
          ["35% (headline)", "€313,500", "10.6x"],
          ["50% (optimistic)", "€460,500", "15.6x"],
        ],
        [40, 30, 30]
      ),
      new Paragraph({ spacing: { before: 120, after: 120 }, children: [] }),
      p(
        "Net benefit stays clearly positive even at the conservative end of this range, because the " +
        "cost asymmetry driving the case — a €3 intervention against a €180 idle slot — is structural, " +
        "not dependent on an optimistic recovery-rate assumption."
      ),

      h1("6. KPIs to Track Post-Launch"),
      bullet("No-show rate (overall, and specifically within the flagged high-risk segment)"),
      bullet("Precision and recall of the flagging model against realized outcomes, tracked monthly"),
      bullet("Intervention response rate (share of flagged customers who engage with the outreach)"),
      bullet("Net service-bay utilization recovered, in €, vs. the model's projection"),

      h1("7. Milestones"),
      dataTable(
        ["Phase", "Milestone"],
        [
          ["Phase 1 (Weeks 1–4)", "Validate data availability across regions; retrain and calibrate model on real historical data"],
          ["Phase 2 (Weeks 5–8)", "Pilot in one region with a manual intervention workflow; track actual precision/recall vs. projected"],
          ["Phase 3 (Weeks 9–12)", "Evaluate pilot results against KPIs; decide on rollout, threshold tuning, or discontinuation"],
        ],
        [30, 70]
      ),

      h1("8. Scope & Next Steps"),
      bullet("All data is synthetic; no real manufacturer, dealer, or customer data was used. Real historical data would very likely show different feature relationships and no-show base rates."),
      bullet("The 35% recovery rate is a planning assumption; pilot data will replace it before the business case is finalized."),
      bullet("The 0.78 AUC model is designed as a prioritization tool that directs limited intervention capacity to the appointments most likely to be missed."),
    ],
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("Aftersales_NoShow_BusinessCase.docx", buf);
  console.log("done");
});
