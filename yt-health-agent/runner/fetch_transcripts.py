#!/usr/bin/env python3

import os, csv, json, re, time, glob, tempfile
import yt_dlp

DAILY_LIMIT = int(os.getenv("TRANSCRIPT_DAILY_LIMIT", "100"))
FETCH_DELAY = float(os.getenv("TRANSCRIPT_FETCH_DELAY", "1.5"))
SAVE_EVERY = int(os.getenv("TRANSCRIPT_SAVE_EVERY", "50"))


# ---------- VTT cleaning ----------
def clean_vtt(vtt_text: str) -> str:
    """Convert VTT subtitle content to clean plain text."""
    lines = vtt_text.splitlines()
    cleaned = []
    for line in lines:
        # Skip header and metadata lines
        if re.match(r'^(WEBVTT|NOTE|Kind:|Language:)', line):
            continue
        # Skip timestamp lines (00:00:00.000 --> 00:00:00.000 ...)
        if re.match(r'^\d{2}:\d{2}[\d:\.]+\s*-->\s*\d{2}:\d{2}[\d:\.]+', line):
            continue
        # Skip cue index lines (pure digits)
        if re.match(r'^\d+$', line.strip()):
            continue
        # Remove inline VTT tags: <00:00:00.000>, <c>, </c>, <b>, etc.
        line = re.sub(r'<[^>]+>', '', line)
        # Remove positioning directives: align:start position:0%
        line = re.sub(r'\b(align|position|line|size):[^\s]+', '', line)
        line = line.strip()
        if line:
            cleaned.append(line)

    # Deduplicate consecutive identical lines (YouTube auto-captions repeat across cue boundaries)
    deduped = []
    for line in cleaned:
        if not deduped or line != deduped[-1]:
            deduped.append(line)

    text = ' '.join(deduped)
    text = re.sub(r'\s+', ' ', text).strip()
    # Decode common HTML entities left over from VTT files
    text = text.replace('&amp;', '&').replace('&nbsp;', ' ').replace('&lt;', '<').replace('&gt;', '>').replace('&apos;', "'").replace('&quot;', '"')
    return text


# ---------- transcript fetching ----------
def fetch_transcript(video_id: str) -> str:
    """Fetch transcript for a video using yt-dlp. Returns cleaned text or error string."""
    url = f"https://www.youtube.com/watch?v={video_id}"

    cookies_file = os.getenv("COOKIES_FILE", "").strip()

    with tempfile.TemporaryDirectory() as tmpdir:
        ydl_opts = {
            'skip_download': True,
            'writeautomaticsub': True,
            'writesubtitles': True,
            'subtitleslangs': ['en'],
            'subtitlesformat': 'vtt',
            'outtmpl': os.path.join(tmpdir, '%(id)s.%(ext)s'),
            'quiet': True,
            'no_warnings': True,
        }
        if cookies_file and os.path.exists(cookies_file):
            ydl_opts['cookiefile'] = cookies_file

        for attempt in range(3):
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    ydl.download([url])
                break
            except Exception as e:
                err = str(e)
                if '429' in err:
                    wait = (attempt + 1) * 60
                    print(f"[rate limit] 429 received, waiting {wait}s before retry {attempt + 1}/3...")
                    time.sleep(wait)
                    continue
                elif any(x in err.lower() for x in ['private', 'unavailable', 'removed', 'terminated', 'age-restricted']):
                    return "Video unavailable"
                else:
                    return "Video unavailable"
        else:
            return "No transcript available"

        vtt_files = glob.glob(os.path.join(tmpdir, '*.vtt'))
        if not vtt_files:
            return "No transcript available"

        with open(vtt_files[0], 'r', encoding='utf-8') as f:
            vtt_content = f.read()

    text = clean_vtt(vtt_content)
    return text if text else "No transcript available"


# ---------- JSON helpers ----------
def load_transcripts(path: str) -> dict:
    if not os.path.exists(path):
        return {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_transcripts(path: str, transcripts: dict):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(transcripts, f, indent=2, ensure_ascii=False)
    os.replace(tmp, path)


# ---------- main ----------
def main():
    out_csv = os.getenv("OUT_CSV", "/data/results.csv").strip()
    transcripts_file = os.getenv("TRANSCRIPTS_FILE", "/data/transcripts.json").strip()
    status_file = os.getenv("TRANSCRIPT_STATUS_FILE", "/data/transcript_status.json").strip()

    if not os.path.exists(out_csv):
        raise SystemExit(f"CSV not found: {out_csv}")

    with open(out_csv, "r", newline="", encoding="utf-8") as f:
        all_rows = list(csv.DictReader(f))

    transcripts = load_transcripts(transcripts_file)
    status = load_transcripts(status_file)  # { video_id: "No transcript available" | "Video unavailable" }

    already_handled = set(transcripts) | set(status)

    # Find video IDs not yet attempted
    to_process = [
        row["video_id"] for row in all_rows
        if (row.get("video_id") or "").strip()
        and row["video_id"] not in already_handled
    ][:DAILY_LIMIT]

    total = len(to_process)
    if total == 0:
        print("[done] All videos already handled")
        return

    print(f"[info] Processing {total} videos (limit={DAILY_LIMIT}, delay={FETCH_DELAY}s)\n")

    success = 0
    failed = 0

    for n, vid in enumerate(to_process, 1):
        print(f"Processing {n}/{total}: {vid}...", end=" ", flush=True)

        transcript = fetch_transcript(vid)

        if transcript in ("Video unavailable", "No transcript available"):
            status[vid] = transcript
            failed += 1
            print(f"failed: {transcript}")
        else:
            transcripts[vid] = transcript
            success += 1
            print("done")

        # Save progress every SAVE_EVERY videos to protect against crashes
        if n % SAVE_EVERY == 0:
            save_transcripts(transcripts_file, transcripts)
            save_transcripts(status_file, status)
            print(f"[checkpoint] Saved progress at {n}/{total}")

        if n < total:
            time.sleep(FETCH_DELAY)

    save_transcripts(transcripts_file, transcripts)
    save_transcripts(status_file, status)
    print(f"\n[summary] Total: {total} | Success: {success} | Failed: {failed}")


if __name__ == "__main__":
    main()
