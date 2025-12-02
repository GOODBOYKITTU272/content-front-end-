import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for privileged operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zxnevoulicmapqmniaos.supabase.co';
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4bmV2b3VsaWNtYXBxbW5pYW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwMjM1NiwiZXhwIjoyMDgwMTc4MzU2fQ.drPYqcrPuCAsijag-gZIFcr5MDU7wAPYCRuSzhylCAY';

if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    throw new Error('Missing VITE_SUPABASE_URL');
}
if (!serviceRoleKey || serviceRoleKey === 'your-service-role-key') {
    throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY');
}

// Create admin client with service role key
// NOTE: This bypasses RLS policies - use only for admin operations
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
