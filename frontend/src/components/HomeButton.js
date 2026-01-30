import React from 'react';
import { useNavigate } from 'react-router-dom';
import homeIcon from '../assets/home.svg'; // use your uploaded icon

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/dashboard')}
      className="home-button"
      title="Home"
      aria-label="Go to Dashboard"
    >
      <img src={homeIcon} alt="Home" className="home-icon" />
    </button>
  );
};

export default HomeButton;
