import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import {Queue} from "aws-cdk-lib/aws-sqs";
import {Stack, StackProps} from "aws-cdk-lib";

export class ProductFinderSchedulerSqsStack extends Stack {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    //create sqs
    this.queue = new Queue(this, 'launchProductFinderSchedulerQueue', {
      queueName : 'launch-productfinder-scheduler-queue'
    });
  }
}
