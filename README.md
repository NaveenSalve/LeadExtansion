# Leads Extractor

Google Maps aur Bing Maps se business leads extract karke CSV mein download karne wala free Chrome extension. Web design, digital marketing aur lead generation ke kaam mein sabse useful.

---

## Features

- Google Maps aur Bing Maps dono ka support
- Auto-scroll: results ko khud scroll karke collect karta hai (20 scroll passes)
- Live extraction: extract ke dauran results popup mein real-time dikhte hain
- Smart filters (neeche dekho)
- Search + sort built-in
- Ek click mein CSV download (UTF-8, Excel compatible)
- 100% free, koi lock ya activation nahi

## Extract Kiya Jaane Wala Data

Har lead ke liye ye fields capture hoti hain:

| Field | Description |
|-------|-------------|
| Business Name | Business ka naam |
| Category | Category/type (e.g. Dentist) |
| Rating | Google/Bing rating |
| Reviews | Reviews count |
| Phone | Phone number |
| Website | Website URL |
| Address | Address |
| Maps Link | Maps ka link |
| Source | Google Maps ya Bing Maps |

## Install Kaise Karein

1. Is repo ko **ZIP** mein download karo aur **extract** karo ek permanent folder mein (Downloads folder mein mat rakho — extension wahan se clean ho sakti hai).
2. Chrome mein jaao: `chrome://extensions`
3. Upar-right corner mein **Developer mode** ON karo.
4. **Load unpacked** button click karo.
5. Extracted folder ka `extension` folder select karo.
6. Done! Extension browser toolbar mein add ho jayega.

## Use Kaise Karein

1. [Google Maps](https://maps.google.com) ya **Bing Maps** pe jaao.
2. Koi business search karo, e.g. `dentists Delhi`.
3. Results load hone do — thoda scroll karo.
4. Extension icon click karo, phir **Start Extraction** button dabao.
5. Extension apne aap scroll karke leads collect karega.
6. Filters lagao, phir **CSV Download** button dabao.

> Note: Popup kehlta hai agar page Maps ka nahi hai to **Open Google Maps** button — wahi se seedha Maps khol sakte ho.

## Filter Options

| Filter | Kya Karta Hai |
|--------|---------------|
| Duplicates Hatao | Same naam ke duplicate leads remove karta hai (default ON) |
| No Website Only | Sirf woh leads jo online nahi hain — best for outreach |
| Phone wale Only | Sirf woh leads jinke paas phone number hai |
| Low Rating (<=3) | 3 star ya kam wale business — improvement services ke liye |

## Sort Options

- A-Z: naam ke hisaab se
- Rating High-Low: best rating pehle
- Phone First: phone wale upar
- No Site First: website nahi wale upar

## Tips

- Zyada results chahiye? Scroll karke aur load karo, phir dobara **Start Extraction** dabao — data accumulate hota hai.
- Google Maps + Bing Maps dono se extract karo — coverage zyada milegi.
- **No Website Only** filter = sabse valuable leads for web design / digital marketing services.
- Excel mein kholne ke liye CSV seedha download hota hai (BOM ke sath, Hindi text bhi sahi aayega).

## Tech Stack

- Manifest V3 Chrome extension
- Vanilla JavaScript (koi framework nahi)
- `chrome.scripting` se content script injection
- Local storage se data accumulate

## Project Structure

```
LeadExtansion/
|-- extension/
|   |-- manifest.json      # MV3 config, permissions, popup
|   |-- popup.html         # Popup UI
|   |-- popup.js           # UI logic, filters, CSV export
|   `-- extractor.js       # Maps page scraper (auto-scroll)
|-- README.md
```

## License

Personal use ke liye free hai. Commercial distribution se pehle author se permission lein.

---

**By Naveen Salve** | [LinkedIn](https://www.linkedin.com/in/naveensalve01/) | [Instagram](https://www.instagram.com/itzz_mr_naveen/)