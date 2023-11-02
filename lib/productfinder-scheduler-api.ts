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
    // the crawl resource
    schedulerResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    // the api of add/remove products resource
    const addResource = api.root.addResource("addProducts");
    addResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    const removeResource = api.root.addResource("removeProducts");
    removeResource.addMethod("POST", new LambdaIntegration(lambdaFunction));
    this.api = api;
  }
}
