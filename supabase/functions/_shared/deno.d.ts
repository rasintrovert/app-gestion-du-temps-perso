/** Minimal Deno types for Supabase Edge Functions (IDE only; runtime is Deno). */
declare namespace Deno {
  function serve(
    handler: (req: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; reusePort?: boolean }
  ): void
}
