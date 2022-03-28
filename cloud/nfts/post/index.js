const { exists } = require('../../utils/validate/index');
const errors = require('../../utils/error-handling/index');
const parseUtils = require('../../utils/parse-utils/index');
const { duplicateHashMeme } = require('../../utils/meme-validation/index');
const memeValidation = require('../../utils/meme-validation/index');

const { detectText } = require('../../utils/rekognition/index');
const CustomError = require('../../utils/custom-error/index');
const { oneTimeEncryption } = require('../../utils/rsa-enc-dec/index');
const web3 = require('../../utils/web3/index');
const pHash = require("sharp-phash");
// const { tenCentsToEth } = require('../../utils/coinbase/index');
const { prepareFile } = require('../../utils/prepare-file/index');
const { toBinary } = require('../../utils/to-binary/index');
const { MEME_PRICE } = require('../../utils/constants/index');
const ETHMeme = require('../../utils/web3/memes/get/index');

module.exports = {
  async post_meme(req, res) {
    const { meme } = req.params;
    const { user } = req;
    if (exists(meme, user)) {
      let fileOps;
      try {
        const {
          normalizedFile,
          fileOperations,
          width,
          height,
          JPEGBuffer,
        } = await prepareFile(meme);
        fileOps = fileOperations;
        const { path } = await fileOperations.createFileFromBuffer();
        const hash = await pHash(path);
        if (hash === '0') {
          throw new CustomError(1010);
        }


        // First see if the meme exists, from any user and it does not have a valid tx, memeid, mined
        // i.e it might not be saved due to transaction thing etc!
        const memeValidatedQuery = parseUtils.query('Memes');
        memeValidatedQuery.equalTo('hash', hash);
        memeValidatedQuery.equalTo('validated', true);
        const memeValidatedInstance = await memeValidatedQuery.first();
        if (memeValidatedInstance) {
          const memeOwnedOnBlockchain = await ETHMeme.memeExistsOnBlockChain(hash);
          if (!memeOwnedOnBlockchain) {
            return({
              data: {
                duplicate: false,
                valid: true,
                hash: web3.utils.fromAscii(oneTimeEncryption(memeValidatedInstance.get('hash'))),
                dId: web3.utils.fromAscii(oneTimeEncryption(memeValidatedInstance.id)),
                value: MEME_PRICE,
              },
            });
            return false; // very impo. Program should exit from here now.
          }
        }

        const duplicateMemeInstance = await duplicateHashMeme(hash);
        if (duplicateMemeInstance) {
          return({
            data: {
              valid: false,
              duplicate: true,
              memes: [duplicateMemeInstance],
            },
          });
          return false;
        }

        const { sentence = ' ', words = [' '] } =  { sentence: Math.random().toString(), words: Math.random().toString().split('.') } //await detectText(JPEGBuffer, hash);
        
        // const sameWordMemesInstance = await memeValidation.sameWordsMemes({
        //   words, hashToCompare: hash,
        // });
        
        // if (sameWordMemesInstance && sameWordMemesInstance.length) {
        //   res.success({
        //     data: {
        //       valid: false,
        //       duplicate: true,
        //       memes: sameWordMemesInstance,
        //     },
        //   });
        //   return false;
        // }
        

        const similarHashMemesInstances = await memeValidation.similarHashMemes({
          sentence, hashToCompare: hash,
        });

        if (similarHashMemesInstances && similarHashMemesInstances.length) {
          return({
            data: {
              valid: false,
              duplicate: true,
              memes: similarHashMemesInstances,
            },
          });
          return false;
        }


        const similarHashWithSimilarSentences = await memeValidation.similarHashMemesWithSimilarSentence({
          sentence, hashToCompare: hash,
        });

        if (similarHashWithSimilarSentences && similarHashWithSimilarSentences.length) {
          return({
            data: {
              valid: false,
              duplicate: true,
              memes: similarHashWithSimilarSentences,
            },
          });
          return false;
        }

        // const similarHashWithSimilarSentences = similarHashMemesInstances.filter(similarHashMeme => {
        //   if (!similarHashMeme.sentence || !sentence) {
        //     delete similarHashMeme.sentence;
        //     return similarHashMeme;
        //   }
        //   const average = fuzzyMatchAverage(similarHashMeme.sentence, sentence);
        //   if (average > 50) {
        //     delete similarHashMeme.sentence;
        //     return similarHashMeme;
        //   }
        // }).filter(Boolean);

        // if (similarHashWithSimilarSentences.length) {
        //   res.success({ data: {
        //       duplicate: true,
        //       valid: false,
        //       memes: similarHashWithSimilarSentences,
        //     }
        //   });
        //   return false;
        // }


        const memesInstance = parseUtils.instance('Memes');
        const savedFile = await normalizedFile.save(null, parseUtils.sessTok(user));
        memesInstance.set('meme', savedFile);
        memesInstance.set('sentence', sentence);
        memesInstance.set('words', words);
        memesInstance.set('hash', hash);
        memesInstance.set('binaryHash', toBinary(hash));
        // memesInstance.set('mined', false);
        // memesInstance.set('txHash', undefined);
        // memesInstance.set('memeId', undefined);
        // memesInstance.set('owner', user);
        memesInstance.set('validated', true);
        memesInstance.set('width', width);
        memesInstance.set('height', height);

        const memeACL = new Parse.ACL();
        memeACL.setPublicReadAccess(true);
        memeACL.setPublicWriteAccess(false); // Only master key updates
        memesInstance.setACL(memeACL);

        const savedMeme = await memesInstance.save(null, parseUtils.sessTok(user));
        return({
          data: {
            duplicate: false,
            valid: true,
            hash: web3.utils.fromAscii(oneTimeEncryption(savedMeme.get('hash'))),
            dId: web3.utils.fromAscii(oneTimeEncryption(savedMeme.id)),
            value: MEME_PRICE,
          },
        });
      } catch (e) {
        errors.handleError(errors.constructErrorObject(e.code || 500, e), res);
      } finally {
        if (fileOps) {
          fileOps.deleteCreatedFile();
        }
      }
    }
  },
  initRoutes() {
    Parse.Cloud.define('post_meme', (req, res) => this.post_meme(req, res));
  },
};
