import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styling/History.css';

function formatDuration(seconds) {
    if (!seconds) return '0m 0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getScoreColor(value) {
    if (value < 40) return 'score-red';
    if (value < 70) return 'score-yellow';
    return 'score-green';
}

function History() {
    const [sessions, setSessions] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div className="history-page">
                <div className="history-container">
                    <h2>Session History</h2>
                    <div className="loading-message">Loading sessions...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="history-page">
            <div className="history-container">
                <h2>Session History</h2>

                {sessions.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">&#128218;</div>
                        <h3>No sessions yet</h3>
                        <p>Start your first teaching session to see your progress here!</p>
                    </div>
                ) : (
                    <div className="sessions-grid">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`session-card ${expandedId === session.id ? 'expanded' : ''}`}
                                onClick={() => toggleExpand(session.id)}
                            >
                                <div className="session-card-header">
                                    <div className="session-card-title">
                                        <h4>{session.subject}</h4>
                                        <span className="session-date">{formatDate(session.start_time)}</span>
                                    </div>
                                    <div className={`session-card-score ${getScoreColor(session.teaching_effectiveness)}`}>
                                        {Math.round(session.teaching_effectiveness)}%
                                    </div>
                                </div>

                                <div className="session-card-meta">
                                    <span>Duration: {formatDuration(session.duration_seconds)}</span>
                                    <span>Level: {session.education}</span>
                                    {session.llm_score && session.llm_score !== 'N/A' && (
                                        <span>AI Score: {session.llm_score}</span>
                                    )}
                                </div>

                                {expandedId === session.id && (
                                    <div className="session-card-details">
                                        <div className="detail-metrics">
                                            <div className="detail-metric">
                                                <span className="detail-label">Face Presence</span>
                                                <span className="detail-value">{Math.round(session.face_presence)}%</span>
                                            </div>
                                            <div className="detail-metric">
                                                <span className="detail-label">Positive</span>
                                                <span className="detail-value">{Math.round(session.positive_emotions)}%</span>
                                            </div>
                                            <div className="detail-metric">
                                                <span className="detail-label">Neutral</span>
                                                <span className="detail-value">{Math.round(session.neutral_emotions)}%</span>
                                            </div>
                                            <div className="detail-metric">
                                                <span className="detail-label">Negative</span>
                                                <span className="detail-value">{Math.round(session.negative_emotions)}%</span>
                                            </div>
                                        </div>

                                        {session.llm_strengths && (
                                            <div className="detail-section">
                                                <h5>Strengths</h5>
                                                <p>{session.llm_strengths}</p>
                                            </div>
                                        )}

                                        {session.llm_improvements && (
                                            <div className="detail-section">
                                                <h5>Improvements</h5>
                                                <p>{session.llm_improvements}</p>
                                            </div>
                                        )}

                                        {session.llm_feedback && (
                                            <div className="detail-section">
                                                <h5>AI Feedback</h5>
                                                <p>{session.llm_feedback}</p>
                                            </div>
                                        )}

                                        {session.transcription_text && (
                                            <div className="detail-section">
                                                <h5>Transcription</h5>
                                                <p className="transcription-preview">{session.transcription_text}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default History;
