require('dotenv').config();
const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider(
  process.env.INFURA_LINK
);
const web3 = new Web3(provider); 

module.exports = web3;