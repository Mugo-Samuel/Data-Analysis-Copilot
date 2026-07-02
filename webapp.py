import csv
import io
import os

from flask import Flask, jsonify, render_template, request

from chatbot import GREETING_REPLY, OFF_TOPIC_REPLY, generate_reply, is_greeting, is_probably_data_related, local_reply

app = Flask(__name__)


def summarize_csv(file_bytes: bytes) -> str:
    text = file_bytes.decode("utf-8", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = [row for _, row in zip(range(6), reader)]

    if not rows:
        return "CSV appears empty."

    header = rows[0]
    sample_rows = rows[1:6]
    lines = [
        f"Columns ({len(header)}): {', '.join(header)}",
        "Sample rows:",
    ]

    for row in sample_rows:
        padded = row + [""] * max(0, len(header) - len(row))
        lines.append(" | ".join(padded[: len(header)]))

    return "\n".join(lines)


@app.get("/")
def home():
    return render_template("index.html")


@app.post("/chat")
def chat():
    try:
        user_message = (request.form.get("message") or "").strip()
        if not user_message:
            return jsonify({"error": "Message is required."}), 400

        if is_greeting(user_message):
            return jsonify({"reply": GREETING_REPLY})

        if not is_probably_data_related(user_message):
            return jsonify({"reply": OFF_TOPIC_REPLY})

        dataset_context = ""
        upload = request.files.get("dataset")
        if upload and upload.filename:
            if not upload.filename.lower().endswith(".csv"):
                return jsonify({"error": "Only CSV files are supported right now."}), 400
            dataset_context = summarize_csv(upload.read())

        model_input = user_message
        if dataset_context:
            model_input = (
                "The user uploaded a CSV. Use this context to guide your answer.\n"
                f"CSV Context:\n{dataset_context}\n\n"
                f"User Question:\n{user_message}"
            )

        try:
            reply = generate_reply(model_input)
        except RuntimeError as error:
            reply = f"{local_reply()}\n\nError details: {error}"

        return jsonify({"reply": reply})
    except Exception as error:
        return jsonify({"error": f"Unexpected server error: {error}"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
