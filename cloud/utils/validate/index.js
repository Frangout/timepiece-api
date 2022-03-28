const MAX_MEDIA_LENGTH = 5;

module.exports = {
    exists(...params) {
        return params.every(param => param !== undefined && param !== null);
    },
    strSanitize(param) {
        if (param instanceof Object) {
            return Object.keys(param).reduce((p, n) => {
                if (typeof param[n] === "string") {
                  return {
                      ...p,
                      [n]: param[n].trim().toLowerCase(),
                    }
                }
                return p;
              }, {})
        } else if (typeof param === "string"){
            return param.trim().toLowerCase();
        } else {
            return {};
        }
    },
    mediaLength(media) {
        return media && media.length && media.length <= MAX_MEDIA_LENGTH
    }
}