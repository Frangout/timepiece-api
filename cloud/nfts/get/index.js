const { exists, strSanitize } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');
const ETHMeme = require('../../utils/web3/memes/get/index');
const ETHAuction = require('../../utils/web3/auction/get/index');
const { oneTimeDecryption, oneTimeEncryption } = require('../../utils/rsa-enc-dec/index');
const dbUtils = require('../../utils/db-utils/index');
const { getXrp } = require('../../xrp');

module.exports = {
  async get_meme(req, res) {
    const { meme, account } = req.params;
    const { user } = req;
    if (exists(meme)) {
      try {
        const {
          hash,
          dId,
          owner,
          memeId,
          auction,
        } = await ETHMeme.ETH_getMeme({ memeId: meme });
        const [{ objectId, ...memeFromDB }] = await dbUtils.getMemesFromDB([{ memeId, hash, dId, owner, auction }], user);
        if (memeFromDB) {
          return({
            data: {
              memeRefId: oneTimeEncryption(objectId),
              ...memeFromDB,
            },
          });
        } else {
          errors.handleError(errors.constructErrorObject(404), res);
        }
      } catch (e) {
        errors.handleError(errors.constructErrorObject(500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },

  async get_nfts(req, res) {
    const { account: accountSan, offset = 0, limit = 12, order = 'desc', selling, account } = req.params;
    const { account } = strSanitize({ account: accountSan });
    const { user } = req;
    if (exists(account)) {
      try {
        const nfts = await global.xrpClient.request({
          method: "account_nfts",
          account: account
        })
        const userQuery = parseUtils.query('User');
        userQuery.equalTo('account', account);
        const foundUserInstance = await userQuery.first();

        if (foundUserInstance) {
          const username = foundUserInstance.get('username');
          const {
            nftsOfOwnerFromXRPL,
            total,
          } = await XRPNFTs.XRP_getNFTsOfOwner({
            username, offset, limit, order,
          });
          const nftsFromDB = await dbUtils.getNFTsFromDB(nftsOfOwnerFromXRPL, user);
          return({
            data: {
              result: nftsFromDB
                .filter(Boolean)
                .map(({ objectId, ...nft }) => ({
                  nftRefId: oneTimeEncryption(objectId),
                  ...nft,
                })),
              total,
            },
          });
        } else {
          errors.handleError(errors.constructErrorObject(404), res);
        }
      } catch (e) {
        errors.handleError(errors.constructErrorObject(e.code || 500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },

  initRoutes() {
    Parse.Cloud.define('get_meme', (req, res) => this.get_meme(req, res));
    Parse.Cloud.define('get_memes', (req, res) => this.get_memes(req, res));
  },
};