import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import SettingsScripts from './pages/SettingsScripts';

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes (we can add a real auth guard later, for now we rely on API returning 401 if not authed) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/settings/whatsapp" element={<Settings />} />
          <Route path="/settings/scripts" element={<SettingsScripts />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
