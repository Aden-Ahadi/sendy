const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

function getAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (url && key) {
      supabaseAdmin = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
  }
  return supabaseAdmin;
}

async function requireAuth(req, res, next) {
  const admin = getAdmin();

  if (!admin) {
    // Supabase not configured — block all requests
    return res.status(503).json({
      error: 'Auth not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.',
    });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await admin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

// Standalone verifier for Vercel serverless functions (no Express next())
async function verifyToken(req) {
  const admin = getAdmin();
  if (!admin) return null;

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

module.exports = { requireAuth, verifyToken };
