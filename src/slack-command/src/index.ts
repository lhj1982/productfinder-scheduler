const querystring = require('querystring');
import {SNSClient, PublishCommand} from "@aws-sdk/client-sns";
import {DynamoDBClient, GetItemCommand} from "@aws-sdk/client-dynamodb";

const ALLOWEDUSERS_TABLE_NAME = process.env.ALLOWEDUSERS_TABLE_NAME || '';
const TOPIC_ARN = process.env.TOPIC_ARN || '';

const snsClient = new SNSClient({region: "cn-northwest-1"});
const dynamoDBClient = new DynamoDBClient({region: "cn-northwest-1"});

const allowedPath = ['/find', '/add_products', '/remove_products', '/crawler'];

const validateRequest = async (
    event: any,
): Promise<{
    isValid: boolean;
    message?: string;
    data?: { styleColors?: string[], responseUrl?: string, path?: string };
}> => {
    const {path, httpMethod, body} = event;
    if (allowedPath.indexOf(path) < 0 || httpMethod != 'POST' || !body) {
        return {
            isValid: false,
            message: 'Invalid command.',
        };
    }
    try {
        const bodyObj = querystring.parse(body);
        console.log(`requestBody->${JSON.stringify(bodyObj)}`);
        const {user_id, text, response_url} = bodyObj;
        if (text === 'help') {
            return {
                isValid: false,
                message: `Usage: ${path} styleColor,styleColor,styleColor`,
            };
        }
        if (!user_id) {
            return {
                isValid: false,
                message: 'please input your user_id.',
            };
        }
        const command = new GetItemCommand({
            TableName: ALLOWEDUSERS_TABLE_NAME,
            Key: {
                userId: {
                    S: user_id
                },
            },
        });
        const data = await dynamoDBClient.send(command);
        const {Item} = data;
        if (!Item) {
            return {
                isValid: false,
                message: 'You are not allowed to run this command.',
            };
        }

        const styleColors = text.toUpperCase().split(',');
        let validFlag = true;
        styleColors.forEach((styleColor: string) => {
            if (!styleColor) {
                console.log(`empty styleColor!`);
                validFlag = false;
                return;
            }
        });
        if (!validFlag) {
            return {
                isValid: false,
                message: 'styleColors is invalid, please check your input!',
            };
        }

        if (response_url) {
            return {
                isValid: true,
                data: {
                    styleColors: styleColors,
                    responseUrl: response_url,
                    path: path,
                }
            };
        } else {
            return {
                isValid: true,
                data: {
                    styleColors: styleColors,
                    path: path,
                }
            };
        }
    } catch (err) {
        return {
            isValid: false,
            message: 'Unknown error.',
        };
    }
};

export const handler = async (event: any = {}): Promise<any> => {
    const validateResult: { isValid: boolean; message?: string; data?: any } = await validateRequest(event);
    const {isValid, message, data} = validateResult;
    if (!isValid) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'ephemeral',
                text: message,
            }),
        };
    }

    try {
        const {styleColors, path} = data;
        // publish event message
        if (styleColors.length > 0) {
            const params = {
                TopicArn: TOPIC_ARN,
                Message: JSON.stringify(data),
            };
            const command = new PublishCommand(params);
            await snsClient.send(command);

            return {
                statusCode: 200,
                body: JSON.stringify({
                    response_type: 'ephemeral',
                    text: `request ${path} for ${styleColors.toString()} has been successfully submitted.`,
                }),
            };
        } else {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    response_type: 'ephemeral',
                    text: `Nothing to submit.`,
                }),
            };
        }
    } catch (err) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'Invalid command parameters.',
            }),
        };
    }
};
