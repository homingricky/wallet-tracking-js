import fetch from 'node-fetch';
import dotenv from 'dotenv';
import dateFormat from 'dateformat';
import { addHours, round } from './utils.js';
import { getTargetMap } from './gs-helper.js';

dotenv.config()

export const targetMap = await getTargetMap();
export const checksum_whaleAddress = Array.from(targetMap.keys());

// Telegram Related Functions

export const handle_msg = function (log, decodedLog, tokenInfo) {

    let current_hkt = addHours(8);
    current_hkt = dateFormat(current_hkt, "isoDateTime");
    const processed_value = round(decodedLog.value * 10 ** (-tokenInfo.decimals),2)
    
    const msg = `
        \nTime: ${current_hkt} HKT \nSender: ${(targetMap[decodedLog.from] || decodedLog.from)} \nReceiver: ${(targetMap[decodedLog.to] || decodedLog.to)} \nValue: ${processed_value} ${tokenInfo.symbol} 
        \nhttps://etherscan.io/tx/${log.transactionHash}`;

    return msg
}

export const debug_msg = function (log, decodedLog, tokenInfo) {

    let current_hkt = addHours(8);
    current_hkt = dateFormat(current_hkt, "isoDateTime");
    const processed_value = round(decodedLog.value * 10 ** (-tokenInfo.decimals),2)
    
    const msg = `
        \nTime: ${current_hkt} HKT \nSender: ${decodedLog.from} \nReceiver: ${decodedLog.to} \nValue: ${processed_value} ${tokenInfo.symbol} 
        \nhttps://etherscan.io/tx/${log.transactionHash}`;

    return msg
}

export const alert_tg = async function (msg) {
    
    const data = {
        chat_id: process.env.TG_CHATROOM_ID,
        text: String(msg),
    }
    console.log(data.text)
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    const response = await fetch(process.env.TG_URL, options);
    const json = await response.json();

}