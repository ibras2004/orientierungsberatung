const nodemailer = require('nodemailer');

const EMPFAENGER = 'info@ibras.de';
const SITE_URL = 'https://orientierungsberatung.de';

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

  if (!name || !email) {
    res.status(400).send('Name und E-Mail-Adresse sind erforderlich.');
    return;
  }

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
  ].join('\n');

  try {
    await transporter.sendMail({
      from: `"orientierungsberatung.de" <${process.env.STRATO_SMTP_USER}>`,
      to: EMPFAENGER,
      replyTo: `"${name}" <${email}>`,
      subject: `Neue Anfrage über orientierungsberatung.de${anliegen ? ': ' + anliegen : ''}`,
      text,
    });
  } catch (err) {
    console.error('Mailversand fehlgeschlagen:', err);
    res.status(502).send('Der Versand ist fehlgeschlagen. Bitte versuchen Sie es später erneut oder rufen Sie uns direkt an: 038827 / 88868.');
    return;
  }

  res.writeHead(303, { Location: erfolgsUrl });
  res.end();
};
