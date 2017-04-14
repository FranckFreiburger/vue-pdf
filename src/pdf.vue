<template>
	<div style="position: relative"><canvas style="width:100%"></canvas><div class="vuePdfAnnotationLayer"></div><resize-sensor @resize="resize"></resize-sensor></div>
</template>

<style>

/* see https://github.com/mozilla/pdf.js/blob/55a853b6678cf3d05681ffbb521e5228e607b5d2/test/annotation_layer_test.css */

.vuePdfAnnotationLayer {
	position: absolute;
	left: 0;
	top: 0;
	right: 0;
	bottom: 0;
}

.vuePdfAnnotationLayer > section {
	position: absolute;
}

.vuePdfAnnotationLayer .linkAnnotation > a {
	position: absolute;
	font-size: 1em;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	opacity: 0.2;
	background: #ff0;
	box-shadow: 0px 2px 10px #ff0;
}

.vuePdfAnnotationLayer .textAnnotation img {
	position: absolute;
}

.vuePdfAnnotationLayer .textWidgetAnnotation input,
.vuePdfAnnotationLayer .textWidgetAnnotation textarea,
.vuePdfAnnotationLayer .choiceWidgetAnnotation select,
.vuePdfAnnotationLayer .buttonWidgetAnnotation.checkBox input,
.vuePdfAnnotationLayer .buttonWidgetAnnotation.radioButton input {
	background-color: rgba(0, 54, 255, 0.13);
	border: 1px solid transparent;
	box-sizing: border-box;
	font-size: 9px;
	height: 100%;
	padding: 0 3px;
	vertical-align: top;
	width: 100%;
}

.vuePdfAnnotationLayer .textWidgetAnnotation textarea {
	font: message-box;
	font-size: 9px;
	resize: none;
}

.vuePdfAnnotationLayer .textWidgetAnnotation input[disabled],
.vuePdfAnnotationLayer .textWidgetAnnotation textarea[disabled],
.vuePdfAnnotationLayer .choiceWidgetAnnotation select[disabled],
.vuePdfAnnotationLayer .buttonWidgetAnnotation.checkBox input[disabled],
.vuePdfAnnotationLayer .buttonWidgetAnnotation.radioButton input[disabled] {
	background: none;
	border: 1px solid transparent;
}

.vuePdfAnnotationLayer .textWidgetAnnotation input.comb {
	font-family: monospace;
	padding-left: 2px;
	padding-right: 0;
}

.vuePdfAnnotationLayer .buttonWidgetAnnotation.checkBox input,
.vuePdfAnnotationLayer .buttonWidgetAnnotation.radioButton input {
	-webkit-appearance: none;
	-moz-appearance: none;
	-ms-appearance: none;
	appearance: none;
}

.vuePdfAnnotationLayer .popupAnnotation {
	display: block !important;
}

.vuePdfAnnotationLayer .popupWrapper {
	display: block !important;
	position: absolute;
	width: 20em;
}

.vuePdfAnnotationLayer .popup {
	position: absolute;
	z-index: 200;
	max-width: 20em;
	background-color: #FFFF99;
	box-shadow: 0px 2px 5px #333;
	border-radius: 2px;
	padding: 0.6em;
	margin-left: 5px;
	font: message-box;
	word-wrap: break-word;
}

.vuePdfAnnotationLayer .popup h1 {
	font-size: 1em;
	border-bottom: 1px solid #000000;
	margin: 0;
	padding: 0 0 0.2em 0;
}

.vuePdfAnnotationLayer .popup p {
	margin: 0;
	padding: 0.2em 0 0 0;
}

</style>

<script>

var PDFJS = require('pdfjs-dist');
var resizeSensor = require('vue-resize-sensor');

function PDFJSWrapper(PDFJS, canvasElt, annotationLayerElt) {
	
	var pdfDoc = null;
	var pdfPage = null;
	var pdfRender = null;
	
	this.fireEvent = function(name) {
		
		if ( name in this ) {
			
			var args = Array.prototype.slice.call(arguments, 1);
			this[name].apply(this, args);
		}
	}
	
	function clearCanvas() {
		
		canvasElt.getContext('2d').clearRect(0, 0, canvasElt.width, canvasElt.height);
	}
	
	function clearAnnotations() {
		
		while ( annotationLayerElt.firstChild )
			annotationLayerElt.removeChild(annotationLayerElt.firstChild);
	}
	
	this.destroy = function() {
		
		if ( pdfDoc === null )
			return;
		pdfDoc.destroy();
		pdfDoc = null;
	}
	
	this.getResolutionScale = function() {
		
		return canvasElt.offsetWidth / canvasElt.width;
	}
	
	this.getPageAspectRatio = function() {
		
		if ( pdfPage === null )
			return 0;
		var viewport = pdfPage.getViewport(1);
		return viewport.width / viewport.height;
	}
	
	this.printPage = function() {

		if ( pdfPage === null )
			return;
		
		var PRINT_RESOLUTION = 150; // dpi
		var PRINT_UNITS = PRINT_RESOLUTION / 72.0;
		var CSS_UNITS = 96.0 / 72.0;
		
		var iframeElt = document.createElement('iframe');
		
		iframeElt.frameBorder = '0';
		iframeElt.scrolling = 'no';
		iframeElt.width = '1px;'
		iframeElt.height = '1px;'
		iframeElt.style.cssText = 'position: absolute; top: 0; left: 0';
		
		function removeIframe() {

			iframeElt.parentNode.removeChild(iframeElt);
		}

		iframeElt.onload = function() {
			
			var win = this.contentWindow;
			var viewport = pdfPage.getViewport(1);
			
			var printCanvasElt = win.document.body.appendChild(win.document.createElement('canvas'));
			printCanvasElt.width = (viewport.width * PRINT_UNITS) - 1;
			printCanvasElt.height = (viewport.height * PRINT_UNITS) - 1;
			
			win.document.body.appendChild(document.createElement('style')).textContent = 
				'@supports ((size:A4) and (size:1pt 1pt)) {' +
					'@page { size: ' + (printCanvasElt.width / CSS_UNITS) + 'pt ' + (printCanvasElt.height / CSS_UNITS) + 'pt; }' +
					'body, html { padding: 0; margin: 0 }' +
				'}';

			pdfPage.render({
				canvasContext: printCanvasElt.getContext('2d'),
				transform: [ // Additional transform, applied just before viewport transform.
					PRINT_UNITS, 0, 0,
					PRINT_UNITS, 0, 0
				],
				viewport: viewport,
				intent: 'print'
			})
			.then(function() {
				
				win.focus(); // Required for IE
				win.print();
				removeIframe();
			})
			.catch(function(err) {
			
				removeIframe();
				this.fireEvent('onError', err);
			})
		}
		
		window.document.body.appendChild(iframeElt);
	}
	
	this.renderPage = function(rotate) {
		
		if ( pdfRender !== null )
			return pdfRender.cancel();

		if ( pdfPage === null )
			return;

		if ( rotate === undefined )
			rotate = 0;
	
		var unscaledViewport = pdfPage.getViewport(1);
		var pageWidth = Math.abs((rotate / 90) % 2) ? unscaledViewport.height : unscaledViewport.width;
		var viewport = pdfPage.getViewport(canvasElt.offsetWidth / pageWidth, rotate);
		
		canvasElt.width = viewport.width;
		canvasElt.height = viewport.height;

		pdfRender = pdfPage.render({
			canvasContext: canvasElt.getContext('2d'),
			viewport: viewport
		});
		
		annotationLayerElt.style.visibility = 'hidden';
		clearAnnotations();
		
		pdfPage.getAnnotations()
		.then(function(annotations) {

			PDFJS.AnnotationLayer.render({
				viewport: viewport.clone({ dontFlip: true }),
				div: annotationLayerElt,
				annotations: annotations,
				page: pdfPage,
				//linkService: new LinkServiceMock(),
				renderInteractiveForms: false,
			});
		});

		pdfRender
		.then(function() {
			
			annotationLayerElt.style.visibility = '';
			pdfRender = null;
		})
		.catch(function(err) {

			pdfRender = null;
			if ( err === 'cancelled' )
				return this.renderPage(rotate);
			this.fireEvent('onError', err);
		}.bind(this))
	}		

	this.loadPage = function(pageNumber, rotate) {
		
		pdfPage = null;
		
		if ( pdfDoc === null )
			return;
		
		pdfDoc.getPage(pageNumber)
		.then(function(page) {

			pdfPage = page;
			this.renderPage(rotate);
			this.fireEvent('onPageLoaded', page.pageNumber);
		}.bind(this))
		.catch(function(err) {
			
			pdfPage = null;
			clearCanvas();
			this.fireEvent('onError', err);
		}.bind(this));
	}

	this.loadDocument = function(src) {
		
		pdfDoc = null;
		pdfPage = null;
		
		this.fireEvent('onNumPages', undefined);

		if ( !src ) {
			
			canvasElt.removeAttribute('width');
			canvasElt.removeAttribute('height');
			clearAnnotations();
			return;
		}
		
		var loadingTask = PDFJS.getDocument(src);
		
		if ( this.onPassword ) {
			
			loadingTask.onPassword = function(updatePassword, reason) {
				
				if ( this.onPassword ) {
				
					var reasonStr;
					switch (reason) {
						case PDFJS.PasswordResponses.NEED_PASSWORD:
							reasonStr = 'NEED_PASSWORD';
							break;
						case PDFJS.PasswordResponses.INCORRECT_PASSWORD:
							reasonStr = 'INCORRECT_PASSWORD';
							break;
					}
					this.fireEvent('onPassword', updatePassword, reasonStr);
				}
			}.bind(this);
		}
		
		loadingTask.onProgress = function(status) {
			
			var ratio = status.loaded / status.total;
			this.fireEvent('onProgress', Math.min(ratio, 1));
		}.bind(this);
		
		loadingTask
		.then(function(pdf) {
			
			pdfDoc = pdf;
			this.fireEvent('onNumPages', pdf.numPages);
			this.fireEvent('onDocumentLoaded');
		}.bind(this))
		.catch(function(err) {
			
			pdfDoc = null;
			clearCanvas();
			this.fireEvent('onError', err);
		}.bind(this))
	}
}

module.exports = {
	components: {
		'resize-sensor': resizeSensor,
	},
	props: {
		src: {
			type: [String, Object],
			default: '',
		},
		page: {
			type: Number,
			default: 1,
		},
		rotate: {
			type: Number,
			default: 0,
		},
		password: {
			type: Function,
			default: null,
		},
	},
	watch: {
		src: function() {
			
			this.pdf.loadDocument(this.src);
		},
		page: function() {
			
			this.pdf.loadPage(this.page, this.rotate);
		},
		rotate: function() {
			
			this.pdf.renderPage(this.rotate);
		},
	},
	methods: {
		resize: function(size) {
			
			// on IE10- canvas height must be set
			var pageAspectRatio = this.pdf.getPageAspectRatio();
			if ( pageAspectRatio !== 0 )
				this.$el.childNodes[0].style.height = size.width / pageAspectRatio + 'px';
			
			// update the page when the resolution is too poor
			var resolutionScale = this.pdf.getResolutionScale();
			if ( resolutionScale < 0.85 || resolutionScale > 1.15 )
				this.pdf.renderPage(this.rotate);

			PDFJS.CustomStyle.setProp('transform', this.$el.childNodes[1], 'scale('+resolutionScale+')');
		},
		print: function() {
			
			this.pdf.printPage();
		}
	},
	mounted: function() {
		
		PDFJS.CustomStyle.setProp('transform-origin', this.$el.childNodes[1], '0 0');
		
		this.pdf = new PDFJSWrapper(PDFJS, this.$el.childNodes[0], this.$el.childNodes[1]);
		this.pdf.onPassword = this.password;
		this.pdf.onNumPages = this.$emit.bind(this, 'numPages');
		this.pdf.onProgress = this.$emit.bind(this, 'progress');
		this.pdf.onError = this.$emit.bind(this, 'error');
		this.pdf.onDocumentLoaded = this.$emit.bind(this, 'loaded');
		this.pdf.onPageLoaded = this.$emit.bind(this, 'pageLoaded');
		
		this.$on('loaded', function() {
			
			this.pdf.loadPage(this.page, this.rotate);
		});
		
		this.pdf.loadDocument(this.src);
	},
	destroyed: function() {
		
		this.pdf.destroy();
	}
}

</script>