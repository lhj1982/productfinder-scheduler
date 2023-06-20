import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import {
  RestApi,
  LambdaIntegration,
  IResource,
  MockIntegration,
  PassthroughBehavior,
  EndpointType,
} from 'aws-cdk-lib/aws-apigateway';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Table, ITable } from 'aws-cdk-lib/aws-dynamodb';
import { SchedulerSQS } from './sqs';
// import config from '../config';

export class LaunchProductfinderSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const schedulerSQS = new SchedulerSQS(this, 'ProductFinderSchedulerSQS');

    const ProductFinderProductsTableArn = cdk.Fn.importValue('ProductFinderProductsTableArn');
    const productFinderProductsTable: ITable = Table.fromTableArn(
      this,
      'ProductFinderProductsTable',
      ProductFinderProductsTableArn,
    );
    const ProductFinderAllowedUsersTableArn = cdk.Fn.importValue('ProductFinderAllowedUsersTableArn');
    const productFinderAllowedUsersTable: ITable = Table.fromTableArn(
      this,
      'ProductFinderAllowedUsersTable',
      ProductFinderAllowedUsersTableArn,
    );

    const createEntryLambda = new Function(this, 'createProductFinderEntryLambda', {
      code: Code.fromAsset('src/create-entry/lib'),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_16_X,
      environment: {
        TABLE_NAME: productFinderProductsTable.tableName,
        ALLOWEDUSERS_TABLE_NAME: productFinderAllowedUsersTable.tableName,
        PRIMARY_KEY: 'itemId',
        TOPIC_ARN: schedulerSQS.topic.topicArn,
      },
      description: 'Initialize a productFinder automation request',
    });

    productFinderProductsTable.grantReadWriteData(createEntryLambda);
    productFinderAllowedUsersTable.grantReadWriteData(createEntryLambda);
    const sqsStatement = new iam.PolicyStatement();
    sqsStatement.addActions('SNS:Publish');
    sqsStatement.addResources(schedulerSQS.topic.topicArn);
    createEntryLambda.addToRolePolicy(sqsStatement);

    const api = new RestApi(this, 'ProductFinderSchedulerApi', {
      restApiName: 'ProductFinder Scheduler Service',
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
    });

    const scheduler = api.root.addResource('scheduler');
    const createEntryIntegration = new LambdaIntegration(createEntryLambda);
    scheduler.addMethod('POST', createEntryIntegration);

    addCorsOptions(scheduler);

    // 👇 create an Output
    new cdk.CfnOutput(this, 'ProductFinderSchedulerSQSArn', {
      value: schedulerSQS.queue.queueArn,
      description: 'The arn name of scheduler sqs queue',
      exportName: 'ProductFinderSchedulerSQSArn',
    });
  }
}

export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod(
    'OPTIONS',
    new MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers':
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
          },
        },
      ],
      passthroughBehavior: PassthroughBehavior.NEVER,
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
    }),
    {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    },
  );
}
