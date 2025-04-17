import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const baseStyles = {
  input: "w-full px-4 py-2 mb-3 bg-black text-white border border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-red-600",
  button: "w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded",
  container: "max-w-md mx-auto mt-10 p-6 bg-black shadow-lg rounded-lg border border-red-500",
  title: "text-3xl text-center font-bold mb-6 text-red-600"
};

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await axios.post('http://localhost:3000/loginUser', { email, password });
      const role = res.data.userRole;

      if (role === 'admin') navigate('/admin-dashboard');
      else if (role === 'trainer') navigate('/trainer-dashboard');
      else navigate('/member-dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    }
  };

  return (
    <div className={baseStyles.container}>
      <h2 className={baseStyles.title}>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          className={baseStyles.input}
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={baseStyles.input}
          type="password"
          placeholder="Password"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className={baseStyles.button} type="submit">Login</button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </form>
    </div>
  );
};
