import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";

export class ProductFinderSchedulerLambda extends Construct {
  public readonly lambda: Function;

  constructor(scope: Construct, id: string, allowUserTableName: string, topicArn: string, config: any) {
    super(scope, id);
    //role arn
    const productFinderRoleArn = `arn:aws-cn:iam::${config.account}:role/launch-productfinder-role`;
    this.lambda = new Function(this, "launchProductFinderSchedulerLambda", {
      functionName: "launch-productfinder-scheduler-lambda",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("src/slack-command/lib"),
      handler: "index.handler",
      role: Role.fromRoleArn(this, "existingSchedulerLambdaRole", productFinderRoleArn),
      description: "Initialize a productFinder automation request",
      environment: {
        ALLOWEDUSERS_TABLE_NAME: allowUserTableName,
        TOPIC_ARN: topicArn,
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
  }
}
