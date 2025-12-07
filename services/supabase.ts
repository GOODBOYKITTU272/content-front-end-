import { createClient } from '@supabase/supabase-js';

// Configuration provided by user
const supabaseUrl = 'https://zxnevoulicmapqmniaos.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4bmV2b3VsaWNtYXBxbW5pYW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDIzNTYsImV4cCI6MjA4MDE3ODM1Nn0.kTwKj07Zn-eITEpGW2wje4gRoHzT7xUQYV8JG6w_IjE';

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables!');
}

// Custom fetch with timeout and logging for better debugging
const customFetch = (url: string, options: RequestInit = {}) => {
    const timeout = 30000; // 30 seconds timeout
    
    return Promise.race([
        fetch(url, options),
        new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms. Please check your network connection.`)), timeout)
        )
    ]);
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
    },
    global: {
        fetch: customFetch
    }
});