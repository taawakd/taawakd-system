// api/config.js
// يحقن مفاتيح Supabase العامة في الـ HTML بأمان
// SUPABASE_URL و SUPABASE_ANON_KEY عامة وآمنة للـ Frontend

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const config = `
    window.__SUPABASE_URL__  = '${process.env.SUPABASE_URL || ''}';
    window.__SUPABASE_ANON__ = '${process.env.SUPABASE_ANON_KEY || ''}';
  `;

  res.status(200).send(config);
}
