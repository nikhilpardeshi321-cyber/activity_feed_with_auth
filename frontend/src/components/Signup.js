import React, { useState } from 'react';
import './Auth.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

function Signup({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      onAuth({ token: data.token, tenantId: data.tenantId, name: data.name, email: data.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create an account</h2>
        <p className="auth-sub">Sign up and get your tenant dashboard</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">Name</label>
          <input
            className="auth-input"
            value={name}
            onChange={e => setName(e.target.value)}
            type="text"
            placeholder="Your full name"
            required
          />

          <label className="auth-label">Email</label>
          <input
            className="auth-input"
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            required
          />

          <label className="auth-label">Password</label>
          <input
            className="auth-input"
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            placeholder="Create a strong password"
            required
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Signup & Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
