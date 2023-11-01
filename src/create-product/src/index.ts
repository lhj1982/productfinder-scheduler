import {getProductDetail} from "./product_feed";
import moment = require("moment-timezone");


const AWS = require('aws-sdk');
const mysql = require('mysql2')
const db = new AWS.DynamoDB.DocumentClient();
const ALLOWEDUSERS_TABLE_NAME = process.env.ALLOWEDUSERS_TABLE_NAME || '';
const host = process.env.MYSQL_HOST || '';
const port = process.env.MYSQL_PORT || '';
const user = process.env.MYSQL_USER || '';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || '';
const querystring = require('querystring');

const addPath = '/addProducts';
const removePath = '/removeProducts';
const regex = /^[A-Za-z]{2}-\d{4}-\d{3}$/;

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
                message: `Usage: /add_products styleColor,styleColor,styleColor or /remove_products styleColor,styleColor,styleColor`,
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
        let validFlag = true;
        styleColors.forEach((styleColor: string) => {
            if (!regex.test(styleColor)) {
                validFlag = false;
            }
        });
        if (!validFlag) {
            return {
                isValid: false,
                message: 'some styleColors is invalid, please check your input!',
            };
        }
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
    if (styleColors.length <= 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'styleColor is empty!',
            }),
        };
    }
    const connection = mysql.createConnection({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
    });
    let add: string[] = [];
    let fail: string[]  = [];
    let exists: string[]  = [];
    styleColors.forEach(styleColor => {
        connection.query(`select styleColor from products where stylecolor = ${styleColor}`, async (error: any, results: any) => {
            if (error) {
                throw error;
            }
            const count = results[0].count;
            if (count > 0) {
                exists.push(styleColor);
                console.log(`styleColor:${styleColor} already exists!`)
            } else {
                const product = await getProductDetail(styleColor);
                const chinaTime = moment().tz('Asia/Shanghai');
                const timestamp = chinaTime.format('YYYY-MM-DD HH:mm:ss');
                const insertQuery = 'insert into products(stylecolor,name,price,url,create_at,enable) values (?,?,?,?,?,?)';
                const values = [styleColor, product?.labelName, product?.currentPrice, product?.imageUrl, timestamp, 1]
                connection.query(insertQuery, values, (error: any, result: any) => {
                    if (error) {
                        console.log(`delete product failed, styleColor:${styleColor}`)
                        fail.push(styleColor)
                    } else {
                        add.push(styleColor)
                    }
                })
            }
        })

    });
    connection.end();
    let message = "";
    if (add.length > 0) {
        message += `Added, styleColor:${add.join(",")}!  `;
    }
    if (fail.length > 0) {
        message += `Failed, styleColor:${fail.join(",")}!  `;
    }
    if (exists.length > 0) {
        message += `The following styleColors already exists, styleColor: ${exists.join(",")}`;
    }
    return {
        statusCode: 200,
        body: JSON.stringify({
            response_type: 'ephemeral',
            text: message,
        }),
    };
}

const removeProducts = (styleColors: []) => {
    if (styleColors.length <= 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                response_type: 'ephemeral',
                text: 'styleColor is empty!',
            }),
        };
    }
    const connection = mysql.createConnection({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
    });

    connection.query(`delete from products where stylecolor in (${styleColors.join(",")})`, (error: any, result: any) => {
        if (error) {
            console.log(`delete product failed, styleColors:${styleColors.join(",")}`)
        }
        connection.end();
    })
    return {
        statusCode: 200,
        body: JSON.stringify({
            response_type: 'ephemeral',
            text: 'Successfully deleted!',
        }),
    };
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
