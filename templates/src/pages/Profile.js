import React, { useState, useEffect } from 'react';
import '../styling/ProfilePage.css';
import { useUser } from '../context/UserContext';
import axios from 'axios';

function capitalizeFirstLetter(val) {
    if (!val) return '';
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

function formatTotalTime(seconds) {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function Profile() {
    const { user } = useUser();
    const { name, education } = user;
    const [stats, setStats] = useState({
        totalSessions: 0,
        avgEffectiveness: 0,
        totalTime: 0,
        bestScore: 0,
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sessions`);
            const sessions = response.data;
            if (sessions.length > 0) {
                const totalSessions = sessions.length;
                const avgEffectiveness = Math.round(
                    sessions.reduce((sum, s) => sum + (s.teaching_effectiveness || 0), 0) / totalSessions
                );
                const totalTime = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
                const bestScore = Math.round(
                    Math.max(...sessions.map(s => s.teaching_effectiveness || 0))
                );
                setStats({ totalSessions, avgEffectiveness, totalTime, bestScore });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getInitials = (n) => {
        if (!n) return '?';
        return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div className="avatar-circle">
                        <span>{getInitials(name)}</span>
                    </div>
                    <h2>{capitalizeFirstLetter(name) || 'Guest'}</h2>
                    <p className="education-badge">{capitalizeFirstLetter(education) || 'Not set'}</p>
                </div>

                <div className="stats-dashboard">
                    <div className="stat-card">
                        <span className="stat-value">{stats.totalSessions}</span>
                        <span className="stat-label">Total Sessions</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.avgEffectiveness}%</span>
                        <span className="stat-label">Avg Effectiveness</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{formatTotalTime(stats.totalTime)}</span>
                        <span className="stat-label">Total Time</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.bestScore}%</span>
                        <span className="stat-label">Best Score</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
