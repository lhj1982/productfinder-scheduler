import {Construct} from "constructs";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Role} from "aws-cdk-lib/aws-iam";
import {RetentionDays} from "aws-cdk-lib/aws-logs";
import {Rule, Schedule} from "aws-cdk-lib/aws-events";
import {LambdaFunction} from "aws-cdk-lib/aws-events-targets";
import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class ProductFinderSchedulerEventBridges extends Construct {

    constructor(scope: Construct, id: string, config: any, url: any) {
        super(scope, id);
        // import the role of product finder
        const roleArn = `arn:aws-cn:iam::${config.account}:role/launch-productfinder-role`;
        const vpc = ec2.Vpc.fromVpcAttributes(this, "autoExecutorVpc", {
            vpcId: config.mysqlVpc,
            availabilityZones: ["cn-northwest-1"],
            privateSubnetIds: config.mysqlSubnet
        });
        const securityGroups = config.mysqlSgs.map((sgId: string) => {
            return ec2.SecurityGroup.fromSecurityGroupId(this, `autoExecutor-${sgId}`, sgId);
        });
        const productFinderAutoExecutor = new Function(this, 'productFinderAutoExecutor', {
            functionName: 'launch-productfinder-autoExecutor',
            code: Code.fromAsset('src/auto-executor/lib'),
            handler: 'index.handler',
            runtime: Runtime.NODEJS_16_X,
            environment: {
                URL: `${url}crawler`,
                MYSQL_HOST: config.mysqlHost,
                MYSQL_PORT: config.mysqlPort,
                MYSQL_USER: config.mysqlUser,
                MYSQL_PASSWORD: config.mysqlPassword,
                MYSQL_DATABASE: config.mysqlDatabase,
                PAGE_SIZE : config.pageSize
            },
            description: 'a scheduler lambda of periodic searching',
            role: Role.fromRoleArn(this, 'existingAutoExecutorRole', roleArn),
            logRetention: RetentionDays.ONE_WEEK,
            timeout: cdk.Duration.seconds(15 * 60),
            vpc: vpc,
            securityGroups: securityGroups
        });

        const rule = new Rule(this, 'productFinderAutoExecutorRule', {
            ruleName: 'productFinderAutoExecutorRule',
            schedule: Schedule.cron({minute: '0/10'}),
            targets: [new LambdaFunction(productFinderAutoExecutor)]
        });
    }
}
