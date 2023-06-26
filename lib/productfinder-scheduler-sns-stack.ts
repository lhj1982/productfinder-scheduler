import {Construct} from "constructs";
import {Stack, StackProps} from "aws-cdk-lib";
import {Topic} from "aws-cdk-lib/aws-sns";

export class ProductFinderSchedulerSnsStack extends Stack {

    public readonly topic: Topic

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
        //create sns
        this.topic = new Topic(this, 'launchProductFinderSchedulerTopic',{
            topicName : 'launch-productfinder-scheduler-topic'
        });
    }
}
