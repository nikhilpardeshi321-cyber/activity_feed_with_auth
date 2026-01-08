import React, { useState, useEffect } from 'react';
import './App.css';
import ActivityFeed from './components/ActivityFeed';
import Login from './components/Login';
import Signup from './components/Signup';

function App() {
  const [auth, setAuth] = useState({ token: null, tenantId: null, name: null, email: null });
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    if (token && tenantId) {
      setAuth({ token, tenantId, name, email });
    }
  }, []);

  const handleAuth = ({ token, tenantId, name, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tenantId', tenantId);
    if (name) localStorage.setItem('name', name);
    if (email) localStorage.setItem('email', email);
    setAuth({ token, tenantId, name, email });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    setAuth({ token: null, tenantId: null, name: null, email: null });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Activity Feed</h1>
        {auth.token ? (
          <div className="auth-info">
            <span>Welcome, {auth.name || auth.email}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        ) : (
          <div className="auth-controls">
            <button onClick={() => setShowSignup(false)} className={!showSignup ? 'active' : ''}>Login</button>
            <button onClick={() => setShowSignup(true)} className={showSignup ? 'active' : ''}>Signup</button>
          </div>
        )}
      </header>

      <main>
        {!auth.token ? (
          showSignup ? (
            <Signup onAuth={handleAuth} />
          ) : (
            <Login onAuth={handleAuth} />
          )
        ) : (
          <ActivityFeed tenantId={auth.tenantId} authToken={auth.token} />
        )}
      </main>
    </div>
  );
}

export default App;

