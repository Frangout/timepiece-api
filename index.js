require('dotenv').config();
const express = require('express');
const { ParseServer } = require('parse-server');
const path = require('path');
const uppy = require('uppy-server');
const bodyParser = require('body-parser');
const session = require('express-session');
const app = express();
const xrp = require('./cloud/xrp');

app.use(session({
  secret: process.env.UPPY_SECRET_SESSION,
  resave: true,
  saveUninitialized: true,
}));


app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, X-Parse-Session-Token');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.header('Access-Control-Expose-Headers', 'Content-Length');
	next();
});

app.use(bodyParser.json({ limit: '100mb', verify(req, res, buf) {
	req.rawBody = buf;
},
}));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
// app.use(bodyParser.text({ limit: '100mb' }));
app.use(bodyParser.raw({ limit: '100mb' }))

// initialize uppy
const uppyOptions = {
  providerOptions: {
    instagram: {
      key: process.env.INSTA_KEY,
      secret: process.env.INSTA_SECRET,
    },
    google: {
      key: process.env.GOOGLE_KEY,
      secret: process.env.GOOGLE_SECRET,
    },
    dropbox: {
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET,
    },
    // you can also add options for dropbox here
  },
  server: {
    host: process.env.UPPY_SERVER_HOST,
    protocol: process.env.SERVER_PROTOCOL,
  },
  filePath: '/tmp/memeschain/',
  secret: process.env.UPPY_SECRET_SESSION,
};

app.use(uppy.app(uppyOptions));
uppy.socket(app.listen(3020), uppyOptions);

app.use('/static', express.static(path.join(__dirname, '/public/build/static'))); // For static build at root
app.use('/public', express.static(path.join(__dirname, '/public'))); // For avatars

// Init XRP
xrp.init();
// Init Parse
const api = new ParseServer({
  databaseURI: process.env.DATABASE_URI,
  cloud: __dirname + process.env.CLOUD_CODE_MAIN,
  appId: process.env.APP_ID,
  masterKey: process.env.MASTER_KEY,
  serverURL: process.env.SERVER_URL,
  allowClientClassCreation: true,
  filesAdapter: {
		module: '@parse/s3-files-adapter',
		options: {
			"bucket": process.env.S3_BUCKET,
      // "bucket": "memeschain.com",
      // optional:
      
      // "bucketPrefix": 'frills-dev-bucket-spaces', // default value
      "directAccess": true, // default value
      "baseUrl": process.env.S3_BASE_URL,//'https://frills-dev-bucket-s3.s3.us-east-1.amazonaws.com', // default value
      "signatureVersion": 'v4', // default value
			globalCacheControl: 'public, max-age=31536000',  // 365 days Cache-Control.

    }
	},
	
  publicServerURL: process.env.SERVER_URL,
});
app.use(process.env.PARSE_MOUNT, api);

// Routes
app.get('/', (req, res) => {
	res.sendStatus(200);
});

const httpServer = require('http').createServer(app);

httpServer.listen(Number(process.env.PORT), () => {});
