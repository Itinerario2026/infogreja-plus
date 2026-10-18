import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ChurchPage from "./pages/ChurchPage";
import PastoralPage from "./pages/PastoralPage";
import AdminPortal from "./pages/AdminPortal";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/igrejas/:churchId" element={<ChurchPage />} />
      <Route path="/pastorais/:churchId/:pastoralSlug" element={<PastoralPage />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="/admin/login" element={<AdminPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
