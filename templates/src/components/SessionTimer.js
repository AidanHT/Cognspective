import React, { useState, useEffect } from 'react';

const SessionTimer = () => {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');

    return (
        <div className="session-timer">
            <span className="timer-display">{mins}:{secs}</span>
        </div>
    );
};

export default SessionTimer;
