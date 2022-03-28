const { exists } = require('../../utils/validate/index');
const { oneTimeDecryption } = require('../../utils/rsa-enc-dec/index');
const parseUtils = require('../../utils/parse-utils/index');
const errors = require('../../utils/error-handling/index');

module.exports = {
  async post_vote(req, res) {
    const { type, memeRefId } = req.params;
    const { user } = req;
    if (exists(type, user, memeRefId)) {
      try {
        const votesQuery = parseUtils.query('Votes');
        votesQuery.equalTo('meme', parseUtils.pointer('Memes', oneTimeDecryption(memeRefId)));
        votesQuery.equalTo('createdBy', user);
        const hasUserVoted = await votesQuery.first();
        if (hasUserVoted) {
          hasUserVoted.set('type', type === 1 ? 1 : -1);
          await hasUserVoted.save(null, parseUtils.sessTok(user));
          return({ data: type === 1 ? 1 : -1 });
        } else {
          const votesInstance = parseUtils.instance('Votes');
          votesInstance.set('type', type === 1 ? 1 : -1); // Safeguarding against bad input
          votesInstance.set('createdBy', user);
          votesInstance.set('meme', parseUtils.pointer('Memes', oneTimeDecryption(memeRefId)));
          const voteACL = new Parse.ACL(user);
          voteACL.setPublicReadAccess(true);
          votesInstance.setACL(voteACL);
          await votesInstance.save(null, parseUtils.sessTok(user));
          return({ data: type === 1 ? 1 : -1 });
        }
      } catch (e) {
        errors.handleError(errors.constructErrorObject(500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },
  initRoutes() {
    Parse.Cloud.define('post_vote', (req, res) => this.post_vote(req, res));
  },
};
