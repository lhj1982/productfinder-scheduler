import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";

export class ProductFinderSchedulerDynamodb extends Construct {
  public readonly tableName: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    const tableName = 'launch-productfinder-scheduler-allowedUsers'
    const table = Table.fromTableName(this,'ExistingTableCheck', tableName);
    if (!table.tableArn) {
      //table does not exist
      const createTable = new Table(this, "launchProductFinderSchedulerDynamodbAllowedUsers", {
        tableName: tableName,
        partitionKey: {
          name: "userId",
          type: AttributeType.STRING
        },
        billingMode: BillingMode.PAY_PER_REQUEST
      });
      this.tableName = createTable.tableName;
    } else {
      this.tableName = table.tableName;
    }
  }
}
