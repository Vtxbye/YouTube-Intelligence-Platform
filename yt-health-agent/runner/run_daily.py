#!/usr/bin/env python3
import os, csv, json, time, re, random
from datetime import datetime, timezone

import requests, isodate
from dateutil.relativedelta import relativedelta
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

FIELDS = ["video_id","title","channel","published_at","duration_seconds","views","url","matched_keywords"]
TRANSCRIPTS_FILE = os.getenv("TRANSCRIPTS_FILE", "/data/transcripts.json")
TRANSCRIPT_STATUS_FILE = os.getenv("TRANSCRIPT_STATUS_FILE", "/data/transcript_status.json")

HEALTH = ["health","healthy","wellness","nutrition","diet","protein","fitness","workout","exercise",
          "sleep","stress","mental","mindfulness","meditation","recovery","lifestyle","habit","longevity",
          "weight loss","fat loss", "bodybuilding"]
# Stricter set for title-level gating — excludes terms too broad for titles ("lifestyle","habit","mental")
HEALTH_TITLE = ["health","healthy","wellness","nutrition","diet","protein","fitness",
                "sleep","stress","mental health","mindfulness","meditation","recovery","longevity",
                "weight loss","fat loss","supplement","vitamin","immune","gut health","inflammation",
                "cholesterol","blood pressure","blood sugar","anxiety","depression"]

NEG = ["toddler","toddlers","kids","kid","baby","nursery","rhyme","rhymes","cocomelon","cartoon",
       "toy","toys","dump truck","truck song","vehicle song","abc song","numbers for toddlers",
       "asmr", "asleep to", "asleep"]
# Country codes to exclude from the channel pool
BLOCKED_COUNTRIES = {"IN"}
# Title-level vlog signals — checked against title only to avoid over-blocking descriptions
VLOG_TITLE_NEG = [
    # lifestyle/vlog
    "unboxing","gift haul","gift guide","wishlist","storytime","grwm","get ready with me",
    "apartment tour","room tour","moving vlog","what i bought","come shop with me",
    "christmas vlog","holiday vlog","vlog ep","weekly vlog","daily vlog","shopping vlog",
    "try on haul","house tour","car tour","q&a","q & a",
    # workout demos — follow-along or timed exercise videos with no informational content
    "follow along","workout with me","train with me","exercise with me",
    "min workout","minute workout","day workout","week workout",
]

def env_int(k,d):
    v=os.getenv(k,"").strip()
    return int(v) if v else d

def now():
    return datetime.now(timezone.utc)

def iso(dt):
    return dt.isoformat().replace("+00:00","Z")

def ts(s):
    if not s: return None
    try: return datetime.fromisoformat(s.replace("Z","+00:00"))
    except: return None

def dur(iso_d):
    try: return int(isodate.parse_duration(iso_d).total_seconds())
    except: return 0

def chunks(lst,n):
    for i in range(0,len(lst),n): yield lst[i:i+n]

# ---------- CSV safety (fixes "1 row" issue) ----------
def ensure_header(path):
    if not os.path.exists(path): return
    if os.path.getsize(path)==0:
        with open(path,"w",newline="",encoding="utf-8") as f:
            csv.DictWriter(f,fieldnames=FIELDS).writeheader()
        return
    with open(path,"r",newline="",encoding="utf-8") as f:
        reader=csv.DictReader(f)
        existing_fields=list(reader.fieldnames or [])
        if existing_fields==FIELDS: return
        rows=list(reader)
    os.replace(path, path+f".backup_{int(time.time())}")
    with open(path,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS,extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

def prune(path, months_back):
    if not os.path.exists(path): return 0
    ensure_header(path)
    cutoff = now() - relativedelta(months=months_back)
    kept=[]
    with open(path,"r",newline="",encoding="utf-8") as f:
        for row in csv.DictReader(f):
            pub=ts((row.get("published_at") or "").strip())
            if pub and pub>=cutoff: kept.append(row)
    tmp=path+".tmp"
    with open(tmp,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader(); w.writerows(kept)
    os.replace(tmp,path)
    return len(kept)

def dedup_csv(path):
    """Remove duplicate video_id rows from the CSV, keeping the first occurrence."""
    if not os.path.exists(path): return 0
    ensure_header(path)
    seen_ids=set(); kept=[]
    with open(path,"r",newline="",encoding="utf-8") as f:
        all_rows=list(csv.DictReader(f))
    for row in all_rows:
        vid=(row.get("video_id") or "").strip()
        if vid and vid not in seen_ids:
            seen_ids.add(vid); kept.append(row)
    removed=len(all_rows)-len(kept)
    if removed > 0:
        tmp=path+".tmp"
        with open(tmp,"w",newline="",encoding="utf-8") as f:
            w=csv.DictWriter(f,fieldnames=FIELDS); w.writeheader(); w.writerows(kept)
        os.replace(tmp,path)
        print(f"[dedup] Removed {removed} duplicate rows")
    return removed

def check_and_remove_unavailable(path, y):
    """Remove rows for videos that are deleted, private, or otherwise unavailable."""
    if not os.path.exists(path): return 0
    ensure_header(path)
    with open(path,"r",newline="",encoding="utf-8") as f:
        all_rows=list(csv.DictReader(f))

    all_ids=[row["video_id"] for row in all_rows if (row.get("video_id") or "").strip()]
    if not all_ids: return 0

    available=set()
    for batch in chunks(all_ids, 50):
        resp=y.videos().list(part="status", id=",".join(batch)).execute()
        for item in resp.get("items", []):
            available.add(item["id"])

    removed_ids={vid for vid in all_ids if vid not in available}
    if not removed_ids:
        print(f"[health] All {len(all_ids)} videos still available")
        return 0

    kept=[row for row in all_rows if (row.get("video_id") or "").strip() not in removed_ids]
    tmp=path+".tmp"
    with open(tmp,"w",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS,extrasaction="ignore"); w.writeheader(); w.writerows(kept)
    os.replace(tmp, path)

    # Remove unavailable videos from transcripts.json and transcript_status.json
    for fpath in (TRANSCRIPTS_FILE, TRANSCRIPT_STATUS_FILE):
        if not os.path.exists(fpath): continue
        try:
            with open(fpath,"r",encoding="utf-8") as f: tx=json.load(f)
            pruned={vid: t for vid, t in tx.items() if vid not in removed_ids}
            if len(pruned) < len(tx):
                with open(fpath,"w",encoding="utf-8") as f: json.dump(pruned,f,indent=2,ensure_ascii=False)
        except Exception as e:
            print(f"[warn] Could not update {os.path.basename(fpath)}: {e}")

    print(f"[health] Removed {len(removed_ids)} unavailable video(s): {', '.join(removed_ids)}")
    return len(removed_ids)

def count_csv_rows(path):
    if not os.path.exists(path): return 0
    with open(path,"r",newline="",encoding="utf-8") as f:
        return sum(1 for _ in csv.DictReader(f))

def backup_csv(path):
    """Copy results.csv to results.csv.backup_MMDDYYYY using today's CST date, keeping only the 2 most recent backups."""
    import shutil, glob as _glob
    from zoneinfo import ZoneInfo
    if not os.path.exists(path): return
    cst_now=datetime.now(ZoneInfo("America/Chicago"))
    suffix=cst_now.strftime("%m%d%Y")
    dest=f"{path}.backup_{suffix}"
    shutil.copy2(path, dest)
    print(f"[backup] Saved {dest}")
    # Prune old backups, keeping only the 2 most recent (sort by backup date)
    def _backup_sort_key(p):
        suffix = p.rsplit(".backup_", 1)[-1]
        try:
            # MMDDYYYY format
            return datetime.strptime(suffix, "%m%d%Y")
        except ValueError:
            # unix timestamp fallback — treat as very old
            return datetime.min
    pattern=f"{path}.backup_*"
    backups=sorted(_glob.glob(pattern), key=_backup_sort_key)
    for old in backups[:-2]:
        os.remove(old)
        print(f"[backup] Removed old backup {old}")

def count_prunable(path, months_back):
    """Count rows that would be removed by pruning, without touching the file."""
    if not os.path.exists(path): return 0
    cutoff=now() - relativedelta(months=months_back)
    with open(path,"r",newline="",encoding="utf-8") as f:
      return sum(
          1
          for row in csv.DictReader(f)
          for published in [ts((row.get("published_at") or "").strip())]
          if published is None or published < cutoff
      )

# ---------- state ----------
def load_state(path):
    if not os.path.exists(path):
        return {"last_run_utc":None,"seen_video_ids":[],"channel_pool":[]}
    try:
        with open(path,"r",encoding="utf-8") as f: s=json.load(f)
        s.setdefault("last_run_utc",None); s.setdefault("seen_video_ids",[]); s.setdefault("channel_pool",[])
        return s
    except:
        return {"last_run_utc":None,"seen_video_ids":[],"channel_pool":[]}

def save_state(path,s):
    tmp=path+".tmp"
    with open(tmp,"w",encoding="utf-8") as f: json.dump(s,f,indent=2)
    os.replace(tmp,path)

def read_seen(csv_path):
    seen=set()
    if not os.path.exists(csv_path): return seen
    ensure_header(csv_path)
    with open(csv_path,"r",newline="",encoding="utf-8") as f:
        for row in csv.DictReader(f):
            vid=(row.get("video_id") or "").strip()
            if vid: seen.add(vid)
    return seen

# ---------- keywords (strict JSON only) ----------
TOPIC_POOL = [
    "gut health and microbiome","sleep science and optimization","stress and cortisol",
    "mental health and anxiety","bodybuilding and muscle growth","strength training science",
    "cardiovascular health","longevity and aging","hormones and endocrine health",
    "weight loss and metabolism","supplements and vitamins","recovery and injury prevention",
    "nutrition and macronutrients","immune system","inflammation","blood sugar and insulin",
    "cholesterol and heart disease","respiratory health","bone health and osteoporosis",
    "skin health and dermatology","cognitive performance and brain health",
    "intermittent fasting","protein and amino acids","hydration and electrolytes",
    "posture and mobility","testosterone and men's health","women's hormonal health",
]

def ollama_json_keywords(ollama_url, model):
    topics=random.sample(TOPIC_POOL, k=4)
    topic_str=", ".join(topics)
    prompt=(f"Return ONLY a JSON array (no prose) of 8 short YouTube search phrases for "
            f"INFORMATIONAL health content specifically about: {topic_str}. "
            "Focus on science explanations, expert tips, research breakdowns, and how-to guides. "
            "Avoid phrases that would find workout demonstrations, exercise follow-alongs, vlogs, or kids content. "
            "Prefer phrases like 'science of X', 'why X matters', 'how X affects health', 'X explained'.")
    r=requests.post(f"{ollama_url.rstrip('/')}/api/generate",
                    json={"model":model,"prompt":prompt,"stream":False,"options":{"temperature":0.8}},
                    timeout=120)
    r.raise_for_status()
    response=(r.json().get("response") or "").strip()
    if not response:
        raise ValueError("Ollama returned an empty response")
    m=re.search(r'\[[\s\S]*\]', response)
    if not m:
        raise ValueError(f"No JSON array found in Ollama response: {response[:300]}")
    arr=json.loads(m.group())
    if not isinstance(arr, list): return []
    out=[]
    for x in arr:
        if isinstance(x, dict):
            # extract first string value from dicts like {"searchPhrase": "..."}
            val=next((v for v in x.values() if isinstance(v,str) and v.strip()), None)
            if val: out.append(val.strip())
        elif str(x).strip():
            out.append(str(x).strip())
    return out

def sanitize(kws):
    bad={"```json","```","json","[","]","{","}"}
    out=[]; seen=set()
    for k in kws:
        k=(k or "").strip().replace('"',"").replace("'","")
        k=re.sub(r"\s+"," ",k).strip()
        lk=k.lower()
        if not k or len(k)<3: continue
        if lk in bad: continue
        if "json array" in lk or lk.startswith("here is"): continue
        if lk in seen: continue
        seen.add(lk); out.append(k)
    return out

def has_neg(text, neg_terms):
    t=(text or "").lower()
    return any(n in t for n in neg_terms)

def is_likely_english(title, sn):
    # Reject if YouTube reports a non-English audio/default language
    lang=(sn.get("defaultAudioLanguage") or sn.get("defaultLanguage") or "").lower()
    if lang and not lang.startswith("en"):
        return False
    # Reject if title has >20% non-ASCII characters (handles Tamil, Hindi, Arabic, etc.)
    if title:
        non_ascii=sum(1 for c in title if ord(c)>127)
        if non_ascii>0 and non_ascii/len(title)>0.20:
            return False
    return True

EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF"   # emoticons, symbols, pictographs
    "\U00002600-\U000027BF"    # misc symbols, dingbats
    "\U0000FE00-\U0000FE0F"    # variation selectors
    "]", re.UNICODE
)

def has_emoji(text):
    return bool(EMOJI_RE.search(text or ""))

def has_health_in_title(title):
    t=(title or "").lower()
    return any(h in t for h in HEALTH_TITLE)

def is_vlog_title(title):
    t=(title or "").lower()
    return any(v in t for v in VLOG_TITLE_NEG)

def view_velocity(rec):
    """Views per day since published — proxy for currently popular without using 'trending'."""
    pub=ts(rec["published_at"])
    if not pub: return 0.0
    age_days=max(1.0, (datetime.now(timezone.utc)-pub).total_seconds()/86400.0)
    return rec["views"]/age_days

def extract_tags(text, keywords):
    t=(text or "").lower()
    hits=[]
    for h in HEALTH:
        if h in t: hits.append(h)
    for k in keywords:
        kk=k.lower().replace('"',"").strip()
        if kk and kk in t and kk not in hits: hits.append(kk)
    uniq=[]; s=set()
    for h in hits:
        if h not in s: s.add(h); uniq.append(h)
    return uniq[:10]

# ---------- YouTube API ----------
def discover_channels(y, queries, published_after, pages_per_query):
    ch={}
    for q in queries:
        token=None
        for _ in range(pages_per_query):
            resp=y.search().list(part="snippet", q=q, type="video", order="relevance", maxResults=50,
                                 publishedAfter=published_after, pageToken=token,
                                 safeSearch="none", relevanceLanguage="en").execute()
            for it in resp.get("items",[]):
                sn=it.get("snippet",{}) or {}
                cid=(sn.get("channelId") or "").strip()
                if not cid: continue
                ch[cid]=ch.get(cid,0)+1
            token=resp.get("nextPageToken")
            if not token: break
        print(f"[info] discovered_channels={len(ch)} after q='{q}'")
    return ch

def uploads_playlists(y, channel_ids):
    """Returns (playlists_dict, countries_dict) — snippet added at no extra quota cost."""
    playlists={}; countries={}
    for batch in chunks(channel_ids,50):
        resp=y.channels().list(part="contentDetails,snippet", id=",".join(batch), maxResults=50).execute()
        for it in resp.get("items",[]):
            cid=it.get("id")
            pl=it.get("contentDetails",{}).get("relatedPlaylists",{}).get("uploads")
            country=((it.get("snippet",{}) or {}).get("country") or "").upper()
            if cid and pl:
                playlists[cid]=pl; countries[cid]=country
    return playlists, countries

def playlist_page(y, plid, token):
    try:
        resp=y.playlistItems().list(part="contentDetails", playlistId=plid, maxResults=50, pageToken=token).execute()
    except HttpError as e:
        if e.resp.status == 404:
            print(f"[warn] Playlist not found, skipping: {plid}")
            return [], None
        raise
    items=[]
    for it in resp.get("items",[]):
        cd=it.get("contentDetails",{}) or {}
        if cd.get("videoId"):
            items.append((cd.get("videoId"), cd.get("videoPublishedAt")))
    return items, resp.get("nextPageToken")

def videos_details(y, ids):
    out=[]
    for batch in chunks(ids,50):
        resp=y.videos().list(part="snippet,contentDetails,statistics,status",
                             id=",".join(batch), maxResults=50).execute()
        out.extend(resp.get("items",[]))
    return out

def filter_video(it, cutoff, min_views, min_dur, exclude_kids, neg_terms, keywords):
    sn=it.get("snippet",{}) or {}
    st=it.get("statistics",{}) or {}
    cd=it.get("contentDetails",{}) or {}
    status=it.get("status",{}) or {}

    if sn.get("liveBroadcastContent") in ("live","upcoming"): return None
    if exclude_kids and (status.get("madeForKids") is True or status.get("selfDeclaredMadeForKids") is True):
        return None

    vid=it.get("id")
    pub_at=(sn.get("publishedAt") or "").strip()
    pub=ts(pub_at)
    if not vid or not pub or pub < cutoff: return None

    views=int(st.get("viewCount",0) or 0)
    if views < min_views: return None

    ds=dur(cd.get("duration",""))
    if ds < min_dur: return None

    title=(sn.get("title") or "").strip()
    channel=(sn.get("channelTitle") or "").strip()
    desc=(sn.get("description") or "").strip()
    tags=sn.get("tags") or []
    blob=f"{title}\n{channel}\n{desc}\n{' '.join(tags)}"

    if not is_likely_english(title, sn): return None
    if has_emoji(title): return None
    if has_neg(blob, neg_terms): return None
    if not has_health_in_title(title): return None
    if is_vlog_title(title): return None

    mk=", ".join(extract_tags(blob, keywords))
    return {"video_id":vid,"title":title,"channel":channel,"published_at":pub_at,
            "duration_seconds":ds,"views":views,"url":f"https://www.youtube.com/watch?v={vid}",
            "matched_keywords":mk}

def _loose_health(it, cutoff):
    """Channel scoring gate: any HEALTH keyword anywhere in title+desc+tags."""
    sn=it.get("snippet",{}) or {}
    pub=ts((sn.get("publishedAt") or "").strip())
    if not pub or pub < cutoff: return False
    title=(sn.get("title") or "").strip()
    desc=(sn.get("description") or "").strip()
    tags=sn.get("tags") or []
    blob=f"{title} {desc} {' '.join(tags)}".lower()
    return any(h in blob for h in HEALTH)

def score_channels(y, cand_ids, uploads_map, cutoff, min_views, min_dur, exclude_kids, neg_terms, keywords, sample_n=20):
    scores={}
    for cid in cand_ids:
        pl=uploads_map.get(cid)
        if not pl: scores[cid]=0; continue
        items,_ = playlist_page(y, pl, None)
        vids=[]
        for vid,vpub in items:
            dt=ts(vpub) if vpub else None
            if dt and dt < cutoff: continue
            vids.append(vid)
            if len(vids) >= sample_n: break
        if not vids: scores[cid]=0; continue
        det=videos_details(y, vids)
        scores[cid]=sum(1 for it in det if _loose_health(it, cutoff))
    return scores

def main():
    api_key=os.getenv("YT_API_KEY","").strip()
    if not api_key: raise SystemExit("Missing YT_API_KEY")

    out_csv=os.getenv("OUT_CSV","/data/results.csv").strip()
    state_file=os.getenv("STATE_FILE","/data/state.json").strip()

    db_max=env_int("DB_MAX",1000)
    months_back=env_int("MONTHS_BACK",6)
    min_dur=env_int("MIN_DURATION_SECONDS",300)
    min_views=env_int("MIN_VIEWS",5000)

    discovery_pages=env_int("DISCOVERY_PAGES_PER_QUERY",1)
    playlist_pages=env_int("PLAYLIST_PAGES_PER_CHANNEL",3)
    max_per_channel=env_int("MAX_VIDEOS_PER_CHANNEL",50)

    exclude_kids = os.getenv("EXCLUDE_MADE_FOR_KIDS","1").strip() != "0"
    extra_neg = os.getenv("NEGATIVE_TERMS","").strip()
    neg_terms=[n.lower() for n in NEG] + ([t.strip().lower() for t in extra_neg.split(",") if t.strip()] if extra_neg else [])

    ollama_url=os.getenv("OLLAMA_URL","http://ollama:11434").strip()
    ollama_model=os.getenv("OLLAMA_MODEL","llama3.1:8b").strip()

    os.makedirs(os.path.dirname(out_csv), exist_ok=True)
    ensure_header(out_csv)
    dedup_csv(out_csv)

    state=load_state(state_file)

    # Skip if already ran successfully today (UTC date) — prevents double-runs
    # when the container restarts on a day the script already completed.
    #last_run=ts(state.get("last_run_utc") or "")
    #if last_run and last_run.date() == now().date():
        #print(f"[skip] Already ran today ({state['last_run_utc']}), skipping")
        #return

    # Compute open slots without touching the file yet — so a network failure
    # never leaves the DB pruned but unfilled.
    current=count_csv_rows(out_csv)
    to_prune=count_prunable(out_csv, months_back)
    target=(db_max - current) + to_prune  # open slots + slots about to free up
    print(f"[info] db={current}/{db_max} stale={to_prune} need={target}")
    if target <= 0:
        print("[info] DB at capacity, nothing to add today")
        return

    backup_csv(out_csv)

    seen=set(state.get("seen_video_ids") or [])
    seen |= read_seen(out_csv)

    cutoff=now() - relativedelta(months=months_back)

    keywords=sanitize(ollama_json_keywords(ollama_url, ollama_model))
    print(f"[info] keywords({len(keywords)}): {keywords}")

    # Discovery always looks back at least 30 days so channels are found even when
    # runs happen close together (using last_run_utc would make the window too tight).
    discovery_floor=now() - relativedelta(days=30)
    published_after=iso(max(discovery_floor, cutoff))
    print(f"[info] discovery publishedAfter={published_after}")

    y=build("youtube","v3",developerKey=api_key)

    check_and_remove_unavailable(out_csv, y)

    neg_q="-kids -toddler -nursery -rhyme -cartoon -toy -cocomelon -baby -vlog -haul -unboxing -grwm -asmr"
    discovery_queries=[f"{k} {neg_q}" for k in keywords]

    found=discover_channels(y, discovery_queries, published_after, discovery_pages)
    ranked=sorted(found.items(), key=lambda kv: kv[1], reverse=True)

    pool=list(dict.fromkeys(state.get("channel_pool") or []))
    pool_set=set(pool)

    # Score only channels not yet in pool; add every one that has health content
    new_cands=[cid for cid,_ in ranked if cid not in pool_set]
    if new_cands:
        new_uploads,new_countries=uploads_playlists(y, new_cands)
        new_scores=score_channels(y, new_cands, new_uploads, cutoff, min_views, min_dur, exclude_kids, neg_terms, keywords)
        # Drop blocked-country channels before adding to pool
        new_countries_blocked={cid for cid,c in new_countries.items() if c in BLOCKED_COUNTRIES}
        for cid in sorted(new_cands, key=lambda c: new_scores.get(c,0), reverse=True):
            if new_scores.get(cid,0) > 0 and cid not in new_countries_blocked:
                pool.append(cid); pool_set.add(cid)

    # Persist pool now so it survives a quota failure during collection
    state["channel_pool"]=pool
    state["last_run_utc"]=iso(now())
    save_state(state_file, state)

    uploads,ch_countries=uploads_playlists(y, pool)
    active=[cid for cid in pool if cid in uploads and ch_countries.get(cid) not in BLOCKED_COUNTRIES]

    # Rotate through pool so we don't collect from all channels every run
    max_collect=env_int("MAX_COLLECT_CHANNELS", 200)
    offset=state.get("collect_offset", 0) % max(len(active), 1)
    rotated=active[offset:] + active[:offset]
    collect_channels=rotated[:max_collect]
    state["collect_offset"]=(offset + max_collect) % max(len(active), 1)
    print(f"[info] pool={len(pool)} active={len(active)} collecting={len(collect_channels)} (offset={offset})")

    per={cid:[] for cid in collect_channels}
    plids={cid:uploads.get(cid) for cid in collect_channels if uploads.get(cid)}
    tokens={cid:None for cid in plids}
    used={cid:0 for cid in tokens}
    done=set()

    while sum(len(v) for v in per.values()) < target:
        progressed=False
        for cid in list(tokens.keys()):
            if cid in done: continue
            if used[cid] >= playlist_pages: done.add(cid); continue

            items,nxt = playlist_page(y, plids[cid], tokens[cid])
            used[cid]+=1
            tokens[cid]=nxt

            page_ids=[]
            hit_cutoff=False
            for vid,vpub in items:
                dt=ts(vpub) if vpub else None
                if dt and dt < cutoff:
                    hit_cutoff=True
                    continue
                if vid not in seen: page_ids.append(vid)

            if hit_cutoff or not nxt: done.add(cid)
            if not page_ids: continue

            det=videos_details(y, page_ids)
            for it in det:
                rec=filter_video(it, cutoff, min_views, min_dur, exclude_kids, neg_terms, keywords)
                if rec and rec["video_id"] not in seen:
                    per[cid].append(rec)
            per[cid].sort(key=view_velocity, reverse=True)
            per[cid]=per[cid][:max_per_channel]
            if len(per[cid]) >= max_per_channel: done.add(cid)
            progressed=True

        if not progressed or len(done)==len(tokens): break

    ptr={cid:0 for cid in collect_channels}
    picked=[]
    while len(picked) < target:
        did=False
        for cid in collect_channels:
            i=ptr[cid]; lst=per.get(cid,[])
            if i < len(lst):
                picked.append(lst[i]); ptr[cid]+=1; did=True
                if len(picked) >= target: break
        if not did: break

    ensure_header(out_csv)
    added_rows=0
    with open(out_csv,"a",newline="",encoding="utf-8") as f:
        w=csv.DictWriter(f,fieldnames=FIELDS)
        for r in picked:
            if r["video_id"] in seen: continue
            w.writerow(r); seen.add(r["video_id"]); added_rows += 1

    eligible_total=sum(len(v) for v in per.values())
    print(f"[done] channels_used={len(collect_channels)} eligible_total={eligible_total} picked={len(picked)} added={added_rows}")

    # Prune only after a successful write — network failure before this point
    # leaves the CSV untouched rather than shrunk-but-not-refilled.
    if added_rows > 0:
        prune(out_csv, months_back)

    state["last_run_utc"]=iso(now())
    state["seen_video_ids"]=sorted(list(seen))[-300000:]
    state["channel_pool"]=pool
    save_state(state_file,state)

if __name__=="__main__":
    try:
        main()
    except HttpError as e:
        raise SystemExit(f"YouTube API error: {e}")

    