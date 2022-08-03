import dotenv from 'dotenv';
import Web3 from 'web3';
import { erc20abi } from './src/constants.js';

const web3 = new Web3(process.env.RPC_URL_WSS)


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

console.log(abiMap);

const topics = ['Transfer(address,address,uint256)']

var subscription = web3.eth.subscribe('logs', {
    address: null,
    topics: topics.map(topic => web3.utils.keccak256(topic)),
}).on('data', async(log) => {
    try {
        const { address, data, topics, transactionHash } = log;
        const decodedLog = web3.eth.abi.decodeLog(
            abiMap.get(topics[0]),
            data,
            topics.slice(1)
        );
        // console.log(log);
        console.log(decodedLog);

    } catch (error) {
        // console.log(error);
    }
})