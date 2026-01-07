export const resetPasswordTemplate = (url: string) => `
  <div style="font-family: sans-serif; padding: 20px;">
    <h1>Recupera tu acceso</h1>
    <p>Haz clic abajo para resetear tu password:</p>
    <a href="${url}" style="background: blue; color: white; padding: 10px;">Reset Password</a>
  </div>
`;
