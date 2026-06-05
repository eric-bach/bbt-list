import { NextRequest, NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { getAwsCredentials, AWS_REGION } from '@/lib/aws-config';
import { getAuthenticatedUser, isAuthenticationError } from '@/lib/server-auth';

let lambdaClient: LambdaClient | null = null;
function getLambdaClient() {
  if (!lambdaClient) {
    lambdaClient = new LambdaClient({
      region: AWS_REGION,
      credentials: getAwsCredentials(),
    });
  }
  return lambdaClient;
}

const FUNCTION_NAME =
  process.env.BACKEND_LAMBDA_FUNCTION_NAME || 'bbt-list-BackendFunction-dev';

async function handleRequest(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const resolvedParams = await params;
    const pathParts = resolvedParams.path || [];
    const path = pathParts.join('/');

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();

    let bodyText = '';
    let authenticatedUser: { email: string; username: string } | null = null;

    // Secure POST requests
    if (req.method === 'POST') {
      try {
        authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) {
          return NextResponse.json(
            { error: 'Unauthorized: Missing token' },
            { status: 401 },
          );
        }
      } catch (error) {
        if (isAuthenticationError(error)) {
          return NextResponse.json(
            { error: `Unauthorized: ${error.message}` },
            { status: 401 },
          );
        }
        throw error;
      }

      // Read body and inject/override author field with verified email
      const rawBody = await req.text();
      if (rawBody) {
        try {
          const bodyObj = JSON.parse(rawBody);
          // If review payload, set author to authenticated user's email
          bodyObj.author = authenticatedUser.email;
          bodyText = JSON.stringify(bodyObj);
        } catch {
          bodyText = rawBody;
        }
      }
    } else {
      if (req.method === 'PUT' || req.method === 'PATCH') {
        bodyText = await req.text();
      }
    }

    // Construct the API Gateway V2 Proxy Event payload
    const event = {
      version: '2.0',
      routeKey: '$default',
      rawPath: `/api/${path}`,
      rawQueryString: queryString,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      requestContext: {
        http: {
          method: req.method,
          path: `/api/${path}`,
          protocol: 'HTTP/1.1',
          sourceIp:
            req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            '127.0.0.1',
          userAgent: req.headers.get('user-agent') || 'vercel-route-handler',
        },
      },
      body: bodyText,
      isBase64Encoded: false,
    };

    const client = getLambdaClient();
    const command = new InvokeCommand({
      FunctionName: FUNCTION_NAME,
      Payload: Buffer.from(JSON.stringify(event)),
    });

    const response = await client.send(command);
    if (!response.Payload) {
      return NextResponse.json(
        { error: 'Empty response from backend Lambda' },
        { status: 500 },
      );
    }

    const resultText = Buffer.from(response.Payload).toString('utf-8');
    const result = JSON.parse(resultText);

    // API Gateway format contains statusCode, headers, and body
    const statusCode = result.statusCode || 200;
    const responseBody = result.body ? JSON.parse(result.body) : {};

    return NextResponse.json(responseBody, { status: statusCode });
  } catch (error: any) {
    console.error('Error proxying request to Lambda:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return handleRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  return handleRequest(req, context);
}
