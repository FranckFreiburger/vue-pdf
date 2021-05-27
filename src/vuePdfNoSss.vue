<style src="./annotationLayer.css"></style>
<script>
import componentFactory from './componentFactory.js';
import pdfjsWrapper from './pdfjsWrapper';

const PDFJS = require('pdfjs-dist/build/pdf.js');
const PDFJSWorker = require('worker-loader!pdfjs-dist/build/pdf.worker.js');

if ( typeof process == 'undefined' || process.env.VUE_ENV !== 'server' ) {
  if ( typeof window !== 'undefined' && 'Worker' in window && navigator.appVersion.indexOf('MSIE 10') === -1 ) {

    PDFJS.GlobalWorkerOptions.workerSrc = PDFJSWorker.default
  }

  var component = componentFactory(pdfjsWrapper(PDFJS));
} else {

  var component = componentFactory({});
}

export default component;
</script>
