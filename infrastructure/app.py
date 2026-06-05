#!/usr/bin/env python3
import os
import aws_cdk as cdk
from lib.data_stack import DataStack
from lib.backend_stack import BackendStack

app = cdk.App()

APP_NAME = 'bbt-list'
ENV_NAME = os.environ.get('ENV_NAME', 'dev')

target_env = cdk.Environment(
    account=os.environ.get('CDK_DEFAULT_ACCOUNT'),
    region=os.environ.get('CDK_DEFAULT_REGION')
)

data = DataStack(app, f"{APP_NAME}-data", 
    app_name=APP_NAME,
    env_name=ENV_NAME,
    env=target_env
)

BackendStack(app, f"{APP_NAME}-backend",
    app_name=APP_NAME,
    env_name=ENV_NAME,
    data_stack=data,
    env=target_env
)

app.synth()
