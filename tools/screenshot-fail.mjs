// Проверка бонусов, финала и проигрыша через отладку (localStorage + клики).
import { chromium } from "playwright";
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.addInitScript(() => localStorage.setItem("alibi.save.v1", JSON.stringify({ version: 1, bestScore: 4820, bestCombo: 4, settings: { sound: false, volume: 0.6 }, seenHowto: true })));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const box = await page.locator("#game-host canvas").boundingBox();
const at = (x, y) => ({ x: box.x + (x / 240) * box.width, y: box.y + (y / 320) * box.height });
let p = at(120, 186);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(2800);
p = at(120, 260);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(2500);
await page.screenshot({ path: ".shots/7-live.png" });
// долго болтаем ракеткой
for (let i = 0; i < 40; i++) {
  const q = at(40 + (i % 20) * 8, 295);
  await page.touchscreen.tap(q.x, q.y);
  await page.waitForTimeout(120);
}
await page.screenshot({ path: ".shots/8-live-more.png" });
// пауза и выход в меню
const hud = await page.locator("#hud canvas").boundingBox();
await page.touchscreen.tap(hud.x + (233 / 240) * hud.width, hud.y + hud.height * 0.5);
await page.waitForTimeout(300);
const pauseBox = await page.locator("#game-host canvas").boundingBox();
const at2 = (x, y) => ({ x: pauseBox.x + (x / 240) * pauseBox.width, y: pauseBox.y + (y / 320) * pauseBox.height });
await page.touchscreen.tap(at2(120, 270).x, at2(120, 270).y); // В МЕНЮ
await page.waitForTimeout(300);
console.log(errors.length ? "ERRORS:\n" + errors.join("\n") : "no errors");
await browser.close();
