const get = require('./get/index');
const post = require('./post/index');
module.exports = {
  initRoutes() {
    get.initRoutes();
    post.initRoutes();
  }
}