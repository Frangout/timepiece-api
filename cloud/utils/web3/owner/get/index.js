const MemesChainCoreInstance = require('../../../eth-build/meme');
const CustomError = require('../../../custom-error/index');
const { strSanitize } = require('../../../../utils/validate/index');

module.exports = {
  async ETH_getOwnerTokens(owner) {
    try {
      const tokensOfOwner = await MemesChainCoreInstance.methods.tokensOfOwner(owner).call();
      return tokensOfOwner || [];       
    } catch (e) {
      throw new CustomError(500, e);
    }
  }
}