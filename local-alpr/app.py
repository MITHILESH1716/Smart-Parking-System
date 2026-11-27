"""Local-only SmartParking vehicle number-plate recognition service."""

from __future__ import annotations

import re
from functools import lru_cache
from statistics import mean

import cv2
import numpy as np
from fast_alpr import ALPR
from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI(title="SmartParking Local Plate Recognition")
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_IMAGE_PIXELS = 20_000_000
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@lru_cache(maxsize=1)
def get_alpr() -> ALPR:
    # Default detector and OCR models are downloaded/cached by fast-alpr on
    # first use, then inference is performed locally using ONNX Runtime CPU.
    return ALPR(
        detector_model="yolo-v9-t-384-license-plate-end2end",
        ocr_model="cct-xs-v2-global-model",
        ocr_device="cpu",
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recognize")
async def recognize(image: UploadFile = File(...)) -> dict[str, object]:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Upload a JPG, PNG, or WEBP image.")

    raw = await image.read(MAX_IMAGE_BYTES + 1)
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 8 MB or smaller.")
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    encoded = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="The image could not be decoded.")
    if frame.shape[0] * frame.shape[1] > MAX_IMAGE_PIXELS:
        raise HTTPException(status_code=413, detail="Image dimensions are too large.")

    try:
        predictions = get_alpr().predict(frame)
    except Exception as exc:  # service remains available and returns a readable setup error
        raise HTTPException(
            status_code=503,
            detail="Local plate model could not start. Check local-alpr setup and model download access.",
        ) from exc

    candidates: list[dict[str, object]] = []
    for prediction in predictions:
        ocr = prediction.ocr
        if ocr is None or not ocr.text:
            continue
        plate = re.sub(r"[^A-Za-z0-9]", "", ocr.text).upper()
        if not plate:
            continue
        score = ocr.confidence
        if isinstance(score, (list, tuple, np.ndarray)):
            score = mean(float(value) for value in score) if len(score) else 0.0
        candidates.append({"plateNumber": plate, "confidence": float(score or 0.0)})

    if not candidates:
        raise HTTPException(
            status_code=422,
            detail="No readable number plate was found. Try a sharper, well-lit photo with the plate facing the camera.",
        )

    candidates.sort(key=lambda candidate: float(candidate["confidence"]), reverse=True)
    return {"plateNumber": candidates[0]["plateNumber"], "confidence": candidates[0]["confidence"], "candidates": candidates}
