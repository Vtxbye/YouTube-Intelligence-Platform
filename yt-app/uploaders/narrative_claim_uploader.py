import csv
import os
import requests
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())
API_URL = os.getenv("NEXT_PUBLIC_API_URL")

def parallel_map(func, items, max_workers=2):
  with ThreadPoolExecutor(max_workers=max_workers) as ex:
    futures = {ex.submit(func, item): item for item in items}
    for f in as_completed(futures):
      try:
        f.result()
      except Exception as e:
        print(f"Error: {e}")

def parse_csv(csv_path):
  narratives = []
  current = None

  with open(csv_path, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
      narrative_text = row.get("narrative", "").strip()
      video_id = row.get("video_id", "").strip()
      claim_text = row.get("claim", "").strip()

      if narrative_text:
        current = {"narrative_text": narrative_text, "claims": []}
        narratives.append(current)
        continue

      if current and video_id and claim_text:
        current["claims"].append({"video_id": video_id, "claim_text": claim_text})

  return narratives

def process_single_claim(args):
  session, narrative_id, claim, video_claim_cache, narrative_claim_cache = args
  video_id = claim["video_id"]
  claim_text = claim["claim_text"]

  video_claims = video_claim_cache[video_id]
  claim_id = None

  for vc in video_claims:
    if vc["claim_text"].strip() == claim_text:
      claim_id = vc["claim_id"]
      break

  if not claim_id:
    r = session.post(f"{API_URL}/claims", json={"video_id": video_id, "claim_text": claim_text})
    if r.status_code != 200:
      print(f"Error creating claim: {r.text}")
      return
    claim_id = r.json()["claim_id"]
    video_claim_cache[video_id].append({"claim_id": claim_id, "claim_text": claim_text})
    print(f"Added claim {claim_id}: {claim_text[:60]}")

  narrative_claims = narrative_claim_cache[narrative_id]
  if any(nc["claim_id"] == claim_id for nc in narrative_claims):
    print(f"Link exists for claim {claim_id}")
    return

  r = session.post(f"{API_URL}/narratives/{narrative_id}/claims/{claim_id}")
  if r.status_code == 200:
    narrative_claim_cache[narrative_id].append({"claim_id": claim_id})
    print(f"Linked claim {claim_id} → narrative {narrative_id}")
  else:
    print(f"Error linking claim {claim_id}: {r.text}")

def upload_data(narratives):
  session = requests.Session()

  r = session.get(f"{API_URL}/videos")
  existing_videos = {v["video_id"] for v in r.json()}

  r = session.get(f"{API_URL}/narratives", params={"limit": 5000})
  narrative_cache = {n["narrative_text"].strip(): n["narrative_id"] for n in r.json()}

  video_claim_cache = {}
  narrative_claim_cache = {}

  for block in narratives:
    narrative_text = block["narrative_text"]
    claims = block["claims"]

    print(f"\nNarrative: {narrative_text[:80]}")

    if narrative_text in narrative_cache:
      narrative_id = narrative_cache[narrative_text]
      print(f"Using existing narrative {narrative_id}")
    else:
      r = session.post(f"{API_URL}/narratives", json={"narrative_text": narrative_text, "domain": None})
      narrative_id = r.json()["narrative_id"]
      narrative_cache[narrative_text] = narrative_id
      print(f"Created narrative {narrative_id}")

    if narrative_id not in narrative_claim_cache:
      r = session.get(f"{API_URL}/narratives/{narrative_id}/claims")
      narrative_claim_cache[narrative_id] = r.json()

    for c in claims:
      if c["video_id"] not in existing_videos:
        print(f"Skip — video {c['video_id']} missing")
        continue

      if c["video_id"] not in video_claim_cache:
        r = session.get(f"{API_URL}/videos/{c['video_id']}/claims")
        video_claim_cache[c["video_id"]] = r.json()

    items = [
      (session, narrative_id, c, video_claim_cache, narrative_claim_cache)
      for c in claims
      if c["video_id"] in existing_videos
    ]

    parallel_map(process_single_claim, items, max_workers=2)

def main():
  script_dir = Path(__file__).resolve().parent
  data_file = script_dir.parent.parent / "yt-health-agent" / "data" / "generated_narratives_and_claims_formatted.csv"

  narratives = parse_csv(data_file)
  upload_data(narratives)

if __name__ == "__main__":
  main()