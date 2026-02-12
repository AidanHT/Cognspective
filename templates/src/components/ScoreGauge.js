import React, { useState, useEffect } from 'react';

const ScoreGauge = ({ value, label, size = 120 }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const numericValue = parseFloat(value) || 0;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(numericValue), 100);
        return () => clearTimeout(timer);
    }, [numericValue]);

    const getColor = (val) => {
        if (val < 40) return '#ef5350';
        if (val < 70) return '#ffa726';
        return '#66bb6a';
    };

    const color = getColor(animatedValue);

    return (
        <div className="score-gauge" style={{ width: size, height: size }}>
            <div
                className="score-gauge-circle"
                style={{
                    width: size,
                    height: size,
                    background: `conic-gradient(${color} ${animatedValue * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                    transition: 'background 1.5s ease-out',
                }}
            >
                <div className="score-gauge-inner" style={{
                    width: size - 16,
                    height: size - 16,
                }}>
                    <span className="score-gauge-value" style={{ color }}>
                        {Math.round(animatedValue)}%
                    </span>
                </div>
            </div>
            {label && <span className="score-gauge-label">{label}</span>}
        </div>
    );
};

export default ScoreGauge;
