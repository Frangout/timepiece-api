const get = require('./get/index');
const post = require('./post/index');
const put = require('./put/index');

module.exports = {
  initRoutes() {
    get.initRoutes();
    post.initRoutes();
    put.initRoutes();
  },
};
