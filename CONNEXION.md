# Résoudre le problème de sauvegarde (connexion au serveur)

Si tu vois **« Impossible de joindre le serveur »** ou **« Failed to fetch »**, l’app ne peut pas appeler ta fonction Edge Supabase. Suis ces étapes dans l’ordre.

---

## 1. Vérifier le fichier `.env`

À la **racine du projet** (à côté de `package.json`), crée ou modifie le fichier `.env` :

```env
VITE_SUPABASE_URL=https://TON_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- **VITE_SUPABASE_URL** : sans slash à la fin. Remplace `TON_PROJECT_REF` par l’ID du projet (Dashboard Supabase → Settings → General → Reference ID).
- **VITE_SUPABASE_ANON_KEY** : clé « anon » publique (Dashboard → Settings → API → Project API keys → `anon` `public`).

Après toute modification de `.env`, **redémarre** le serveur de dev :

```bash
npm run dev
```

---

## 2. Vérifier que la fonction Edge est déployée

L’app appelle l’URL :

```
https://TON_PROJECT_REF.supabase.co/functions/v1/make-server-177dbbc2
```

- Dans le dashboard Supabase : **Edge Functions**.
- Une fonction doit exister avec le **nom** utilisé dans l’URL (ici `make-server-177dbbc2`).
- Si le nom de ta fonction est différent, adapte-le dans `src/lib/api.ts` (variable qui construit `apiBaseUrl`).

---

## 3. Activer CORS (cause la plus fréquente en localhost)

Quand l’app tourne sur **http://localhost:5173** et appelle Supabase, le navigateur envoie une requête « cross-origin ». Si la fonction Edge ne renvoie pas les bons en-têtes CORS, le navigateur bloque et tu obtiens **Failed to fetch**.

### Option A : Déployer la fonction fournie dans le projet (recommandé)

Une fonction Edge avec **CORS déjà activé** se trouve dans le repo :

- `supabase/functions/_shared/cors.ts` — en-têtes CORS
- `supabase/functions/make-server-177dbbc2/index.ts` — handler avec OPTIONS + routes minimales (`session/current`, `sessions`, `session`, `courses`)

**Déploiement :**

1. Installe le CLI Supabase si besoin : <https://supabase.com/docs/guides/cli>  
2. Connecte-toi : `supabase login`  
3. Lie le projet : `supabase link --project-ref rkidinwsppcpjiesgzun` (remplace par ton Reference ID si différent)  
4. Déploie la fonction :

```bash
supabase functions deploy make-server-177dbbc2
```

5. Redéploie après chaque modification du code dans `supabase/functions/`.

Si tu as déjà une autre version de cette fonction (avec plus de routes / une base de données), **copie au minimum** le bloc suivant dans ton code existant (voir Option B).

---

### Option B : Ajouter CORS à ta fonction existante

Dans le **code de ta fonction Edge** (côté Supabase), chaque réponse doit inclure les en-têtes CORS. Exemple en **Deno** :

```ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}
```

- Pour **chaque réponse** de la fonction, ajoute ces en-têtes :

```ts
return new Response(JSON.stringify({ success: true, ... }), {
  status: 200,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})
```

- Gérer la requête **OPTIONS** (préflight du navigateur) au tout début du handler :

```ts
if (req.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders })
}
```

Redéploie la fonction après modification :

```bash
supabase functions deploy make-server-177dbbc2
```

(Remplace par le nom réel de ta fonction si besoin.)

---

## 4. Tester depuis l’app

1. Ouvre **Configuration** dans le menu.
2. Dans le bloc **« Connexion au serveur »**, clique sur **« Tester la connexion »**.
3. Si tout est bon : **« Connexion au serveur OK »** → la sauvegarde de la session devrait fonctionner.
4. Si tu as un message d’erreur (401, 404, CORS), le texte indique quoi corriger (clé, URL, CORS, etc.).

---

## Résumé des causes possibles

| Message / comportement | À vérifier |
|------------------------|------------|
| URL non configurée     | `.env` avec `VITE_SUPABASE_URL` et redémarrage de `npm run dev` |
| Failed to fetch / CORS | En-têtes CORS + gestion OPTIONS dans la fonction Edge, puis redéploiement |
| Erreur 401             | `VITE_SUPABASE_ANON_KEY` correcte (clé anon du projet) |
| Erreur 404             | Nom de la fonction et URL dans `src/lib/api.ts`, fonction déployée |
