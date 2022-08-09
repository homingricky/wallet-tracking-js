import dotenv from 'dotenv';
import Web3 from 'web3';
import fetch from 'node-fetch';
import { erc20abi } from './src/constants.js';
import { handle_msg, debug_msg, alert_tg } from './tools/tg-helper.js';
import { getTargetMap } from './tools/gs-helper.js';
import { logDebug, logError, logInfo } from './tools/log-helper.js';
import { sleep } from './tools/utils.js';


dotenv.config();

const web3 = new Web3(process.env.RPC_URL_WSS);


let abiMap = new Map()

for (const abi of erc20abi){
    if (abi.type == 'event'){
        let input_type = abi.inputs.map(input => input.type).join(',');
        let event_prototype_str = `${abi.name}(${input_type})`;
        let event_prototype_hash = web3.utils.keccak256(event_prototype_str)
        abiMap.set(event_prototype_hash,abi.inputs)
    }
}

logInfo("Initializing topics for targets...")

let targetMap = await getTargetMap();
const whaleAddresses = Array.from(targetMap.values());
let checksum_whaleAddress = [...whaleAddresses].map(address => web3.utils.toChecksumAddress(address))

for (let target of targetMap){
    targetMap.set(target[0],web3.utils.toChecksumAddress(target[1]));
}

const targetTopic = 'Transfer(address,address,uint256)';
const topics_for_all = [web3.utils.keccak256(targetTopic)]
// const topics_from = [web3.utils.keccak256(targetTopic),[checksum_whaleAddress,null]]
// const topics_to = [web3.utils.keccak256(targetTopic),[null,checksum_whaleAddress]]
// console.log(topics_from)


for (const topics of [ topics_for_all]) {

    const log_option = {
        address: null, // we want to track all erc-20 contracts
        topics: topics
    };

    let tokenMap = {};

    logInfo('Subscribing to transfer events...')

    const log_subscription = web3.eth.subscribe('logs', log_option, (err,res) => {
        if (err) console.error(err);
    }).on('data', async(log) => {
        try {

            try {
                var decodedLog = web3.eth.abi.decodeLog(
                    abiMap.get(log.topics[0]), log.data, log.topics.slice(1));
                } catch (err) {
                    /*logDebug('This is not an ERC20 transfer transaction');*/
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
                    sleep(1.5);
                }
                } catch (err) {/*logDebug('This is not an ERC20 transactions');*/} 

            const tokenInfo = tokenMap[token_address];
            // const msg = debug_msg(log, decodedLog, tokenInfo);
            // console.log(msg)

            for (const address in checksum_whaleAddress){
                const check_arr = [decodedLog['from'], decodedLog['to']];
                if (check_arr.includes(address)) {

                    const isSender = (address == decodedLog['from']);

                    let whaleName = null;
                    for (const target of targetMap){
                        if (address == target[1]){
                            whaleName = target[0];
                        }
                    }

                    const alert_msg = handle_msg(log, decodedLog, tokenInfo, isSender, whaleName);
                    alert_tg(alert_msg);
                    logInfo(alert_msg);
                    break;
                }
            }
            
        } catch (err) {console.log(err)}
    })

}
