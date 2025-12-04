import { supabase } from './supabase';
import {
    User,
    Project,
    WorkflowStage,
    Role,
    TaskStatus,
    Channel,
    ContentType,
    Priority,
    UserStatus
} from '../types';

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const auth = {
    // Sign in with email/password
    async signIn(email: string, password: string) {
        // Clear any stale sessions before login
        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            // Ignore signOut errors, continue with login
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // Update last login
        if (data.user) {
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('email', email);
        }

        return data;
    },

    // Sign out
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    // Get current session user
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    // Send password reset email
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/set-password`,
        });

        if (error) throw error;
    },

    // Update password
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;
    },

    // Invite user by email (Admin only) - Calls secure Edge Function
    async inviteUser(email: string, userData: { full_name: string; role: Role; phone?: string }) {
        console.log('inviteUser called with:', email, userData);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxnevoulicmapqmniaos.supabase.co';

        try {
            // Get current session token for authentication
            console.log('Getting session...');
            let session = null;
            let sessionError = null;

            // Helper to race a promise against a timeout
            const withTimeout = (promise: Promise<any>, ms: number, name: string) => {
                return Promise.race([
                    promise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms))
                ]);
            };

            try {
                // 1. Try getSession with 10s timeout
                const sessionResult: any = await withTimeout(
                    supabase.auth.getSession(),
                    10000,
                    'getSession'
                );

                session = sessionResult.data.session;
                sessionError = sessionResult.error;
                console.log('getSession() result:', session ? 'Found' : 'Not found', 'Error:', sessionError);
            } catch (getSessionErr: any) {
                console.warn('getSession() failed or timed out:', getSessionErr.message);

                // 2. Fallback: try refreshSession() with 10s timeout
                try {
                    console.log('Attempting refreshSession()...');
                    const refreshResult: any = await withTimeout(
                        supabase.auth.refreshSession(),
                        10000,
                        'refreshSession'
                    );

                    const { data, error: refreshError } = refreshResult;

                    if (data.session && !refreshError) {
                        console.log('refreshSession() succeeded');
                        session = data.session;
                    } else {
                        console.warn('refreshSession() returned no session or error:', refreshError);
                        // 3. Last resort: getUser() check (just for debugging)
                        const { data: { user } } = await supabase.auth.getUser();
                        if (user) {
                            console.log('getUser() found user, but we have no session token. Edge Function call will likely fail.');
                        }
                    }
                } catch (refreshErr: any) {
                    console.error('refreshSession() failed or timed out:', refreshErr.message);
                }
            }

            if (sessionError) {
                throw new Error(`Session error: ${sessionError.message}`);
            }

            if (!session) {
                throw new Error('Unable to retrieve active session. Please check your connection or try logging in again.');
            }

            console.log('Session token found, calling Edge Function...');

            // Call the Edge Function (service key is secure on server)
            console.log('Calling Edge Function at:', `${supabaseUrl}/functions/v1/invite-user`);
            const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, userData })
            });

            console.log('Edge Function response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Edge Function error response:', errorText);
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || 'Failed to invite user';
                } catch {
                    errorMessage = errorText || 'Failed to invite user';
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('Edge Function success:', data);
            return data.user;
        } catch (error: any) {
            console.error('inviteUser error:', error);
            throw error;
        }
    }
};

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export const users = {
    // Get all users
    async getAll() {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as User[];
    },

    // Get user by ID
    async getById(id: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as User;
    },

    // Get user by email
    async getByEmail(email: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;
        return data as User;
    },

    // Create new user
    async create(userData: {
        email: string;
        full_name: string;
        role: Role;
        phone?: string;
        status?: UserStatus;
    }) {
        const { data, error } = await supabase
            .from('users')
            .insert([{
                ...userData,
                status: userData.status || 'ACTIVE'
            }])
            .select()
            .single();

        if (error) throw error;

        // Log user creation
        await systemLogs.add({
            actor_id: data.id,
            actor_name: userData.full_name,
            actor_role: userData.role,
            action: 'USER_CREATED',
            details: `User ${userData.full_name} created with role ${userData.role}`
        });

        return data as User;
    },

    // Update user
    async update(id: string, updates: Partial<User>) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log user update
        await systemLogs.add({
            actor_id: id,
            actor_name: data.full_name,
            actor_role: data.role,
            action: 'USER_UPDATED',
            details: `User ${data.full_name} updated`
        });

        return data as User;
    },

    // Update last login
    async updateLastLogin(id: string) {
        const { error } = await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    // Delete user (from both Auth and Database)
    async delete(id: string) {
        // Get user details for logging
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        // Delete from database first
        const { error: dbError } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) throw new Error(`Database deletion failed: ${dbError.message}`);

        // Delete from Supabase Auth (requires admin access via Edge Function)
        //Note cannot delete from auth directly from client - would need an Edge Function
        // For now, just delete from database - auth user will remain but won't be able to login

        // Log user deletion
        if (user && currentUserCache) {
            await systemLogs.add({
                actor_id: currentUserCache.id,
                actor_name: currentUserCache.full_name,
                actor_role: currentUserCache.role,
                action: 'USER_DELETED',
                details: `User ${user.full_name} (${user.email}) was deleted by ${currentUserCache.full_name}`
            });
        }

        return true;
    }
};

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

export const projects = {
    // Get all projects
    async getAll() {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Project[];
    },

    // Get projects by role
    async getByRole(role: Role) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('assigned_to_role', role)
            .order('priority', { ascending: false })
            .order('due_date', { ascending: true });

        if (error) throw error;
        return data as Project[];
    },

    // Get project by ID
    async getById(id: string) {
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Project;
    },

    // Create new project
    async create(projectData: {
        title: string;
        channel: Channel;
        content_type: ContentType;
        assigned_to_role: Role;
        assigned_to_user_id?: string;
        priority?: Priority;
        due_date: string;
        data: any;
    }) {
        const { data, error } = await supabase
            .from('projects')
            .insert([{
                ...projectData,
                current_stage: 'SCRIPT' as WorkflowStage,
                status: 'IN_PROGRESS' as TaskStatus,
                priority: projectData.priority || 'NORMAL'
            }])
            .select()
            .single();

        if (error) throw error;
        return data as Project;
    },

    // Update project
    async update(id: string, updates: Partial<Project>) {
        const { data, error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Project;
    },

    // Update project data (JSONB field)
    async updateData(id: string, dataUpdates: any) {
        const project = await this.getById(id);
        const newData = { ...project.data, ...dataUpdates };

        return await this.update(id, { data: newData });
    },

    // Delete project
    async delete(id: string) {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

export const workflow = {
    // Submit project for review
    async submitForReview(
        projectId: string,
        userId: string,
        userName: string,
        nextStage: WorkflowStage,
        nextRole: Role,
        comment?: string
    ) {
        // Update project
        await supabase
            .from('projects')
            .update({
                current_stage: nextStage,
                assigned_to_role: nextRole,
                status: 'WAITING_APPROVAL' as TaskStatus
            })
            .eq('id', projectId);

        // Add workflow history
        await supabase
            .from('workflow_history')
            .insert({
                project_id: projectId,
                stage: nextStage,
                actor_id: userId,
                actor_name: userName,
                action: 'SUBMITTED',
                comment: comment || 'Submitted for review'
            });
    },

    // Approve project
    async approve(
        projectId: string,
        userId: string,
        userName: string,
        userRole: Role,
        nextStage: WorkflowStage,
        nextRole: Role,
        comment?: string
    ) {
        // Update project
        await supabase
            .from('projects')
            .update({
                current_stage: nextStage,
                assigned_to_role: nextRole,
                status: 'TODO' as TaskStatus
            })
            .eq('id', projectId);

        // Add workflow history
        await supabase
            .from('workflow_history')
            .insert({
                project_id: projectId,
                stage: nextStage,
                actor_id: userId,
                actor_name: userName,
                action: 'APPROVED',
                comment: comment || `Approved by ${userRole}`
            });
    },

    // Reject project
    async reject(
        projectId: string,
        userId: string,
        userName: string,
        userRole: Role,
        returnToStage: WorkflowStage,
        returnToRole: Role,
        comment: string
    ) {
        // Update project
        await supabase
            .from('projects')
            .update({
                current_stage: returnToStage,
                assigned_to_role: returnToRole,
                status: 'REJECTED' as TaskStatus
            })
            .eq('id', projectId);

        // Add workflow history
        await supabase
            .from('workflow_history')
            .insert({
                project_id: projectId,
                stage: returnToStage,
                actor_id: userId,
                actor_name: userName,
                action: 'REJECTED',
                comment: comment || `Rejected by ${userRole}`
            });
    },

    // Mark project as done
    async markAsDone(
        projectId: string,
        userId: string,
        userName: string
    ) {
        await supabase
            .from('projects')
            .update({
                status: 'DONE' as TaskStatus
            })
            .eq('id', projectId);

        // Add workflow history
        await supabase
            .from('workflow_history')
            .insert({
                project_id: projectId,
                stage: 'POSTED' as WorkflowStage,
                actor_id: userId,
                actor_name: userName,
                action: 'PUBLISHED',
                comment: 'Project completed and published'
            });
    }
};

// ============================================================================
// WORKFLOW HISTORY
// ============================================================================

export const workflowHistory = {
    // Get history for a project
    async getByProject(projectId: string) {
        const { data, error } = await supabase
            .from('workflow_history')
            .select('*')
            .eq('project_id', projectId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Add history entry
    async add(entry: {
        project_id: string;
        stage: WorkflowStage;
        actor_id: string;
        actor_name: string;
        action: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
        comment?: string;
    }) {
        const { data, error } = await supabase
            .from('workflow_history')
            .insert([entry])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================================================
// SYSTEM LOGS
// ============================================================================

export const systemLogs = {
    // Get all logs (Admin only)
    async getAll(limit: number = 100) {
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // Get logs by user
    async getByUser(userId: string, limit: number = 50) {
        const { data, error } = await supabase
            .from('system_logs')
            .select('*')
            .eq('actor_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // Add log entry
    async add(logEntry: {
        actor_id?: string;
        actor_name: string;
        actor_role: Role;
        action: string;
        details: string;
        metadata?: any;
    }) {
        const { data, error } = await supabase
            .from('system_logs')
            .insert([{
                ...logEntry,
                metadata: logEntry.metadata || {}
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================================================
// FILE STORAGE
// ============================================================================

export const storage = {
    // Upload video
    async uploadVideo(file: File, projectId: string) {
        const fileName = `${projectId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
            .from('videos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('videos')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    // Upload thumbnail
    async uploadThumbnail(file: File, projectId: string) {
        const fileName = `${projectId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
            .from('thumbnails')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    // Upload creative
    async uploadCreative(file: File, projectId: string) {
        const fileName = `${projectId}/${Date.now()}_${file.name}`;

        const { data, error } = await supabase.storage
            .from('creatives')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('creatives')
            .getPublicUrl(fileName);

        return publicUrl;
    },

    // Delete file
    async deleteFile(bucket: 'videos' | 'thumbnails' | 'creatives', path: string) {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const helpers = {
    // Get workflow next stage based on content type
    getNextStage(currentStage: WorkflowStage, contentType: ContentType, action: 'approve' | 'reject'): {
        stage: WorkflowStage;
        role: Role;
    } {
        if (action === 'reject') {
            // Return to previous stage based on current stage
            const rejectMap: Record<WorkflowStage, { stage: WorkflowStage; role: Role }> = {
                [WorkflowStage.SCRIPT_REVIEW_L1]: { stage: WorkflowStage.SCRIPT, role: Role.WRITER },
                [WorkflowStage.SCRIPT_REVIEW_L2]: { stage: WorkflowStage.SCRIPT, role: Role.WRITER },
                [WorkflowStage.FINAL_REVIEW_CMO]: {
                    stage: contentType === 'VIDEO' ? WorkflowStage.THUMBNAIL_DESIGN : WorkflowStage.CREATIVE_DESIGN,
                    role: Role.DESIGNER
                },
                [WorkflowStage.FINAL_REVIEW_CEO]: {
                    stage: contentType === 'VIDEO' ? WorkflowStage.THUMBNAIL_DESIGN : WorkflowStage.CREATIVE_DESIGN,
                    role: Role.DESIGNER
                },
                // Default returns
                [WorkflowStage.SCRIPT]: { stage: WorkflowStage.SCRIPT, role: Role.WRITER },
                [WorkflowStage.CINEMATOGRAPHY]: { stage: WorkflowStage.SCRIPT, role: Role.WRITER },
                [WorkflowStage.VIDEO_EDITING]: { stage: WorkflowStage.CINEMATOGRAPHY, role: Role.CINE },
                [WorkflowStage.THUMBNAIL_DESIGN]: { stage: WorkflowStage.VIDEO_EDITING, role: Role.EDITOR },
                [WorkflowStage.CREATIVE_DESIGN]: { stage: WorkflowStage.SCRIPT, role: Role.WRITER },
                [WorkflowStage.OPS_SCHEDULING]: { stage: WorkflowStage.FINAL_REVIEW_CEO, role: Role.CEO },
                [WorkflowStage.POSTED]: { stage: WorkflowStage.OPS_SCHEDULING, role: Role.OPS }
            };
            return rejectMap[currentStage];
        }

        // Approval flow
        const approvalMap: Record<WorkflowStage, { stage: WorkflowStage; role: Role }> = {
            [WorkflowStage.SCRIPT]: { stage: WorkflowStage.SCRIPT_REVIEW_L1, role: Role.CMO },
            [WorkflowStage.SCRIPT_REVIEW_L1]: { stage: WorkflowStage.SCRIPT_REVIEW_L2, role: Role.CEO },
            [WorkflowStage.SCRIPT_REVIEW_L2]: {
                stage: contentType === 'VIDEO' ? WorkflowStage.CINEMATOGRAPHY : WorkflowStage.CREATIVE_DESIGN,
                role: contentType === 'VIDEO' ? Role.CINE : Role.DESIGNER
            },
            [WorkflowStage.CINEMATOGRAPHY]: { stage: WorkflowStage.VIDEO_EDITING, role: Role.EDITOR },
            [WorkflowStage.VIDEO_EDITING]: { stage: WorkflowStage.THUMBNAIL_DESIGN, role: Role.DESIGNER },
            [WorkflowStage.THUMBNAIL_DESIGN]: { stage: WorkflowStage.FINAL_REVIEW_CMO, role: Role.CMO },
            [WorkflowStage.CREATIVE_DESIGN]: { stage: WorkflowStage.FINAL_REVIEW_CMO, role: Role.CMO },
            [WorkflowStage.FINAL_REVIEW_CMO]: { stage: WorkflowStage.FINAL_REVIEW_CEO, role: Role.CEO },
            [WorkflowStage.FINAL_REVIEW_CEO]: { stage: WorkflowStage.OPS_SCHEDULING, role: Role.OPS },
            [WorkflowStage.OPS_SCHEDULING]: { stage: WorkflowStage.POSTED, role: Role.OPS },
            [WorkflowStage.POSTED]: { stage: WorkflowStage.POSTED, role: Role.OPS }
        };
        return approvalMap[currentStage];
    }
};

// ============================================================================
// COMPATIBILITY WRAPPER - Matches mockDb Interface
// ============================================================================

/**
 * This wrapper layer provides a flat interface matching mockDb.ts
 * so that all components work without modification.
 */

// Session management (mimics mockDb behavior)
let currentUserCache: User | null = null;

// Initialize current user from Supabase session
const initializeCurrentUser = async () => {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            // Get full user data from users table
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('email', authUser.email)
                .single();
            currentUserCache = data as User;
        }
    } catch (error) {
        console.error('Failed to initialize current user:', error);
    }
};

// Auto-initialize
initializeCurrentUser();

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();
        currentUserCache = data as User;
    } else if (event === 'SIGNED_OUT') {
        currentUserCache = null;
    }
});

// ============================================================================
// EXPORT ALL - Flat Interface Matching mockDb
// ============================================================================

export const db = {
    // Keep namespaced access for advanced usage
    auth,
    users,
    projects,
    workflow,
    workflowHistory,
    systemLogs,
    storage,
    helpers,

    // ========================================================================
    // FLAT COMPATIBILITY METHODS (matches mockDb.ts interface)
    // ========================================================================

    // --- Auth & Session ---
    getCurrentUser(): User | null {
        return currentUserCache;
    },

    async login(email: string, password: string): Promise<User> {
        // Real authentication using Supabase
        const { user } = await auth.signIn(email, password);

        if (!user) {
            throw new Error('Login failed');
        }

        // Get full user details
        const { data } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!data) {
            throw new Error('User profile not found');
        }

        currentUserCache = data as User;
        return data as User;
    },

    async logout() {
        if (currentUserCache) {
            await systemLogs.add({
                actor_id: currentUserCache.id,
                actor_name: currentUserCache.full_name,
                actor_role: currentUserCache.role,
                action: 'LOGOUT',
                details: `User ${currentUserCache.full_name} logged out`
            });
        }
        await auth.signOut();
        currentUserCache = null;
    },

    // --- User Management ---
    async getUsers(): Promise<User[]> {
        return await users.getAll();
    },

    async addUser(userData: Omit<User, 'id' | 'last_login'>): Promise<User> {
        return await users.create({
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            phone: userData.phone,
            status: userData.status
        });
    },

    async updateUser(id: string, updates: Partial<User>) {
        await users.update(id, updates);
    },

    async deleteUser(id: string) {
        return await users.delete(id);
    },

    // --- Project Management ---
    async getProjects(user: User): Promise<Project[]> {
        // For CEO/CMO/Admin/OPS, show all projects
        if ([Role.CEO, Role.CMO, Role.ADMIN, Role.OPS].includes(user.role)) {
            return await projects.getAll();
        }
        // For other roles, show projects assigned to their role
        return await projects.getByRole(user.role);
    },

    async getProjectById(id: string): Promise<Project | undefined> {
        try {
            return await projects.getById(id);
        } catch (error) {
            return undefined;
        }
    },

    createProject(title: string, channel: Channel, dueDate: string, contentType: ContentType = 'VIDEO'): Project {
        // This needs to be sync to match mockDb, so we'll handle it differently
        // For now, return a promise disguised as sync (components will handle)
        const projectData = {
            title,
            channel,
            content_type: contentType,
            assigned_to_role: Role.WRITER, // Always starts with writer
            due_date: dueDate,
            data: {}
        };

        // Create immediately and return a pseudo-project
        // The actual creation happens in background
        const tempId = `temp_${Date.now()}`;
        const tempProject: Project = {
            id: tempId,
            title,
            channel,
            content_type: contentType,
            current_stage: WorkflowStage.SCRIPT,
            assigned_to_role: Role.WRITER,
            status: TaskStatus.TODO,
            priority: 'NORMAL',
            due_date: dueDate,
            created_at: new Date().toISOString(),
            data: {},
            history: []
        };

        // Create in background and update cache
        projects.create(projectData).then(createdProject => {
            // Update the temp project with real ID
            tempProject.id = createdProject.id;
        });

        return tempProject;
    },

    updateProjectData(projectId: string, newData: Partial<any>) {
        projects.updateData(projectId, newData).catch(err => {
            console.error('Failed to update project data:', err);
        });
    },

    // --- Workflow Management ---
    submitToReview(projectId: string) {
        if (!currentUserCache) {
            console.error('No current user for submitToReview');
            return;
        }

        // Get the project to determine next stage
        projects.getById(projectId).then(project => {
            const nextStageInfo = helpers.getNextStage(
                project.current_stage,
                project.content_type,
                'approve'
            );

            workflow.submitForReview(
                projectId,
                currentUserCache!.id,
                currentUserCache!.full_name,
                nextStageInfo.stage,
                nextStageInfo.role,
                'Submitted for review'
            ).catch(err => {
                console.error('Failed to submit for review:', err);
            });
        }).catch(err => {
            console.error('Failed to get project:', err);
        });
    },

    advanceWorkflow(projectId: string, comment?: string) {
        if (!currentUserCache) {
            console.error('No current user for advanceWorkflow');
            return;
        }

        projects.getById(projectId).then(project => {
            const nextStageInfo = helpers.getNextStage(
                project.current_stage,
                project.content_type,
                'approve'
            );

            workflow.approve(
                projectId,
                currentUserCache!.id,
                currentUserCache!.full_name,
                currentUserCache!.role,
                nextStageInfo.stage,
                nextStageInfo.role,
                comment
            ).catch(err => {
                console.error('Failed to advance workflow:', err);
            });
        }).catch(err => {
            console.error('Failed to get project:', err);
        });
    },

    rejectTask(projectId: string, targetStage: WorkflowStage, comment: string) {
        if (!currentUserCache) {
            console.error('No current user for rejectTask');
            return;
        }

        projects.getById(projectId).then(project => {
            const returnStageInfo = helpers.getNextStage(
                targetStage,
                project.content_type,
                'reject'
            );

            workflow.reject(
                projectId,
                currentUserCache!.id,
                currentUserCache!.full_name,
                currentUserCache!.role,
                returnStageInfo.stage,
                returnStageInfo.role,
                comment
            ).catch(err => {
                console.error('Failed to reject task:', err);
            });
        }).catch(err => {
            console.error('Failed to get project:', err);
        });
    },

    // --- System Logs ---
    async getSystemLogs(): Promise<any[]> {
        return await systemLogs.getAll();
    }
};

// Default export for compatibility
export default db;
