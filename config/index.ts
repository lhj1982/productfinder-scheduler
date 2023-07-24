import * as _ from 'lodash';
import * as configAll from './env/all';
console.log(process.env.NODE_ENV);
const configEnv = process.env.NODE_ENV === 'cnprod' ? require(`./env/cnprod`) : require(`./env/cntest`);
const mergedConf = _.merge({}, configEnv, configAll.default);

export default mergedConf;
