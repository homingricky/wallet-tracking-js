import Web3 from "web3";

import dotenv from "dotenv";
dotenv.config();


const web3 = new Web3(process.env.RPC_URL_WSS);

const topics = [
    'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // the event prototype hash (Transfer(address,address,uint256)
    null, //from wallet
    null, // to everyone
];

const subscription = web3.eth.subscribe('logs',topics, (err, res) => {
    if (err) console.error(err);
});

const input = [
        {
            "indexed": true,
            "name": "from",
            "type": "address",
        },
        {
            "indexed": true,
            "name": "to",
            "type": "address",
        },
        {
            "indexed": false,
            "name": "value",
            "type": "uint256",
        },
    ]

subscription.on('data', log => {
    console.log(log);
    try {
        console.log(
            web3.eth.abi.decodeLog(input, log.data, [log.topics[1],log.topics[2]]))
    } catch (err) {
        console.log(err);}

})