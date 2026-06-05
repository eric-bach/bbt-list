import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { NextRequest } from 'next/server';

type CognitoJwtPayload = JWTPayload & {
  token_use?: string;
  aud?: string;
  client_id?: string;
  email?: string;
  'cognito:username'?: string;
};

export class AuthenticationError extends Error {}

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getCognitoConfig() {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || process.env.COGNITO_USER_POOL_ID;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || process.env.COGNITO_CLIENT_ID;

  if (!userPoolId || !clientId) {
    throw new Error('Missing Cognito configuration: COGNITO_USER_POOL_ID or COGNITO_CLIENT_ID');
  }

  const [region] = userPoolId.split('_');
  if (!region) {
    throw new Error('Invalid Cognito user pool id');
  }

  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  return { clientId, issuer };
}

function getJwks(issuer: string) {
  const cached = jwksByIssuer.get(issuer);
  if (cached) {
    return cached;
  }

  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  jwksByIssuer.set(issuer, jwks);
  return jwks;
}

function getBearerToken(req: NextRequest | Request): string | null {
  const authorization = req.headers.get('authorization')?.trim();
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(/\s+/, 2);
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export async function getAuthenticatedUser(req: NextRequest | Request): Promise<{ email: string; username: string } | null> {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const { clientId, issuer } = getCognitoConfig();
  let payload: JWTPayload;

  try {
    ({ payload } = await jwtVerify(token, getJwks(issuer), {
      issuer,
    }));
  } catch (error: any) {
    console.error('JWT Verification failed:', error);
    throw new AuthenticationError('Invalid Cognito token');
  }

  const claims = payload as CognitoJwtPayload;

  // We accept either ID or Access tokens. For ID token:
  if (claims.token_use === 'id' && claims.aud !== clientId) {
    throw new AuthenticationError('Invalid Cognito audience');
  }
  // For Access token:
  if (claims.token_use === 'access' && claims.client_id !== clientId) {
    throw new AuthenticationError('Invalid Cognito client_id');
  }

  const username = claims['cognito:username'] || (claims.sub as string);
  const email = claims.email || username;

  return { email, username };
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}
