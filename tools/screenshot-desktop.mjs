// Десктопный скриншот: поле 240×320 при 3x + HUD.
import { chromium } from "playwright";
const url = process.argv[2] ?? "http://127.0.0.1:4173/";
const executablePath =
  process.env.CHROME_PATH ??
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell`;
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1024, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.screenshot({ path: ".shots/d1-howto.png" });
await page.keyboard.press("Space");
await page.waitForTimeout(400);
await page.keyboard.press("Space");
await page.waitForTimeout(1600);
await page.screenshot({ path: ".shots/d2-playing.png" });
console.log(errors.length ? errors.join("\n") : "no errors");
await browser.close();
