import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import NavigationBar from './components/NavigationBar';
import Home from './pages/Home';
import Evaluation from './pages/Evaluation';
import Profile from './pages/Profile';
import History from './pages/History';
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <NavigationBar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/evaluation" element={<Evaluation />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
