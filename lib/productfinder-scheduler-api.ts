import {Construct} from "constructs";
import {Function} from "aws-cdk-lib/aws-lambda";
import {
    EndpointType,
    LambdaIntegration,
    MockIntegration,
    PassthroughBehavior,
    RestApi
} from "aws-cdk-lib/aws-apigateway";

export class ProductFinderSchedulerApi extends Construct {
    constructor(scope: Construct,
                id: string,
                lambdaFunction: Function) {
        super(scope, id);
        const api = new RestApi(this, 'launchProductFinderSchedulerApi', {
            restApiName : 'launch-productfinder-scheduler-api',
            endpointConfiguration: {
                types: [EndpointType.REGIONAL],
            },
        });
        const resource = api.root.addResource('scheduler');
        resource.addMethod('POST', new LambdaIntegration(lambdaFunction));
        resource.addMethod(
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
}
