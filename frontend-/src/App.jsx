import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import About from "./pages/About";
import Plans from "./pages/Plans";
import Trainers from "./pages/Trainers";
import Contact from "./pages/Contact";
import Footer from "./components/Footer";
import BarLoader from "./components/BarLoader";
import "./App.css";
import Dashboard from "./pages/AdminDash";
import SignUp from "./pages/Signup";

const App = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      {loading && <BarLoader />}

      <main>
        {/* <section id="home">
          <Home />
        </section>

        <section id="about">
          <About />
        </section>
        <section id="plans">
          <Plans />
        </section>

        <section id="trainers">
          <Trainers />
        </section>

        <section id="contact">
          <Contact />
        </section> */}
        <section id="Admin Dashboard"> 
        <Dashboard />
        <SignUp></SignUp>
    
        </section>
  
        
      </main>

      <Footer />
    </div>
  );
};

export default App;