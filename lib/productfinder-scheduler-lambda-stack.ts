import {Stack, StackProps} from "aws-cdk-lib";
import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam";

export class ProductFinderSchedulerLambdaStack extends Stack {

    public readonly lambda:Function;

    constructor(scope: Construct,
                id: string,
                allowUserTableName : string,
                topicArn : string,
                prop?: StackProps,) {
        super(scope, id, prop);

        this.lambda = new Function(this, 'launchProductFinderSchedulerLambda', {
            functionName : 'launch-productfinder-scheduler-lambda',
            runtime : Runtime.NODEJS_16_X,
            code: Code.fromAsset('src/create-entry/lib'),
            handler: 'index.handler',
            role : Role.fromRoleName(this, 'existingLaunchProductRole', 'launch-productfinder-role'),
            description: 'Initialize a productFinder automation request',
            environment: {
                ALLOWEDUSERS_TABLE_NAME: allowUserTableName,
                PRIMARY_KEY: 'itemId',
                TOPIC_ARN: topicArn,
            },
        })
    }
}
