import { handlers } from '@/lib/auth'

// #region agent log
fetch('http://127.0.0.1:7242/ingest/716151d5-b5ff-4d89-a3f2-8421e03cf581',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/auth/route.ts:module-load',message:'Auth API route module loaded',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
// #endregion

export const { GET, POST } = handlers

