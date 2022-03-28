const { exists, strSanitize } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');

module.exports = {
  async get_user(req, res) {
    const { memer: memSan, username: usnSan, bool } = req.params;
    const { memer, username } = strSanitize({ memer: memSan, username: usnSan });
    const { user } = req;
    if(exists(memer || username)) {
      const userQuery = parseUtils.query('User');
      memer ? userQuery.equalTo('memer', memer.toLowerCase()) : null;
      username ? userQuery.equalTo('username', username.toLowerCase()) : null;
      try {
        const data = await userQuery.first();
        if (data) {
          if (user) {
            if (user.id === data.id) {
              return({ data: { ...data.toJSON(), sameUser: true } });
            } else {
              return({ data: data.toJSON() });
            }
          } else {
            return({ data: data.toJSON() });
          }
          return true;
        } else {
          if (bool) {
            return({ data: false });
            return true;
          } else {
            errors.handleError(errors.constructErrorObject(404), res);
            return false;
          } 
        }
      } catch (e) {
        errors.handleError(errors.constructErrorObject(500, e), res);
        return false;
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
      return false;
    }
  },
  initRoutes() {
    Parse.Cloud.define('get_user', (req, res) => this.get_user(req, res));
  }
}