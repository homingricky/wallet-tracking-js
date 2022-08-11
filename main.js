import dotenv from 'dotenv';
import Web3 from 'web3';
import { erc20abi } from './src/constants.js';
import { checksum_whaleAddress, handle_msg, debug_msg, alert_tg } from './tools/tg-helper.js';
import { logDebug, logError, logInfo } from './tools/log-helper.js';

dotenv.config();

const web3 = new Web3(process.env.RPC_URL_WSS);

let abiMap = new Map()

for (const abi of erc20abi){
    if (abi.type == 'event'){
        let input_type = abi.inputs.map(input => input.type).join(',');
        let event_prototype_str = `${abi.name}(${input_type})`;
        let event_prototype_hash = web3.utils.keccak256(event_prototype_str)
        abiMap.set(event_prototype_hash, abi.inputs)
    }
}

logInfo("Initializing topics for targets...")

let tokenMap = {};

const targetTopic = 'Transfer(address,address,uint256)';
const topics_for_all = [web3.utils.keccak256(targetTopic)]
// const topics_from = [web3.utils.keccak256(targetTopic),[checksum_whaleAddress,null]]
// const topics_to = [web3.utils.keccak256(targetTopic),[null,checksum_whaleAddress]]
// Somehow the above filters do not work (https://web3js.readthedocs.io/en/v1.2.11/web3-eth-subscribe.html#subscribe-logs)

// want to keep this for loop for now in case the above filter works 
for (const topics of [topics_for_all]) {

    const log_option = {
        address: null, // we want to track all erc-20 contracts
        topics: topics
    };

    logInfo('Subscribing to transfer events...')

    const log_subscription = web3.eth.subscribe('logs', log_option, (err,res) => {
        if (err) console.error(err);
    }).on('data', async(log) => {

        // Here I want to use separate try..catch.. 
        // because the first try...catch... catches any error arised from logs not matching with the desired event prototype
        // the second try..catch.. catches any error arised from non ERC20 transactions

        // Will add the if..return.. logic once the script is tested
        try {
            var decodedLog = web3.eth.abi.decodeLog(
                abiMap.get(log.topics[0]), log.data, log.topics.slice(1));
            } catch (err) {
                /*logDebug('This transaction log does not match with desired event prototype(s)');*/
                return
            }

        const token_address = log.address;
        try{
            if (!(token_address in tokenMap)){
                const token_contract = new web3.eth.Contract(erc20abi, token_address);
                tokenMap[token_address] = {
                    'decimals': await token_contract.methods.decimals().call(),
                    'symbol': await token_contract.methods.symbol().call(),
                };
            }
            } catch (err) {/*logDebug('This is not an ERC20 transaction');*/} 

        const tokenInfo = tokenMap[token_address];

        for (const address in checksum_whaleAddress){
            const check_arr = [decodedLog['from'], decodedLog['to']];
            if (check_arr.includes(address)) {

                const alert_msg = handle_msg(log, decodedLog, tokenInfo);
                alert_tg(alert_msg);
                logInfo(alert_msg);
                break;
            }
        }
    })
}
