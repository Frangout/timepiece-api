const user = require('./user/index');
const memes = require('./nfts/index');
const report = require('./report/index');
const auctions = require('./auctions/index');
const votes = require('./votes/index');
const price = require('./price/index');

user.initRoutes();
memes.initRoutes();
report.initRoutes();
auctions.initRoutes();
votes.initRoutes();
price.initRoutes();
