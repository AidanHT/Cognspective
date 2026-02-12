import os
import re
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()


def evaluate_transcription(transcription: str, education: str, subject: str) -> dict:
    """Evaluate a teaching transcription using Claude Sonnet 4.5.

    Returns a dict with score, strengths, improvements, and detailed_feedback.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {
            "score": "N/A",
            "strengths": "API key not configured",
            "improvements": "Set ANTHROPIC_API_KEY in .env file",
            "detailed_feedback": "Unable to evaluate without API key.",
        }

    if not transcription or not transcription.strip():
        return {
            "score": "N/A",
            "strengths": "No transcription available",
            "improvements": "Ensure microphone is working and speak during the session",
            "detailed_feedback": "No speech was detected during this session.",
        }

    client = Anthropic(api_key=api_key)

    prompt = (
        f"You are a {education} student. You are judging the transcript below based on the following criteria: "
        "1. How much you can understand the speaker based on the language (diction) they use and your role. "
        "2. How much they pause and or stutter. "
        f"3. How much the content is relevant to the {subject} topic. "
        "Please provide your response in EXACTLY this format:\n"
        "SCORE: [number]%\n"
        "STRENGTHS: [bullet points of strengths]\n"
        "IMPROVEMENTS: [bullet points of improvements]\n"
        "FEEDBACK: [detailed paragraph of feedback]\n\n"
        f"The transcription is: {transcription}"
    )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text

        # Parse the response
        score = "N/A"
        strengths = ""
        improvements = ""
        feedback = ""

        score_match = re.search(r"SCORE:\s*(\d+%?)", response_text, re.IGNORECASE)
        if score_match:
            score = score_match.group(1)

        strengths_match = re.search(
            r"STRENGTHS?:\s*(.*?)(?=IMPROVEMENTS?:|FEEDBACK:|$)",
            response_text,
            re.IGNORECASE | re.DOTALL,
        )
        if strengths_match:
            strengths = strengths_match.group(1).strip()

        improvements_match = re.search(
            r"IMPROVEMENTS?:\s*(.*?)(?=FEEDBACK:|$)",
            response_text,
            re.IGNORECASE | re.DOTALL,
        )
        if improvements_match:
            improvements = improvements_match.group(1).strip()

        feedback_match = re.search(
            r"FEEDBACK:\s*(.*?)$", response_text, re.IGNORECASE | re.DOTALL
        )
        if feedback_match:
            feedback = feedback_match.group(1).strip()

        # Fallback: if parsing failed, use the whole response
        if not strengths and not improvements:
            feedback = response_text

        return {
            "score": score,
            "strengths": strengths,
            "improvements": improvements,
            "detailed_feedback": feedback,
        }

    except Exception as e:
        return {
            "score": "N/A",
            "strengths": "Evaluation failed",
            "improvements": str(e),
            "detailed_feedback": f"Error during LLM evaluation: {str(e)}",
        }
