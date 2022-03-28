const { exists, strSanitize } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');
// const ethSigUtils = require('eth-sig-util');
const xrpl = require('xrpl');

const uniqid = require('uniqid');
const { oneTimeEncryption } = require('../../utils/rsa-enc-dec/index');

module.exports = {
  async post_user(req, res) {
    const { sign, account: accSan, memer: sanMemer, avatar } = req.params;
    const { account, memer } = strSanitize({ account: accSan, memer: sanMemer }); 
    if(exists(sign, account, memer)) {

      if(memer.length <= 3 || memer.length > 32 || !new RegExp("^[a-zA-Z0-9_]+$").test(memer)) {
        errors.handleError(errors.constructErrorObject(500), res);
        return false;
      } 

      const decodedSignature = new xrpl.decode(sign)

      if (decodedSignature.Account.toLocaleLowerCase() === account.toLocaleLowerCase()) {
        // This validates that the account holder is making the request
        try {

          // Login existing user
          const userQueryForLogin = parseUtils.query("User");
          userQueryForLogin.equalTo("username", account);
          userQueryForLogin.equalTo("memer", memer);
          const existingUser = await userQueryForLogin.first({ useMasterKey: true });
          if (existingUser) {
            const userToLoginInstance = parseUtils.instance("User");
            const loggedInUser = await Parse.User.logIn(account, oneTimeEncryption(account));
            return({ data: loggedInUser });
            return true;
          } else {
            // Search for username again
            const userQuery = parseUtils.query("User");
            userQuery.equalTo('memer', memer);
            const userWithSameMemerName = await userQuery.first();
            if (userWithSameMemerName) {
              errors.handleError(errors.constructErrorObject(202), res);
              return false;
            }
            const userInstance = parseUtils.instance("User");
            userInstance.set('username', account);
            userInstance.set('password', oneTimeEncryption(account));
            // Caution!!!! Never store sign
            // /* userInstance.set('sign', sign); */ // do not store this on the user object. Because other users should not be able to read this. Either create a pointer to another field and store it there or ignore it for now.
            userInstance.set('memer', memer);
            userInstance.set('avatar', avatar);
            const savedUser = await userInstance.signUp(null);
            return({ data: savedUser });
            return true;
          }
        } catch (e) {
          console.error(e);
          errors.handleError(errors.constructErrorObject(500, e), res);
        }
      } else {
        errors.handleError(errors.constructErrorObject(500), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },
  initRoutes() {
    Parse.Cloud.define('post_user', (req, res) => this.post_user(req, res));
  }
}