import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });

await page.setContent(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 58px; background: #e8edea; color: #0f172a; font-family: Arial, sans-serif; }
    .warning { margin-bottom: 28px; border: 4px solid #be123c; background: #fff1f2; padding: 18px 24px; color: #9f1239; font-size: 24px; font-weight: 800; letter-spacing: .12em; text-align: center; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; }
    .card { min-height: 610px; border-radius: 24px; background: white; padding: 34px; box-shadow: 0 20px 50px rgba(15,23,42,.12); }
    .passport { background: #123b66; color: white; }
    .eyebrow { color: #5eead4; font-size: 15px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
    h1 { margin: 22px 0 38px; font-size: 38px; }
    h2 { margin: 14px 0 32px; font-size: 34px; }
    dl { display: grid; grid-template-columns: 165px 1fr; gap: 20px 16px; margin: 0; }
    dt { color: #94a3b8; font-size: 13px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    dd { margin: 0; font-size: 20px; font-weight: 700; }
    .passport dt { color: #bfdbfe; }
    .stamp { margin-top: 44px; border: 2px solid rgba(255,255,255,.5); padding: 18px; text-align: center; font-family: monospace; letter-spacing: .12em; }
    .booking { border-top: 8px solid #0d9488; }
    .route { display: flex; align-items: center; justify-content: space-between; margin: 40px 0; font-size: 42px; font-weight: 800; }
    .route span { color: #94a3b8; font-size: 24px; }
    .notice { margin-top: 42px; border-radius: 14px; background: #f1f5f9; padding: 18px; color: #475569; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="warning">SYNTHETIC HACKATHON SAMPLE — NOT A REAL IDENTITY DOCUMENT</div>
  <div class="grid">
    <section class="card passport">
      <div class="eyebrow">Synthetic identity evidence</div>
      <h1>Travel Document Copy</h1>
      <dl>
        <dt>Full name</dt><dd>Maya Laurent</dd>
        <dt>Nationality</dt><dd>French</dd>
        <dt>Date of birth</dt><dd>18 May 1994</dd>
        <dt>Document no.</dt><dd>19DF000042</dd>
        <dt>Issued</dt><dd>20 May 2019</dd>
        <dt>Expires</dt><dd>19 May 2029</dd>
      </dl>
      <div class="stamp">DEMO · INVALID · SAMPLE · DEMO</div>
    </section>
    <section class="card booking">
      <div class="eyebrow" style="color:#0f766e">Synthetic travel evidence</div>
      <h2>Return Journey</h2>
      <div class="route">BCN <span>AF1249 →</span> CDG</div>
      <dl>
        <dt>Passenger</dt><dd>Maya Laurent</dd>
        <dt>Booking ref.</dt><dd>K8R4NQ</dd>
        <dt>Departure</dt><dd>31 Aug 2026 · 17:45</dd>
        <dt>Hotel</dt><dd>Hotel Brummell</dd>
        <dt>Reservation</dt><dd>BRM-88215</dd>
      </dl>
      <div class="notice">Created only to test document extraction and minimum-disclosure workflows. It cannot be used as proof of identity or travel.</div>
    </section>
  </div>
</body>
</html>
`);

await page.screenshot({ path: "public/samples/maya-travel-evidence.png", fullPage: true });
await browser.close();
console.log("public/samples/maya-travel-evidence.png");
