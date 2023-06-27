import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import {Queue} from "aws-cdk-lib/aws-sqs";

export class ProductFinderSchedulerSqs extends Construct {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    //create sqs
    this.queue = new Queue(this, 'launchProductFinderSchedulerQueue', {
      queueName : 'launch-productfinder-scheduler-queue'
    });
  }
}
