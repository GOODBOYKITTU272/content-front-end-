
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
  const [loading, setLoading] = useState(true); // Start with loading true
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  // Admin State
  const [adminView, setAdminView] = useState<AdminView>(() => {
    const saved = localStorage.getItem('admin_last_view') as AdminView;
    return saved || 'DASH';
  });
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  // Session restoration on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Starting session initialization...');
        
        // First check if there's a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('Session check error:', sessionError);
        }

        if (session) {
          console.log('Active session found, fetching user data...');
          try {
            const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.warn('Get user error:', userError);
            }

            if (authUser && authUser.email) {
              try {
                const fullUser = await db.users.getByEmail(authUser.email);
                
                if (fullUser) {
                  console.log('User authenticated and set:', fullUser.full_name);
                  setUser(fullUser);
                  await refreshData(fullUser);
                } else {
                  console.warn('User not found in database for email:', authUser.email);
                }
              } catch (dbError) {
                console.warn('Database user fetch error:', dbError);
              }
            }
          } catch (authError) {
            console.warn('Auth user fetch error:', authError);
          }
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      } finally {
        setLoading(false);
        console.log('Session initialization complete');
      }
    };

    initializeAuth();
    
    // Also listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            try {
              const fullUser = await db.users.getByEmail(session.user.email!);
              if (fullUser) {
                console.log('User signed in:', fullUser.full_name);
                setUser(fullUser);
                await refreshData(fullUser);
              }
            } catch (error) {
              console.error('Error fetching user on sign in:', error);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('User signed out');
          setUser(null);
          setProjects([]);
          setAdminUsers([]);
          setAdminLogs([]);
          setAdminView('DASH');
          localStorage.removeItem('admin_last_view');
          break;
          
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed, refreshing session cache');
          // Refresh our user cache when token is refreshed
          await db.refreshSession();
          break;
      }
    });

    // Cleanup listener on unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Periodic session check to maintain session state
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      try {
        // Check if session is still valid
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('Session expired, triggering sign out');
          setUser(null);
        }
      } catch (error) {
        console.warn('Periodic session check failed:', error);
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Save admin view to localStorage when it changes
  useEffect(() => {
    if (user?.role === Role.ADMIN && adminView) {
      localStorage.setItem('admin_last_view', adminView);
    }
  }, [adminView, user]);

  const refreshData = async (u: User = user!) => {
    if (!u) return;

    try {
      if (u.role === Role.ADMIN) {
        const users = await db.getUsers();
        setAdminUsers([...users]);
        const logs = await db.getSystemLogs();
        setAdminLogs([...logs]);
      } else {
        const userProjects = await db.getProjects(u);
        setProjects([...userProjects]);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const handleLogin = async () => {
    try {
      const authUser = await db.auth.getCurrentUser();
      
      if (authUser && authUser.email) {
        const fullUser = await db.users.getByEmail(authUser.email);
        
        if (fullUser) {
          setUser(fullUser);
          await refreshData(fullUser);
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
      localStorage.removeItem('admin_last_view');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCreateProject = async (title: string, channel: Channel, dueDate: string) => {
    await db.createProject(title, channel, dueDate);
    refreshData(user!);
  };

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Handle Set Password Route
  if (location.pathname === '/set-password') {
    return <SetPassword />;
  }

  // Show login if no user
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
