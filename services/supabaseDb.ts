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
        console.log('🔐 SignIn: Starting login process...');

        // LAYER 1: Force clear ALL Supabase tokens from localStorage
        // This prevents stale/expired tokens from interfering
        console.log('🧹 SignIn: Clearing all sb-* tokens from localStorage...');
        const clearedKeys: string[] = [];
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-')) {
                localStorage.removeItem(key);
                clearedKeys.push(key);
            }
        });
        if (clearedKeys.length > 0) {
            console.log(`🧹 SignIn: Cleared ${clearedKeys.length} old tokens:`, clearedKeys);
        }

        // LAYER 2: Explicitly sign out to ensure backend session cleared
        console.log('🚪 SignIn: Calling signOut to clear backend session...');
        try {
            await supabase.auth.signOut({ scope: 'global' });
            console.log('✅ SignIn: Backend session cleared');
        } catch (signOutError) {
            console.warn('⚠️  SignIn: SignOut failed (continuing anyway):', signOutError);
            // Don't throw - old session might not exist
        }

        // LAYER 3: Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Now proceed with fresh login
        console.log('🔑 SignIn: Attempting fresh login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            console.error('❌ SignIn: Login failed:', error);
            throw error;
        }

        console.log('✅ SignIn: Login successful');

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
            // First, check if we have a current user session
            const currentUser = await this.getCurrentUser();
            if (!currentUser) {
                console.warn('No active session found, falling back to direct user creation');
                // Fall back to direct user creation without sending invite email
                const newUser = await users.create({
                    email,
                    full_name: userData.full_name,
                    role: userData.role,
                    phone: userData.phone,
                    status: UserStatus.ACTIVE
                });

                // Since we couldn't send an invite email, we'll create a basic user record
                console.log('User created directly without invite email:', newUser);
                return newUser;
            }

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

            // If we still don't have a session, fall back to direct creation
            if (sessionError || !session) {
                console.warn('Unable to retrieve active session, falling back to direct user creation');
                const newUser = await users.create({
                    email,
                    full_name: userData.full_name,
                    role: userData.role,
                    phone: userData.phone,
                    status: UserStatus.ACTIVE
                });

                console.log('User created directly without invite email:', newUser);
                return newUser;
            }

            console.log('Session token found, calling Edge Function...');

            // Call the Edge Function (service key is secure on server)
            console.log('Calling Edge Function at:', `${supabaseUrl}/functions/v1/invite-user`);

            // Add timeout to prevent hanging forever
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, userData }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
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

                    // Fallback: create user directly so the admin can proceed even if the edge function fails
                    console.warn('Invite failed, falling back to direct user creation. No email will be sent.');
                    const createdUser = await users.create({
                        email,
                        full_name: userData.full_name,
                        role: userData.role,
                        phone: userData.phone,
                        status: UserStatus.ACTIVE
                    });

                    return {
                        user: createdUser,
                        fallback: true,
                        warning: `Invite email not sent: ${errorMessage}`
                    };
                }

                const data = await response.json();
                console.log('Edge Function success:', data);

                // Return the full response data, not just the user
                return data;

            } catch (fetchError: any) {
                clearTimeout(timeoutId);

                // Handle timeout specifically
                if (fetchError.name === 'AbortError') {
                    console.error('Edge Function timeout after 30 seconds');
                    throw new Error('Invitation service timed out. Please try again or contact support.');
                }

                // Re-throw other errors
                throw fetchError;
            }
        } catch (error: any) {
            console.error('inviteUser error:', error);
            throw error;
        }
    },

    // Delete user (Admin only) - Calls secure Edge Function
    async deleteUser(userId: string) {
        console.log('deleteUser called for:', userId);
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxnevoulicmapqmniaos.supabase.co';

        try {
            // Get current session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                throw new Error('No active session - admin authentication required');
            }

            console.log('Calling delete-user Edge Function...');

            // Call Edge Function
            const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId })
            });

            console.log('Edge Function response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Edge Function error response:', errorText);

                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || 'Failed to delete user';
                } catch {
                    errorMessage = errorText || 'Failed to delete user';
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('User deleted successfully:', data);

            return data;
        } catch (error: any) {
            console.error('deleteUser error:', error);
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
        console.log('🔍 getByEmail: Fetching user for:', email);

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (error) {
            console.error('❌ getByEmail: Database error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn('⚠️  getByEmail: No user found for email:', email);
            throw new Error(`No user found with email: ${email}`);
        }

        if (data.length > 1) {
            console.error(`🔴 getByEmail: DUPLICATE USERS DETECTED for ${email}! Found ${data.length} users.`);
            console.error('🔴 User IDs:', data.map(u => u.id));
            console.warn('⚠️  getByEmail: Returning first match, but you should clean up duplicates!');
            // Return first match to allow login, but log the issue
        }

        console.log('✅ getByEmail: User found:', data[0].full_name);
        return data[0] as User;
    },

    // Create new user
    async create(userData: {
        email: string;
        full_name: string;
        role: Role;
        phone?: string;
        status?: UserStatus;
    }) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([{
                    ...userData,
                    status: userData.status || UserStatus.ACTIVE
                }])
                .select()
                .single();

            if (error) {
                console.error('Error creating user in database:', error);
                throw error;
            }

            // Log user creation
            try {
                await systemLogs.add({
                    actor_id: data.id,
                    actor_name: userData.full_name,
                    actor_role: userData.role,
                    action: 'USER_CREATED',
                    details: `User ${userData.full_name} created with role ${userData.role}`
                });
            } catch (logError) {
                console.warn('Failed to log user creation:', logError);
            }

            return data as User;
        } catch (error) {
            console.error('Failed to create user:', error);
            throw error;
        }
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

// Listen for auth changes with improved handling
supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('DB Auth state change detected:', event);

    switch (event) {
        case 'SIGNED_IN':
            if (session?.user) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', session.user.email)
                        .single();

                    if (error) {
                        console.warn('Error fetching user data on sign in:', error);
                        return;
                    }

                    if (data) {
                        currentUserCache = data as User;
                        console.log('DB: User signed in and cached:', currentUserCache?.full_name);
                    }
                } catch (error) {
                    console.warn('Error processing sign in:', error);
                }
            }
            break;

        case 'SIGNED_OUT':
            console.log('DB: User signed out, clearing cache');
            currentUserCache = null;
            break;

        case 'TOKEN_REFRESHED':
            console.log('DB: Token refreshed');
            // Optionally re-fetch user data if needed
            break;

        case 'USER_UPDATED':
            console.log('DB: User updated');
            // Optionally re-fetch user data if needed
            break;

        default:
            console.log('DB: Other auth event:', event);
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

    async refreshSession(): Promise<boolean> {
        try {
            console.log('DB: Manually refreshing session...');
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', session.user.email!)
                    .single();

                if (error) {
                    console.warn('DB: Error fetching user during session refresh:', error);
                    return false;
                }

                if (data) {
                    currentUserCache = data as User;
                    console.log('DB: Session refreshed successfully for:', currentUserCache.full_name);
                    return true;
                }
            } else {
                console.log('DB: No active session to refresh');
                currentUserCache = null;
            }

            return false;
        } catch (error) {
            console.error('DB: Session refresh failed:', error);
            return false;
        }
    },

    async login(email: string, password: string): Promise<User> {
        try {
            // Defensive: clear any stale local session before a fresh login attempt
            // This prevents "stuck until I delete tokens" issues when refresh tokens are invalid
            try {
                await supabase.auth.signOut();
            } catch (signOutErr) {
                console.warn('Pre-login signOut failed (safe to ignore if no session):', signOutErr);
            }

            // Real authentication using Supabase
            console.log('Login: calling signInWithPassword...');
            const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

            if (signInError) {
                throw new Error(signInError.message);
            }

            if (!user) {
                throw new Error('Login failed - no user returned');
            }

            // Get full user details
            console.log('Login: fetching user profile...');
            const userData = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userData.error) {
                throw new Error(`User profile fetch failed: ${userData.error.message}`);
            }

            if (!userData.data) {
                throw new Error('User profile not found in database');
            }

            currentUserCache = userData.data as User;
            console.log('User logged in and cached:', currentUserCache.full_name);

            // Update last login
            try {
                await supabase
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('email', email);
            } catch (updateError) {
                console.warn('Failed to update last login timestamp:', updateError);
            }

            return userData.data as User;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
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
// ============================================================================
// TOKEN HEALTH MONITORING
// ============================================================================

/**
 * Check if authentication tokens in localStorage are healthy
 * Returns status indicating if tokens should be cleared
 */
export const tokenHealthCheck = (): {
    healthy: boolean;
    status: string;
    action?: 'clear' | 'keep';
} => {
    const tokens = Object.keys(localStorage).filter(k => k.startsWith('sb-'));

    if (tokens.length === 0) {
        return { healthy: true, status: 'no_tokens', action: 'keep' };
    }

    try {
        // Check if we can parse token data (validate JSON format)
        tokens.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                JSON.parse(value); // Validate JSON structure
            }
        });

        return { healthy: true, status: 'tokens_valid_format', action: 'keep' };
    } catch (error) {
        console.error('🔴 Token Health: Corrupted token detected:', error);
        return { healthy: false, status: 'tokens_corrupted', action: 'clear' };
    }
};

export default db;
