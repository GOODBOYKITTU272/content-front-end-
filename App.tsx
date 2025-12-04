
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Admin State
  const [adminView, setAdminView] = useState<AdminView>('DASH');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  // Initialize checks - Quick session check first
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Checking for existing session...');

        // Quick synchronous check for session token
        const hasSession = localStorage.getItem('sb-zxnevoulicmapqmniaos-auth-token');

        if (!hasSession) {
          // No session found, show login immediately
          console.log('No session found, showing login');
          setLoading(false);
          return;
        }

        // Session exists, verify and restore
        console.log('Session found, verifying...');
        setCountdown(5);
        const countdownInterval = setInterval(() => {
          setCountdown(prev => Math.max(1, prev - 1));
        }, 1000);

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );

        const authPromise = db.auth.getCurrentUser();

        // Wait for Supabase to restore session (with timeout)
        const authUser = await Promise.race([authPromise, timeoutPromise]) as any;

        console.log('Auth user:', authUser ? 'Found' : 'Not found');

        if (authUser && authUser.email) {
          // Get full user data from database
          const fullUser = await db.users.getByEmail(authUser.email);
          console.log('Full user:', fullUser ? 'Found' : 'Not found');

          if (fullUser) {
            setUser(fullUser);
            await refreshData(fullUser);
          } else {
            console.warn('User profile not found in database');
          }
        }

        clearInterval(countdownInterval);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Even if there's an error, we should show the login page
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const refreshData = async (u: User = user!) => {
    if (!u) return;

    if (u.role === Role.ADMIN) {
      const users = await db.getUsers();
      setAdminUsers([...users]);
      const logs = await db.getSystemLogs();
      setAdminLogs([...logs]);
    } else {
      const userProjects = await db.getProjects(u);
      setProjects([...userProjects]);
    }
  };

  const handleLogin = () => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      refreshData(currentUser);
      if (currentUser.role === Role.ADMIN) {
        setAdminView('DASH');
      }
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateProject = async (title: string, channel: Channel, dueDate: string) => {
    await db.createProject(title, channel, dueDate);
    refreshData(user!);
  };

  // Handle Set Password Route
  if (location.pathname === '/set-password') {
    return <SetPassword />;
  }

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-6">
          <div className="w-32 h-32 rounded-full border-4 border-black flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto">
            <span className="text-6xl font-black text-white">{countdown}</span>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-black text-slate-900 uppercase tracking-tight">Restoring your workspace</p>
            <p className="text-lg text-slate-600 font-medium">in {countdown} second{countdown !== 1 ? 's' : ''}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  // --- ADMIN FLOW ---
  if (user.role === Role.ADMIN) {
    return (
      <AdminLayout
        user={user}
        currentView={adminView}
        onNavigate={setAdminView}
        onLogout={handleLogout}
      >
        {adminView === 'DASH' && <AdminDashboard users={adminUsers} logs={adminLogs} onNavigate={setAdminView} />}
        {adminView === 'USERS' && <UserManagement users={adminUsers} logs={adminLogs} onRefresh={() => refreshData(user)} onNavigate={setAdminView} />}
        {adminView === 'USER_ADD' && <AddUser onBack={() => setAdminView('USERS')} onUserAdded={() => { refreshData(user); setAdminView('USERS'); }} />}
        {adminView === 'ROLES' && <RolesMatrix />}
        {adminView === 'LOGS' && <AuditLogs logs={adminLogs} />}
        {adminView === 'SETTINGS' && (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400">
            <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-slate-200 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-lg font-medium text-slate-600">Settings Module</h3>
            <p>Coming in v1.2</p>
          </div>
        )}
      </AdminLayout>
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
