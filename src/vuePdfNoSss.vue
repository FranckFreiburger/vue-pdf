<style src="./annotationLayer.css"></style>
<script>

	import componentFactory from './componentFactory.js'

	if ( process.env.VUE_ENV !== 'server' ) {

		var pdfjsWrapper = require('./pdfjsWrapper.js').default;
		var PDFJS = require('pdfjs-dist/es5/build/pdf.js');

		if ( typeof window !== 'undefined' && 'Worker' in window && navigator.appVersion.indexOf('MSIE 10') === -1 ) {

			var PdfjsWorker = require('worker-loader!pdfjs-dist/es5/build/pdf.worker.js');
			PDFJS.GlobalWorkerOptions.workerPort = new PdfjsWorker();
		}

		var component = componentFactory(pdfjsWrapper(PDFJS));
	} else {

		var component = componentFactory({});
	}

	export default component;
</script>