<style src="./annotationLayer.css"></style>
<script>

	import componentFactory from './componentFactory.js'

	if ( process.env.VUE_ENV !== 'server' ) {

		var pdfjsWrapper = require('./pdfjsWrapper.js').default;
		var PDFJS = require('pdfjs-dist/build/pdf.js');
		var component = componentFactory(pdfjsWrapper(PDFJS));
	} else {

		var component = componentFactory({});
	}

	export default component;
</script>