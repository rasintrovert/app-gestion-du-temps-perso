const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const apiBaseUrl = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-177dbbc2`
  : ''

export const publicAnonKey = ANON_KEY

export function getApiHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json',
  }
}

export function getProjectId(): string {
  if (!SUPABASE_URL) return ''
  const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match ? match[1] : ''
}

/** Message court pour le toast ; détails en console. */
export function getFetchErrorMessage(e: unknown): string {
  if (e instanceof TypeError && e.message === 'Failed to fetch') {
    const details =
      'Vérifiez : .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY), URL https://XXX.supabase.co, fonction Edge déployée, CORS en localhost.'
    if (typeof console !== 'undefined' && console.info) console.info('[StudyFlow]', details)
    return 'Impossible de joindre le serveur. Voir la console (F12) pour les pistes.'
  }
  if (e instanceof Error) return e.message
  return 'Erreur réseau ou serveur'
}
