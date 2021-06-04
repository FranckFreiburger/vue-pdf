import { CMapCompressionType } from 'pdfjs-dist/es5/build/pdf.js'

// see https://github.com/mozilla/pdf.js/blob/628e70fbb5dea3b9066aa5c34cca70aaafef8db2/src/display/dom_utils.js#L64

export default function() {

	this.fetch = function(query) {

		return import('./buffer-loader!pdfjs-dist/cmaps/'+query.name+'.bcmap' /* webpackChunkName: "noprefetch-[request]" */)
		.then(function(bcmap) {
			//加载完语言文件后清除缓存,问题:多次打开pdf时不显示文字.
			delete require.cache[require.resolve('./buffer-loader!pdfjs-dist-sign/cmaps/'+query.name+'.bcmap')];
			return {
				cMapData: bcmap.default,
				compressionType: CMapCompressionType.BINARY,
			};
		});
	}
};
