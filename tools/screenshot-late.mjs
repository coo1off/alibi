import { chromium } from "playwright";
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
for (const q of ["3-1", "3-4", "boss"]) {
  await page.goto(`http://localhost:4173/?level=${q}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2800);
  const box = await page.locator("#game-host canvas").boundingBox();
  const at = (x, y) => ({ x: box.x + (x / 240) * box.width, y: box.y + (y / 320) * box.height });
  await page.touchscreen.tap(at(120, 295).x, at(120, 295).y);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `.shots/late-${q}.png` });
}
console.log(errors.length ? errors.join("\n") : "no errors");
await browser.close();
