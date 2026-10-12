/**
 * DocuVault - Cognito Authentication Helper
 * Native browser implementation for AWS Cognito User Pool authentication.
 * Uses public Cognito IDP JSON endpoints (no heavy SDK required).
 */

const REGION = import.meta.env.VITE_COGNITO_REGION || 'ap-southeast-2';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const COGNITO_ENDPOINT = `https://cognito-idp.${REGION}.amazonaws.com/`;

export interface CognitoUserSession {
  userId: string;
  email: string;
  name: string;
  isAdmin: boolean;
  idToken: string;
  accessToken: string;
  refreshToken?: string;
}

/**
 * Decode base64url JWT payload
 */
export function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse JWT:', e);
    return null;
  }
}

/**
 * Send request to Cognito IDP
 */
async function cognitoRequest(target: string, payload: Record<string, any>) {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMsg = data.message || data.__type || 'Cognito authentication failed';
    throw new Error(errorMsg);
  }
  return data;
}

/**
 * Log in using USER_PASSWORD_AUTH
 */
export async function cognitoLogin(email: string, password: string): Promise<CognitoUserSession> {
  if (!CLIENT_ID) {
    throw new Error('VITE_COGNITO_CLIENT_ID is not configured in .env');
  }

  const result = await cognitoRequest('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const authResult = result.AuthenticationResult;
  if (!authResult || !authResult.IdToken) {
    throw new Error('Authentication did not return valid tokens.');
  }

  const payload = decodeJwtPayload(authResult.IdToken);
  if (!payload) {
    throw new Error('Failed to decode user identity from ID token.');
  }

  const groups = Array.isArray(payload['cognito:groups'])
    ? payload['cognito:groups']
    : (payload['cognito:groups'] ? [payload['cognito:groups']] : []);
  const isAdmin = groups.some((g: string) => ['admin', 'admins'].includes(g.toLowerCase()));

  return {
    userId: payload.sub,
    email: payload.email || email,
    name: payload.name || payload.email?.split('@')[0] || 'Student',
    isAdmin,
    idToken: authResult.IdToken,
    accessToken: authResult.AccessToken,
    refreshToken: authResult.RefreshToken,
  };
}

/**
 * Register a new student account
 */
export async function cognitoSignUp(email: string, password: string, name: string): Promise<{ userSub: string; confirmed: boolean }> {
  if (!CLIENT_ID) {
    throw new Error('VITE_COGNITO_CLIENT_ID is not configured in .env');
  }

  const result = await cognitoRequest('SignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
    ],
  });

  return {
    userSub: result.UserSub,
    confirmed: Boolean(result.UserConfirmed),
  };
}

/**
 * Confirm user email with verification code
 */
export async function cognitoConfirmSignUp(email: string, code: string): Promise<void> {
  if (!CLIENT_ID) throw new Error('VITE_COGNITO_CLIENT_ID is not configured in .env');
  await cognitoRequest('ConfirmSignUp', {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}
