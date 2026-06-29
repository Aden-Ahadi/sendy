// Mirrors the backend shell HTML (supabase/functions/campaigns-send/index.ts) but uses
// the relative /brand-logo.png path, which only resolves correctly in-browser.
export const BRAND_NAME   = 'Huawei ICT Academy - DIT';
export const BRAND_FOOTER = 'Huawei DIT ICT Academy &nbsp;&middot;&nbsp; P.O.Box 2958 Dar-es-salaam';

const BASE_STYLES = `
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f5f4f0;
           font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; }
    p    { margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #202020; }
    h1   { margin: 0 0 16px; font-size: 26px; font-weight: 700; line-height: 1.2; color: #111; letter-spacing: -0.5px; }
    h2   { margin: 0 0 14px; font-size: 21px; font-weight: 700; line-height: 1.2; color: #111; letter-spacing: -0.3px; }
    h3   { margin: 0 0 12px; font-size: 17px; font-weight: 600; line-height: 1.3; color: #111; }
    ul, ol { margin: 0 0 16px; padding-left: 24px; }
    li   { margin-bottom: 6px; font-size: 15px; line-height: 1.7; color: #202020; }
    a    { color: #c7000a; text-decoration: underline; }
    strong { font-weight: 700; }
    em   { font-style: italic; }
    blockquote { margin: 0 0 16px; padding: 0 0 0 16px; border-left: 3px solid #e0ddd6; color: #646464; font-style: italic; }
    hr   { margin: 24px 0; border: none; border-top: 1px solid #eaeaea; }
    code { background: #f3f0e8; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; }
  </style>
`;

export function buildPreviewHtml(shell, content) {
  if (!content || content === '<p></p>') return '';

  if (shell === 'branded') {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">${BASE_STYLES}</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f0;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#fff;border-radius:8px 8px 0 0;padding:28px 48px;text-align:center;border-bottom:1px solid #eaeaea;">
    <img src="/brand-logo.png" width="110" height="auto" alt="${BRAND_NAME}" style="display:block;margin:0 auto;max-width:110px;">
  </td></tr>
  <tr><td style="background:#fff;padding:40px 48px;">${content}</td></tr>
  <tr><td style="background:#f9f8f5;border-radius:0 0 8px 8px;padding:20px 48px;border-top:1px solid #eaeaea;text-align:center;font-size:12px;color:#999;line-height:1.8;">
    ${BRAND_FOOTER}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  }

  // minimal
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">${BASE_STYLES}</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f0;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
  <tr><td style="background:#fff;border-radius:8px;padding:48px;">${content}</td></tr>
  <tr><td style="padding:24px 0;text-align:center;font-size:12px;color:#999;line-height:1.8;">
    ${BRAND_FOOTER}
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
