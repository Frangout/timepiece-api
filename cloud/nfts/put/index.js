const { exists } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');
const { oneTimeDecryption } = require('../../utils/rsa-enc-dec/index');
const web3 = require('../../utils/web3/index');
const web3Utils = require('../../utils/web3/utils/index');

module.exports = {
  async put_meme(req, res) {
    const { txHash, dId, memeId } = req.params;
    const { user } = req;
    if (exists(txHash, dId, user)) {
      try {
        const isTransactionValid = await web3Utils.isTransactionHashValidToMemesChainCore(txHash, user);
        if (!isTransactionValid) {
          errors.handleError(errors.constructErrorObject(400), res);
          return false;
        }

        // Duplicate txHash
        const memesQueryForTxHash = parseUtils.query('Memes');
        memesQueryForTxHash.equalTo('txHash', txHash);
        const dupTxExists = memesQueryForTxHash.count();
        if (dupTxExists > 0) {
          errors.handleError(errors.constructErrorObject(400), res);
          return false;
        }

        const memeQuery = parseUtils.query('Memes');
        memeQuery.equalTo('objectId', oneTimeDecryption(web3.utils.toAscii(dId)));
        // memeQuery.include('owner', 'owner.memer');
        const memeInstance = await memeQuery.first();
        if (memeInstance) {
          memeId ? memeInstance.set('memeId', Number(memeId)) : null;
          memeInstance.set('txHash', txHash);
          memeId ? memeInstance.set('mined', true) : memeInstance.set('mined', false);
          const savedMeme = await memeInstance.save(null, parseUtils.sessTok(false, 'useMasterkey'));
          if (savedMeme) {
            return({
              data: {
                meme: savedMeme.get('meme').toJSON(),
                memer: user.get('memer'),
                memeId,
              },
            });
          } else {
            errors.handleError(errors.constructErrorObject(500), res);
          }
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
  initRoutes() {
    Parse.Cloud.define('put_meme', (req, res) => this.put_meme(req, res));
  },
};
