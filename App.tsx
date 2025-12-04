
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './services/supabase';
import { db } from './services/supabaseDb';
import { User, Project, Channel, Role } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CreateProjectModal from './components/CreateProjectModal';

// Admin Imports
import AdminLayout, { AdminView } from './components/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import AddUser from './components/admin/AddUser';
import RolesMatrix from './components/admin/RolesMatrix';
import AuditLogs from './components/admin/AuditLogs';
import SetPassword from './components/SetPassword';

// CEO Imports
import CeoDashboard from './components/ceo/CeoDashboard';

// CMO Imports
import CmoDashboard from './components/cmo/CmoDashboard';

// Writer Imports
import WriterDashboard from './components/writer/WriterDashboard';

// Cinematographer Imports
import CineDashboard from './components/cine/CineDashboard';

// Editor Imports
import EditorDashboard from './components/editor/EditorDashboard';

// Designer Imports
import DesignerDashboard from './components/designer/DesignerDashboard';

// Ops Imports
import OpsDashboard from './components/ops/OpsDashboard';

// Observer Imports
import ObserverDashboard from './components/observer/ObserverDashboard';

function App() {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Wait for session check before rendering
  const [countdown, setCountdown] = useState(5);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Admin State
  const [adminView, setAdminView] = useState<AdminView>(() => {
    const saved = localStorage.getItem('admin_last_view') as AdminView;
    return saved || 'DASH';
  });
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  initializeAuth();
}, []);

// Save admin view to localStorage when it changes
useEffect(() => {
  if (user?.role === Role.ADMIN && adminView) {
    localStorage.setItem('admin_last_view', adminView);
  }
}, [adminView, user]);

const refreshData = async (u: User = user!) => {
  if (!u) return;

  if (u.role === Role.ADMIN) {
    const users = await db.getUsers();
    setAdminUsers([...users]);
    const logs = await db.getSystemLogs();
    setAdminLogs([...logs]);
    // adminView is already initialized from localStorage on mount - no need to restore here
  } else {
    const userProjects = await db.getProjects(u);
    setProjects([...userProjects]);
  }
};

const handleLogin = async () => {
  try {
    // Get authenticated user from Supabase
    const authUser = await db.auth.getCurrentUser();

    if (authUser && authUser.email) {
      // Get full user data from database
      const fullUser = await db.users.getByEmail(authUser.email);

      if (fullUser) {
        setUser(fullUser);
        await refreshData(fullUser);
      } else {
        console.error('User profile not found in database');
      }
    }
  } catch (error) {
    console.error('Login callback failed:', error);
  }
};

const handleLogout = async () => {
  try {
    await db.logout();
    setUser(null);
    setProjects([]);
    setAdminUsers([]);
    setAdminLogs([]);
    setAdminView('DASH');
    setLoading(false);

    // Clear saved admin view
    localStorage.removeItem('admin_last_view');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
currentView = { adminView }
onNavigate = { setAdminView }
onLogout = { handleLogout }
  >
  { adminView === 'DASH' && <AdminDashboard users={adminUsers} logs={adminLogs} onNavigate={setAdminView} />}
{ adminView === 'USERS' && <UserManagement users={adminUsers} logs={adminLogs} onRefresh={() => refreshData(user)} onNavigate={setAdminView} /> }
{ adminView === 'USER_ADD' && <AddUser onBack={() => setAdminView('USERS')} onUserAdded={() => { refreshData(user); setAdminView('USERS'); }} /> }
{ adminView === 'ROLES' && <RolesMatrix /> }
{ adminView === 'LOGS' && <AuditLogs logs={adminLogs} /> }
{
  adminView === 'SETTINGS' && (
    <div className="flex flex-col items-center justify-center h-96 text-slate-400">
      <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
      </div>
      <h3 className="text-lg font-medium text-slate-600">Settings Module</h3>
      <p>Coming in v1.2</p>
    </div>
  )
}
    </AdminLayout >
  );
}

// --- CEO FLOW ---
if (user.role === Role.CEO) {
  return (
    <CeoDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- CMO FLOW ---
if (user.role === Role.CMO) {
  return (
    <CmoDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- WRITER FLOW ---
if (user.role === Role.WRITER) {
  return (
    <WriterDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- CINEMATOGRAPHER FLOW ---
if (user.role === Role.CINE) {
  return (
    <CineDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- EDITOR FLOW ---
if (user.role === Role.EDITOR) {
  return (
    <EditorDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- DESIGNER FLOW ---
if (user.role === Role.DESIGNER) {
  return (
    <DesignerDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- OPS FLOW ---
if (user.role === Role.OPS) {
  return (
    <OpsDashboard
      user={user}
      projects={projects}
      onRefresh={() => refreshData(user)}
      onLogout={handleLogout}
    />
  );
}

// --- OBSERVER FLOW ---
if (user.role === Role.OBSERVER) {
  return <ObserverDashboard user={user} onLogout={handleLogout} />;
}

// --- STANDARD WORKFLOW FLOW (fallback) ---
return (
  <>
    <Layout
      user={user}
      onLogout={handleLogout}
      onOpenCreate={() => setCreateModalOpen(true)}
    >
      <Dashboard
        user={user}
        projects={projects}
        refreshData={() => refreshData(user)}
      />
    </Layout>

    <CreateProjectModal
      isOpen={isCreateModalOpen}
      onClose={() => setCreateModalOpen(false)}
      onSubmit={handleCreateProject}
    />
  </>
);
}

export default App;
