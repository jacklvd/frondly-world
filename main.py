"""Forage analysis service — stateless. Image in, ForageResult out; persists nothing.

The deterministic safety pipeline (vision -> dataset -> 4-state result) lives in
forage/. This file is only the HTTP seam the iOS app POSTs a photo to.

Run: uv run uvicorn main:app --reload
"""
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, UploadFile

from forage.identify import identify_wild_plant
from forage.vision import GeminiVision, VisionBackend

load_dotenv(Path(__file__).resolve().parent.parent / ".env")  # GEMINI_API_KEY

app = FastAPI(title="Forage analysis service")


@lru_cache(maxsize=1)
def get_vision() -> VisionBackend:
    """Single GeminiVision for the process. Overridden with a stub in tests."""
    return GeminiVision()


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/forage/identify")
async def forage_identify(file: UploadFile, vision: VisionBackend = Depends(get_vision)) -> dict:
    image = await file.read()
    return identify_wild_plant(image, vision).to_dict()
