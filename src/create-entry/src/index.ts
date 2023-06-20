import * as moment from 'moment';
const AWS = require('aws-sdk');
const db = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || '';
const ALLOWEDUSERS_TABLE_NAME = process.env.ALLOWEDUSERS_TABLE_NAME || '';
const querystring = require('querystring');
const TOPIC_ARN = process.env.TOPIC_ARN || '';
const sns = new AWS.SNS();
const ALLOWED_GEOS = ['CN', 'NA', 'WE', 'JP', 'MX', 'XA', 'XP'];

const validateRequest = async (
  event: any,
): Promise<{
  isValid: boolean;
  message?: string;
  data?: { styleColors: string[]; startDate: number; geo: string };
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
        message: `Usage: /schedule-precheck [styleColors] [startDate(YYYY-MM-DD)] [geo(CN)]`,
      };
    }
    const data = await db
      .get({
        TableName: ALLOWEDUSERS_TABLE_NAME,
        Key: {
          userId: user_id,
        },
      })
      .promise();
    console.log(data);
    const { Item } = data;
    if (!Item) {
      return {
        isValid: false,
        message: 'You are not allowed to run this command.',
      };
    }

    const splitted = text.toUpperCase().split(' ');
    const styleColorsStr = splitted[0];
    const dateStr = splitted[1];
    const geo = splitted[2];
    const date = moment(dateStr, 'YYYY-MM-DD');
    const styleColors = styleColorsStr.split(',');

    if (ALLOWED_GEOS.indexOf(geo) === -1) {
      return {
        isValid: false,
        message: `Unknown geo. Only support ${ALLOWED_GEOS.toString()} now`,
      };
    }
    return {
      isValid: true,
      data: {
        styleColors,
        startDate: date.valueOf(),
        geo,
      },
    };
  } catch (err) {
    console.error(`Validation error, ${err}`);
    return {
      isValid: false,
      message: 'Unknown error.',
    };
  }
};

export const handler = async (event: any = {}): Promise<any> => {
  const params = {
    TableName: TABLE_NAME,
  };
  console.log(JSON.stringify(event));
  const { body } = event;
  const bodyObj = querystring.parse(body);
  const { response_url } = bodyObj;
  const validateResult: { isValid: boolean; message?: string; data?: any } = await validateRequest(event);
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
    const {
      data: { styleColors, startDate, geo },
    } = validateResult;
    const promises = styleColors.map(async (_: string) => {
      return await db
        .put({
          TableName: TABLE_NAME,
          Item: {
            styleColor: `${_}`,
            startDate,
            responseUrl: decodeURIComponent(response_url) || '',
          },
        })
        .promise();
    });
    // save entry to database
    await Promise.all(promises);
    // publish event message
    if (styleColors.length > 0) {
      const messageToPublish = styleColors.map((styleColor: string) => {
        return { styleColor, startDate, geo };
      });
      const params = {
        TopicArn: TOPIC_ARN,
        Message: JSON.stringify(messageToPublish),
      };
      console.log(`messageToPublish: ${JSON.stringify(messageToPublish)}`);
      const response = await sns.publish(params).promise();
      console.log(JSON.stringify(response));

      return {
        statusCode: 200,
        body: JSON.stringify({
          response_type: 'ephemeral',
          text: `Precheck request for ${styleColors.toString()} on ${moment(startDate).format(
            'YYYY-MM-DD',
          )}, ${geo} has been successfully submitted.`,
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
    console.error(err);
    return {
      statusCode: 200,
      body: JSON.stringify({
        response_type: 'ephemeral',
        text: 'Invalid command parameters.',
      }),
    };
  }
};
