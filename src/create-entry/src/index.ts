const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const ALLOWEDUSERS_TABLE_NAME = process.env.ALLOWEDUSERS_TABLE_NAME || '';
const querystring = require('querystring');
const TOPIC_ARN = process.env.TOPIC_ARN || '';
const sns = new AWS.SNS();

const validateRequest = async (
  event: any,
): Promise<{
  isValid: boolean;
  message?: string;
  styleColors?:string[];
}> => {
  const { path, httpMethod, body } = event;
  if (path != '/scheduler' || httpMethod != 'POST' || !body) {
    return {
      isValid: false,
      message: 'Invalid command.',
    };
  }
  try {
    const bodyObj = querystring.parse(body);
    const { user_id, text } = bodyObj;
    if (text === 'help') {
      return {
        isValid: false,
        message: `Usage: /scheduler [styleColor,styleColor,styleColor...]`,
      };
    }
    if(!user_id) {
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
    const { Item } = data;
    if (!Item) {
      return {
        isValid: false,
        message: 'You are not allowed to run this command.',
      };
    }

    const styleColors = text.toUpperCase().split(',');

    return {
      isValid: true,
      styleColors: styleColors
    };
  } catch (err) {
    return {
      isValid: false,
      message: 'Unknown error.',
    };
  }
};

export const handler = async (event: any = {}): Promise<any> => {
  const validateResult: { isValid: boolean; message?: string; styleColors?: any } = await validateRequest(event);
  const { isValid, message } = validateResult;
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
    const { styleColors } = validateResult;
    // publish event message
    if (styleColors.length > 0) {
      const params = {
        TopicArn: TOPIC_ARN,
        Message: JSON.stringify(styleColors),
      };
      await sns.publish(params).promise();

      return {
        statusCode: 200,
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: `productfinder request for ${styleColors.toString()} has been successfully submitted.`,
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
