import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";
import {
  EndpointType,
  LambdaIntegration,
  RestApi
} from "aws-cdk-lib/aws-apigateway";

export class ProductFinderSchedulerApi extends Construct {

  public readonly api: RestApi;

  constructor(scope: Construct, id: string, lambdaFunction: Function) {
    super(scope, id);
    const api = new RestApi(this, "launchProductFinderSchedulerRestApi", {
      restApiName: "launch-productfinder-scheduler-restApi",
      endpointConfiguration: {
        types: [EndpointType.REGIONAL]
      }
    });
    const schedulerResource = api.root.addResource("find");
    // the find resource
    schedulerResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    // the crawler resource
    const crawlerResource = api.root.addResource("crawler");
    crawlerResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    // the api of add/remove products resource
    const addResource = api.root.addResource("add_products");
    addResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    const removeResource = api.root.addResource("remove_products");
    removeResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    this.api = api;
  }
}
