import * as _ from 'lodash';
import * as configAll from './env/all';
console.log(process.env.NODE_ENV);
const configEnv = process.env.NODE_ENV === 'production' ? require(`./env/production`) : require(`./env/development`);
const mergedConf = _.merge({}, configEnv, configAll.default);

export default mergedConf;
