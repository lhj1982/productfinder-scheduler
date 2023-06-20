import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

// export interface ISchedulerSQSProps {
//   * the function for which we want to count url hits *
// }

export class SchedulerSQS extends Construct {
  public topic: sns.Topic;
  public queue: sqs.Queue;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    // 👇 create queue
    this.queue = new sqs.Queue(this, 'SchedulerSQS');

    // 👇 create sns topic
    this.topic = new sns.Topic(this, 'SchedulerTopic');

    // 👇 subscribe queue to topic
    this.topic.addSubscription(new subs.SqsSubscription(this.queue));
  }
}
