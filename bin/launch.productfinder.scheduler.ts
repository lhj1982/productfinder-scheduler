#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import config from '../config';
import {ProductFinderSchedulerSnsStack} from "../lib/productfinder-scheduler-sns-stack";
import {ProductFinderSchedulerSqsStack} from "../lib/productfinder-scheduler-sqs-stack";
import {SqsSubscription} from "aws-cdk-lib/aws-sns-subscriptions";

const app = new cdk.App();

const envProps = {
    env : {
        account : config.AWS_ACCOUNT,
        region : config.AWS_REGION
    }
}
// sns
const snsStack = new ProductFinderSchedulerSnsStack(app,
    `LaunchProductFinderSchedulerSnsStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    envProps);
//sqs
const sqsStack = new ProductFinderSchedulerSqsStack(app,
    `LaunchProductFinderSchedulerSqsStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    envProps);
//add subscribe
snsStack.topic.addSubscription(new SqsSubscription(sqsStack.queue));
//todo add fargate
//todo add lambda


