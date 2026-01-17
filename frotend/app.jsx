import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { LanguageProvider } from "./contexts/LanguageContext";

import LoginPage from "./LoginPage.jsx";
import HomePage from "./HomePage.jsx";
import RevenuePredictionPage from "./RevenuePredictionPage.jsx";
import FertilizerPestControlPage from "./FertilizerPestControlPage.jsx";
import InsightsPage from "./InsightsPage.jsx";
import FavoritesPage from "./FavoritesPage.jsx";
import CropComparisonPage from "./CropComparisonPage.jsx";
import TrendAnalysisPage from "./TrendAnalysisPage.jsx";
import SupportWidget from "./components/SupportWidget.jsx";

function App() {
  const [username, setUsername] = useState("");

  const handleLogout = () => {
    setUsername("");
  };

  return (
    <ThemeProvider>
      <NotificationProvider>
        <FavoritesProvider>
          <LanguageProvider>
            <Router>
            <Routes>
              <Route 
                path="/" 
                element={<LoginPage setUsername={setUsername} />} 
              />
              <Route 
                path="/home" 
                element={
                  <HomePage 
                    username={username} 
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/revenue-prediction" 
                element={
                  <RevenuePredictionPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/fertilizer-pest-control" 
                element={
                  <FertilizerPestControlPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/insights" 
                element={
                  <InsightsPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/compare" 
                element={
                  <CropComparisonPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/trends" 
                element={
                  <TrendAnalysisPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
              <Route 
                path="/favorites" 
                element={
                  <FavoritesPage 
                    username={username}
                    onLogout={handleLogout}
                  />
                } 
              />
            </Routes>
            <SupportWidget />
          </Router>
          </LanguageProvider>
        </FavoritesProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
