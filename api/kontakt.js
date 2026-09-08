const nodemailer = require('nodemailer');

const EMPFAENGER = 'info@ibras.de';
const SITE_URL = 'https://orientierungsberatung.de';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const body = req.body || {};

  // Zurueck zur Seite, von der aus das Formular abgeschickt wurde. Nur
  // site-interne, relative Pfade zulassen (kein offener Redirect).
  const requestedRedirect = (body._redirect || '').toString().trim();
  const isSafeRedirect = requestedRedirect.startsWith('/')
    && !requestedRedirect.startsWith('//')
    && !requestedRedirect.includes('://')
    && !/\s/.test(requestedRedirect);
  const redirectPath = isSafeRedirect ? requestedRedirect : '/';
  const erfolgsUrl = `${SITE_URL}${redirectPath}${redirectPath.includes('?') ? '&' : '?'}gesendet=1#kontakt`;

  const anliegen = (body.Anliegen || '').toString().trim();
  const name = (body.Name || '').toString().trim();
  const email = (body['E-Mail'] || '').toString().trim();
  const telefon = (body.Telefon || '').toString().trim();
  const nachricht = (body.Nachricht || '').toString().trim();
  const kontakteinwilligung = (body.Kontakteinwilligung || '').toString().trim() === 'ja';

  if (!name || !email) {
    res.status(400).send('Name und E-Mail-Adresse sind erforderlich.');
    return;
  }

  // Nachweis-Daten fuer die beiden Einwilligungen: Zeitpunkt + IP-Adresse,
  // damit im Streitfall belegbar ist, wann/wie zugestimmt wurde.
  const zeitpunkt = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const ipAdresse = (
    req.headers['x-real-ip']
    || (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim()
    || 'unbekannt'
  );

  if (!process.env.STRATO_SMTP_USER || !process.env.STRATO_SMTP_PASS) {
    console.error('STRATO_SMTP_USER/STRATO_SMTP_PASS fehlen als Vercel-Umgebungsvariablen.');
    res.status(500).send('Der Formularversand ist noch nicht eingerichtet. Bitte kontaktieren Sie uns direkt telefonisch oder per E-Mail.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.strato.de',
    port: 465,
    secure: true,
    auth: {
      user: process.env.STRATO_SMTP_USER,
      pass: process.env.STRATO_SMTP_PASS,
    },
  });

  const text = [
    `Anliegen: ${anliegen || '–'}`,
    `Name: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${telefon || '–'}`,
    '',
    'Nachricht:',
    nachricht || '–',
    '',
    `Einwilligungen (bestätigt am ${zeitpunkt} Uhr, IP-Adresse ${ipAdresse}):`,
    '- Datenschutzerklärung bestätigt: Ja',
    '  Wortlaut: "Es gilt die Datenschutzerklärung der ibras® GmbH & Co. KG."',
    `- Kontakt-Einwilligung (weitere Ansprache erlaubt): ${kontakteinwilligung ? 'Ja' : 'Nein'}`,
    '  Wortlaut: "Ich bin außerdem damit einverstanden, dass ibras® mich gelegentlich per',
    '  E-Mail mit für mich relevanten Einschätzungen zum Maklermarkt kontaktiert. Ein',
    '  Widerruf ist jederzeit formlos möglich."',
  ].join('\n');

  const zeile = (label, wert) => `
    <tr>
      <td style="padding:7px 14px 7px 0; font-weight:bold; vertical-align:top; width:150px; border-bottom:1px solid #E4DFCF; color:#2C2C2C;">${escapeHtml(label)}</td>
      <td style="padding:7px 0; vertical-align:top; border-bottom:1px solid #E4DFCF; color:#2C2C2C;">${wert}</td>
    </tr>`;

  const nachrichtHtml = nachricht
    ? escapeHtml(nachricht).replace(/\n/g, '<br>')
    : '–';

  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#2C2C2C; max-width:600px; margin:0 auto;">
    <h2 style="color:#5E8C20; font-size:18px; margin:0 0 18px;">Neue Anfrage über orientierungsberatung.de</h2>
    <table style="border-collapse:collapse; width:100%; font-size:14px;">
      ${zeile('Anliegen', escapeHtml(anliegen || '–'))}
      ${zeile('Name', `<strong>${escapeHtml(name)}</strong>`)}
      ${zeile('E-Mail', `<a href="mailto:${escapeHtml(email)}" style="color:#5E8C20;">${escapeHtml(email)}</a>`)}
      ${zeile('Telefon', escapeHtml(telefon || '–'))}
    </table>

    <h3 style="font-size:15px; margin:24px 0 8px;">Nachricht</h3>
    <p style="margin:0; padding:12px 14px; background:#FAF7F0; border-left:3px solid #7DB72F; font-size:14px; line-height:1.5;">${nachrichtHtml}</p>

    <h3 style="font-size:15px; margin:24px 0 8px;">Einwilligungen</h3>
    <table style="border-collapse:collapse; width:100%; font-size:13px; color:#555555;">
      ${zeile('Datenschutzerklärung bestätigt', '<strong>Ja</strong>')}
      ${zeile('Kontakt-Einwilligung (weitere Ansprache)', `<strong>${kontakteinwilligung ? 'Ja' : 'Nein'}</strong>`)}
      ${zeile('Bestätigt am', `${escapeHtml(zeitpunkt)} Uhr`)}
      ${zeile('IP-Adresse', escapeHtml(ipAdresse))}
    </table>
    <p style="font-size:12px; color:#8A8A85; margin-top:14px; line-height:1.5;">
      Wortlaut Datenschutz-Häkchen: „Es gilt die Datenschutzerklärung der ibras® GmbH &amp; Co. KG."<br><br>
      Wortlaut Kontakt-Häkchen: „Ich bin außerdem damit einverstanden, dass ibras® mich gelegentlich per E-Mail mit für mich relevanten Einschätzungen zum Maklermarkt kontaktiert. Ein Widerruf ist jederzeit formlos möglich."
    </p>
  </div>`;

  try {
    await transporter.sendMail({
      from: `"ibras® Orientierungsberatung" <${process.env.STRATO_SMTP_USER}>`,
      to: EMPFAENGER,
      replyTo: `"${name}" <${email}>`,
      subject: `Neue Anfrage über orientierungsberatung.de${anliegen ? ': ' + anliegen : ''}`,
      text,
      html,
    });
  } catch (err) {
    console.error('Mailversand fehlgeschlagen:', err);
    res.status(502).send('Der Versand ist fehlgeschlagen. Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an: 038827 / 88868.');
    return;
  }

  res.writeHead(303, { Location: erfolgsUrl });
  res.end();
};
