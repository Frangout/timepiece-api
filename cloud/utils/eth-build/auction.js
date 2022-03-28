require('dotenv').config();
const web3 = require('../web3/index');
const SaleClockAuction = require('./build/SaleClockAuction.json');

const SaleClockAuctionInstance = new web3.eth.Contract(
  JSON.parse(SaleClockAuction.interface),
  process.env.SALE_CLOCK_AUCTION_CONTRACT_ADDRESS,
);

module.exports = SaleClockAuctionInstance;
