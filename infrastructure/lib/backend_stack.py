from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_cognito as cognito,
    CfnOutput,
    Duration,
)
from constructs import Construct
from .data_stack import DataStack

class BackendStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, app_name: str, env_name: str, data_stack: DataStack, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # backend lambda function
        # We will bundle the backend folder (FastAPI application)
        backend_function = _lambda.Function(
            self,
            "BackendFunction",
            runtime=_lambda.Runtime.PYTHON_3_12,
            handler="main.handler",
            code=_lambda.Code.from_asset(
                path="../backend",
                bundling={
                    "image": _lambda.Runtime.PYTHON_3_12.bundling_image,
                    "command": [
                        "bash", "-c",
                        "pip install fastapi uvicorn pydantic boto3 python-dotenv mangum -t /asset-output && cp -R . /asset-output"
                    ]
                }
            ) if not self.node.try_get_context("local-dev") else _lambda.Code.from_asset("../backend"),
            environment={
                "SHOPS_TABLE": data_stack.shops_table.table_name,
                "REVIEWS_TABLE": data_stack.reviews_table.table_name,
                "AWS_REGION": self.region,
            },
            timeout=Duration.seconds(30),
            memory_size=512,
        )

        # Grant table permissions
        data_stack.shops_table.grant_read_write_data(backend_function)
        data_stack.reviews_table.grant_read_write_data(backend_function)

        # Import OIDC provider (mirroring video-agent)
        vercel_oidc_provider = iam.OpenIdConnectProvider.from_open_id_connect_provider_arn(
            self,
            "VercelOidcProvider",
            f"arn:aws:iam::{self.account}:oidc-provider/oidc.vercel.com/eric-bachs-projects"
        )

        # IAM Role for Vercel OIDC
        vercel_role = iam.Role(
            self,
            "VercelOidcRole",
            assumed_by=iam.OpenIdConnectPrincipal(
                open_id_connect_provider=vercel_oidc_provider,
                conditions={
                    "StringEquals": {
                        "oidc.vercel.com/eric-bachs-projects:aud": "https://vercel.com/eric-bachs-projects"
                    },
                    "StringLike": {
                        "oidc.vercel.com/eric-bachs-projects:sub": f"owner:eric-bachs-projects:project:{app_name}:*"
                    }
                }
            ),
            role_name=f"{app_name}-vercel-oidc-role-{env_name}"
        )

        # Grant invoke permissions to the Vercel role
        backend_function.grant_invoke(vercel_role)

        # Cognito User Pool
        user_pool = cognito.UserPool(
            self,
            "UserPool",
            user_pool_name=f"{app_name}-user-pool-{env_name}",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
        )

        # User Pool Client
        user_pool_client = cognito.UserPoolClient(
            self,
            "UserPoolClient",
            user_pool=user_pool,
            auth_flows=cognito.AuthFlow(
                user_password=True
            )
        )

        # Outputs
        CfnOutput(
            self,
            "BackendFunctionArn",
            value=backend_function.function_arn,
            description="The ARN of the backend Lambda function"
        )

        CfnOutput(
            self,
            "VercelRoleArn",
            value=vercel_role.role_arn,
            description="The IAM Role ARN for Vercel OIDC"
        )

        CfnOutput(
            self,
            "UserPoolId",
            value=user_pool.user_pool_id,
            description="The Cognito User Pool ID"
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value=user_pool_client.user_pool_client_id,
            description="The Cognito User Pool Client ID"
        )
