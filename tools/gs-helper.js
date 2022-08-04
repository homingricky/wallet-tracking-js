import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config()
export const getTargetMap = async function (){
    
    const auth = new google.auth.GoogleAuth({
        keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
    
    const sheets = google.sheets('v4')
    const authClient = await auth.getClient();
    google.options({auth: authClient})
    
    
    const sheet = await sheets.spreadsheets.values.batchGet({
        ranges: ["target_wallets!A2:B1000"],
        spreadsheetId: process.env.GOOGLESHEET_ID,
    });
    
    const target_arr = sheet.data.valueRanges[0].values;
    const target_map = new Map();
    
    for (const target of target_arr){
        const target_name = target[0];
        const target_address = target[1];
        
        if (!target_address) continue 
        else{
            target_map.set(target_name,target_address)
        }
    }

    return target_map
}

