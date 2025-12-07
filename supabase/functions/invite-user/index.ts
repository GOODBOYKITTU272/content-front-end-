import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Get the service role key from environment (secure!)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? ''

        if (!serviceRoleKey) {
            throw new Error('SERVICE_ROLE_KEY not set')
        }

        // Create admin client with service role key
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get request body
        const { email, userData } = await req.json()

        if (!email || !userData) {
            return new Response(
                JSON.stringify({ error: 'Missing email or userData' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Attempting to invite user: ${email} with role: ${userData.role}`)

        const redirectUrl = `${req.headers.get('origin')}/set-password?email=${encodeURIComponent(email)}&role=${userData.role}`
        console.log(`Redirect URL: ${redirectUrl}`)

        // Invite user using admin client
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: userData,
            redirectTo: redirectUrl
        })

        if (error) {
            console.error('Supabase Invite Error:', error)
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log('User invited successfully:', data.user?.id)

        // Also create user record in public.users table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: data.user?.id,
                email: email,
                full_name: userData.full_name,
                role: userData.role,
                phone: userData.phone || null,
                status: 'ACTIVE'  // This is fine as a string in the database
            })

        if (dbError) {
            console.error('Failed to create user record:', dbError)
        }

        return new Response(
            JSON.stringify({ success: true, user: data.user }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})