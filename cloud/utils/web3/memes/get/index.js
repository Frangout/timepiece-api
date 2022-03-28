require('dotenv').config();
const MemesChainCoreInstance = require('../../../eth-build/meme');
const CustomError = require('../../../custom-error/index');
const { strSanitize } = require('../../../../utils/validate/index');
const { oneTimeEncryption } = require('../../../rsa-enc-dec/index');
const web3 = require('../../index');
const _ = require('lodash');
const ETHAuction = require('../../auction/get/index');

module.exports = {

  async ETH_getMemesOfOwner({ username, offset = 0, limit = 12, order = 'desc' }) {
    try {
      var tokensOfOwner = await MemesChainCoreInstance.methods.tokensOfOwner(username).call();
			var tokensOfOwnerCopy = [...tokensOfOwner];
      tokensOfOwner = order === 'desc' ? tokensOfOwnerCopy.reverse() : null;
      const paginated = tokensOfOwner.slice(offset, offset + limit);
      const memesOfOwner = await Promise.all(paginated
        .map(async (memeId) => {
          const meme = await this.ETH_getMeme({ memeId: Number(memeId) });
          return { ...meme, memeId };
        }),
      );

      return {
        memesOfOwnerFromETH: memesOfOwner.map(({
          hash,
          dId,
          owner,
          memeId,
          auction,
        }) => ({
          memeId,
          hash,
          dId,
          owner: strSanitize(owner),
          auction,
        })),
        total: tokensOfOwner.length,
      };
    } catch (e) {
      throw new CustomError(500, e);
    }
  },

  async ETH_getMeme({ memeId, auction } = {}) {
    try {
      const {
        hash = '',
        dId = '',
        creationTime,
      } = await MemesChainCoreInstance.methods.getMeme(memeId).call();
      const owner = await MemesChainCoreInstance.methods.ownerOf(memeId).call();
      return {
        memeId,
        hash,
        dId,
        owner: strSanitize(owner),
        creationTime,
        auction: auction ? auction : await ETHAuction.getMemeAuction(memeId),
      };
    } catch (e) {
      throw new CustomError(500, e);
    }
  },

  async memeExistsOnBlockChain(hash) {
    const index = '0000000000000000000000000000000000000000000000000000000000000005';
    const key = web3.utils.fromAscii(oneTimeEncryption(hash));

    try {
      const hashExists = await web3.eth.getStorageAt(
        process.env.MEMES_CHAIN_CORE_CONTRACT_ADDRESS,
        web3.utils.sha3(key + index, { encoding: 'hex' }),
      );
      return web3.utils.toDecimal(hashExists);
    } catch (e) {
      return 0;
    }
  },

  async getAllMemesFromETH({ offset = 0, limit = 12, sort = 'desc' } = {}) {
    const totalSupply = (await MemesChainCoreInstance.methods.totalSupply().call()) - 1;
    const fetchTill = sort === 'desc' ? totalSupply - (offset + limit) : ((totalSupply + offset) + limit) - totalSupply;
    const fetchFrom = sort === 'desc' ? totalSupply - offset : offset;
    const memesIndices = _.range(fetchFrom, fetchTill);

    const memes = await Promise.all(memesIndices.map(async (memeIndex) => {
      try {
        const meme = await this.ETH_getMeme({ memeId: memeIndex });
        return meme;
      } catch (e) {
        // ignore
      }
    }));
    return { memesFromETH: memes.filter(Boolean), total: totalSupply };
  },
};
