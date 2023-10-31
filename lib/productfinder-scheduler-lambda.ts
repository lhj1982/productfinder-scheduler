import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";

export class ProductFinderSchedulerLambda extends Construct {
  public readonly findLambda: Function;

  public readonly productLambda: Function;

  constructor(scope: Construct, id: string, allowUserTableName: string, topicArn: string, config: any) {
    super(scope, id);
    //role arn
    const productFinderRoleArn = `arn:aws-cn:iam::${config.account}:role/launch-productfinder-role`;
    this.findLambda = new Function(this, "launchProductFinderFindLambda", {
      functionName: "launch-productfinder-find-lambda",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("src/create-entry/lib"),
      handler: "index.handler",
      role: Role.fromRoleArn(this, "existingFindLambdaRole", productFinderRoleArn),
      description: "Initialize a productFinder automation request",
      environment: {
        ALLOWEDUSERS_TABLE_NAME: allowUserTableName,
        TOPIC_ARN: topicArn,
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });

    this.productLambda = new Function(this, "launchProductFinderProductLambda", {
      functionName: "launch-productfinder-product-lambda",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("src/create-product/lib"),
      handler: "index.handler",
      role: Role.fromRoleArn(this, "existingProductLambdaRole", productFinderRoleArn),
      description: "add/remove the product in automation progress of product finder",
      environment: {
        ALLOWEDUSERS_TABLE_NAME: allowUserTableName,
        MYSQL_HOST: config.mysqlHost,
        MYSQL_PORT: config.mysqlPort,
        MYSQL_USER: config.mysqlUser,
        MYSQL_PASSWORD: config.mysqlPassword,
        MYSQL_DATABASE: config.mysqlDatabase
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60)
    });
  }
}
