const { exists } = require('../../utils/validate/index');
const { oneTimeDecryption } = require('../../utils/rsa-enc-dec/index');
const parseUtils = require('../../utils/parse-utils/index');
const errors = require('../../utils/error-handling/index');
const CustomError = require('../../utils/custom-error/index');
const web3 = require('../../utils/web3/index');

const hasUserVoted = async (user, memeRefId) => {
  try {
    const hasUserVotedQuery = parseUtils.query('Votes');
    hasUserVotedQuery.equalTo('createdBy', user);
    hasUserVotedQuery.equalTo('meme', parseUtils.pointer('Memes', oneTimeDecryption(web3.utils.toAscii(memeRefId))));
    const hasVotedInstance = await hasUserVotedQuery.first();
    if (hasVotedInstance) {
      return {
        voted: hasVotedInstance.get('type'),
      };
    }
    return {
      voted: 0,
    };
  } catch (e) {
    throw new CustomError(500, e);
  }
};

module.exports = {
  async get_votes({ memeRefId, user }) {
    if (exists(memeRefId)) {
      try {
        const dankVotesQuery = parseUtils.query('Votes');
        dankVotesQuery.equalTo('meme', parseUtils.pointer('Memes', oneTimeDecryption(web3.utils.toAscii(memeRefId))));
        dankVotesQuery.equalTo('type', 1);
        const dankVotesCount = await dankVotesQuery.count();

        const basicVotesQuery = parseUtils.query('Votes');
        basicVotesQuery.equalTo('meme', parseUtils.pointer('Memes', oneTimeDecryption(web3.utils.toAscii(memeRefId))));
        basicVotesQuery.equalTo('type', -1);
        const basicVotesCount = await basicVotesQuery.count();

        const voted = user ? await hasUserVoted(user, memeRefId) : { voted: 0 };
        return {
          votes: {
            dank: dankVotesCount,
            basic: basicVotesCount,
            ...voted,
          },
        };
      } catch (e) {
				return {
          votes: {
            dank: 0,
            basic: 0,
          	voted: 0,
          },
        };
        throw new CustomError(500, e);
      }
    } else {
      throw new CustomError(400);
    }
  },
  initRoutes() {
    Parse.Cloud.define('get_votes', async (req, res) => {
      try {
        const votes = await this.get_votes(req, res);
        return({ data: votes });
      } catch (e) {
        errors.handleError(errors.constructErrorObject(e.code || 500), e, res);
      }
    });
  },
};

