const { exists, strSanitize } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');

module.exports = {
  async post_report(req, res) {
    const { file, data, report } = req.params;
    const { user } = req;
    // Just plain post
    if (exists(user)) {
      try {
        const reportInstance = parseUtils.instance('Report');
        reportInstance.set('file', file);
        reportInstance.set('data', data);
        reportInstance.set('report', report);
        reportInstance.set('createdBy', user);
  
        await reportInstance.save(null, parseUtils.sessTok(user));
        return({ data: true });
        return true;
      } catch(e) {
        errors.handleError(errors.constructErrorObject(500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },
  initRoutes() {
    Parse.Cloud.define('post_report', (req, res) => this.post_report(req, res));
  }
}