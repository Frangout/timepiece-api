module.exports = {
  handleError(error, response) {
    console.error(error);
    throw error;
  },
  constructErrorObject(code, error) {
    const grok = {
      code,
      message: '',
      server: error,
    };
    switch (code) {
      case 202:
        grok.message = "Oh! Memer name was taken just a few seconds ago...";
        return grok;
      case 400:
        grok.message = "Bad request.";
        return grok;
        break;
      case 401:
        grok.message = "Not authorized to make this request. Please signup first.";
        return grok;
      case 500:
        grok.message = "Server error occured. Please try again.";
        return grok;
      case 1010:
        grok.message = "The image is invalid or is too small to process";
        return grok;
      default:
        grok.message = "Please try again";
        return grok;
    }
  }
};