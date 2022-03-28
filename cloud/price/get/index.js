const { exists } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const getVotes = require('../../votes/get/index');
const web3 = require('../../utils/web3/index');

const PRICE_FOR_BELOW_50 = 0.01;
const PRICE_FOR_BELOW_100 = 0.1;
const BASE_PRICE = 0.001;

module.exports = {
  async get_price(req, res) {
    const { memeRefId } = req.params;
    // Just plain post
    if (exists(memeRefId)) {
      try {
        const { votes: { dank } } = await getVotes.get_votes({ memeRefId: web3.utils.toHex(memeRefId) });
        const getPriceToVote = (dankVotes = 1) => dankVotes * BASE_PRICE;
        
        return({ data: getPriceToVote(dank) });
      } catch (e) {
        errors.handleError(errors.constructErrorObject(500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },
  initRoutes() {
    Parse.Cloud.define('get_price', (req, res) => this.get_price(req, res));
  },
};
