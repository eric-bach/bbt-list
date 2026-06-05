const USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

async function callCognito(target: string, body: Record<string, any>) {
  const url = `https://cognito-idp.${AWS_REGION}.amazonaws.com/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Cognito authentication request failed');
  }
  return data;
}

export async function signUp(email: string, password: string) {
  if (!USER_POOL_CLIENT_ID) throw new Error('Missing NEXT_PUBLIC_COGNITO_CLIENT_ID configuration');
  return callCognito('SignUp', {
    ClientId: USER_POOL_CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: 'email', Value: email }],
  });
}

export async function confirmSignUp(email: string, code: string) {
  if (!USER_POOL_CLIENT_ID) throw new Error('Missing NEXT_PUBLIC_COGNITO_CLIENT_ID configuration');
  return callCognito('ConfirmSignUp', {
    ClientId: USER_POOL_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

export async function signIn(email: string, password: string) {
  if (!USER_POOL_CLIENT_ID) throw new Error('Missing NEXT_PUBLIC_COGNITO_CLIENT_ID configuration');
  const result = await callCognito('InitiateAuth', {
    ClientId: USER_POOL_CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  
  return {
    accessToken: result.AuthenticationResult.AccessToken,
    idToken: result.AuthenticationResult.IdToken,
    refreshToken: result.AuthenticationResult.RefreshToken,
    expiresIn: result.AuthenticationResult.ExpiresIn,
  };
}
