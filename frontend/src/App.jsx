import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing       from "./assets/pages/Landing.jsx";
import Auth          from "./assets/pages/Auth.jsx";
import Dashboard     from "./assets/pages/Dashboard.jsx";
import StartRide     from "./assets/pages/StartRide.jsx";
import LiveTracking  from "./assets/pages/LiveTracking.jsx";
import ProfileSafety from "./assets/pages/ProfileSafety.jsx";

// Safety Center coming soon — placeholder for now
const SafetyCenter = () => (
  <div style={{ color: "white", padding: "100px 40px", textAlign: "center" }}>
    <h2>Safety Center — Coming Soon</h2>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<Landing />} />
        <Route path="/auth"             element={<Auth />} />
        <Route path="/dashboard"        element={<Dashboard />} />
        <Route path="/start-ride"       element={<StartRide />} />
        <Route path="/tracking/:rideId" element={<LiveTracking />} />
        <Route path="/profile"          element={<ProfileSafety />} />
        <Route path="/safety-center"    element={<SafetyCenter />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;