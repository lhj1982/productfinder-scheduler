#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import config from '../config';
import {ProductFinderSchedulerStack} from "../lib/productfinder-scheduler-stack";

const app = new cdk.App();

new ProductFinderSchedulerStack(
    app,
    `launchProductFinderSchedulerStack-${config.AWS_ACCOUNT}-${config.AWS_REGION}`,
    {
        env: {
            account: config.AWS_ACCOUNT,
            region: config.AWS_REGION
        }
    }
);





