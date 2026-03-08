import { Routes, Route } from "react-router-dom";
import SelectProfile from "./pages/SelectProfile";
import UserDashboard from "./pages/UserDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SelectProfile />} />
      <Route path="/user/:id" element={<UserDashboard />} />
      <Route path="/manager" element={<ManagerDashboard />} />
    </Routes>
  );
}
