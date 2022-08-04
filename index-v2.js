import dotenv from 'dotenv';
import Web3 from 'web3';
import fetch from 'node-fetch';
import { erc20abi } from './src/constants.js';
import { handle_msg, alert_tg } from './tools/tg-helper.js';
import { getTargetMap } from './tools/gs-helper.js';


dotenv.config();

const web3 = new Web3(process.env.RPC_URL_WSS);


let abiMap = new Map()

for (const abi of erc20abi){
    if (abi.type == 'event'){
        // abiDict.set(abi.name,)
        let input_type = abi.inputs.map(input => input.type).join(',');
        let event_prototype_str = `${abi.name}(${input_type})`;
        let event_prototype_hash = web3.utils.keccak256(event_prototype_str)
        abiMap.set(event_prototype_hash,abi.inputs)
    }
}
// console.log(abiMap)



// whaleAddresses.map()

console.log("Initializing topics for targets...")

const targetMap = await getTargetMap();
const whaleAddresses = Array.from(targetMap.values());

let checksum_whaleAddress = [...whaleAddresses].map(address => web3.utils.toChecksumAddress(address))

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

    // console.log(log_option);)

    const log_subscription = web3.eth.subscribe('logs', log_option, (err,res) => {
        if (err) console.error(err);
    }).on('data', async(log) => {
        try {

            // console.log(log)
            var decodedLog = web3.eth.abi.decodeLog(
                abiMap.get(log.topics[0]), log.data, log.topics.slice(1));

            console.log(log);
            console.log(decodedLog);
            const alert_msg = handle_msg(log, decodedLog);
            alert_tg(alert_msg);

            for (const address in checksum_whaleAddress){
                check_arr = [decodedLog['from'], decodedLog['to']]
                if (check_arr.includes(address)) {
                    console.log(decodedLog)
                }
            }
            
        } catch (err) {}
    })

}