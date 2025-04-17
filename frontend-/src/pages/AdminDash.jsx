import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [gymUsers, setGymUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberCounts, setMemberCounts] = useState([]);
  const [inactiveMembers, setInactiveMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, countRes, inactiveRes] = await Promise.all([
        axios.get('http://localhost:3000/gymUser'),
        axios.get('http://localhost:3000/countMembers'),
        axios.get('http://localhost:3000/inactiveMembers'),
      ]);
      setGymUsers(usersRes.data);
      setFilteredUsers(usersRes.data);
      setMemberCounts(countRes.data);
      setInactiveMembers(inactiveRes.data);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = gymUsers.filter((user) =>
      `${user.fName} ${user.lName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, gymUsers]);

  if (loading) return <p className="text-red-600 text-center text-xl mt-10">Loading data...</p>;
  if (error) return <p className="text-red-600 text-center text-xl mt-10">{error}</p>;

  return (
    <div className="p-6 bg-red-50 min-h-screen">
      <h1 className="text-3xl font-bold text-red-700 mb-6 text-center">Gym Dashboard</h1>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search gym users by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      {/* Gym Users */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">All Gym Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-red-300 rounded-lg shadow-sm">
            <thead className="bg-red-100 text-red-800">
              <tr>
                {filteredUsers.length > 0 &&
                  Object.keys(filteredUsers[0]).map((key) => (
                    <th key={key} className="px-4 py-2 text-left border-b border-red-300">
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr
                  key={index}
                  className="hover:bg-red-100 transition duration-200"
                >
                  {Object.values(user).map((val, i) => (
                    <td key={i} className="px-4 py-2 border-b border-red-200 text-black">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Member Count */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Member Count by Status</h2>
        <ul className="list-disc list-inside text-red-800">
          {memberCounts.map((entry, i) => (
            <li key={i} className="mb-1">
              <span className="font-medium">{entry.membershipStatus || "Unknown"}</span>: {entry.member_count}
            </li>
          ))}
        </ul>
      </section>

      {/* Inactive Members */}
      <section>
        <h2 className="text-2xl font-semibold text-red-600 mb-4">Inactive Members (Last Month)</h2>
        <ul className="space-y-2 text-red-800">
          {inactiveMembers.map((member, i) => (
            <li
              key={i}
              className="bg-red-100 p-3 rounded-lg shadow-sm hover:bg-red-200 transition"
            >
              {member.fName} {member.lName} <span className="text-sm text-gray-600">(UserID: {member.userid})</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
