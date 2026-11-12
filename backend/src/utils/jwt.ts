import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtAccessSecret, options);
};

export const signRefreshToken = (payload: RefreshTokenPayload): string => {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.jwtRefreshSecret, options);
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

