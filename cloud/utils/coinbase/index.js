const Client = require('coinbase').Client;
require('dotenv').config();
const apiKey = process.env.COINBASE_API_KEY;
const apiSecret = process.env.COINBASE_API_SECRET_KEY;
const CustomError = require('../custom-error/index');

var client = new Client({ apiKey, apiSecret });

module.exports = {
  tenCentsToEth() {
    return new Promise((resolve, reject) => {
      try {
        client.getSpotPrice({'currencyPair': 'ETH-USD'}, (err, result) => {
          if (err) {
            reject(err);
          }
          const { data: { amount } } = result;
          resolve(((1 / (+amount)) * 0.10).toFixed(18));
        });
      } catch (e) {
        throw new CustomError(500, e);
      }
    })
  }
}