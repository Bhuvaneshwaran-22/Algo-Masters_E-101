import React from 'react';
import './App.css';
import Home from './Home';
import NetBanking from './NetBanking';
import Loans from './Loans';
import AboutUs from './AboutUs';

function App() {
  return (
    <div className="App">
      <Home />
      <NetBanking />
      <Loans />
      <AboutUs />
    </div>
  );
}

export default App;
