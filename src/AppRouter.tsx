// App.tsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthCallback } from "./components/AuthCallback";
import App from "./App"; // or wherever your main content lives

const AppRouter: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthComplete = (success: boolean) => {
    setIsAuthenticated(success);
    // Optionally, store token info or trigger a refresh of user data
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/callback"
          element={<AuthCallback onAuthComplete={handleAuthComplete} />}
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
