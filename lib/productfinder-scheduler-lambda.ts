import { Construct } from "constructs";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Role } from "aws-cdk-lib/aws-iam";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class ProductFinderSchedulerLambda extends Construct {
  public readonly schedulerLambda: Function;
  public readonly productLambda : Function;

  constructor(scope: Construct, id: string, allowUserTableName: string, topicArn: string, config: any) {
    super(scope, id);
    //role arn
    const productFinderRoleArn = `arn:aws-cn:iam::${config.account}:role/launch-productfinder-role`;
    //scheduler lambda
    this.schedulerLambda = new Function(this, "launchProductFinderSchedulerLambda", {
      functionName: "launch-productfinder-scheduler-lambda",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("src/create-entry/lib"),
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
    //product lambda
    const vpc = ec2.Vpc.fromVpcAttributes(this, "productLambdaVpc", {
      vpcId: config.mysqlVpc,
      availabilityZones: ["cn-northwest-1"],
      privateSubnetIds: config.mysqlSubnet
    });
    const securityGroups = config.mysqlSgs.map((sgId: string) => {
      return ec2.SecurityGroup.fromSecurityGroupId(this, `productLambda-${sgId}`, sgId);
    });
    this.productLambda = new Function(this, "launchProductFinderProductLambda", {
      functionName: "launch-productfinder-product-lambda",
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset("src/create-product/lib"),
      handler: "index.handler",
      role: Role.fromRoleArn(this, "existingProductLambdaRole", productFinderRoleArn),
      description: "add/remove the product in automation progress of product finder",
      environment: {
        MYSQL_HOST: config.mysqlHost,
        MYSQL_PORT: config.mysqlPort,
        MYSQL_USER: config.mysqlUser,
        MYSQL_PASSWORD: config.mysqlPassword,
        MYSQL_DATABASE: config.mysqlDatabase
      },
      logRetention: RetentionDays.ONE_WEEK,
      timeout: cdk.Duration.seconds(60),
      vpc: vpc,
      securityGroups: securityGroups
    });
  }
}
