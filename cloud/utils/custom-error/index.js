class CustomError extends Error {
  constructor(code = 100, ...params) {
    super(...params);
    this.code = code;
    this.message = params;
  }
}

module.exports = CustomError;