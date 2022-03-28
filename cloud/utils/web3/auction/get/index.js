require('dotenv').config();
const { strSanitize } = require('../../../validate/index');
const SaleClockAuctionInstance = require('../../../eth-build/auction');
const MemesChainCoreInstance = require('../../../eth-build/meme');
const CustomError = require('../../../custom-error/index');
const _ = require('lodash');

module.exports = {
  async getAllMemesOnAuction({ offset, limit }) {
    try {
      const totalSupply = await MemesChainCoreInstance.methods.totalSupply().call();
      const memesIndices = _.range(totalSupply, -1);
      const auctions = await Promise.all(memesIndices.map(async (ele) => {
        const auctionData = await this.getMemeAuction(ele);
        return auctionData;
      }));
      const filteredAuctions = auctions.filter(Boolean);
      const paginated = filteredAuctions.slice(offset, offset + limit);
      return { tokensOnAuction: paginated, total: filteredAuctions.length };
    } catch (e) {
      throw new CustomError(500, e);
    }
  },

  async getMemeAuction(memeId) {
    try {
      const {
        seller,
        startingPrice,
        endingPrice,
        duration,
        startedAt,
      } = await SaleClockAuctionInstance.methods.getAuction(memeId).call();
      const currentPrice = await SaleClockAuctionInstance.methods.getCurrentPrice(memeId).call();
      return {
        seller,
        startingPrice,
        endingPrice,
        duration,
        startedAt,
        memeId,
        currentPrice,
      };
    } catch (e) {
      // Ignore error messages
      return false;
    }
  },

  async getTokensOnAuctionOfOwner({ username, offset = 0, limit = 12 }) {
    const totalSupply = (await MemesChainCoreInstance.methods.totalSupply().call()) - 1;
    const memesIndices = _.range(totalSupply, -1);

    const tokensOnAuction = (await Promise.all(memesIndices.map(async (index) => {
      const auctionDetails = await this.getMemeAuction(index);
      if (auctionDetails) {
        return strSanitize(auctionDetails.seller) === strSanitize(username) ? auctionDetails : false;
      }
      return false;
    }))).filter(Boolean);
    const paginated = tokensOnAuction.slice(offset, offset + limit);
    return { tokensOnAuction: paginated, total: tokensOnAuction.length };
  },
};
