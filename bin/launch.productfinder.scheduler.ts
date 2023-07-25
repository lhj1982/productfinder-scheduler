#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import config from '../config';
import {ProductFinderSchedulerStack} from "../lib/productfinder-scheduler-stack";

const app = new cdk.App();

new ProductFinderSchedulerStack(app, `launch-productfinder-scheduler-stack`, config);



