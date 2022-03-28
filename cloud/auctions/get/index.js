const { strSanitize } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const ETHMeme = require('../../utils/web3/memes/get/index');
const { oneTimeEncryption } = require('../../utils/rsa-enc-dec/index');
const ETHAuctions = require('../../utils/web3/auction/get/index');
const dbUtils = require('../../utils/db-utils/index');
const CustomError = require('../../utils/custom-error/index');
const parseUtils = require('../../utils/parse-utils/index');

const getTokens = async ({ memer, offset, limit }) => {
  try {
    if (memer) {
      const userQuery = parseUtils.query('User');
      userQuery.equalTo('memer', memer);
      userQuery.select('username');
      const userInstance = await userQuery.first();
      if (userInstance) {
        const username = userInstance.get('username');
        const { tokensOnAuction, total } = await ETHAuctions.getTokensOnAuctionOfOwner({ username, offset, limit });
        return { tokensOnAuction, total };
      } else {
        throw new CustomError(400);
      }
    } else {
      const { tokensOnAuction, total } = await ETHAuctions.getAllMemesOnAuction({ offset, limit });
      return { tokensOnAuction, total };
    }
    
  } catch (e) {
    throw new CustomError(500, e);
  }
  
};

module.exports = {
  async get_auctions(req, res) {
    const { offset = 0, limit = 12, memer: memerSan } = req.params;
    const { user } = req;
    const { memer = '' } = strSanitize({ memer: memerSan });
    try {
      const { tokensOnAuction: tokens, total } = await getTokens({ memer, offset, limit });
      const memesWithAuctionFromETH = await Promise.all(tokens.map(async ({ memeId: memeOnAuctionId, ...auction }) => {
        const {
          hash,
          dId,
          owner,
          memeId,
        } = await ETHMeme.ETH_getMeme({ memeId: memeOnAuctionId, auction });
        return {
          hash,
          dId,
          owner,
          memeId,
          auction,
        };
      }).filter(Boolean));
      const memesFromAuction = await dbUtils.getMemesFromDB(memesWithAuctionFromETH, user);
      return({
        data: {
          result: memesFromAuction.filter(Boolean).map(({
            objectId,
            createdAt: memeCreatedAt,
            updatedAt,
            owner: { createdAt, objectId: ownerObjectId, updatedAt: ownerUpdateAt, ...owner },
            ...rest
          }) => ({ ...rest, owner, memeRefId: oneTimeEncryption(objectId) })),
          total,
        },
      });
    } catch (e) {
      errors.handleError(errors.constructErrorObject(e.code || 500, e), res);
    }
  },
  initRoutes() {
    Parse.Cloud.define('get_auctions', (req, res) => this.get_auctions(req, res));
  },
};
