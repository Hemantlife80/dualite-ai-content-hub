import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto, toHashString } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  prompt: string
}

// --- AES-GCM Decryption Helpers ---
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY')

function hexToUint8Array(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
}

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

async function decrypt(encryptedHex: string): Promise<string> {
  const combined = hexToUint8Array(encryptedHex)
  const salt = combined.slice(0, 16)
  const iv = combined.slice(16, 28)
  const ciphertext = combined.slice(28)
  
  const key = await getKey(salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decrypted)
}
// --- End Decryption Helpers ---


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

    const { prompt }: RequestBody = await req.json()
    if (!prompt || prompt.trim().length === 0) throw new Error('Prompt is required')

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('daily_generation_count, last_generation_date, is_pro_member, api_key_encrypted')
      .eq('id', user.id)
      .single()

    if (profileError) throw new Error('Failed to fetch user profile')

    const today = new Date().toISOString().split('T')[0]
    const isNewDay = userProfile.last_generation_date !== today
    const currentCount = isNewDay ? 0 : userProfile.daily_generation_count

    if (!userProfile.is_pro_member && currentCount >= 5) {
      throw new Error('Daily generation limit reached. Upgrade to Pro for unlimited access.')
    }

    if (!userProfile.api_key_encrypted) {
      throw new Error('Please configure your OpenAI API key in Settings.')
    }

    const decryptedApiKey = await decrypt(userProfile.api_key_encrypted)

    // --- Call OpenAI API ---
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${decryptedApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
      }),
    })

    if (!openAIResponse.ok) {
      const errorBody = await openAIResponse.json()
      console.error('OpenAI API Error:', errorBody)
      throw new Error(`Failed to generate content from AI. ${errorBody.error?.message || ''}`)
    }
    
    const openAIResult = await openAIResponse.json()
    const generatedText = openAIResult.choices[0].message.content.trim()
    // --- End OpenAI Call ---

    const generatedImageUrl = `https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/512x512/6366f1/ffffff?text=${encodeURIComponent(prompt.slice(0, 50))}`

    const { data: creation, error: creationError } = await supabase
      .from('creations')
      .insert({ user_id: user.id, prompt, generated_text: generatedText, generated_image_url: generatedImageUrl })
      .select().single()

    if (creationError) throw new Error('Failed to save creation')

    const newCount = currentCount + 1
    await supabase
      .from('users')
      .update({ daily_generation_count: newCount, last_generation_date: today })
      .eq('id', user.id)

    return new Response(JSON.stringify({
      success: true,
      generated_text: generatedText,
      generated_image_url: generatedImageUrl,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
