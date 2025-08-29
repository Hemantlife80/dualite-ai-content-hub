import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto, toHashString } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'save' | 'delete'
  apiKey?: string
}

// --- AES-GCM Encryption Helpers ---
// In a real production environment, the ENCRYPTION_KEY should be a long,
// randomly generated string stored securely in Supabase secrets.
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY')

async function getKey(salt: Uint8Array) {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is not set in environment variables.')
  }
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

async function encrypt(data: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await getKey(salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    new TextEncoder().encode(data)
  )

  // Combine salt, iv, and ciphertext into one buffer, then encode as hex
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  return toHashString(combined)
}
// --- End Encryption Helpers ---

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { action, apiKey }: RequestBody = await req.json()

    if (action === 'save') {
      if (!apiKey || !apiKey.trim() || !apiKey.startsWith('sk-')) {
        throw new Error('A valid OpenAI API key is required.')
      }

      const encryptedKey = await encrypt(apiKey.trim())
      
      const { error } = await supabase
        .from('users')
        .update({ api_key_encrypted: encryptedKey })
        .eq('id', user.id)

      if (error) throw new Error('Failed to save API key.')

      return new Response(JSON.stringify({ success: true, message: 'API key saved successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })

    } else if (action === 'delete') {
      const { error } = await supabase
        .from('users')
        .update({ api_key_encrypted: null })
        .eq('id', user.id)

      if (error) throw new Error('Failed to delete API key.')

      return new Response(JSON.stringify({ success: true, message: 'API key deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    } else {
      throw new Error('Invalid action. Use "save" or "delete".')
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
