import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { SqsSubscription } from "aws-cdk-lib/aws-sns-subscriptions";
import { ProductFinderSchedulerSns } from "./productfinder-scheduler-sns";
import { ProductFinderSchedulerSqs } from "./productfinder-scheduler-sqs";
import { ProductFinderSchedulerDynamodb } from "./productfinder-scheduler-dynamodb";
import { ProductFinderSchedulerLambda } from "./productfinder-scheduler-lambda";
import { ProductFinderSchedulerApi } from "./productfinder-scheduler-api";

export class ProductFinderSchedulerStack extends Stack {
  constructor(scope: Construct, id: string, config: any, props?: StackProps) {
    super(scope, id, props);
    // sns
    const schedulerSns = new ProductFinderSchedulerSns(this, "launchProductFinderSchedulerTopicConstruct");
    //sqs
    const schedulerSqs = new ProductFinderSchedulerSqs(this, "launchProductFinderSchedulerQueueConstruct");
    //add subscribe
    schedulerSns.topic.addSubscription(new SqsSubscription(schedulerSqs.queue));
    //dynamodb(user table)
    const schedulerDynamodb = new ProductFinderSchedulerDynamodb(this, "launchProductFinderSchedulerDynamodbConstruct");
    //lambda
    const lambdaStack = new ProductFinderSchedulerLambda(
      this,
      "launchProductFinderSchedulerLambdaConstruct",
      schedulerDynamodb.tableName,
      schedulerSns.topic.topicArn,
      config
    );
    //add api gateway
    const apiStack = new ProductFinderSchedulerApi(
      this,
      "launchProductFinderSchedulerApiConstruct",
      lambdaStack.lambda,
    );
  }
}
