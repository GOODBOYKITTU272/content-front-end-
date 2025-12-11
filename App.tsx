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
  const [loading, setLoading] = useState(true);
  const [isRestoringSession, setIsRestoringSession] = useState(true); // NEW: Track session restoration
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // Admin State
  const [adminView, setAdminView] = useState<AdminView>(() => {
    const saved = localStorage.getItem('admin_last_view') as AdminView;
    return saved || 'DASH';
  });
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);

  // Function to check if token is expired
  const isTokenExpired = (tokenData: any): boolean => {
    try {
      if (tokenData.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        return now > tokenData.expires_at;
      }
      return false;
    } catch (e) {
      console.error('Error checking token expiration:', e);
      return true; // Treat as expired if we can't check
    }
  };

  // Function to clear all stored auth tokens
  const clearAllTokens = () => {
    console.log('Clearing all auth tokens');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  // Function to clear invalid token and reset state
  const clearInvalidToken = () => {
    console.log('Clearing invalid/expired token');
    clearAllTokens();
    setUser(null);
    setLoading(false);
  };

  // Simplified session restoration with proper error handling
  const restoreSession = async () => {
    try {
      console.log('Attempting session restoration...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn('Session check error:', sessionError);
        // Only clear if it's an auth error (invalid token), not network/other errors
        if (sessionError.message?.includes('invalid') || sessionError.message?.includes('expired')) {
          console.log('Token is invalid/expired, clearing...');
          clearAllTokens();
        }
        return;
      }

      if (session?.user) {
        try {
          const fullUser = await db.users.getByEmail(session.user.email!);
          if (fullUser) {
            console.log('Session restored for:', fullUser.full_name);
            setUser(fullUser);
            await refreshData(fullUser);
          } else {
            console.warn('User not found in database for email:', session.user.email);
            // User exists in auth but not in database - this is a real problem, clear session
            await supabase.auth.signOut();
            clearAllTokens();
          }
        } catch (dbError) {
          console.error('Error fetching user from database:', dbError);
          // DON'T clear tokens on database errors - might be temporary network issue
          // Just log the error and show login screen
        }
      } else {
        console.log('No active session found');
      }
    } catch (error: any) {
      console.error('Session restoration failed:', error);
      // DON'T clear tokens on all errors - only on auth-specific errors
      if (error.message?.includes('invalid') || error.message?.includes('expired') || error.message?.includes('token')) {
        console.log('Auth error detected, clearing tokens');
        clearAllTokens();
      }
    }
  };

  // Session restoration on mount - Simplified with guaranteed state update
  useEffect(() => {
    let mounted = true;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    const initializeAuth = async () => {
      if (!mounted) return;

      // IMPORTANT: Skip session restoration on password reset/set-password pages
      // These pages use recovery tokens, not regular sessions
      if (location.pathname === '/set-password') {
        console.log('On set-password page, skipping session restoration to preserve recovery token');
        if (mounted) {
          setLoading(false);
          setIsRestoringSession(false);
        }
        return;
      }

      // Check if there are any stored tokens FIRST
      const hasStoredTokens = Object.keys(localStorage).some(key =>
        key.startsWith('sb-') && key.includes('-auth-token')
      );

      // If no tokens, skip loading and go straight to login
      if (!hasStoredTokens) {
        console.log('No stored tokens found, skipping session restoration');
        if (mounted) {
          setLoading(false);
          setIsRestoringSession(false);
        }
        return;
      }

      try {
        console.log('Starting session initialization...');
        await restoreSession();
      } catch (error) {
        console.error('Initialization error:', error);
        // Don't clear tokens here - restoreSession handles it internally
      } finally {
        // ALWAYS set these, even on error
        if (mounted) {
          setLoading(false);
          setIsRestoringSession(false);
          console.log('Session initialization complete');
        }
      }
    };

    // REMOVED: Global onAuthStateChange listener
    // It was causing race conditions with manual login flow
    // Auth state changes are now handled in SetPassword component only

    // Start initialization with a safety timeout so UI never hangs on "Loading session..."
    fallbackTimer = setTimeout(() => {
      if (!mounted) return;
      console.warn('Session initialization timed out; clearing tokens and returning to login.');
      clearAllTokens();
      setLoading(false);
      setIsRestoringSession(false);
    }, 8000);

    initializeAuth().finally(() => {
      clearTimeout(fallbackTimer);
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

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

  // handleLogin now receives user directly from Auth.tsx - no redundant fetch
  const handleLogin = async (user: User) => {
    try {
      console.log('Login successful for:', user.full_name);
      setUser(user);
      await refreshData(user);
    } catch (error) {
      console.error('Login callback failed:', error);
      // Re-throw so Auth.tsx can show error and re-enable button
      throw error;
    }
  };

  const handleLogout = async () => {
    // Clear UI immediately for instant response
    setUser(null);
    setProjects([]);
    setAdminUsers([]);
    setAdminLogs([]);
    setAdminView('DASH');
    localStorage.removeItem('admin_last_view');

    // Do cleanup in background (don't await)
    db.logout().catch(error => {
      console.error('Logout cleanup failed:', error);
    });
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

  // Handle Set Password Route (both path and hash-based)
  // Supabase password reset links use hash fragments like /#access_token=...&type=recovery
  const isPasswordResetFlow = location.pathname === '/set-password' ||
    (location.hash && location.hash.includes('type=recovery'));

  if (isPasswordResetFlow) {
    return <SetPassword />;
  }

  // Show login if no user
  if (!user) {
    return <Auth onLogin={handleLogin} isRestoringSession={isRestoringSession} />;
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
