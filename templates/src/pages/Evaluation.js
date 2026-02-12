import React, { useState } from 'react';
import EmotionDetection from '../components/EmotionDetection';
import ScoreGauge from '../components/ScoreGauge';
import { useUser } from '../context/UserContext';
import '../styling/EvaluationPage.css';
import axios from 'axios';

function capitalizeFirstLetter(val) {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function Evaluation() {
    const { user } = useUser();
    const { name, education } = user;
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [sessionResults, setSessionResults] = useState(null);
    const [showSubjectPrompt, setShowSubjectPrompt] = useState(true);
    const [subject, setSubject] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        if (subject.trim()) {
            try {
                setIsLoading(true);
                await axios.post(`${process.env.REACT_APP_API_URL}/api/start-session`, {
                    subject: subject,
                    name: name,
                    education: education
                });
                setShowSubjectPrompt(false);
                setIsSessionActive(true);
                setIsLoading(false);
            } catch (error) {
                console.error('Error starting session:', error);
                setShowSubjectPrompt(false);
                setIsSessionActive(true);
                setIsLoading(false);
            }
        }
    };

    const handleSessionEnd = async (results) => {
        try {
            setIsProcessing(true);
            setIsSessionActive(false);

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/stop-session`, {
                name: name,
                education: education,
                subject: subject
            });

            const data = response.data;
            setSessionResults({
                final_metrics: data.final_metrics || results.final_metrics,
                duration_seconds: data.duration_seconds || 0,
                transcription: data.transcription || results.transcription || '',
                llm_evaluation: data.llm_evaluation || null,
            });
            setShowSubjectPrompt(false);
            setIsProcessing(false);
        } catch (error) {
            console.error('Error stopping session:', error);
            if (results && results.final_metrics) {
                setSessionResults({
                    final_metrics: results.final_metrics,
                    duration_seconds: 0,
                    transcription: results.transcription || '',
                    llm_evaluation: null,
                });
            }
            setIsProcessing(false);
        }
    };

    // Emotion donut chart data
    const renderEmotionDonut = () => {
        if (!sessionResults?.final_metrics) return null;
        const { positive_emotions, neutral_emotions, negative_emotions } = sessionResults.final_metrics;
        const total = positive_emotions + neutral_emotions + negative_emotions || 1;
        const posPercent = (positive_emotions / total) * 100;
        const neuPercent = (neutral_emotions / total) * 100;

        return (
            <div className="emotion-donut-container">
                <h4>Emotion Breakdown</h4>
                <div className="donut-wrapper">
                    <div className="donut" style={{
                        background: `conic-gradient(
                            #66bb6a 0deg ${posPercent * 3.6}deg,
                            #42a5f5 ${posPercent * 3.6}deg ${(posPercent + neuPercent) * 3.6}deg,
                            #ef5350 ${(posPercent + neuPercent) * 3.6}deg 360deg
                        )`
                    }}>
                        <div className="donut-hole"></div>
                    </div>
                    <div className="donut-legend">
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#66bb6a' }}></span>
                            <span>Positive ({positive_emotions}%)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#42a5f5' }}></span>
                            <span>Neutral ({neutral_emotions}%)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-color" style={{ background: '#ef5350' }}></span>
                            <span>Negative ({negative_emotions}%)</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="evaluation-page">
            <div className="stars">
                {[...Array(5)].map((_, i) => <div className="star" key={i}></div>)}
            </div>

            <div className="evaluation-container">
                <h2>Teaching Session</h2>

                {name && (
                    <div className="user-info">
                        <p>Welcome <i>{capitalizeFirstLetter(name)}</i>, teaching at <i>{capitalizeFirstLetter(education)}</i> level.</p>
                    </div>
                )}

                {showSubjectPrompt && !isLoading && !isSessionActive && !sessionResults && !isProcessing && (
                    <div className="subject-prompt">
                        <h3>What subject will you be teaching?</h3>
                        <form onSubmit={handleSubjectSubmit}>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Enter subject (e.g., Mathematics, History)"
                                required
                            />
                            <button type="submit" className="start-button">
                                Begin Session
                            </button>
                        </form>
                    </div>
                )}

                {isLoading && (
                    <div className="loading-screen">
                        <div className="loading-spinner"></div>
                        <h3>Initializing Camera...</h3>
                        <p>Please wait while we set up your teaching session</p>
                    </div>
                )}

                {isSessionActive && !sessionResults && !isProcessing && (
                    <EmotionDetection onSessionEnd={handleSessionEnd} />
                )}

                {isProcessing && (
                    <div className="loading-screen">
                        <div className="loading-spinner"></div>
                        <h3>Analyzing Your Session...</h3>
                        <p>Running AI evaluation on your teaching performance</p>
                    </div>
                )}

                {sessionResults && !isSessionActive && !showSubjectPrompt && !isProcessing && (
                    <div className="session-results fade-in">
                        <h3>Session Results</h3>

                        <div className="session-meta">
                            <span>Subject: {subject}</span>
                            <span>Duration: {formatDuration(sessionResults.duration_seconds)}</span>
                            <span>Education: {education}</span>
                        </div>

                        <div className="gauges-grid">
                            <ScoreGauge
                                value={sessionResults.final_metrics?.teaching_effectiveness}
                                label="Teaching Effectiveness"
                                size={130}
                            />
                            <ScoreGauge
                                value={sessionResults.final_metrics?.face_presence}
                                label="Student Engagement"
                                size={130}
                            />
                            <ScoreGauge
                                value={sessionResults.final_metrics?.positive_emotions}
                                label="Positive Response"
                                size={130}
                            />
                            <ScoreGauge
                                value={sessionResults.final_metrics?.neutral_emotions}
                                label="Neutral Response"
                                size={130}
                            />
                            <ScoreGauge
                                value={100 - (sessionResults.final_metrics?.negative_emotions || 0)}
                                label="Low Negativity"
                                size={130}
                            />
                        </div>

                        {renderEmotionDonut()}

                        {sessionResults.llm_evaluation && (
                            <div className="llm-feedback-section">
                                <h4>AI Teaching Analysis</h4>
                                <div className="llm-score-badge">
                                    Score: {sessionResults.llm_evaluation.score}
                                </div>

                                {sessionResults.llm_evaluation.strengths && (
                                    <div className="feedback-card strengths-card">
                                        <h5>Strengths</h5>
                                        <p>{sessionResults.llm_evaluation.strengths}</p>
                                    </div>
                                )}

                                {sessionResults.llm_evaluation.improvements && (
                                    <div className="feedback-card improvements-card">
                                        <h5>Areas for Improvement</h5>
                                        <p>{sessionResults.llm_evaluation.improvements}</p>
                                    </div>
                                )}

                                {sessionResults.llm_evaluation.detailed_feedback && (
                                    <div className="feedback-card detail-card">
                                        <h5>Detailed Feedback</h5>
                                        <p>{sessionResults.llm_evaluation.detailed_feedback}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {sessionResults.transcription && (
                            <div className="transcription-result">
                                <h4>Your Transcription</h4>
                                <p>{sessionResults.transcription}</p>
                            </div>
                        )}

                        <button
                            className="start-button"
                            onClick={() => {
                                setSessionResults(null);
                                setShowSubjectPrompt(true);
                                setSubject('');
                            }}
                        >
                            Start New Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Evaluation;
