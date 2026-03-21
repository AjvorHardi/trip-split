import { Routes, Route } from "react-router";

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Landing Page</div>} />
      <Route path="/login" element={<div>Login</div>} />
      <Route path="/signup" element={<div>Signup</div>} />
      <Route path="/dashboard" element={<div>Dashboard</div>} />
    </Routes>
  );
}

export default App;