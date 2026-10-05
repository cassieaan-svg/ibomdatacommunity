// Netlify serverless function: sends the Contact page form via Resend.
// Requires RESEND_API_KEY (and optionally RESEND_FROM_EMAIL, CONTACT_TO_EMAIL)
// to be set as environment variables in the Netlify site dashboard.

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  var data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  var name = String(data.name || '').trim();
  var email = String(data.email || '').trim();
  var subject = String(data.subject || 'General Enquiry').trim();
  var message = String(data.message || '').trim();

  if (!name || !email || !message) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Name, email and message are required' }) };
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service is not configured yet' }) };
  }

  var fromEmail = process.env.RESEND_FROM_EMAIL || 'Ibom Data Community <onboarding@resend.dev>';
  var toEmail = process.env.CONTACT_TO_EMAIL || 'ibomdatacommunity@gmail.com';

  var safeName = name.replace(/[<>"\r\n]/g, '').slice(0, 60);
  var addrMatch = fromEmail.match(/<([^>]+)>/);
  var fromAddress = addrMatch ? addrMatch[1] : fromEmail;
  var safeEmail = email.replace(/[<>"\r\n]/g, '').slice(0, 80);
  var fromHeader = safeName + ' (' + safeEmail + ') via Ibom Data Community <' + fromAddress + '>';

  var html =
    '<div style="background:#f4f1ec;padding:24px;font-family:Arial,Helvetica,sans-serif;">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e8e0d4;">' +
      '<div style="background:#1a3d0f;padding:20px 28px;">' +
        '<div style="color:#f7921e;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">New contact form message</div>' +
        '<div style="color:#ffffff;font-size:20px;font-weight:bold;margin-top:6px;">' + escapeHtml(subject) + '</div>' +
      '</div>' +
      '<div style="padding:28px;">' +
        '<table style="width:100%;border-collapse:collapse;font-size:14px;color:#333;">' +
          '<tr><td style="padding:6px 0;color:#888;width:80px;">From</td><td style="padding:6px 0;font-weight:bold;">' + escapeHtml(name) + '</td></tr>' +
          '<tr><td style="padding:6px 0;color:#888;">Email</td><td style="padding:6px 0;"><a href="mailto:' + escapeHtml(email) + '" style="color:#1e8800;">' + escapeHtml(email) + '</a></td></tr>' +
        '</table>' +
        '<div style="margin-top:20px;padding:18px;background:#fdf6ee;border-left:4px solid #f7921e;border-radius:6px;font-size:15px;line-height:1.7;color:#222;">' +
          escapeHtml(message).replace(/\n/g, '<br/>') +
        '</div>' +
      '</div>' +
      '<div style="padding:14px 28px;background:#fafafa;color:#999;font-size:12px;text-align:center;">Sent from the Ibom Data Community website contact form</div>' +
    '</div></div>';

  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromHeader,
        to: [toEmail],
        reply_to: email,
        subject: 'New message from ' + safeName + ': ' + subject,
        html: html
      })
    });

    if (!res.ok) {
      var errBody = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send message', details: errBody }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error sending message' }) };
  }
};
