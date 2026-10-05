const pptxgen = require("pptxgenjs");

// "Midnight Executive" family adapted for automotive aftersales:
// deep navy dominant, ice-blue supporting, sharp white/amber accents for
// callouts — a clean, boardroom-appropriate palette.
const NAVY = "12233D";
const STEEL = "2E5C8A";
const ICE = "C9DCF0";
const AMBER = "E2A63C";
const OFFWHITE = "F7F9FB";
const DARKTEXT = "16242C";
const MUTED = "5B7480";

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

function addFooter(slide, pageNum) {
  slide.addText("Aftersales No-Show Risk Flagging — Illustrative business case on synthetic data", {
    x: 0.5, y: 7.15, w: 10, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: MUTED,
  });
  slide.addText(String(pageNum), {
    x: 12.6, y: 7.15, w: 0.4, h: 0.3, fontFace: FONT_BODY, fontSize: 9, color: MUTED, align: "right",
  });
}

// ---------------- Slide 1: Title ----------------
{
  const slide = pres.addSlide();
  slide.background = { color: NAVY };
  slide.addText("Reducing Aftersales No-Shows\nwith AI-Prioritized Outreach", {
    x: 0.9, y: 2.2, w: 11.5, h: 1.9, fontFace: FONT_HEAD, fontSize: 38, bold: true, color: "FFFFFF",
  });
  slide.addText("A business case for flagging at-risk service appointments before they're missed", {
    x: 0.9, y: 4.05, w: 10.5, h: 0.6, fontFace: FONT_BODY, fontSize: 17, italic: true, color: ICE,
  });
  slide.addText("Santosh Hiremath  |  Illustrative project on synthetic data  |  2026", {
    x: 0.9, y: 6.6, w: 10, h: 0.4, fontFace: FONT_BODY, fontSize: 12, color: ICE,
  });
}

// ---------------- Slide 2: Problem ----------------
{
  const slide = pres.addSlide();
  slide.background = { color: OFFWHITE };
  slide.addText("The problem: missed appointments waste service capacity", {
    x: 0.6, y: 0.5, w: 12.1, h: 0.8, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: NAVY,
  });

  const cards = [
    { stat: "27%", label: "of booked service\nappointments are no-shows" },
    { stat: "€180", label: "estimated revenue at risk\nper idle service slot" },
    { stat: "0", label: "days notice — most no-show\nslots can't be refilled" },
  ];
  const cardW = 3.7, gap = 0.45, startX = 0.6, y = 2.1;
  cards.forEach((c, i) => {
    const x = startX + i * (cardW + gap);
    slide.addShape("roundRect", { x, y, w: cardW, h: 2.6, rectRadius: 0.12, fill: { color: "FFFFFF" }, line: { color: ICE, width: 1 }, shadow: { type: "outer", color: "1C2733", opacity: 0.18, blur: 6, offset: 3, angle: 90 } });
    slide.addText(c.stat, { x, y: y + 0.25, w: cardW, h: 1.0, align: "center", fontFace: FONT_HEAD, fontSize: 50, bold: true, color: STEEL });
    slide.addText(c.label, { x: x + 0.25, y: y + 1.35, w: cardW - 0.5, h: 1.1, align: "center", fontFace: FONT_BODY, fontSize: 14, color: DARKTEXT });
  });

  slide.addText("Illustrative figures on synthetic data, broadly in line with published aftersales industry ranges — not real dealer data.", {
    x: 0.6, y: 5.15, w: 12.1, h: 0.8, fontFace: FONT_BODY, fontSize: 13, italic: true, color: MUTED,
  });
  addFooter(slide, 2);
}

// ---------------- Slide 3: Use case ----------------
{
  const slide = pres.addSlide();
  slide.background = { color: OFFWHITE };
  slide.addText("The use case: flag risk before the appointment, not after", {
    x: 0.6, y: 0.5, w: 12.1, h: 0.8, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: NAVY,
  });

  const steps = [
    { n: "1", t: "Booking signal", d: "Lead time, no-show history, reminder status — already captured today." },
    { n: "2", t: "Risk model", d: "A classifier scores each appointment's no-show risk at booking time." },
    { n: "3", t: "Targeted outreach", d: "Service team prioritizes the riskiest slots for a call or reschedule offer." },
  ];
  const boxW = 3.5, gapX = 0.75, startX = 0.7, y = 2.3;
  steps.forEach((s, i) => {
    const x = startX + i * (boxW + gapX);
    slide.addShape("ellipse", { x, y, w: 0.7, h: 0.7, fill: { color: STEEL }, line: { type: "none" } });
    slide.addText(s.n, { x, y, w: 0.7, h: 0.7, align: "center", valign: "middle", fontFace: FONT_HEAD, fontSize: 24, bold: true, color: "FFFFFF" });
    slide.addText(s.t, { x: x - 0.1, y: y + 0.85, w: boxW + 0.2, h: 0.5, fontFace: FONT_HEAD, fontSize: 17, bold: true, color: NAVY });
    slide.addText(s.d, { x: x - 0.1, y: y + 1.35, w: boxW + 0.2, h: 1.4, fontFace: FONT_BODY, fontSize: 13, color: DARKTEXT });
    if (i < steps.length - 1) {
      slide.addText("→", { x: x + boxW + 0.05, y: y - 0.05, w: 0.65, h: 0.8, align: "center", fontFace: FONT_BODY, fontSize: 28, bold: true, color: ICE });
    }
  });

  slide.addShape("roundRect", { x: 0.6, y: 5.15, w: 12.1, h: 1.5, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  slide.addText("Held-out ROC-AUC of 0.78 — genuine, useful signal, not a suspiciously perfect model. This prioritizes limited intervention capacity; it doesn't predict individual outcomes precisely.", {
    x: 1.0, y: 5.35, w: 11.3, h: 1.1, fontFace: FONT_BODY, fontSize: 14, color: "FFFFFF", valign: "middle",
  });
  addFooter(slide, 3);
}

// ---------------- Slide 4: Cost-benefit ----------------
{
  const slide = pres.addSlide();
  slide.background = { color: OFFWHITE };
  slide.addText("The economics: a cheap intervention against an expensive miss", {
    x: 0.6, y: 0.5, w: 12.1, h: 0.8, fontFace: FONT_HEAD, fontSize: 26, bold: true, color: NAVY,
  });

  slide.addChart(pres.ChartType.bar, [
    {
      name: "Net benefit (€ thousands)",
      labels: ["15%\n(conservative)", "25%", "35%\n(headline)", "50%\n(optimistic)"],
      values: [117.5, 215.5, 313.5, 460.5],
    },
  ], {
    x: 0.6, y: 1.7, w: 7.0, h: 4.4,
    chartColors: [STEEL],
    showTitle: true, title: "Net benefit (€000s) by intervention recovery-rate assumption", titleFontFace: FONT_HEAD, titleFontSize: 13, titleColor: NAVY,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 11, dataLabelColor: DARKTEXT, dataLabelFormatCode: "0",
    catAxisLabelFontSize: 10, catAxisLabelColor: DARKTEXT,
    valAxisLabelFontSize: 9, valAxisLabelColor: MUTED,
    valGridLine: { color: "E3E9EC", size: 1 }, catGridLine: { style: "none" },
    showLegend: false, barDir: "col",
  });

  const notes = [
    "€3 cost per intervention vs. €180 value per recovered slot",
    "Net benefit stays positive even at the conservative 15% case",
    "ROI ranges 4.0x–15.6x depending on the recovery-rate assumption",
    "Headline case: ~1,900 slots recovered/year, €313.5k net benefit",
  ];
  let ny = 1.95;
  notes.forEach((n) => {
    slide.addShape("ellipse", { x: 7.95, y: ny + 0.08, w: 0.12, h: 0.12, fill: { color: AMBER }, line: { type: "none" } });
    slide.addText(n, { x: 8.25, y: ny - 0.08, w: 4.5, h: 0.7, fontFace: FONT_BODY, fontSize: 13, color: DARKTEXT, valign: "top" });
    ny += 0.95;
  });
  addFooter(slide, 4);
}

// ---------------- Slide 5: Roadmap + scope ----------------
{
  const slide = pres.addSlide();
  slide.background = { color: OFFWHITE };
  slide.addText("Next steps — and what this case does not claim", {
    x: 0.6, y: 0.5, w: 12.1, h: 0.8, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: NAVY,
  });

  const phases = [
    { t: "Weeks 1–4", d: "Validate data access; retrain and calibrate on real historical data." },
    { t: "Weeks 5–8", d: "Pilot in one region; track actual precision/recall vs. projection." },
    { t: "Weeks 9–12", d: "Evaluate against KPIs; decide on rollout or revision." },
  ];
  let fx = 0.6;
  phases.forEach((ph) => {
    slide.addShape("roundRect", { x: fx, y: 1.9, w: 3.85, h: 1.7, rectRadius: 0.1, fill: { color: "FFFFFF" }, line: { color: ICE, width: 1 } });
    slide.addText(ph.t, { x: fx + 0.25, y: 2.05, w: 3.35, h: 0.4, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: STEEL });
    slide.addText(ph.d, { x: fx + 0.25, y: 2.45, w: 3.35, h: 1.05, fontFace: FONT_BODY, fontSize: 12.5, color: DARKTEXT });
    fx += 4.15;
  });

  slide.addShape("roundRect", { x: 0.6, y: 4.1, w: 12.1, h: 2.55, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  slide.addText("Scope & next steps", { x: 1.0, y: 4.3, w: 11.3, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: AMBER });
  slide.addText([
    { text: "All data is synthetic — no real manufacturer, dealer, or customer data was used.", options: { bullet: true, breakLine: true, color: "FFFFFF" } },
    { text: "The 35% intervention recovery rate is a planning assumption; pilot data will replace it.", options: { bullet: true, breakLine: true, color: "FFFFFF" } },
    { text: "A 0.78 AUC model prioritizes appointments so limited intervention capacity goes where it matters most.", options: { bullet: true, color: "FFFFFF" } },
  ], { x: 1.0, y: 4.75, w: 11.3, h: 1.8, fontFace: FONT_BODY, fontSize: 13, paraSpaceAfter: 8 });
  addFooter(slide, 5);
}

pres.writeFile({ fileName: "Aftersales_NoShow_Deck.pptx" }).then(() => {
  console.log("done");
});
