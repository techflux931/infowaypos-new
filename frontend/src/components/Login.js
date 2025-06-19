import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((username === 'admin' && password === '1234') || (username === 'cashier' && password === '1234')) {
      navigate('/dashboard');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleForgotPassword = () => {
    if (username.toLowerCase() === 'admin') {
      alert('Password recovery instructions sent to techfluxsoftware@gmail.com');
    } else {
      alert('Forgot Password option is only available for Admin users.');
    }
  };

  return (
    <div className="login-background">
      <div className="login-wrapper">
        <img src={logo} alt="Infoways Logo" className="login-main-logo" />
        <h1 className="login-title">Infoways POS</h1>

        <div className="login-box">
          <form onSubmit={handleSubmit} className="login-form">
            <input
              type="text"
              placeholder="User Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <span>Remember me</span>
              </label>

              {username.toLowerCase() === 'admin' && (
                <button type="button" className="forgot-password" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              )}
            </div>
            <button type="submit" className="login-button">LOG IN</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
