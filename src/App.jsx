import { Routes, Route } from "react-router-dom";
import "./index.css";
import ADO from "./pages/ADO";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ADO />} />
    </Routes>
  );
}
