import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SessionTimer from './SessionTimer';
import '../styling/EmotionDetection.css';

const EmotionDetection = ({ onSessionEnd }) => {
    const [isActive, setIsActive] = useState(false);
    const [metrics, setMetrics] = useState(null);
    const [transcription, setTranscription] = useState('');
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const metricsIntervalRef = useRef(null);
    const transcriptionIntervalRef = useRef(null);
    const transcriptionEndRef = useRef(null);

    const startDetection = async () => {
        try {
            setIsActive(true);
            if (videoRef.current) {
                videoRef.current.src = `${process.env.REACT_APP_API_URL}/video_feed`;
            }
            metricsIntervalRef.current = setInterval(fetchMetrics, 1000);
            transcriptionIntervalRef.current = setInterval(fetchTranscription, 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    const stopDetection = async () => {
        try {
            setIsActive(false);
            if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
            if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
            if (videoRef.current) videoRef.current.src = '';
            if (onSessionEnd && metrics) {
                onSessionEnd({ final_metrics: metrics, transcription });
            }
        } catch (err) {
            console.error('Error stopping detection:', err);
        }
    };

    const fetchMetrics = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/metrics`);
            if (response.data) setMetrics(response.data);
        } catch (err) {
            // Silently ignore metric fetch errors during active session
        }
    };

    const fetchTranscription = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/transcription`);
            if (response.data && response.data.transcription) {
                setTranscription(response.data.transcription);
            }
        } catch (err) {
            // Silently ignore
        }
    };

    useEffect(() => {
        startDetection();
        const video = videoRef.current;
        return () => {
            if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
            if (transcriptionIntervalRef.current) clearInterval(transcriptionIntervalRef.current);
            if (video) video.src = '';
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (transcriptionEndRef.current) {
            transcriptionEndRef.current.scrollTop = transcriptionEndRef.current.scrollHeight;
        }
    }, [transcription]);

    return (
        <div className="emotion-detection">
            {error && <div className="error">{error}</div>}

            <div className="session-header">
                <SessionTimer />
                {isActive && (
                    <button className="stop-button" onClick={stopDetection}>
                        End Session
                    </button>
                )}
            </div>

            <div className="detection-layout">
                <div className="video-panel">
                    <div className="video-container">
                        <img ref={videoRef} alt="Video feed" />
                    </div>
                </div>

                <div className="side-panel">
                    <div className="transcription-panel" ref={transcriptionEndRef}>
                        <h4>Live Transcription</h4>
                        <div className="transcription-text">
                            {transcription || 'Waiting for speech...'}
                        </div>
                    </div>

                    {metrics && (
                        <div className="live-metrics">
                            <h4>Live Metrics</h4>
                            <div className="mini-metrics-grid">
                                <div className="mini-metric">
                                    <span className="mini-metric-label">Effectiveness</span>
                                    <span className="mini-metric-value">{metrics.teaching_effectiveness}%</span>
                                </div>
                                <div className="mini-metric">
                                    <span className="mini-metric-label">Engagement</span>
                                    <span className="mini-metric-value">{metrics.face_presence}%</span>
                                </div>
                                <div className="mini-metric">
                                    <span className="mini-metric-label">Positive</span>
                                    <span className="mini-metric-value">{metrics.positive_emotions}%</span>
                                </div>
                                <div className="mini-metric">
                                    <span className="mini-metric-label">Neutral</span>
                                    <span className="mini-metric-value">{metrics.neutral_emotions}%</span>
                                </div>
                                <div className="mini-metric">
                                    <span className="mini-metric-label">Negative</span>
                                    <span className="mini-metric-value">{metrics.negative_emotions}%</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmotionDetection;
