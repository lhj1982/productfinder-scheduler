import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

export class ProductFinderSchedulerDynamodb extends Construct {
  public readonly allowUserTable: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.allowUserTable = new Table(this, "launchProductFinderSchedulerDynamodbAllowedUsers", {
      tableName: "launch-productfinder-scheduler-allowedUsers",
      partitionKey: {
        name: "userId",
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST
    });
  }
}
