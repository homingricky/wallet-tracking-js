import { logInfo, logSuccess, logError } from "./src/logging.js";
import { web3, erc20abi } from "./src/constants.js";

const main = async () => {
  
  // Add timestamp to all subsequent console.logs
  const origLog = console.log;
  console.log = function (obj, ...placeholders) {
    if (typeof obj === "string")
      placeholders.unshift("[" + new Date().toISOString() + "] " + obj);
    else {
      // This handles console.log( object )
      placeholders.unshift(obj);
      placeholders.unshift("[" + new Date().toISOString() + "] %j");
    }
    origLog.apply(this, placeholders);
  };

  logInfo("Initiating WhaleWatch...\n");
  
  let whaleAddresses = [
    "0x020cA66C30beC2c4Fe3861a94E4DB4A498A35872",
    "0x0D71587c83a28E1AdB9CF61450A2261ABbE33632",
    "0x4F20Cb7a1D567A54350a18DAcB0cc803aEBB4483",
    "0x23A5eFe19Aa966388E132077d733672cf5798C03",
    "0x0c5a2c72c009252f0e7312f5a1ab87de02be6fbe",
    "0xd6AF301A8770659c1Dc880843db4d1aaA01048b4",
    "0xaba85673458b876c911ccff5e3711bcedb3b4f56",
    "0xA22eb3338dFd69458513a1F6D4742AB29F7eF333",
    "0x7E4B4DC22111B84594d9b7707A8DCFFd793D477A",
    "0x4093fbe60ab50ab79a5bd32fa2adec255372f80e",
    "0x408505ec4bb812b9b649a653390a7b683cea3d54",
    "0x5ca29dc4845b8cb19ccf335337b774749c7bb617",
    "0xA25ea37C36f724E4C0EE7DD215ff1d3093a1C602",
    "0x1B73d1A98739D227BcB06589fD8CDA09331C5A25",
    "0x0DC874Fb5260Bd8749e6e98fd95d161b7605774D",
    "0x009988ff77eeaa00051238ee32c48f10a174933e",
    "0xc33192b79ad149b05169516a8af2adc6e1e08ef6",
    "0x66B870dDf78c975af5Cd8EDC6De25eca81791DE1",
    "0xa86e3d1c80a750a310b484fb9bdc470753a7506f",
    "0x8A7f7C5b556B1298a74c0e89df46Eba117A2F6c1",
    "0xf5445429a4e843b91c036ab4028cdb0f103a1017",
    "0x60ad50e7d5dbb92da6e01f933a4f913e4d9a4535",
    "0x176F3DAb24a159341c0509bB36B833E7fdd0a132",
    "0xbd7774b6CEa51fa217696d7B052F4C8Da205D333",
    "0x716034C25D9Fb4b38c837aFe417B7f2b9af3E9AE",
    "0xB0Cf943Cf94E7B6A2657D15af41c5E06c2BFEA3D",
    "0xA9Cdf0542a1128C5cAca1E81521A09aEc8abe1a7",
    "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852" // Uniswap V2 USDT
  ];
  
  const tokens = {};
  const topics = ['Transfer(address,address,uint256)']
  
  // Generate inputs dict for log decoding
  const inputsDict = erc20abi.reduce((acc, cur) => {
    if (cur.type === 'event'){
      const args = cur.inputs.map(input => input.type).join(",");
      acc[web3.utils.sha3(`${cur.name}(${args})`)] = cur.inputs
    }
    return acc;
  }, {});
  
  var subscription = web3.eth.subscribe('logs', {
    address: null,
    topics: topics.map(topic => web3.utils.sha3(topic)) // "Transfer"
  }).on("data", async (log) => {
    const { address, data, topics, transactionHash } = log;
    try {
      if (!(address in tokens)) {
        const tokenContract = new web3.eth.Contract(erc20abi, address);
        tokens[address] = {
          'decimals': await tokenContract.methods.decimals().call(),
          'symbol': await tokenContract.methods.symbol().call()
        };
      }
      const decodedLog = web3.eth.abi.decodeLog(
        inputsDict[topics[0]],
        data,
        topics.slice(1)
      );
      logSuccess("===========================================================================");
      logSuccess("txHash:", transactionHash);
      logSuccess("from:  ", decodedLog['from']);
      logSuccess("to:    ", decodedLog['to']);
      logSuccess("symbol:", tokens[address]['symbol']);
      logSuccess("amount:", decodedLog["value"] /  10 ** tokens[address]['decimals']);
    } catch (error) {
      // non-ERC20 tokens transfers might result in invalid argument errors
      // logError(`Log decode error: (txHash: ${transactionHash}, data: ${data})`) 
    }
  });
};

main();