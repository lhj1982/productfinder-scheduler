import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import {Queue} from "aws-cdk-lib/aws-sqs";
import {Stack} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";

// export interface ISchedulerSQSProps {
//   * the function for which we want to count url hits *
// }

export class ProductFinderSchedulerSqsStack extends Stack {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //create sqs
    this.queue = new Queue(this, 'launchProductFinderSchedulerQueue', {
      queueName : 'launch-product-finder-scheduler-queue'
    });
  }
}
