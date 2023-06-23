import {Construct} from "constructs";
import {Stack} from "aws-cdk-lib";
import {Topic} from "aws-cdk-lib/aws-sns";
import * as cdk from "aws-cdk-lib";

export class ProductFinderSchedulerSnsStack extends Stack {

    public readonly topic: Topic

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        //create sns
        const topicName = 'launch-product-finder-scheduler-topic';
        this.topic = new Topic(this, 'launchProductFinderSchedulerTopic',{
            topicName : topicName
        });
    }
}
