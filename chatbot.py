import json
import os
import re
from typing import Any

from groq import Groq


MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama-3.1-8b-instant")


def get_api_key() -> str:
    return os.getenv("SMAPIKEY") or os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY") or ""


def get_groq_client() -> Groq:
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError(
            "Missing SMAPIKEY environment variable. "
            "Set a valid Groq API key before running this script."
        )

    return Groq(api_key=api_key)

SYSTEM_INSTRUCTION = (
    "You are a data analysis assistant. Only help with tasks related to data "
    "analysis, statistics, data cleaning, visualization, and working with "
    "datasets (e.g. pandas, SQL, spreadsheets, charts, summarizing data). "
    "If the user asks about anything outside this scope, politely decline "
    "and explain that you only handle data analysis tasks."
)

# Keywords used to short-circuit obviously off-topic requests before
# calling the API at all (saves latency/cost). Not a security boundary,
# just a cheap first pass.
DATA_ANALYSIS_KEYWORDS = [
    "data", "analysis", "analyze", "analyse", "dataset", "csv", "excel",
    "spreadsheet", "pandas", "numpy", "sql", "query", "chart", "plot",
    "graph", "visuali", "statistic", "stats", "mean", "median", "average",
    "correlation", "regression", "column", "row", "table", "dataframe",
    "pivot", "aggregate", "trend", "outlier", "distribution", "cluster",
    "model", "predict", "clean", "merge", "join", "filter", "sort",
    "sum", "count", "percentage", "metric", "kpi", "report",
]

OFF_TOPIC_REPLY = (
    "I only handle data analysis tasks (e.g. cleaning, statistics, pandas, "
    "SQL, visualization, summarizing datasets). That request looks outside "
    "that scope, so I can't help with it here."
)

GREETING_REPLY = (
    "Hi. I’m a data analysis assistant. I can help with cleaning data, "
    "statistics, pandas, SQL, visualization, summaries, and basic "
    "analysis workflows. Ask me a data question and I’ll help."
)

GREETING_WORDS = {
    "hi",
    "hello",
    "hey",
    "hiya",
    "yo",
}

GREETING_PHRASES = {
    "good morning",
    "good afternoon",
    "good evening",
}


def is_probably_data_related(user_input: str) -> bool:
    lowered = user_input.lower()
    return any(keyword in lowered for keyword in DATA_ANALYSIS_KEYWORDS)


def is_greeting(user_input: str) -> bool:
    lowered = user_input.lower().strip()
    lowered = re.sub(r"[\s\W_]+$", "", lowered)

    if lowered in GREETING_WORDS or lowered in GREETING_PHRASES:
        return True

    words = lowered.split()
    if not words:
        return False

    first_two = " ".join(words[:2])
    if first_two in GREETING_PHRASES:
        return len(words) <= 3

    return words[0] in GREETING_WORDS and len(words) <= 3


def generate_reply(user_input: str) -> str:
    try:
        client = get_groq_client()
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_INSTRUCTION},
                {"role": "user", "content": user_input},
            ],
            temperature=1,
            max_completion_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )

        chunks: list[str] = []
        for chunk in completion:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                chunks.append(delta)

        reply = "".join(chunks).strip()
        if not reply:
            raise RuntimeError("Unexpected Groq response: empty completion")

        return reply
    except Exception as error:
        details = str(error)
        lowered = details.lower()

        if "1010" in lowered or "cloudflare" in lowered:
            raise RuntimeError(
                "Groq rejected the request with Cloudflare error 1010. "
                "This usually means the request is being blocked by Groq, your network, or an account/access restriction. "
                "Check that the Groq API key is active, the selected model is allowed, and the request is not being filtered by a proxy or region policy."
            ) from error

        if "api key" in lowered or "authentication" in lowered:
            raise RuntimeError(
                "Groq API key is invalid. Set SMAPIKEY or GROQ_API_KEY to a valid Groq API key."
            ) from error

        if "timeout" in lowered or "network" in lowered or "connect" in lowered:
            raise RuntimeError(f"Could not reach Groq API: {details}") from error

        raise RuntimeError(f"Groq API request failed: {details}") from error


def local_reply(error: RuntimeError | None = None) -> str:
    base_reply = (
        "I can only help with data analysis tasks (e.g. cleaning, statistics, "
        "pandas, SQL, visualization, summarizing datasets)."
    )

    if error is None:
        return base_reply

    details = str(error)
    lowered = details.lower()

    if "cloudflare error 1010" in lowered:
        return (
            f"{base_reply} I could not reach Groq because the request was blocked. "
            "Check the active Groq API key, model access, and whether a proxy, VPN, "
            "or region policy is blocking the request."
        )

    if "api key" in lowered and ("invalid" in lowered or "missing" in lowered):
        return (
            f"{base_reply} The Groq API key looks invalid or missing. "
            "Set SMAPIKEY or GROQ_API_KEY to a valid Groq key."
        )

    if "could not reach groq api" in lowered:
        return (
            f"{base_reply} I could not reach Groq right now. "
            "Check your internet connection and try again."
        )

    return f"{base_reply} {details}"


def run_cli() -> None:
    print("Welcome to the Data Analysis chatbot! Type 'exit' to quit.")

    while True:
        user_input = input("You: ").strip()
        if user_input.lower() == "exit":
            print("Goodbye!")
            break
        if not user_input:
            continue

        if is_greeting(user_input):
            print("Assistant:", GREETING_REPLY)
            continue

        if not is_probably_data_related(user_input):
            print("Assistant:", OFF_TOPIC_REPLY)
            continue

        try:
            reply = generate_reply(user_input)
        except RuntimeError as error:
            print("Error:", error)
            print("Using local fallback response.")
            reply = local_reply(error)

        print("Assistant:", reply)


if __name__ == "__main__":
    run_cli()