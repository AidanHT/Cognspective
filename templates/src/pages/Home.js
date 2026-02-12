import React, { useState } from 'react';
import '../styling/Home.css';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Home = () => {
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const navigate = useNavigate();
  const { updateUser } = useUser();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !education) {
      alert('Please fill in all fields');
      return;
    }
    updateUser(name, education);
    navigate('/evaluation');
  };

  return (
    <div className="home-container">
      <div className="title-section">
        <h1>Cognspective</h1>
        <h2>Enhance YOUR learning.</h2>
      </div>

      <div className="info-cards">
        <div className="info-card info-card-main">
          <p>Cognspective is a platform designed to help users develop a deeper understanding of concepts by teaching them from various perspectives.</p>
        </div>
        <div className="info-card-row">
          <div className="info-card">
            <p>By explaining a topic at different educational levels, users are encouraged to fully grasp the material, as teaching others requires a thorough comprehension of the subject.</p>
          </div>
          <div className="info-card">
            <p>This approach not only reinforces the user's knowledge but also enhances their ability to communicate complex ideas in simpler terms, fostering both mastery and effective teaching skills.</p>
          </div>
        </div>
      </div>

      <div className="form-container">
        <div className="input-group">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="input-group">
          <label>Your Education Level</label>
          <select
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            required
          >
            <option value="">Select Education Level</option>
            <option value="Elementary">Elementary</option>
            <option value="Middle School">Middle School</option>
            <option value="High School">High School</option>
            <option value="University">University</option>
          </select>
        </div>

        <button type="submit" className="submit-button" onClick={handleSubmit}>
          Continue to Evaluation
        </button>
      </div>
    </div>
  );
};

export default Home;
