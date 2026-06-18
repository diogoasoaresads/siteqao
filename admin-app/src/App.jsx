import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Clients from './pages/Clients';
import GrowthBacklog from './pages/GrowthBacklog';
import GrowthTasks from './pages/GrowthTasks';
import PerformanceMetrics from './pages/PerformanceMetrics';
import Financial from './pages/Financial';
import SettingsIntegrations from './pages/SettingsIntegrations';
import Settings from './pages/Settings';
import SettingsScripts from './pages/SettingsScripts';
import SettingsNotifications from './pages/SettingsNotifications';
import SettingsLogs from './pages/SettingsLogs';
import ClientPortal from './pages/ClientPortal';

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/portal/:accessKey" element={<ClientPortal />} />
        
        {/* Protected Routes (we can add a real auth guard later, for now we rely on API returning 401 if not authed) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/backlog" element={<GrowthBacklog />} />
          <Route path="/tasks" element={<GrowthTasks />} />
          <Route path="/metrics" element={<PerformanceMetrics />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/settings/whatsapp" element={<Settings />} />
          <Route path="/settings/scripts" element={<SettingsScripts />} />
          <Route path="/settings/notifications" element={<SettingsNotifications />} />
          <Route path="/settings/logs" element={<SettingsLogs />} />
          <Route path="/settings/integrations" element={<SettingsIntegrations />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
