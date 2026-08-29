import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 1200 } });

const documents = [
  {
    file: "public/samples/maya-passport.pdf",
    title: "SYNTHETIC PASSPORT COPY",
    subtitle: "Identity evidence only — no flight or hotel information",
    accent: "#0d9488",
    fields: [
      ["FULL NAME", "Maya Laurent"],
      ["NATIONALITY", "French"],
      ["DATE OF BIRTH", "18 May 1994"],
      ["DOCUMENT NUMBER", "19DF000042"],
      ["DATE OF ISSUE", "20 May 2019"],
      ["DATE OF EXPIRY", "19 May 2029"],
    ],
  },
  {
    file: "public/samples/maya-flight-itinerary.pdf",
    title: "SYNTHETIC FLIGHT ITINERARY",
    subtitle: "Travel evidence only — not proof of identity",
    accent: "#2563eb",
    fields: [
      ["PASSENGER NAME", "Maya Laurent"],
      ["BOOKING REFERENCE", "K8R4NQ"],
      ["FLIGHT NUMBER", "AF1249"],
      ["DEPARTURE", "31 August 2026 at 17:45 CEST"],
      ["ARRIVAL", "31 August 2026 at 19:40 CEST"],
      ["ROUTE", "Barcelona BCN to Paris CDG"],
    ],
  },
  {
    file: "public/samples/maya-hotel-confirmation.pdf",
    title: "SYNTHETIC HOTEL CONFIRMATION",
    subtitle: "Accommodation evidence only — not proof of nationality",
    accent: "#7c3aed",
    fields: [
      ["GUEST NAME", "Maya Laurent"],
      ["HOTEL", "Hotel Brummell"],
      ["RESERVATION", "BRM-88215"],
      ["CHECK IN", "29 August 2026"],
      ["CHECK OUT", "31 August 2026"],
      ["LOCATION", "Barcelona, Spain"],
    ],
  },
];

for (const document of documents) {
  const rows = document.fields.map(([label, value]) => `<div class="row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
    header { height: 94px; padding: 30px 52px; background: #0f172a; color: white; display:flex; justify-content:space-between; align-items:center; }
    header b { letter-spacing:.16em; font-size:14px; }
    header span { color:#99f6e4; font-size:12px; font-weight:700; }
    main { padding: 54px 64px; }
    .warning { border: 2px solid #fb7185; background:#fff1f2; color:#9f1239; padding:16px; text-align:center; font-size:14px; font-weight:800; letter-spacing:.1em; }
    h1 { margin:42px 0 8px; font-size:32px; letter-spacing:-.03em; }
    .subtitle { color:#64748b; margin-bottom:38px; }
    .card { border-top:8px solid ${document.accent}; background:white; border-radius:18px; padding:18px 26px; box-shadow:0 16px 40px rgba(15,23,42,.08); }
    .row { display:grid; grid-template-columns:190px 1fr; gap:22px; padding:18px 4px; border-bottom:1px solid #e2e8f0; }
    .row:last-child { border-bottom:0; }
    .row span { color:#64748b; font-size:12px; font-weight:800; letter-spacing:.08em; }
    .row strong { font-size:17px; }
    footer { margin-top:42px; color:#64748b; font-size:12px; line-height:1.6; }
  </style></head><body>
    <header><b>MINPAYLOAD</b><span>TEST EVIDENCE</span></header>
    <main>
      <div class="warning">INVALID SYNTHETIC DOCUMENT — HACKATHON DEMO ONLY</div>
      <h1>${document.title}</h1><p class="subtitle">${document.subtitle}</p>
      <section class="card">${rows}</section>
      <footer>Source separation is intentional. MinPayload uses these fields only as candidate context before empirical API payload minimization.</footer>
    </main>
  </body></html>`);
  await page.pdf({ path: document.file, format: "A4", printBackground: true });
  console.log(document.file);
}

await browser.close();
