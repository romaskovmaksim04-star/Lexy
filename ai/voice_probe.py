"""Median pitch of every Silero v3_en speaker, to tell male from female voices."""
import json
import numpy as np
import torch

torch.set_num_threads(2)
model, _ = torch.hub.load("snakers4/silero-models", "silero_tts", language="en", speaker="v3_en", trust_repo=True)
SR = 24000
text = "Hello, I am your examiner today. Could you tell me about your hometown?"


def f0(x: np.ndarray) -> float:
    """Median autocorrelation pitch over voiced 40 ms frames."""
    frame = int(0.04 * SR)
    hop = frame // 2
    out = []
    for i in range(0, len(x) - frame, hop):
        seg = x[i : i + frame]
        if np.sqrt(np.mean(seg**2)) < 0.02:
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, mode="full")[frame - 1 :]
        lo, hi = SR // 400, SR // 70
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] > 0.3 * ac[0]:
            out.append(SR / lag)
    return float(np.median(out)) if out else 0.0


res = {}
for spk in model.speakers:
    if spk == "random":
        continue
    audio = model.apply_tts(text=text, speaker=spk, sample_rate=SR).numpy()
    res[spk] = round(f0(audio), 1)
print(json.dumps(res))
