const { bufferOps } = require('../../utils/file/index');
const uniqid = require('uniqid');
const { toJPEG } = require('../../utils/image-utils/index');
const CustomError = require('../../utils/custom-error/index');

module.exports = {
  async prepareFile(meme) {
    try {
      const name = `${uniqid('memeschain_')}.jpeg`;
      const parseFile = new Parse.File(name, { base64: meme }, 'image/jpeg');
      const buffer = Buffer.from(parseFile._source.base64, 'base64');
      const { data: JPEGBuffer, width, height } = await toJPEG(buffer);
      const normalizedFile = new Parse.File(name, { base64: JPEGBuffer.toString('base64') }, 'image/jpeg');
      const fileOperations = bufferOps({ buffer: JPEGBuffer, name });
      return {
        fileOperations,
        normalizedFile,
        width,
        height,
        JPEGBuffer,
      };
    } catch (e) {
      throw new CustomError(500, e);
    }
  },
};
