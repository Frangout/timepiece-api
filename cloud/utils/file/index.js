const fs = require('fs');
const fse = require('fs-extra')


module.exports = {
  bufferOps({ buffer, name }) {
    const dirAvail = fse.ensureDirSync('/tmp/memeschain/');
    const path = `/tmp/memeschain/${name}`;
    return {
      createFileFromBuffer() {
        return new Promise((resolve, reject) => {
          fs.open(path, 'w', function(err, fd) {  
            if (err) {
              reject(err);
            }
            fs.write(fd, buffer, 0, buffer.length, null, function(err) {
              if (err) reject(err);
              fs.close(fd, function() {
                resolve({ fd, path });
              });
            });
          });
        }) 
      },
      deleteCreatedFile() {
        fs.unlinkSync(path);
      }
    };
  },
};