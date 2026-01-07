export interface TokenPayload {
  sub: string; // Subject (ID del usuario)
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export abstract class TokenServicePort {
  abstract generateTokens(payload: TokenPayload): Promise<TokenResponse>;
  abstract verifyToken(token: string): Promise<TokenPayload>;
}
