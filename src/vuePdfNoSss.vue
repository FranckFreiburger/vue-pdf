<style src="./annotationLayer.css"></style>
<script>

	import componentFactory from './componentFactory.js'

	if ( process.env.VUE_ENV === 'server' ) {

		var component = componentFactory({});
	} else {

		var pdfjsWrapper = require('./pdfjsWrapper.js').default;
		var PDFJS = require('pdfjs-dist/webpack.js');
		var component = componentFactory(pdfjsWrapper(PDFJS));
	}

	export default component;
</script>