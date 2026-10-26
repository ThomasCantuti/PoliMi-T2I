# Fix Whisper word timings against measured pauses, and restore the script's exact text.
#   python3 refine.py <vo dir> <whisper dir> b1 b2 b3 b4
# Reads <vo dir>/<b>.txt, <whisper dir>/<b>.json (Whisper small.en transcript.json) and the clip it was made from,
# <whisper dir>/<b>.wav; writes <vo dir>/<b>.words.json.
# Whisper's starts drift inside a sentence (up to ~0.6 s here); the pauses in the wav are exact.
# Each measured pause (found at -40 dB >= 0.065 s, edges taken at -45 dB) is matched to the script's punctuation
# boundary nearest to it; the words of each speech run are then mapped linearly from Whisper's span onto the
# measured span.
# ponytail: linear warp per run, a forced aligner if mid-sentence words need frame accuracy.
import difflib, json, re, subprocess, sys

def silences(wav, db, d):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", wav, "-af", f"silencedetect=noise={db}dB:d={d}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    v = [float(x) for x in re.findall(r"silence_(?:start|end): ([\d.]+)", out)]
    return list(zip(v[0::2], v[1::2]))

def pauses(wav):
    fine = silences(wav, -45, 0.05)
    out = []
    for s0, s1 in silences(wav, -40, 0.065):
        inner = [(a, b) for a, b in fine if a < s1 and b > s0]
        out.append((min(a for a, _ in inner), max(b for _, b in inner)) if inner else (s0, s1))
    return out

def align(words, script, norm):
    """Whisper's words onto the script's: matching words keep their times; a stretch heard differently (a number,
    "A star" for A*, a misheard word) spreads its script words evenly over the time Whisper heard there."""
    out = [None] * len(script)
    sm = difflib.SequenceMatcher(a=[norm(w["text"]) for w in words], b=[norm(t) for t in script], autojunk=False)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == "equal":
            for k in range(j2 - j1):
                out[j1 + k] = dict(words[i1 + k])
        elif j2 > j1:
            s = words[i1]["start"] if i2 > i1 else words[i1 - 1]["end"] if i1 else 0
            e = words[i2 - 1]["end"] if i2 > i1 else words[i1]["start"] if i1 < len(words) else s
            for k in range(j2 - j1):
                out[j1 + k] = {"start": s + (e - s) * k / (j2 - j1), "end": s + (e - s) * (k + 1) / (j2 - j1)}
            print(f"  heard {' '.join(w['text'] for w in words[i1:i2])!r} for {' '.join(script[j1:j2])!r} at {s:.2f}")
    return out

def refine(words, script, dur, gaps):
    norm = lambda t: re.sub(r"[^a-z0-9']", "", t.lower())
    words = align(words, script, norm)
    cuts, used = [], set()  # cut k = (index of the first word after pause k, pause)
    for s0, s1 in sorted(gaps, key=lambda g: g[0] - g[1]):  # longest first
        if s0 < 0.05 or s1 > dur - 0.05:
            continue  # leading / trailing silence
        cands = [(abs(words[i + 1]["start"] - min(max(words[i + 1]["start"], s0), s1)), i + 1)
                 for i in range(len(words) - 1) if re.search(r"[.,?!:;]$", script[i]) and i + 1 not in used]
        if not cands:
            continue
        d, j = min(cands)
        # a short silence may be a stop consonant: use it only where Whisper puts the boundary there too
        if d > (0.8 if s1 - s0 >= 0.15 else 0.1) or any((j < j2) != (s0 < a2) for j2, a2, _ in cuts):
            print(f"  pause {s0:.2f}-{s1:.2f} matches no punctuation, ignored")
            continue
        used.add(j); cuts.append((j, s0, s1))
        print(f"  pause {s0:.2f}-{s1:.2f} -> before '{script[j]}' (Whisper start {words[j]['start']:.2f})")
    cuts.sort()
    bounds = [0] + [j for j, _, _ in cuts] + [len(words)]
    out = []
    for k in range(len(bounds) - 1):
        a, b = bounds[k], bounds[k + 1] - 1
        rs = cuts[k - 1][2] if k else words[a]["start"]
        re_ = cuts[k][1] if k < len(cuts) else dur
        ws, we = words[a]["start"], words[b]["end"]
        f = lambda t: round(rs + (t - ws) * (re_ - rs) / (we - ws), 3)
        for i in range(a, b + 1):
            out.append({"id": f"w{i}", "text": script[i], "start": f(words[i]["start"]), "end": f(words[i]["end"])})
    return out

if __name__ == "__main__":
    root, wdir, beats = sys.argv[1], sys.argv[2], sys.argv[3:]
    for b in beats:
        wav = f"{wdir}/{b}.wav"
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav],
                                   capture_output=True, text=True).stdout)
        raw = json.load(open(f"{wdir}/{b}.json"))
        script = open(f"{root}/{b}.txt").read().split()
        new = refine(raw, script, dur, pauses(wav))
        assert all(x["start"] <= x["end"] <= dur + 1e-3 for x in new) and all(p["start"] <= q["start"] for p, q in zip(new, new[1:]))
        json.dump(new, open(f"{root}/{b}.words.json", "w"), indent=2)
        moved = [(w["text"], r["start"], w["start"]) for w, r in zip(new, raw) if abs(w["start"] - r["start"]) > 0.15]
        print(b, f"{len(new)} words, clip {dur:.3f} s, starts moved > 0.15 s:", ", ".join(f"{t} {a:.2f}->{c:.2f}" for t, a, c in moved) or "none")
