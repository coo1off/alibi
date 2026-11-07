// Смоук + скриншоты всех экранов. Запуск: node tools/screenshot.mjs [url]
import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:4173/";

const executablePath =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const browser = await chromium.launch({ executablePath });
const errors = [];

async function shot(page, name) {
  await page.screenshot({ path: `.shots/${name}.png` });
  console.log("shot:", name);
}

const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`console: ${m.text()}`);
});

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await shot(page, "1-howto");

// «НАЗАД» в меню
const field = await page.locator("#game-host canvas").boundingBox();
const toLogical = (x, y) => ({ x: field.x + (x / 240) * field.width, y: field.y + (y / 320) * field.height });

let p = toLogical(120, 300);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(400);
await shot(page, "2-title");

// НАЧАТЬ ДЕЛО
p = toLogical(120, 186);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(300);
await shot(page, "3-level-banner");
await page.waitForTimeout(2600);

// запуск мяча — тап по полю низко
p = toLogical(120, 250);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(1500);
await shot(page, "4-playing");

// подвигаем ракетку
for (let i = 0; i < 12; i++) {
  const q = toLogical(60 + i * 12, 285);
  await page.touchscreen.tap(q.x, q.y);
  await page.waitForTimeout(30);
}
await page.waitForTimeout(700);
await shot(page, "5-playing2");

// пауза через HUD
const hud = await page.locator("#hud canvas").boundingBox();
await page.touchscreen.tap(hud.x + (227 / 240) * hud.width, hud.y + hud.height / 2);
await page.waitForTimeout(300);
await shot(page, "6-pause");

p = toLogical(120, 160);
await page.touchscreen.tap(p.x, p.y);
await page.waitForTimeout(200);

console.log(errors.length ? `ERRORS:\n${errors.join("\n")}` : "no errors");
await browser.close();
