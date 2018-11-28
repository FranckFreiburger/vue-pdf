var loaderUtils = require('loader-utils');

module.exports = function(content) {

	var options = loaderUtils.getOptions(this);

	var data;
	if ( content instanceof Buffer )
		data = content;
	else
		data = Buffer.from(content);

	return 'module.exports = Buffer.from("'+data.toString('base64')+'", "base64")';
}

module.exports.raw = true;
