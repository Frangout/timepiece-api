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
