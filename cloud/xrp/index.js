const xrpl = require('xrpl')

module.exports = {
	async init() {
		global.xrpClient = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233")
		await global.xrpClient.connect()
		return global.xrpClient;
	},
}