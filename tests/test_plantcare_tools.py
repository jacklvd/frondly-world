"""Offline self-checks for plant-care tools. Run: python tests/test_plantcare_tools.py"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from plantcare.tools.decline import assess_decline


def test_decline_detects_downward_trend():
    h = [
        {"date": "2026-06-01", "health": "thriving"},
        {"date": "2026-06-10", "health": "good"},
        {"date": "2026-06-20", "health": "fair"},
    ]
    r = assess_decline(h)
    assert r["trend"] == "declining", r
    assert r["signals"], r  # at least one step-down recorded


def test_decline_detects_improvement():
    h = [
        {"date": "2026-06-01", "health": "poor"},
        {"date": "2026-06-15", "health": "good"},
    ]
    assert assess_decline(h)["trend"] == "improving"


def test_decline_stable_and_insufficient():
    assert assess_decline([])["trend"] == "stable"
    assert assess_decline([{"date": "2026-06-01", "health": "good"}])["trend"] == "stable"


if __name__ == "__main__":
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in tests:
        fn()
        print(f"ok  {fn.__name__}")
    print(f"\nall {len(tests)} passed")
