<style src="./annotationLayer.css"></style>
<script>

	import componentFactory from './componentFactory'
	import pdfjsWrapper from './pdfjsWrapper'

	if ( process.env.VUE_ENV === 'server' ) {

		var PDFJS = require('pdfjs-dist/build/pdf.js');
		PDFJS.PDFJS.disableWorker = true;
	} else {

		var PDFJS = require('pdfjs-dist/webpack.js');
	}

	var component = componentFactory(pdfjsWrapper(PDFJS));
	component.PDFJS = PDFJS;

	export default component;
	
</script>