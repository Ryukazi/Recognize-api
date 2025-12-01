import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());

// Cleaned up Cloudflare cookie (single-line, no newlines or spaces)
const CF_COOKIE = "cf_clearance=GnOHfe5khnNT5hRmZzDsHEJC4sObbVYPe9JdSkvuOVF-1714652874-1.2.1.1-ewX5b61zmxmXZk5wUWTJOP94Hg5t8aT1ppzqWyUjQEpowomu-d9cI23j9sGK5VPxPlp3a.oFyKoL4NFUAjBw2pz7qwnwS3YHufBP7q-NSeoYmxDvDWUxL5k_s-Zt.7m7nB1UkyEfbDAe4yAl3LphX9ndGfHl-YoNGBDWwUMaWvY_gYK0rVYmuKUmsHRsJ_6P8WJ1bcYOpZDh-oAuNKIXZP03GUjPqek1E";

// Temporary folder for downloaded files
const TMP_FOLDER = path.join(process.cwd(), "tmp");
if (!fs.existsSync(TMP_FOLDER)) fs.mkdirSync(TMP_FOLDER);

app.get("/recognize", async (req, res) => {
  const audioUrl = req.query.url;
  if (!audioUrl) return res.json({ success: false, error: "Missing ?url=" });

  const tmpFile = path.join(TMP_FOLDER, `audio_${Date.now()}.tmp`);

  try {
    // 1️⃣ Download the file
    const response = await axios.get(audioUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(tmpFile, response.data);

    // 2️⃣ Prepare FormData for musikerkennung.com
    const form = new FormData();
    form.append("videoFile", fs.createReadStream(tmpFile));
    form.append("recaptchaToken", "dummy_token_123"); // replace with real token if needed

    // 3️⃣ Send to musikerkennung.com
    const result = await axios.post(
      "https://musikerkennung.com/recognize-audio",
      form,
      {
        headers: {
          ...form.getHeaders(),
          cookie: CF_COOKIE,
          origin: "https://musikerkennung.com",
          referer: "https://musikerkennung.com/en/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          accept: "*/*"
        },
        timeout: 30000 // 30s timeout
      }
    );

    // 4️⃣ Return API response
    res.json({ success: true, result: result.data });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.json({ success: false, error: err.response?.data || err.message });
  } finally {
    // 5️⃣ Cleanup temporary file
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
});

app.listen(3000, () => console.log("GET API running on port 3000"));
