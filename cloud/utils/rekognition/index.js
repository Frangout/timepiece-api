require('dotenv').config();
const AWS = require('aws-sdk');
const CustomError = require('../custom-error/index');
const { strSanitize } = require('../validate/index');
const parseUtils = require('../../utils/parse-utils/index');

const MIN_BOUNDING_BOX = 0.05;

module.exports = {
  detectText(buffer, hash) {
    const rekognition = new AWS.Rekognition({ region: 'us-west-2' });
    return new Promise(async (resolve, reject) => {
      const hashDataFindQuery = parseUtils.query('HashData');
      hashDataFindQuery.equalTo('hash', hash);
      const hashDataInstance = await hashDataFindQuery.first();
      if (hashDataInstance) {
        resolve({
          words: hashDataInstance.get('words'),
          sentence: hashDataInstance.get('sentence'),
        });
      }

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

          const hashData = parseUtils.instance('HashData');
          hashData.set('sentence', sentence);
          hashData.set('words', words);
          hashData.set('hash', hash);
          hashData.save();

          resolve({ sentence, words });
        }
      });
    });
  },
};
