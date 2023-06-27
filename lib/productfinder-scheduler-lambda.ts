import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam";
import {Fn} from "aws-cdk-lib";

export class ProductFinderSchedulerLambda extends Construct {

    public readonly lambda:Function;

    constructor(scope: Construct,
                id: string,
                allowUserTableName : string,
                topicArn : string) {
        super(scope, id);
        //role arn
        const productFinderRoleArn = Fn.importValue('ProductFinderRoleArn');
        this.lambda = new Function(this, 'launchProductFinderSchedulerLambda', {
            functionName : 'launch-productfinder-scheduler-lambda',
            runtime : Runtime.NODEJS_16_X,
            code: Code.fromAsset('src/create-entry/lib'),
            handler: 'index.handler',
            role : Role.fromRoleArn(this, 'existingSchedulerLambdaRole', productFinderRoleArn),
            description: 'Initialize a productFinder automation request',
            environment: {
                ALLOWEDUSERS_TABLE_NAME: allowUserTableName,
                PRIMARY_KEY: 'itemId',
                TOPIC_ARN: topicArn,
            },
        })
    }
}
