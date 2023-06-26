#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import config from '../config';
import {ProductFinderSchedulerSnsStack} from "../lib/productfinder-scheduler-sns-stack";
import {ProductFinderSchedulerSqsStack} from "../lib/productfinder-scheduler-sqs-stack";
import {SqsSubscription} from "aws-cdk-lib/aws-sns-subscriptions";
import {ProductFinderSchedulerDynamodbStack} from "../lib/productfinder-scheduler-dynamodb-stack";
import {ProductFinderSchedulerLambdaStack} from "../lib/productfinder-scheduler-lambda-stack";
import {ProductFinderSchedulerApiStack} from "../lib/productfinder-scheduler-api-stack";

const app = new cdk.App();

const envProps = {
    env : {
        account : config.AWS_ACCOUNT,
        region : config.AWS_REGION
    }
}
// sns
const snsStack = new ProductFinderSchedulerSnsStack(app,
    `launchProductFinderSchedulerSnsStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    envProps);
//sqs
const sqsStack = new ProductFinderSchedulerSqsStack(app,
    `launchProductFinderSchedulerSqsStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    envProps);
//add subscribe
snsStack.topic.addSubscription(new SqsSubscription(sqsStack.queue));
//dynamodb(user table)
const dynamodbStack = new ProductFinderSchedulerDynamodbStack(app,
    `launchProductFinderSchedulerDynamodbStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    envProps);
//lambda
const lambdaStack = new ProductFinderSchedulerLambdaStack(app,
    `launchProductFinderSchedulerLambdaStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    dynamodbStack.allowUserTable.tableName,
    snsStack.topic.topicArn,
    envProps);
//add api gateway
const apiStack = new ProductFinderSchedulerApiStack(app,
    `launchProductFinderSchedulerApiStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    lambdaStack.lambda,
    envProps);




