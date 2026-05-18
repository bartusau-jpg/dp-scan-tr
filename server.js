const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");

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
    console.log("Browser başlıyor...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    console.log("Sayfa açılıyor...");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    console.log("İçerik alınıyor...");

    const data = await page.evaluate(() => {
      return {
        title: document.title || "",
        text: document.body?.innerText || ""
      };
    });

    await browser.close();

    console.log("Bitti");

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
