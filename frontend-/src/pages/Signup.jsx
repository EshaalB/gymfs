import React, { useState } from 'react';
import axios from 'axios';

const baseStyles = {
  input: "w-full px-4 py-2 mb-3 bg-black text-white border border-red-500 rounded focus:outline-none focus:ring-2 focus:ring-red-600",
  button: "w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded",
  container: "max-w-md mx-auto mt-10 p-6 bg-black shadow-lg rounded-lg border border-red-500",
  title: "text-3xl text-center font-bold mb-6 text-red-600"
};

export const SignUp = () => {
  const [formData, setFormData] = useState({
    fName: '', lName: '', email: '', password: '', age: '', dateOfBirth: '', gender: '', userRole: 'member', specialization: '', experienceYears: '', salary: '', membershipType: '', membershipStatus: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/registerUser', formData);
      setSuccess(res.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className={baseStyles.container}>
      <h2 className={baseStyles.title}>Sign Up</h2>
      <form onSubmit={handleSubmit}>
        <input className={baseStyles.input} name="fName" placeholder="First Name" onChange={handleChange} />
        <input className={baseStyles.input} name="lName" placeholder="Last Name" onChange={handleChange} />
        <input className={baseStyles.input} type="email" name="email" placeholder="Email" onChange={handleChange} />
        <input className={baseStyles.input} type="password" name="password" placeholder="Password" onChange={handleChange} />
        <input className={baseStyles.input} type="number" name="age" placeholder="Age" onChange={handleChange} />
        <input className={baseStyles.input} type="date" name="dateOfBirth" placeholder="Date of Birth" onChange={handleChange} />
        <select className={baseStyles.input} name="gender" onChange={handleChange}>
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
        <select className={baseStyles.input} name="userRole" onChange={handleChange}>
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </select>

        {formData.userRole === 'trainer' && (
          <>
            <input className={baseStyles.input} name="specialization" placeholder="Specialization" onChange={handleChange} />
            <input className={baseStyles.input} name="experienceYears" placeholder="Experience (years)" onChange={handleChange} />
            <input className={baseStyles.input} name="salary" placeholder="Salary" onChange={handleChange} />
          </>
        )}

        {formData.userRole === 'member' && (
          <>
            <input className={baseStyles.input} name="membershipType" placeholder="Membership Type" onChange={handleChange} />
            <input className={baseStyles.input} name="membershipStatus" placeholder="Membership Status" onChange={handleChange} />
          </>
        )}

        <button className={baseStyles.button} type="submit">Register</button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </form>
    </div>
  );
};
export default SignUp;