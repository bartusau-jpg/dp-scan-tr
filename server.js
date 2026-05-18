const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();

app.use(cors());
app.use(express.static("public"));

app.get("/fetch", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ success: false, error: "URL yok" });
  }

  let browser;

  try {
    console.log("Chromium başlıyor...");

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: "new"
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    const data = await page.evaluate(() => {
      return {
        title: document.title || "",
        text: document.body?.innerText || ""
      };
    });

    await browser.close();

    return res.json({
      success: true,
      ...data
    });

  } catch (err) {
    if (browser) await browser.close();

    console.log("HATA:", err.message);

    return res.json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
