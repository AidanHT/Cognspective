from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session as DBSession
from datetime import datetime
import threading
import os
import cv2
import logging
import traceback

# Ensure imports work when running from project root
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from transcribe import TranscriptionService
from camera_manager import CameraManager
from emotion_cam import EmotionDetector
from evaluation.test import evaluate_transcription
from models.database import init_db, get_db, Session as SessionModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Cognspective API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# --- Pydantic Models ---

class SessionStart(BaseModel):
    subject: str
    name: str = ""
    education: str = ""

class SessionStop(BaseModel):
    name: str = ""
    education: str = ""
    subject: str = ""

class MetricsResponse(BaseModel):
    teaching_effectiveness: float = 0.0
    face_presence: float = 0.0
    positive_emotions: float = 0.0
    neutral_emotions: float = 0.0
    negative_emotions: float = 0.0

class EvaluationResponse(BaseModel):
    score: str = "N/A"
    strengths: str = ""
    improvements: str = ""
    detailed_feedback: str = ""

# --- Global State ---

transcription_service = None
emotion_detector = None
camera_manager = CameraManager()
session_start_time = None
current_session_data = {}


# --- Helpers ---

def generate_frames():
    global emotion_detector
    while True:
        if emotion_detector is None:
            break
        frame = emotion_detector.get_frame()
        if frame is None:
            continue
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


# --- Endpoints ---

@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/test-camera")
def test_camera():
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": "Could not open camera"}
            )
        ret, frame = cap.read()
        cap.release()
        if not ret:
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": "Could not read from camera"}
            )
        return {"status": "success"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.post("/api/start-session")
def start_session(data: SessionStart):
    global emotion_detector, transcription_service, session_start_time, current_session_data
    try:
        logger.info("Starting new session for subject: %s", data.subject)
        session_start_time = datetime.utcnow()
        current_session_data = {
            "name": data.name,
            "education": data.education,
            "subject": data.subject,
        }

        # Start transcription service
        try:
            if transcription_service is None:
                logger.info("Initializing transcription service...")
                transcription_service = TranscriptionService()
                thread = threading.Thread(target=transcription_service.start_recording)
                thread.daemon = True
                thread.start()
                logger.info("Transcription service started successfully")
        except Exception as e:
            logger.error("Failed to start transcription service: %s", str(e))
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={"status": "error", "message": "Failed to start transcription"}
            )

        # Initialize and start emotion detector
        try:
            logger.info("Initializing emotion detector...")
            emotion_detector = EmotionDetector()
            if not emotion_detector.start():
                raise Exception("Failed to start emotion detector")
            logger.info("Emotion detector started successfully")
        except Exception as e:
            logger.error("Failed to start emotion detector: %s", str(e))
            logger.error(traceback.format_exc())

        return {"status": "success"}
    except Exception as e:
        logger.error("Error in start_session: %s", str(e))
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.post("/api/stop-session")
def stop_session(data: Optional[SessionStop] = None, db: DBSession = Depends(get_db)):
    global emotion_detector, transcription_service, session_start_time, current_session_data
    try:
        logger.info("Stopping session...")
        end_time = datetime.utcnow()
        duration = 0
        if session_start_time:
            duration = int((end_time - session_start_time).total_seconds())

        # Get final metrics before stopping
        final_metrics = {}
        if emotion_detector:
            final_metrics = emotion_detector.get_current_metrics()

        # Get transcription text
        transcription_text = ""
        if transcription_service:
            transcription_text = " ".join(
                line for line in transcription_service.transcription if line.strip()
            )

        # Stop emotion detector
        try:
            if emotion_detector:
                logger.info("Stopping emotion detector...")
                emotion_detector.stop()
                emotion_detector = None
                logger.info("Emotion detector stopped successfully")
        except Exception as e:
            logger.error("Error stopping emotion detector: %s", str(e))
            logger.error(traceback.format_exc())

        # Stop transcription
        try:
            if transcription_service:
                logger.info("Stopping transcription service...")
                transcription_service.stop_recording()
                transcription_service = None
                logger.info("Transcription service stopped successfully")
        except Exception as e:
            logger.error("Error stopping transcription: %s", str(e))
            logger.error(traceback.format_exc())

        # Merge session data from start + stop body
        name = current_session_data.get("name", "")
        education = current_session_data.get("education", "")
        subject = current_session_data.get("subject", "")
        if data:
            name = data.name or name
            education = data.education or education
            subject = data.subject or subject

        # Run LLM evaluation
        llm_result = {"score": "N/A", "strengths": "", "improvements": "", "detailed_feedback": ""}
        if transcription_text.strip():
            try:
                llm_result = evaluate_transcription(transcription_text, education, subject)
            except Exception as e:
                logger.error("LLM evaluation failed: %s", str(e))

        # Save session to database
        try:
            db_session = SessionModel(
                name=name,
                education=education,
                subject=subject,
                start_time=session_start_time or end_time,
                end_time=end_time,
                duration_seconds=duration,
                teaching_effectiveness=final_metrics.get("teaching_effectiveness", 0),
                face_presence=final_metrics.get("face_presence", 0),
                positive_emotions=final_metrics.get("positive_emotions", 0),
                neutral_emotions=final_metrics.get("neutral_emotions", 0),
                negative_emotions=final_metrics.get("negative_emotions", 0),
                transcription_text=transcription_text,
                llm_score=llm_result.get("score", "N/A"),
                llm_strengths=llm_result.get("strengths", ""),
                llm_improvements=llm_result.get("improvements", ""),
                llm_feedback=llm_result.get("detailed_feedback", ""),
            )
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
            logger.info("Session saved to database with id: %s", db_session.id)
        except Exception as e:
            logger.error("Failed to save session to DB: %s", str(e))

        session_start_time = None
        current_session_data = {}

        return {
            "status": "success",
            "final_metrics": final_metrics,
            "duration_seconds": duration,
            "transcription": transcription_text,
            "llm_evaluation": llm_result,
        }
    except Exception as e:
        logger.error("Error in stop_session: %s", str(e))
        logger.error(traceback.format_exc())
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )


@app.get("/api/metrics")
def get_metrics():
    global emotion_detector
    try:
        if emotion_detector:
            metrics = emotion_detector.get_current_metrics()
            return metrics
        return JSONResponse(status_code=404, content={"error": "No active session"})
    except Exception as e:
        logger.error("Error getting metrics: %s", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/api/transcription")
def get_transcription():
    global transcription_service
    try:
        if transcription_service:
            text = " ".join(
                line for line in transcription_service.transcription if line.strip()
            )
            return {"transcription": text}
        return {"transcription": ""}
    except Exception as e:
        logger.error("Error getting transcription: %s", str(e))
        return {"transcription": ""}


@app.get("/api/sessions")
def get_sessions(db: DBSession = Depends(get_db)):
    try:
        sessions = db.query(SessionModel).order_by(SessionModel.id.desc()).all()
        return [
            {
                "id": s.id,
                "name": s.name,
                "education": s.education,
                "subject": s.subject,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "duration_seconds": s.duration_seconds,
                "teaching_effectiveness": s.teaching_effectiveness,
                "face_presence": s.face_presence,
                "positive_emotions": s.positive_emotions,
                "neutral_emotions": s.neutral_emotions,
                "negative_emotions": s.negative_emotions,
                "llm_score": s.llm_score,
                "llm_strengths": s.llm_strengths,
                "llm_improvements": s.llm_improvements,
                "llm_feedback": s.llm_feedback,
                "transcription_text": s.transcription_text,
            }
            for s in sessions
        ]
    except Exception as e:
        logger.error("Error fetching sessions: %s", str(e))
        return []


@app.get("/api/sessions/{session_id}")
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    try:
        s = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not s:
            return JSONResponse(status_code=404, content={"error": "Session not found"})
        return {
            "id": s.id,
            "name": s.name,
            "education": s.education,
            "subject": s.subject,
            "start_time": s.start_time.isoformat() if s.start_time else None,
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "duration_seconds": s.duration_seconds,
            "teaching_effectiveness": s.teaching_effectiveness,
            "face_presence": s.face_presence,
            "positive_emotions": s.positive_emotions,
            "neutral_emotions": s.neutral_emotions,
            "negative_emotions": s.negative_emotions,
            "transcription_text": s.transcription_text,
            "llm_score": s.llm_score,
            "llm_strengths": s.llm_strengths,
            "llm_improvements": s.llm_improvements,
            "llm_feedback": s.llm_feedback,
        }
    except Exception as e:
        logger.error("Error fetching session: %s", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/set-subject")
def set_subject(data: dict):
    return {"status": "success"}


if __name__ == "__main__":
    import uvicorn
    os.makedirs("transcripts", exist_ok=True)
    logger.info("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=5000)
