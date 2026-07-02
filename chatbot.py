import json
import os
import re
import urllib.error
import urllib.request
from typing import Any


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = os.getenv("GROQ_MODEL_NAME", "llama-3.1-8b-instant")


def get_api_key() -> str:
    return os.getenv("SMAPIKEY") or os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY") or ""


def build_api_request(payload: dict[str, Any]) -> urllib.request.Request:
    api_key = get_api_key()
    if not api_key:
        raise RuntimeError(
            "Missing SMAPIKEY environment variable. "
            "Set a valid Groq API key before running this script."
        )

    return urllib.request.Request(
        GROQ_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

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
    payload: dict[str, Any] = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_input},
        ],
    }

    try:
        with urllib.request.urlopen(build_api_request(payload), timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        if error.code == 403 and "1010" in details:
            raise RuntimeError(
                "Groq rejected the request with Cloudflare error 1010. "
                "This usually means the request is being blocked by Groq, your network, or an account/access restriction. "
                "Check that the Groq API key is active, the selected model is allowed, and the request is not being filtered by a proxy or region policy."
            ) from error
        if error.code in {401, 403} and "api key" in details.lower():
            raise RuntimeError(
                "Groq API key is invalid. Set SMAPIKEY to a valid Groq API key."
            ) from error
        raise RuntimeError(f"Groq API request failed ({error.code}): {details}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Could not reach Groq API: {error.reason}") from error

    choices = data.get("choices", [])
    if not choices:
        raise RuntimeError(f"Unexpected Gemini response: {data}")

    message = choices[0].get("message", {})
    content = message.get("content", "")
    if not content:
        raise RuntimeError(f"Unexpected Groq response: {data}")

    return str(content)


def local_reply() -> str:
    # Fallback stays scoped too, so behavior is consistent whether or not
    # Gemini is reachable.
    return (
        "I'm currently offline, and even when online I only handle "
        "data analysis questions (e.g. cleaning, statistics, pandas, SQL, "
        "visualization). Please try again shortly."
    )


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
            reply = local_reply()

        print("Assistant:", reply)


if __name__ == "__main__":
    run_cli()