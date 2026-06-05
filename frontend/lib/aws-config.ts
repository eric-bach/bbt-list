import { awsCredentialsProvider } from '@vercel/oidc-aws-credentials-provider';

/**
 * Returns the appropriate AWS credentials provider based on the environment.
 * 1. If AWS_ROLE_ARN is set, it uses Vercel's OIDC provider (for production).
 * 2. Otherwise, it falls back to static environment variables (for local development).
 */
export function getAwsCredentials() {
  const roleArn = process.env.AWS_ROLE_ARN;

  // Only use Vercel OIDC provider if running in Vercel environment
  if (roleArn && process.env.VERCEL === '1') {
    return awsCredentialsProvider({
      roleArn: roleArn,
    });
  }

  // Returning undefined allows the AWS SDK to fall back to its default
  // credential provider chain (env vars, ~/.aws/credentials, etc.)
  return undefined;
}

export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
