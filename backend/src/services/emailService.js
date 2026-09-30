/**
 * Envia o e-mail contendo o código de validação via API HTTPS do Brevo
 * @param {string} toEmail - E-mail do usuário cadastrado
 * @param {string} code - Código gerado pelo seu sistema
 */
async function sendVerificationCode(toEmail, code) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Sistema Condomínio', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject: 'Código de Confirmação - Cadastro no Condomínio',
      htmlContent: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Seja bem-vindo ao Sistema do Condomínio!</h2>
        <p>Seu código de verificação para ativar a conta é:</p>
        <h1 style="color: #2b6cb0; letter-spacing: 4px;">${code}</h1>
        <p>Se você não solicitou este cadastro, desconsidere esta mensagem.</p>
      </div>
    `,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao enviar e-mail (Brevo ${response.status}): ${text}`);
  }

  return await response.json();
}

module.exports = { sendVerificationCode };
