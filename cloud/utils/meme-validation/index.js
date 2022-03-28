const { exists, strSanitize } = require('../validate/index');
const errors = require('../error-handling/index');
const parseUtils = require('../parse-utils/index');
const CustomError = require('../custom-error/index');
const dist = require("sharp-phash/distance");
const fuzz = require('fuzzball');
const ETHMeme = require('../../utils/web3/memes/get/index');

const SIMIILAR_HASH_MEME_HASH_FACTOR = 15;
const SAME_WORD_MEME_HASH_FACTOR = 20; // its comparing NLP values too, so high factor


module.exports = {
  async duplicateHashMeme(hash) {
    if (exists(hash)) {
      const memeQuery = parseUtils.query('Memes');
      memeQuery.equalTo('hash', hash);
      memeQuery.select('meme', 'hash');
      try {
        const duplicateMemes = await memeQuery.find();
        const [dupsOnBlockchain] = duplicateMemes.map(async (meme) => {
          const memeHash = meme.get('hash');
          try {
            const memeExists = await ETHMeme.memeExistsOnBlockChain(memeHash);
            if (memeExists) {
              return {
                meme: meme.get('meme').toJSON(),
              };
            }
          } catch (e) {
            return false;
          }
        }).filter(Boolean);

        if (dupsOnBlockchain) {
          return dupsOnBlockchain;
        } else {
          return false;
        }
      } catch (e) {
        throw new CustomError(500, e);
      }
    } else {
      throw new CustomError(400);
    }
  },

  async similarHashMemes({ hashToCompare, sentence }) {
    if (exists(hashToCompare)) {
      const memeQuery = parseUtils.query('Memes');
      memeQuery.select('meme', 'hash', 'sentence');
      const memes = await memeQuery.find();

      const similarHashMemes = [];
      for (let i = 0; i < memes.length; i++) {
        const meme = memes[i];
        if (meme) {
          const difference = dist(hashToCompare, meme.get('hash'));
          const fuzzyAverage = this.fuzzyMatchAverage(sentence, meme.get('sentence'));
          if (difference <= SIMIILAR_HASH_MEME_HASH_FACTOR && fuzzyAverage >= 90) {

            try {
              const memeExists = await ETHMeme.memeExistsOnBlockChain(meme.get('hash'));
              if (memeExists) {
                similarHashMemes.push({ meme: meme.get('meme') });
              }
            } catch (e) {
              // ignore
            }

            if (similarHashMemes.length === 10) {
              break;
            }
          }
        }
      }
      return similarHashMemes;
    }
    throw new CustomError(400);
  },

  // async sameWordsMemes({ words, hashToCompare }) {
  //   const memeQuery = parseUtils.query('Memes');
  //   // memeQuery.fullText('senetence', sentence);
  //   memeQuery.containsAll('words', words);
  //   // memeQuery.exists('memeId');
  //   memeQuery.select('memeId', 'meme', 'hash', 'sentence', 'words');
  //   const memes = await memeQuery.find();

  //   const similarSentenceMemes = [];
  //   for (let i = 0; i < memes.length; i++) {
  //     const meme = memes[i];
  //     if (meme) {
  //       const difference = pHash.hammingDistance(hashToCompare, meme.get('hash'));
  //       const fuzzyAverage = this.fuzzyMatchAverage(words.join(' '), meme.get('words').join(' '));
  //       if (difference <= SAME_WORD_MEME_HASH_FACTOR && fuzzyAverage >= 90) {

  //         try {
  //           const memeExists = await ETHMeme.memeExistsOnBlockChain(meme.get('hash'));
  //           if (memeExists) {
  //             similarSentenceMemes.push({ meme: meme.get('meme'), memeId: meme.get('memeId') });
  //           }
  //         } catch(e) {
  //           // ignore
  //           console.error(e);
  //         }

          
  //         if (similarSentenceMemes.length === 10) {
  //           break;
  //         }
  //       }
  //     }
  //   }

  //   return similarSentenceMemes;
  // },

  async similarHashMemesWithSimilarSentence({ sentence, hashToCompare }) {
    const memeQuery = parseUtils.query('Memes');
    memeQuery.fullText('sentence', sentence);
    memeQuery.ascending('$score');
    memeQuery.select('$score');
    memeQuery.select('meme', 'hash', 'sentence', 'words');
    const memes = await memeQuery.find();

    const similarSentenceMemes = [];
    for (let i = 0; i < memes.length; i++) {
      const meme = memes[i];
      if (meme) {
        const difference = dist(hashToCompare, meme.get('hash'));
        const fuzzyAverage = this.fuzzyMatchAverage(sentence, meme.get('sentence'));
        if (difference <= SAME_WORD_MEME_HASH_FACTOR && fuzzyAverage >= 90) {
          try {
            const memeExists = await ETHMeme.memeExistsOnBlockChain(meme.get('hash'));
            if (memeExists) {
              similarSentenceMemes.push({ meme: meme.get('meme') });
            }
          } catch (e) {
            // ignore
            console.error(e);
          }
        
          if (similarSentenceMemes.length === 10) {
            break;
          }
        }
      }
    }
    return similarSentenceMemes;
  },

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
