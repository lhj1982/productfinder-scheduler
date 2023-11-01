import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import * as cdk from 'aws-cdk-lib';

export class ProductFinderSchedulerEventBridges extends Construct {

    constructor(scope: Construct, id: string, config: any, url: any) {
        super(scope, id);
        // import the role of product finder
        const roleArn = `arn:aws-cn:iam::${config.account}:role/launch-productfinder-role`;
        const productFinderAutoExecutor = new Function(this, 'productFinderAutoExecutor', {
            functionName: 'launch-productfinder-autoExecutor',
            code: Code.fromAsset('src/auto-executor/lib'),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_16_X,
            environment: {
                URL: `${url}find`,
                MYSQL_HOST: config.mysqlHost,
                MYSQL_PORT: config.mysqlPort,
                MYSQL_USER: config.mysqlUser,
                MYSQL_PASSWORD: config.mysqlPassword,
                MYSQL_DATABASE: config.mysqlDatabase
            },
            description: 'a scheduler lambda of periodic searching',
            role : Role.fromRoleArn(this, 'existingAutoExecutorRole',roleArn),
            logRetention : RetentionDays.ONE_WEEK,
            timeout: cdk.Duration.seconds(60)
        });

        const rule = new Rule(this, 'productFinderAutoExecutorRule', {
            ruleName : 'productFinderAutoExecutorRule',
            schedule: Schedule.cron({ minute: '0', hour: '1'}),
            targets : [new LambdaFunction(productFinderAutoExecutor)]
        });
    }
}
