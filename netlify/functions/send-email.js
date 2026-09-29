// Netlify serverless function — sends the Contact page form via Resend.
// Requires RESEND_API_KEY (and optionally RESEND_FROM_EMAIL, CONTACT_TO_EMAIL)
// to be set as environment variables in the Netlify site dashboard.

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

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var html =
    '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
    '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
    '<p><strong>Subject:</strong> ' + escapeHtml(subject) + '</p>' +
    '<p><strong>Message:</strong></p>' +
    '<p>' + escapeHtml(message).replace(/\n/g, '<br/>') + '</p>';

  try {
    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: '[Contact Form] ' + subject + ' — ' + name,
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
