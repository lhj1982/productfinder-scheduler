import axios from "axios";
// oscar token
const clientId = 'nike.launch.productfinder';
const secretId = '0sMsT8AmDrNeAmXBJImv7o-NhwPnIzGJ50iabM39SJUDGp50G3zeUCD3SPgZ0nz7';
let encode = Buffer.from(clientId + ":" + secretId).toString('base64')
const oscarUrl = 'https://oscar.oauth.nikecloud.com.cn/oauth/access_token/v1';
const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${encode}`,
}
const data = new URLSearchParams();
data.append('grant_type', 'client_credentials');
data.append('scope', 'discover:productfeedv2::read:');

// product feed
const SNKRS_CHANNEL_ID = '008be467-6c78-4079-94f0-70e2d6cc4003';
const NIKE_CHANNEL_ID = 'd9a5bc42-4b9c-4976-858a-f159cf99c647';

const generateToken = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        axios.post(oscarUrl, data, {headers})
            .then(response => {
                const data = response.data;
                const {access_token: token} = data;
                resolve(token);
            })
            .catch(error => {
                console.log("get oscar token error: ", error);
                reject(error);
            });
    });
};

const getProductDetail = async (styleColor: string) => {
    let token = await generateToken();
    const response = await axios.get(
        `https://api.nike.com.cn/product_feed/threads/v3/secured?filter=marketplace(CN)&filter=language(zh-Hans)&filter=channelId(${SNKRS_CHANNEL_ID},${NIKE_CHANNEL_ID})&filter=productInfo.merchProduct.styleColor(${styleColor})&filter=exclusiveAccess(true,false)&sort=publishedContent.viewStartDateDesc`,
        {
            headers: {'X-Nike-AppId': 'lsro-productfeed', Authorization: `Bearer ${token}`},
        },
    );
    const {
        status,
        data: {errcode, errmsg},
    } = response;
    if (errcode) {
        console.error(`error: ${errcode}, message: ${errmsg}`);
        throw new Error(`Error when calling product feed api`);
    }

    const {
        data: {
            pages: {totalResources},
            objects,
        },
    } = response;
    if (totalResources > 1) {
        console.warn(`Find one more result by styleColor ${styleColor}`);
    }
    if (totalResources === 0) {
        return undefined;
    }

    const product = objects[0];
    const {
        data: {
            productInfo,
            publishedContent: {
                nodes: contentNodes
            },
        },
    } = product;
    let imageUrl = '';
    if (contentNodes && contentNodes.length > 0) {
        const {
            nodes: imagesNodes
        } = contentNodes[0]
        if (imagesNodes && imagesNodes.length > 0) {
            const {
                properties: {
                    portraitURL
                }
            } = imagesNodes[0]
            imageUrl = portraitURL
        }
    }
    if (!productInfo || productInfo.length === 0) {
        throw new Error(`No product info is found, ${styleColor}`);
    }
    if (!contentNodes || contentNodes.length === 0) {
        throw new Error(`No product publish content is found, ${styleColor}`);
    }
    const {
        merchProduct: {labelName},
        merchPrice: {currentPrice},
    } = productInfo[0];
    return {
        "imageUrl": imageUrl,
        "labelName": labelName,
        "currentPrice": currentPrice
    };
};

export {getProductDetail}



