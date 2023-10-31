const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const ALLOWEDUSERS_TABLE_NAME = process.env.ALLOWEDUSERS_TABLE_NAME || '';
const querystring = require('querystring');

const addPath = '/addProducts';
const removePath = '/removeProducts';

const validateRequest = async (
    event: any,
): Promise<{
    isValid: boolean;
    message?: string;
    data?: { styleColors?: string[], responseUrl?: string };
}> => {
    const {path, httpMethod, body} = event;
    if ((path != addPath && path != removePath) || httpMethod != 'POST' || !body) {
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
                message: `Usage: /addProducts styleColor,styleColor,styleColor or /deleteProducts styleColor,styleColor,styleColor`,
            };
        }
        if (!user_id) {
            return {
                isValid: false,
                message: 'please input your user_id.',
            };
        }
        const data = await db.get({
            TableName: ALLOWEDUSERS_TABLE_NAME,
            Key: {
                userId: user_id,
            },
        }).promise();
        const {Item} = data;
        if (!Item) {
            return {
                isValid: false,
                message: 'You are not allowed to run this command.',
            };
        }
        const styleColors = text.toUpperCase().split(',');
        if (response_url) {
            return {
                isValid: true,
                data: {
                    styleColors: styleColors,
                    responseUrl: response_url
                }
            };
        } else {
            return {
                isValid: true,
                data: {
                    styleColors: styleColors
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

const addProducts = (styleColors: []) => {

}

const removeProducts = (styleColors: []) => {

}

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
        const {styleColors} = data;
        const {path} = event;
        if (path === addPath) {
            return addProducts(styleColors);
        }
        if (path === removePath) {
            return removeProducts(styleColors);
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
