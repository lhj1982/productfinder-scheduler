import {getProductDetail} from "./product_feed";
import moment = require("moment-timezone");
import axios from "axios";

const mysql = require('mysql2/promise')
const host = process.env.MYSQL_HOST || '';
const port = process.env.MYSQL_PORT || '';
const user = process.env.MYSQL_USER || '';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || '';

const addPath = '/add_products';
const removePath = '/remove_products';

const addProducts = async (styleColors: []) => {
    if (styleColors.length <= 0) {
        return 'styleColor is empty!';
    }
    const connection = await mysql.createConnection({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
    });
    let add: string[] = [];
    let fail: string[] = [];
    let exists: string[] = [];
    for (const styleColor of styleColors) {
        console.log(`operation for ${styleColor}`)
        const [result] = await connection.execute(`select stylecolor from products where stylecolor = '${styleColor}'`);
        console.log(`result:${result}`);
        if (result.length > 0) {
            exists.push(styleColor);
            console.log(`styleColor:${styleColor} already exists!`)
        } else {
            try {
                const product = await getProductDetail(styleColor);
                console.log(`product:${JSON.stringify(product)}`);
                const chinaTime = moment().tz('Asia/Shanghai');
                const timestamp = chinaTime.format('YYYY-MM-DD HH:mm:ss');
                const insertQuery = 'insert into products(stylecolor,name,price,url,created_at,enabled) values (?,?,?,?,?,?)';
                const values = [styleColor, product?.labelName, product?.currentPrice, product?.imageUrl, timestamp, 1];
                await connection.execute(insertQuery, values);
                add.push(styleColor);
            } catch (error) {
                console.log(error);
                fail.push(styleColor);
            }
        }
    }
    await connection.end();
    console.log(`add:${JSON.stringify(add)},fail:${JSON.stringify(fail)},exists:${JSON.stringify(exists)}`);
    let message = "";
    if (add.length > 0) {
        message += `Added:${add.join(",")}!  `;
    }
    if (fail.length > 0) {
        message += `Failed:${fail.join(",")}!  `;
    }
    if (exists.length > 0) {
        message += `Already exists:${exists.join(",")}!`;
    }
    console.log(`message:${message}`);
    return message;
}

const removeProducts = async (styleColors: []) => {
    if (styleColors.length <= 0) {
        return 'styleColor is empty!';
    }
    const connection = await mysql.createConnection({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
    });
    for (const styleColor of styleColors) {
        await connection.execute(`delete from products where stylecolor = '${styleColor}'`);
    }
    await connection.end();
    return "Successfully deleted!";
}

export const handler = async (event: any = {}): Promise<any> => {
    const {styleColors, responseUrl, path} = event;
    let message = "";
    try {
        const {path} = event;
        if (path === addPath) {
            message = await addProducts(styleColors);
        }
        if (path === removePath) {
            message = await removeProducts(styleColors);
        }
    } catch (err) {
        message = "Invalid command parameters.";
    }
    await axios.post(responseUrl, {
        response_type: 'ephemeral',
        text: message
    });
};
