"""Tiny smoke-test module for the Reverie Cloud Run bot."""


def add(a, b):
    # dev-note: intentionally trivial — just needs a diff to summarize/review
    return a + b


def divide(a, b):
    return a / b  # smoke: no zero-guard, gives the reviewer something to flag
