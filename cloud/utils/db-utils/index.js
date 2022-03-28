const { oneTimeDecryption } = require('../rsa-enc-dec/index');
const web3 = require('../web3/index');
const { strSanitize } = require('../validate/index');
const parseUtils = require('../parse-utils/index');
const getVotes = require('../../votes/get/index');
const CustomError = require('../custom-error/index');

const getMemesFromDB = (memesOfOwnerFromETH, user) => Promise.all(memesOfOwnerFromETH.map(async ({
  memeId,
  hash,
  dId,
  owner,
  auction,
}) => {
  let oneTimeHashDecryptionValue = '';
  let oneTimeDIdDecryptionValue = '';

  try {
    oneTimeHashDecryptionValue = oneTimeDecryption(web3.utils.toAscii(hash));
    oneTimeDIdDecryptionValue = oneTimeDecryption(web3.utils.toAscii(dId));
  } catch (e) {
    console.error('ERROR DECRYPTING: ', hash, dId);
    // Do nothing
  }

  try {
    const userQuery = parseUtils.query('User');
    userQuery.equalTo('username', strSanitize(auction && auction.seller ? auction.seller : owner));
    userQuery.select(['memer', 'username', 'avatar']);
    const userInstance = await userQuery.first();
    const memesQuery = parseUtils.query('Memes');
    // memesQuery.include('owner');
    memesQuery.select(['meme', 'width', 'height']);
    memesQuery.equalTo('hash', oneTimeHashDecryptionValue);
    memesQuery.equalTo('objectId', oneTimeDIdDecryptionValue);

    // Since ethereum itself is saying that this meme coming from it is valid
    // memesQuery.notEqualTo('mined', false);
    // memesQuery.exists('memeId');
    const meme = await memesQuery.first();
    const votes = await getVotes.get_votes({ memeRefId: dId, user });
    if (meme && userInstance) {
      return {
        memeId,
        ...meme.toJSON(),
        owner: userInstance.toJSON(),
        auction,
        ...votes,
      };
    }
    return null;
  } catch (e) {

    throw new CustomError(500, e);
  }
}));


module.exports = {
  getMemesFromDB,
};

