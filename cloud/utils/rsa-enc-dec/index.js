require('dotenv').config();

var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.ONE_TIME_ENC; 

function oneTimeEncryption(text){
  var cipher = crypto.createCipher(algorithm,password)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
 
function oneTimeDecryption(text){
  var decipher = crypto.createDecipher(algorithm,password)
  var dec = decipher.update(text,'hex','utf8')
  dec += decipher.final('utf8');
  return dec;
}

module.exports = {
  oneTimeEncryption,
  oneTimeDecryption
};