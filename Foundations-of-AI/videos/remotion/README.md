# Chapter intro videos (Remotion)

One composition per chapter (`01-agents` … `12-uncertainty`), scripts in `../SCRIPTS.md`. The voice is the clock:
every cue hangs on a word of the voiceover (`w("perceives")`), scene lengths and captions come from the word timings.

- `src/video.tsx`: the template (title, previously, big picture, roadmap, exam, end card) and the `Chapter` type.
- `src/vNN/index.ts`: a chapter's config (voice, roadmap stations, exam problems); `src/vNN/*.tsx` its two own scenes.
- `src/shared/`: title, course-map opener, roadmap, exam card, end card, captions. `src/anim.ts`: tweens and the word clock.
- `public/vo/NN/b1..b4.txt`: the narration as captioned; `bK.say.txt` (optional) is what the voice reads ("A star" for A*).

```console
npm i --loglevel=error
../tools/vo.sh public/vo/02                  # voice a chapter (Kokoro am_michael, speed 0.9, local): wav + words.json
npm run dev                                   # Remotion Studio
npx remotion render 02-formulation ../../content/videos/formulation.mp4   # the app plays content/videos/<topic id>.mp4
```

`../tools/vo.sh` needs `../tools/.venv` (`uv venv ../tools/.venv --python 3.12 && uv pip install --python ../tools/.venv/bin/python kokoro-onnx==0.6.1 soundfile`).
