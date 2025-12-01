import express from "express";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import cors from "cors";

const app = express();
app.use(cors());

// Your Cloudflare cookie
const CF_COOKIE = `cf_clearance=GnOHfe5khnNT5hRmZzDsHEJC4sObbVYPe9JdSkvuOVF-1714652874-1.2.1.1-
ewX5b61zmxmXZk5wUWTJOP94Hg5t8aT1ppzqWyUjQEpowomu-
d9cI23j9sGK5VPxPlp3a.oFyKoL4NFUAjBw2pz7qwnwS3YHufBP7q-
NSeoYmxDvDWUxL5k_s-Zt.7m7nB1UkyEfbDAe4yAl3LphX9ndGfHl-
YoNGBDWwUMaWvY_gYK0rVYmuKUmsHRsJ_6P8WJ1bc8aYOpZDh-
oAuNKIXZP03GUjPqek1E`;

// GET /recognize?url=https://...
app.get("/recognize", async (req, res) => {
  try {
    const audioUrl = req.query.url;
    if (!audioUrl)
      return res.json({ success: false, error: "Missing ?url=" });

    // Download audio
    const audio = await axios.get(audioUrl, { responseType: "arraybuffer" });
    const tmp = "audio.tmp";
    fs.writeFileSync(tmp, audio.data);

    // Prepare upload form
    const form = new FormData();
    form.append("videoFile", fs.createReadStream(tmp));
    form.append("recaptchaToken", "dummy_token_123");

    // Send to musikerkennung.com
    const response = await axios.post(
      "https://musikerkennung.com/recognize-audio",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "cookie": CF_COOKIE,
          "origin": "https://musikerkennung.com",
          "referer": "https://musikerkennung.com/en/",
          "user-agent":
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          "accept": "*/*"
        }
      }
    );

    fs.unlinkSync(tmp);

    res.json({
      success: true,
      result: response.data
    });

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

app.listen(3000, () => console.log("GET API running on port 3000"));
