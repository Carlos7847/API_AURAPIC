export const verifyEmailTemplate = (url: string) => `
  <div style="font-family: sans-serif; padding: 20px;">
    <h1>¡Bienvenido!</h1>
    <p>Para activar tu cuenta, por favor verifica tu correo electrónico:</p>
    <a href="${url}" style="background: green; color: white; padding: 10px; text-decoration: none; border-radius: 5px;">
      Verificar Email
    </a>
    <p>Este enlace expira en 24 horas.</p>
  </div>
`;
