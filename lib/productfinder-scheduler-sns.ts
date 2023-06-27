import {Construct} from "constructs";
import {Topic} from "aws-cdk-lib/aws-sns";

export class ProductFinderSchedulerSns extends Construct {

    public readonly topic: Topic

    constructor(scope: Construct, id: string) {
        super(scope, id);
        //create sns
        this.topic = new Topic(this, 'launchProductFinderSchedulerTopic',{
            topicName : 'launch-productfinder-scheduler-topic'
        });
    }
}
