import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config()

// Telegram Related Functions

export const handle_msg = function (log, decodedLog) {
    const msg = `
        \ntime: ${Date().toLocaleString()}
        \nfrom: ${decodedLog.from}
        \nto: ${decodedLog.to}
        \nvalue: ${decodedLog.value}`

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