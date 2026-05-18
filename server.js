const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.static("public"));

app.get("/fetch", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.json({ error: "URL yok" });
  }

  let browser;

  try {
    console.log("Browser açılıyor...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    // kritik fixler
    await page.setDefaultNavigationTimeout(20000);
    await page.setDefaultTimeout(20000);

    console.log("Sayfa açılıyor...");

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    // sabit bekleme (JS load kaçsa bile alırız)
    await page.waitForTimeout(3000);

    console.log("Veri çekiliyor...");

    const data = await page.evaluate(() => {
      return {
        title: document.title,
        text: document.body.innerText || "",
        html: document.body.innerHTML || ""
      };
    });

    console.log("Tamamlandı");

    await browser.close();

    res.json({
      success: true,
      ...data
    });

  } catch (err) {
    if (browser) await browser.close();

    console.log("Hata:", err.message);

    res.json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});