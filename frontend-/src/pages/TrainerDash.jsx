import React, { useEffect, useState } from "react";

export default function TrainerDashboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    fetch("/api/trainer/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Trainer: {data.name}</h1>
      <h2 className="mt-4 font-semibold">Your Classes</h2>
      <ul>
        {data.classes?.map((cls, i) => <li key={i}>{cls.className}</li>)}
      </ul>
      <h2 className="mt-4 font-semibold">Assigned Workout Plans</h2>
      <ul>
        {data.plans?.map((plan, i) => <li key={i}>{plan.plan_name} for {plan.memberName}</li>)}
      </ul>
    </div>
  );
}