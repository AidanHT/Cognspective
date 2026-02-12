import React from 'react';
import '../styling/NavigationBar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChalkboardTeacher, faUser, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { Link, useLocation } from 'react-router-dom';

function NavigationBar() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar">
            <div className="nav-brand">
                <Link to="/">Cognspective</Link>
            </div>
            <div className="navigation-bar">
                <ul>
                    <li>
                        <Link to="/" className={isActive('/') ? 'nav-link active' : 'nav-link'}>
                            <FontAwesomeIcon icon={faHome} />
                            <span>Home</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/evaluation" className={isActive('/evaluation') ? 'nav-link active' : 'nav-link'}>
                            <FontAwesomeIcon icon={faChalkboardTeacher} />
                            <span>Teach</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/history" className={isActive('/history') ? 'nav-link active' : 'nav-link'}>
                            <FontAwesomeIcon icon={faClockRotateLeft} />
                            <span>History</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/profile" className={isActive('/profile') ? 'nav-link active' : 'nav-link'}>
                            <FontAwesomeIcon icon={faUser} />
                            <span>Profile</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}

export default NavigationBar;
