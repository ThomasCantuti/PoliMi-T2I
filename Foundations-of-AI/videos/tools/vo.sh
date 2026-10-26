#!/bin/sh
# Voices every <vo dir>/b*.txt with Kokoro (local) and times its words.
#   tools/vo.sh <vo dir> [voice=am_michael] [speed=0.9]
# Writes <b>.wav at -17 LUFS and <b>.words.json ([{text, start, end}], seconds into the clip, script spelling).
set -e
VO=$(cd "$1" && pwd) VOICE=${2:-am_michael} SPEED=${3:-0.9}
T=$(cd "$(dirname "$0")" && pwd)
W=$(mktemp -d)
for txt in "$VO"/b?.txt; do
  b=$(basename "$txt" .txt)
  # <b>.say.txt, when present, is what Kokoro reads ("A star" for A*); captions and timings keep <b>.txt
  say=$txt; [ -f "$VO/$b.say.txt" ] && say=$VO/$b.say.txt
  HYPERFRAMES_PYTHON=$T/.venv/bin/python npx hyperframes tts "$say" -v "$VOICE" -s "$SPEED" -o "$W/$b.wav" >/dev/null
  # measured as stereo: the video plays mono in both channels, which reads 3 dB louder than the mono file
  ffmpeg -hide_banner -loglevel error -y -i "$W/$b.wav" -ac 2 "$W/$b.st.wav"
  lufs=$(ffmpeg -hide_banner -nostats -i "$W/$b.st.wav" -af ebur128=framelog=quiet -f null - 2>&1 | awk '$1 == "I:" { v = $2 } END { print v }')
  ffmpeg -hide_banner -loglevel error -y -i "$W/$b.st.wav" -af "volume=$(echo "-17 - $lufs" | bc)dB,alimiter=limit=0.71:level=false" "$VO/$b.wav"
  # words are timed on the raw clip: refine.py's silence thresholds are set for Kokoro's own level
  npx hyperframes transcribe "$W/$b.wav" --model small.en -d "$W" >/dev/null
  mv "$W/transcript.json" "$W/$b.json" 2>/dev/null || mv "$W/assets/transcript.json" "$W/$b.json"
  echo "$b: $lufs LUFS raw"
done
python3 "$T/refine.py" "$VO" "$W" $(cd "$VO" && ls b?.txt | sed 's/\.txt$//')
rm -rf "$W"
