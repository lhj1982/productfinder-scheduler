import {Stack} from "aws-cdk-lib";
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import {AttributeType, BillingMode, Table} from "aws-cdk-lib/aws-dynamodb";

export class ProductFinderSchedulerDynamodbStack extends Stack {

    public readonly allowUserTable:Table;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        this.allowUserTable = new Table(this, 'launchProductFinderSchedulerDynamodb', {
            tableName : 'launch-productfinder-allowedUsers',
            partitionKey: {
                name: 'userId',
                type: AttributeType.STRING,
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
        });
    }
}
