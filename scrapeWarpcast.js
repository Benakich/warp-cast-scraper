import puppeteer from "puppeteer-core";
import fs from "fs";

const CHANNEL_URL = "https://warpcast.com/~/channel/nouns-draws";

const main = async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  const cookies = JSON.parse(fs.readFileSync("cookies.json"));
  await page.setCookie(...cookies);

  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to:", CHANNEL_URL);
  await page.goto(CHANNEL_URL, { waitUntil: "domcontentloaded", timeout: 0 });

  try {
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise(r => setTimeout(r, 1000));
    }

    await page.waitForSelector('[data-testid="feed-item"]', { timeout: 30000 });
    console.log("✅ Found feed items");

    const posts = await page.$$eval('[data-testid="feed-item"]', (items) =>
      items.map((el) => {
        const textEl = el.querySelector('[data-testid="cast-text"]');
        const imgEl = el.querySelector("img");
        return {
          text: textEl?.innerText || null,
          image: imgEl?.src || null,
        };
      })
    );

    console.log("Extracted posts:", posts.slice(0, 5));
  } catch (err) {
    console.error("❌ Error while scraping:", err);
  }

  await browser.close();
};

main();
