# Timepiece & Dials NFTs?
 
Authenticate timepieces from brands with NFTs & a marketplace for artists and brands to sell their digital dials and timepieces to users & in Metaverse.

- - -

# Welcome

![Screenshot 2022-03-28 at 6.03.07 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648477366699/uth7IBD3Y.png)

- - -

# Architecture Diagram 🏛


![xrp-timepiece-arch.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648477449475/cx5MvTVmu.png)

- - -

XRPL Context

```
const xrpWallet = xrpl.Wallet.fromSeed(process.env.REACT_APP_XRPL_WALLET_PRIVATE_SEED)
const xrpClient = new xrpl.Client(process.env.REACT_APP_XRPL_NET_ADDR); //wss://xls20-sandbox.
await xrpClient.connect();
	
// Context
import React from "react";
export const XRPContext = React.createContext({});

// Pass 
<XRPContext.Provider value={this.props.xrp}>
<App />
<XRPContext.Provider>

// Now wallet and client is accessible in all the components via context
```

# Design 👨🏼‍🎨
The primary color used is #9d0000 orange for the app with Sans Serif Font

# Tech Stack 🛠️
### XRP Ledger
XRP ledger provides API to common methods and properties that blockchain application needs for payments, NFTs (XLS-20) and more.

### Front-end ➬
The **client-side** for the NFT dApp is a web app built with **React** (**CRA SPA**) and the component library used is **Antd** with **Craco**. The router library used to manage the browser-side navigation is **React-router v6**. The data flow within the web app is by **Redux**. The **Web3** wallet integration on the client-side is built with **XRPL.JS JS SDK.**

### Back-end ↔️
The server-side for the NFT dApp is a NodeJS app running **Express** and **Parse Server.** The off-chain storage, caching, and the queue is** MongoDB** managed by **Atlas** and **AgendaJS**. The NFT images are handled by **Sharp**. Duplicate detection is with a custom mix of **pHash and fuzzball distance with AWS Rekognition**. Reading data from the XRP Ledger is from XRPL.JS JS SDK

### Deployment 🛫
The backend is deployed on AWS with CI and CD managed by** Github workflows**. A combination of both EC2 and Docker container images orchestrated by **K8**'s managed by Porter. The contracts are deployed with in-house scripts. The client-side is deployed on **Netlify as a CRA SPA with CI and CD **automatically provided out of the box from Netlify!

- - -

# Features 🎛

- Register with your unique username tied to your XRP wallet address. ✅
- Connect XRP wallet with your username ✅
- Create a profile with an avatar and username ✅
- Smart contracts to mint, trade, sell, buy, authenticate NFTs on the XRP chain ✅
- Browse all NFTs on the marketplace that is both on sale and owned.  ✅
- Create your own timepiece dial and convert it into an NFT ✅
- Detect and prevent the minting of duplicate or plagiarised NFTs both off and on-chain ✅
- Once minted, list the NFT on the user profile and the marketplace ✅
- Allow off-chain community voting of NFTs with "UPVOTE" (+1) or "BASIC" (-1) votes. ✅
- Allow the ability to auction and trade the minted NFTs. ✅
- Set dynamic auction price with an in-house oracle
- Calculates the starting price of an NFT auction based on the popularity and number of "UPVOTE" votes an NFT has. ✅
- Enable buying, transfer, and relisting of NFTs that are on an auction if the auction price is met by the buyer. ✅


# The dApp 💻

### Sign in
The signing-in process to a dApp is different from a traditional email and password experience. To access a dApp the user has to **sign** a request from the wallet that is available as a browser plugin or a hardware wallet or a mobile app as a security measure first. Here is how this is achieved with React + XRPL.JS + Redux.

*UI state updated when the user has not signed via the wallet*

![Screenshot 2022-03-28 at 8.01.37 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648477911337/NhGUMzR35.png)

```
// Loader file
 const xrpWallet = xrpl.Wallet.fromSeed(process.env.REACT_APP_TESTING_PRIVATE_KEY)
 const xrpClient = new xrpl.Client(process.env); // wss://xls20-sandbox.rippletest.net:51233
 await xrpClient.connect();

import { XRPContext } from "../../context";

class SignIn extends Component {
    static contextType = XRPContext;

  async componentWillMount() {
    const { Client, Wallet } = this.context;
    this.props.providerCurrentAccount(Wallet.address);
  }
}

```

*Trigger the wallet for signing in*
```
export const generateWalletSign = async ({ address, publicKey, privateKey }) => {
  try {
    const wallet = new xrpl.Wallet(publicKey, privateKey);
    const signature = wallet.sign({
      TransactionType: 'TrustSet',
      Account: address
    });
    return signature.tx_blob;
  } catch (e) {
    throw e;
  }
};

```
*This authenticates the user signing from the wallet*

### Detecting networks and wallet states.
XRP provides the ability to build and publish your contracts on the Main network as well as multiple test networks. The users of your dApps can also interact with these networks as well. So, it becomes vitally important to make sure to detect that the users are on the right network and on the right wallet state before using your dApp. Again this can be achieved with React + XRPLS.JS + Redux UI state validation

### Creating and minting Timepieices NFTs

![Screenshot 2022-03-28 at 6.18.40 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648478232561/UcFnjR3t-.png)

Minting involves fine-grained interactions between the client UI + XRPLJS, smart contracts, and the server.

*Redux action with XRPL.JS method to mint a timepiece NFT and return the hash for the UI to validate*
```
   export const signTransaction = ({ wallet, client, url = '', account, hash, dId, loader = false, value = 0 }) => async (dispatch) =>  {

  if (hash && dId) {
    try {
      if (loader) {
        dispatch({
          type: CREATE_NFT_TRANSACTION_LOADING,
          payload: {},
        });
      }

      const transactionBlob = {
        TransactionType: "NFTokenMint",
        Account: wallet.classicAddress,
        URI: xrpl.convertStringToHex(url),
        Flags: 8,
        TokenTaxon: 0
      }

      const tx = await client.submitAndWait(transactionBlob,{wallet})

      const nfts = await client.request({
        method: "account_nfts",
        account: wallet.classicAddress
      })
      console.log(tx)
       dispatch({
        type: CREATE_NFT_TRANSACTION_SUCCESS,
        payload: {
          success: {
            ok: true,
            txHash: tx.result.hash,
            NFTId: tx.id,
            ...tx,
          },
        },
      });
    } catch (e) {
      dispatch({
        type: CREATE_NFT_TRANSACTION_ERROR,
        payload: {
          errors: {
            error: true,
            message: e.message,
          },
        },
      });
    }
  }
};
```

*The above method invoked by the UI*


![Screenshot 2022-03-28 at 6.19.29 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648478535950/u1zUiySbM.png)

![Screenshot 2022-03-28 at 6.24.31 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648478545848/VbRA3o3lC.png)

### Preventing duplicate or plagiarized NFTs from minting
Since creators and brands put in a lot of effort to create NFT dilas which can be later auctioned or sold on the platform puts an incentive for users to copy the most popular ones.
To prevent this we have come up with an algorithmic + AI solution that produces a duplicate score. Anything above 60 is not worth minting.


- Generating pHash on NFTs with Sharp-pHash to compare the hamming distance
```
const difference = pHash.hammingDistance(hashToCompare, nft.get('hash'));
```
- Fuzzy match average on the words and sentences in a NFT
```
  fuzzyMatchAverage(str1, str2) {
    const { inStr1, inStr2 } = strSanitize({ inStr1: str1, inStr2: str2 });
    if (!inStr1 && !inStr2) {
      return 100;
    }

    if (!inStr1 || !inStr2) {
      return 0;
    }
    const ratio = fuzz.ratio(inStr1, inStr2);
    const partialRatio = fuzz.partial_ratio(inStr1, inStr2);
    const tokenSortRatio = fuzz.token_sort_ratio(inStr1, inStr2);
    const tokenSetRatio = fuzz.token_set_ratio(inStr1, inStr2);
    return (ratio + partialRatio + tokenSortRatio + tokenSetRatio) / 4;
  },
};
```
- Using AWS Rekognition to detect the words and sentences (for logo, dials, serial number) used in conjunction with pHash's hamming distance and fuzzball ratio

Using the combination of AI, hashing, and Levenshtein distance with Fuzzballs we predict the possibility of the NFT being a duplicate. This prediction is very nuanced and has a lot of edge cases like NFT template is the same but the text in the NFT is worded differently, etc. 

**Let’s dig deep into it**. As an owner of an NFT of a luxury dial, you have the ability to put your NFT up for auction and sell it. But there is a catch. The starting price of your auction will be 10 XRP times the number of UPVOTE votes your NFT has. Higher the number of UPVOTE votes higher will be your starting price.

So, if your NFT has 15 upvotes, you get to put it up for auction at 150 XRP. BAM! That’s some kind of dough you get for popularity.

If anybody wants to buy your NFT which is at auction, they have to pay up whatever the current auction price is. As a part of owning the NFT, the new owner will get upvotes along with the NFT. If he/she/they decide to sell it, the price will always be greater than that of what the previous owner sold it plus the number of votes the new owner has managed to get.

### Off-chain NFT voting

To deduce an NFTs popularity and to indicate prices for the auction contract, an off-chain voting mechanism has been built in for authenticated users, which acts as an oracle to detect suitable auction prices for the NFT.



### On-chain auction
Auctions, specifically dutch are the trading mechanism for buying and selling NFTs on the platform. 
The auctions and the sale modules require the complete tech stack interaction. 

- The voting oracles predict the price for the auction off-chain based on the number of upvotes

- The client UI XRPLJS triggers the auction contract methods with the data from the oracle.

- The actual solidity contract moves the NFT from the seller's wallet to the contract's wallet and holds it with price rules factoring out equally until the auction time runs out.



*Trigger auctions from XRPLJS*
```
TODO
```


![Screenshot 2022-03-28 at 6.27.29 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648478837138/SZj_XsWo4.png)


### Marketplace
The marketplace is a section within the app that basically acts as a snapshot timeline of all the NFTs on the blockchain. The marketplace listing is the server-side workhorse module that reads data from the XRP Ledger using the Node XRPLJS library and maps the NFT hash and id data with the Mongo Database + IPFS/S3 for efficient and cheaper storage strategies.


![Screenshot 2022-03-28 at 6.24.31 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648478887521/WATioJfj3.png)

The Node server app exposes an API to the client that lists all the NFTs that are on the marketplace or on auction to the client by reading the blockchain, mapping it to Mongo, and then caching the results until the next NFT has been minted on the platform.
```
 async get_nfts(req, res) {
    const { account: accountSan, offset = 0, limit = 12, order = 'desc', selling, account } = req.params;
    const { account } = strSanitize({ account: accountSan });
    const { user } = req;
    if (exists(account)) {
      try {
        const nfts = await global.xrpClient.request({
          method: "account_nfts",
          account: account
        })
        const userQuery = parseUtils.query('User');
        userQuery.equalTo('account', account);
        const foundUserInstance = await userQuery.first();

        if (foundUserInstance) {
          const username = foundUserInstance.get('username');
          const {
            nftsOfOwnerFromXRPL,
            total,
          } = await XRPNFTs.XRP_getNFTsOfOwner({
            username, offset, limit, order,
          });
          const nftsFromDB = await dbUtils.getNFTsFromDB(nftsOfOwnerFromXRPL, user);
          return({
            data: {
              result: nftsFromDB
                .filter(Boolean)
                .map(({ objectId, ...nft }) => ({
                  nftRefId: oneTimeEncryption(objectId),
                  ...nft,
                })),
              total,
            },
          });
        } else {
          errors.handleError(errors.constructErrorObject(404), res);
        }
      } catch (e) {
        errors.handleError(errors.constructErrorObject(e.code || 500, e), res);
      }
    } else {
      errors.handleError(errors.constructErrorObject(400), res);
    }
  },
```
- - -

# Responsive design is supported with media queries 🔮



![Screenshot 2022-03-28 at 8.21.54 PM.png](https://cdn.hashnode.com/res/hashnode/image/upload/v1648479146717/yFZQQoxbi.png)


I have put my best efforts to make the architecture diagram as descriptive and elaborate as possible so the need to write it down further is reduced.

- - -

# Recipes 🥘

### Detect words and sentences from the AI image response
```
     rekognition.detectText({
        Image: {
          Bytes: buffer,
        },
      }, (err, { TextDetections: result } = {}) => {
        if (err) {
          reject(err);
        } else {
          const dirtyString = result.reduce((prev, {
            Confidence,
            Type,
            DetectedText,
            Geometry: { BoundingBox: { Height, Width } },
          }) => {
           
            if (Height > MIN_BOUNDING_BOX && Width > MIN_BOUNDING_BOX) {
              if (Confidence >= 70 && Type === 'LINE') {
                prev += DetectedText + ' ';
              }
            }
            return prev;
          }, '').trim();

          const words = result.map(({
            Confidence,
            Type,
            DetectedText,
            Geometry: { BoundingBox: { Height, Width } },
          }) => {
            if (Height > MIN_BOUNDING_BOX && Width > MIN_BOUNDING_BOX) {
              if (Confidence >= 70 && Type === 'WORD') {
                return DetectedText.trim().toLowerCase();
              }
            }
            return false;
          }).filter(Boolean);

          const { sentence } = strSanitize({ sentence: dirtyString });
```

### Encryption and decryption for web3 wallet sign
```
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.MULTI_ENCRYPTION_KEY;
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = new Buffer(textParts.shift(), 'hex');
  let encryptedText = new Buffer(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);

  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
```
### Sharp image normalization to apply the pHash distance equally
```
const sharp = require('sharp');

module.exports = {
  toJPEG(buffer) {
    return new Promise((resolve, reject) => {
      sharp(buffer).flatten().trim(10).jpeg()
        .toBuffer({ resolveWithObject: true })
        .then(({ data, info: { width = 0, height = 0 } }) => resolve({ data, width, height }))
        .catch(err => reject(err));
    });
  },
};

```
### Real-time XRP to USD with Coinbase
```
const Client = require('coinbase').Client;
require('dotenv').config();
const apiKey = process.env.COINBASE_API_KEY;
const apiSecret = process.env.COINBASE_API_SECRET_KEY;
const CustomError = require('../custom-error/index');

var client = new Client({ apiKey, apiSecret });

module.exports = {
  tenCentsToXrp() {
    return new Promise((resolve, reject) => {
      try {
        client.getSpotPrice({'currencyPair': 'XRP-USD'}, (err, result) => {
          if (err) {
            reject(err);
          }
          const { data: { amount } } = result;
          resolve(((1 / (+amount)) * 0.10).toFixed(10));
        });
      } catch (e) {
        throw new CustomError(500, e);
      }
    })
  }
}
```

- - -

# Challenges ⛰

WIP

- - -

# Good engineering practices 🧑🏽‍💻
- ✅  Linting by ESLint
- ✅  Prettier syntax indentation.
- ✅  Redux data flow throughout the app with reducers, actions, types, and store.
- ✅  Easy to understand folder structure for the React JSX with components, routes, utils, services, and more.
- ✅  Simple and reusable component design.
- ✅  Personal framework for the ExpressJS + ParseJS backend with SOLID coding principles.
- ✅  Tested smart contracts.



# Connect with me 😀
- [srameshrr on Twitter](https://twitter.com/srameshrr)
- [srameshr on Github](https://github.com/srameshr)



