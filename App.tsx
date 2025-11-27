import React, { useState, useEffect } from 'react';
import { db } from './services/mockDb';
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

// CEO Imports
import CeoDashboard from './components/ceo/CeoDashboard';

// CMO Imports
import CmoDashboard from './components/cmo/CmoDashboard';

// Writer Imports
import WriterDashboard from './components/writer/WriterDashboard';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  // Admin State
  const [adminView, setAdminView] = useState<AdminView>('DASH');
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]); 

  // Initialize checks
  useEffect(() => {
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      refreshData(currentUser);
    }
  }, []);

  const refreshData = (u: User = user!) => {
    if (!u) return;

    if (u.role === Role.ADMIN) {
        setAdminUsers([...db.getUsers()]);
        setAdminLogs([...db.getSystemLogs()]);
    } else {
        setProjects([...db.getProjects(u)]);
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

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setProjects([]);
  };

  const handleCreateProject = (title: string, channel: Channel, dueDate: string) => {
    db.createProject(title, channel, dueDate);
    refreshData(user!);
  };

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

  // --- STANDARD WORKFLOW FLOW (Ops, Cine, etc.) ---
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