from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'cognspective.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    education = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    teaching_effectiveness = Column(Float, default=0.0)
    face_presence = Column(Float, default=0.0)
    positive_emotions = Column(Float, default=0.0)
    neutral_emotions = Column(Float, default=0.0)
    negative_emotions = Column(Float, default=0.0)
    transcription_text = Column(Text, default="")
    llm_score = Column(String, default="")
    llm_strengths = Column(Text, default="")
    llm_improvements = Column(Text, default="")
    llm_feedback = Column(Text, default="")


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
