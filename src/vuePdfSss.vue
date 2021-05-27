<style src="./annotationLayer.css"></style>
<script>

	import componentFactory from './componentFactory';
  import pdfjsWrapper from './pdfjsWrapper';


	import pdfJS from 'pdfjs-dist/build/pdf.js';
  import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js';

	if ( process.env.VUE_ENV !== 'server' ) {

		if ( typeof window !== 'undefined' && 'Worker' in window ) {

			pdfJS.GlobalWorkerOptions.workerPort = new pdfjsWorker();
		}
	}

	var component = componentFactory(pdfjsWrapper(pdfJS));
	component.pdfJS = pdfJS;

	export default component;

</script>
