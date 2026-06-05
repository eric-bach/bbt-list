from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct

class DataStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, app_name: str, env_name: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # DynamoDB Table for Shops
        self.shops_table = dynamodb.Table(
            self,
            "ShopsTable",
            table_name=f"{app_name}-shops-{env_name}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY, # MVP/Dev environment
        )

        # DynamoDB Table for Reviews
        self.reviews_table = dynamodb.Table(
            self,
            "ReviewsTable",
            table_name=f"{app_name}-reviews-{env_name}",
            partition_key=dynamodb.Attribute(
                name="shopId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY, # MVP/Dev environment
        )

        # Outputs
        CfnOutput(
            self,
            "ShopsTableName",
            value=self.shops_table.table_name,
            description="DynamoDB Table Name for Bubble Tea Shops",
            export_name=f"{app_name}-shops-table-name"
        )

        CfnOutput(
            self,
            "ReviewsTableName",
            value=self.reviews_table.table_name,
            description="DynamoDB Table Name for Reviews",
            export_name=f"{app_name}-reviews-table-name"
        )
