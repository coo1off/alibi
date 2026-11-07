// Сценарий проигрыша: не двигаем ракетку, пока не кончатся жизни.
import { chromium } from "playwright";
const exe = process.env.HOME + "/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.addInitScript(() => localStorage.setItem("alibi.save.v1", JSON.stringify({ version: 1, bestScore: 720, bestCombo: 2, settings: { sound: false, volume: 0.6 }, seenHowto: true })));
await page.goto("http://localhost:4173/", { waitUntil: "networkidle" });
const box = await page.locator("#game-host canvas").boundingBox();
const at = (x, y) => ({ x: box.x + (x / 240) * box.width, y: box.y + (y / 320) * box.height });
await page.touchscreen.tap(at(120, 186).x, at(120, 186).y);
await page.waitForTimeout(2800);
for (let life = 0; life < 3; life++) {
  await page.touchscreen.tap(at(220, 300).x, at(220, 300).y); // мяч запускается с ракетки справа
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `.shots/g-life${life}.png` });
}
await page.waitForTimeout(2500);
await page.screenshot({ path: ".shots/9-gameover.png" });
console.log(errors.length ? errors.join("\n") : "no errors");
await browser.close();
