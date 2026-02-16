// Fonction Edge StudyFlow — CORS activé pour appels depuis le navigateur (localhost).
// Déploiement : supabase functions deploy make-server-177dbbc2
/// <reference path="../_shared/deno.d.ts" />

import { corsHeaders } from '../_shared/cors.ts'

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // Obligatoire : répondre à OPTIONS pour que le navigateur autorise les requêtes cross-origin
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname
  const method = req.method

  try {
    // GET /session/current — utilisé par "Tester la connexion" et la config
    if (method === 'GET' && (path.endsWith('/session/current') || path.includes('/session/current'))) {
      return jsonResponse({ success: true, session: null })
    }

    // GET /sessions
    if (method === 'GET' && (path.endsWith('/sessions') || path.includes('/sessions')) && !path.includes('/session/')) {
      return jsonResponse({ success: true, sessions: [] })
    }

    // POST /session — créer ou mettre à jour une session académique
    if (method === 'POST' && (path.endsWith('/session') || path.includes('/session')) && !path.includes('/session/current') && !path.includes('/sessions')) {
      const body = await req.json().catch(() => ({}))
      // Stockage minimal en mémoire (remplace par ton KV/DB si tu en as)
      return jsonResponse({ success: true, session: { id: body.id || `session-${Date.now()}`, ...body } })
    }

    // PUT /session/:id
    if (method === 'PUT' && path.includes('/session/')) {
      const body = await req.json().catch(() => ({}))
      return jsonResponse({ success: true, session: body })
    }

    // GET /courses
    if (method === 'GET' && (path.endsWith('/courses') || path.includes('/courses'))) {
      return jsonResponse({ success: true, courses: [] })
    }

    // Réponse par défaut (404) — avec CORS pour que le navigateur reçoive la réponse
    return jsonResponse({ success: false, error: 'Not found' }, 404)
  } catch (e) {
    return jsonResponse({ success: false, error: String(e) }, 500)
  }
})
