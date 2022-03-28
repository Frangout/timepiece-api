const web3 = require('../index');
const CustomError = require('../../custom-error/index');
const { strSanitize } = require('../../validate/index');
const parseUtils = require('../../parse-utils/index');
const { MEME_PRICE } = require('../../constants/index');
const abiDecoder = require('abi-decoder');
const ABI = require('../../eth-build/build/MemesChainCore.json');
const { oneTimeDecryption } = require('../../rsa-enc-dec/index');

module.exports = {
  async getTransaction(tx) {
    try {
      const transaction = await web3.eth.getTransaction(tx);
      return transaction;
    } catch (e) {
      throw new CustomError(500, e);
    }
  },

  async isTransactionHashValidToMemesChainCore(tx, user) {
    try {
      const {
        from: dirtyFrom,
        to: dirtyTo,
        value,
        input,
      } = await this.getTransaction(tx);
      const { from, to } = strSanitize({ from: dirtyFrom, to: dirtyTo });
      abiDecoder.addABI(JSON.parse(ABI.interface));
      const { params: [hash, dId] } = abiDecoder.decodeMethod(input);
      const { value: hashValue } = hash;
      const { value: dIdValue } = dId;

      if (
        user.get('username') === from &&
        to === process.env.MEMES_CHAIN_CORE_CONTRACT_ADDRESS.trim().toLowerCase() &&
        value === web3.utils.toWei(MEME_PRICE.toString(), 'ether')
      ) {
        const memesQuery = parseUtils.query('Memes');
        memesQuery.equalTo('hash', oneTimeDecryption(web3.utils.toAscii(hashValue)));
        memesQuery.equalTo('objectId', oneTimeDecryption(web3.utils.toAscii(dIdValue)));
        memesQuery.doesNotExist('txHash');
        const memesInstance = await memesQuery.first();
        if (memesInstance) {
          return true;
        }
        return false;
      }
      return false;
    } catch (e) {
      console.error(e);
      throw new CustomError(500, e);
    }
  },
};
