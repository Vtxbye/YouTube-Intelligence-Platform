# YouTube Claim Extractor

Extracts structured claims and narrative leanings from YouTube video transcripts using the Gemini API. Reads video URLs from a CSV file and outputs a formatted Excel report.

## Setup

### 1. Install dependencies
```bash
pip install google-generativeai pandas youtube-transcript-api openpyxl yt-dlp
```

### 2. Add your Gemini API key
Get a free key at https://aistudio.google.com/app/apikey, then choose one of:

**Option A — Environment variable (recommended):**
```bash
# Mac/Linux (add to ~/.zshrc or ~/.bashrc to persist)
export GOOGLE_API_KEY="your_key_here"

# Windows
set GOOGLE_API_KEY=your_key_here
```

**Option B — `.env` file** (create in same folder as script):
```
GOOGLE_API_KEY=your_key_here
```

**Option C — Enter it manually** when prompted at runtime.

### 3. Prepare your CSV
Make sure your CSV has a `URL` column with YouTube video links. The script also reads `Title`, `Channel`, `Views`, and `Published` columns if present (skips yt-dlp metadata fetch).

## Usage

```bash
python youtube_claim_extractor.py
```

Edit the `CONFIG` block at the top of the script to change:
| Variable | Default | Description |
|---|---|---|
| `CSV_PATH` | `youtube_final_accurate.csv` | Input CSV file |
| `URL_COLUMN` | `URL` | Column name containing URLs |
| `OUTPUT_PATH` | `content_claims.xlsx` | Output Excel file |
| `COOKIES_FILE` | `None` | Path to cookies.txt (fixes IP bans) |
| `MIN_DELAY` / `MAX_DELAY` | `3` / `7` | Seconds between requests |

## Fixing IP Bans

If YouTube blocks transcript fetching (common on cloud servers), the best fix is browser cookies:

1. Install the [Get cookies.txt Locally](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc) Chrome extension
2. Go to youtube.com while logged in
3. Click the extension → Export cookies → save as `cookies.txt` in the same folder
4. Set `COOKIES_FILE = "cookies.txt"` in the CONFIG block

## Resume After Interruption

Progress is saved to `checkpoint.json` every 10 videos. If the script crashes or is stopped, just re-run it — already-processed URLs are automatically skipped.

## Output

An Excel file with one row per video and paired `Claim N` / `Narrative N` columns for every extracted claim.
