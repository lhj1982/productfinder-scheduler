import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";
import {
  EndpointType,
  LambdaIntegration,
  RestApi
} from "aws-cdk-lib/aws-apigateway";

export class ProductFinderSchedulerApi extends Construct {

  public readonly api: RestApi;

  constructor(scope: Construct, id: string, schedulerLambda: Function, productLambda: Function) {
    super(scope, id);
    const api = new RestApi(this, "launchProductFinderSchedulerRestApi", {
      restApiName: "launch-productfinder-scheduler-restApi",
      endpointConfiguration: {
        types: [EndpointType.REGIONAL]
      }
    });
    const schedulerResource = api.root.addResource("find");
    // the crawl resource
    schedulerResource.addMethod("POST", new LambdaIntegration(schedulerLambda));
    // the api of add/remove products resource
    const addResource = api.root.addResource("add_products");
    addResource.addMethod("POST", new LambdaIntegration(productLambda));
    const removeResource = api.root.addResource("remove_products");
    removeResource.addMethod("POST", new LambdaIntegration(productLambda));
    this.api = api;
  }
}
