require('dotenv').config();
const web3 = require('../web3/index');
const MemesChainCore = require('./build/MemesChainCore.json');

const MemesChainCoreInstance = new web3.eth.Contract(
  JSON.parse(MemesChainCore.interface),
  process.env.MEMES_CHAIN_CORE_CONTRACT_ADDRESS,
);

module.exports = MemesChainCoreInstance;
