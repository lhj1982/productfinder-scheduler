import axios from "axios";
import * as process from "node:process";

const URL = process.env.URL || '';
const mysql = require('mysql2')
const host = process.env.MYSQL_HOST || '';
const port = process.env.MYSQL_PORT || '';
const user = process.env.MYSQL_USER || '';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || '';
const pageSize = process.env.PAGE_SIZE

const getConnection = () => {
    return mysql.createConnection({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database
    });
}

const getProducts = (time: string): Promise<{ id: number; stylecolor: string; } []> => {
    return new Promise(async (resolve, reject) => {
        const connection = getConnection();
        try {
            const queryCount = pageSize ? Number(pageSize) : 10;
            connection.query(`select p.id, p.stylecolor from products p where p.enabled = 1 and p.stylecolor not in (select s.stylecolor from product_schedule_record s where schedule_day = '${time}') limit 0, ${queryCount}`, (error: any, results: any) => {
                if (error) {
                    console.log(`query products from db, error=${error}`);
                    reject(error);
                } else {
                    console.log(`query products from db, success, products=${JSON.stringify(results)}`);
                    resolve(results
                        .filter((product: { stylecolor: string; id: number }) => product.stylecolor)
                        .map((product: { stylecolor: string; id: number }) => product));
                }
            })
        } catch (error) {
            console.log(`query styleColors error=${error}`);
            reject(error);
        } finally {
            connection.end();
        }
    })
}

const getTime = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const insertScheduleRecord = (product: { id: number, stylecolor: string }, time: string) => {
    return new Promise(async (resolve, reject) => {
        const connection = getConnection();
        try {
            connection.query("insert into product_schedule_record (product_id, stylecolor, schedule_day) values (?,?,?)",
                [product.id, product.stylecolor, time],
                (error: any, result: any) => {
                    if (error) {
                        console.log(`insert schedule record, error=${error}`);
                    } else {
                        resolve("insert schedule record success");
                    }
                });
        } catch (error) {
            console.log(`insert schedule record, error=${error}`);
        } finally {
            connection.end();
        }
    })
}

const sleep = (ms: number): Promise<any> => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const getRandomInt = (minDelaySecond: number, maxDelaySecond: number) => {
    return Math.floor(Math.random() * (maxDelaySecond - minDelaySecond + 1) + minDelaySecond);
};

export const handler = async (event: any): Promise<any> => {
    try {
        const time = getTime();
        const products: { id: number; stylecolor: string; } [] = await getProducts(time);
        if (products.length === 0) {
            console.log(`products is empty!`);
            return event;
        }
        console.log(`products number: ${products.length}, styleColors: ${JSON.stringify(products.map(product => product.stylecolor))}`);
        for (const product of products) {
            //wait some time
            const waitSecond = getRandomInt(5, 10);
            console.log(`waiting second: ${waitSecond} s`);
            await sleep(waitSecond * 1000);
            const styleColor = product.stylecolor;
            const requestArray: string[] = [];
            requestArray.push(styleColor);
            //request
            const data = new URLSearchParams();
            data.append('text', requestArray.join(","));
            data.append('user_id', 'VIP');
            const response = await axios.post(`${URL}`, data, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            console.log(`response: ${JSON.stringify(response.data)}`);
            await insertScheduleRecord(product, time);
            console.log(`sending completed for styleColor: ${styleColor}`);
        }
    } catch (error) {
        console.log(`event bridge error=${error}`);
    }
    return event;
};
