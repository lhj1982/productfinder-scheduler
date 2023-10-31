import axios from "axios";

const URL = process.env.URL || '';
const mysql = require('mysql2')
const host = process.env.MYSQL_HOST || '';
const port = process.env.MYSQL_PORT || '';
const user = process.env.MYSQL_USER || '';
const password = process.env.MYSQL_PASSWORD || '';
const database = process.env.MYSQL_DATABASE || '';

const getStyleColors = (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
        const connection = mysql.createConnection({
            host: host,
            port: port,
            user: user,
            password: password,
            database: database
        });
        try {
            connection.query('SELECT stylecolor FROM products', (error: any, results: any) => {
                if (error) {
                    console.log(`query styleColors error=${error}`);
                    reject(error);
                } else {
                    console.log(`query styleColors from db success, styleColors=${JSON.stringify(results)}`);
                    resolve(results
                        .filter((product: {stylecolor: string;}) => product.stylecolor)
                        .map((product: { stylecolor: string; }) => product.stylecolor));
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

export const handler = async (event: any): Promise<any> => {
    const styleColors: string[] = await getStyleColors();
    if(styleColors.length === 0){
        console.log(`styleColors is empty!`);
        return event;
    }
    console.log(`styleColors: ${JSON.stringify(styleColors)}`);
    const data = new URLSearchParams();
    data.append('text', styleColors.join(','));
    data.append('user_id', 'VIP');
    const response = await axios.post(`${URL}`, data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    console.log(`response: ${JSON.stringify(response.data)}`);
    return event;
};
