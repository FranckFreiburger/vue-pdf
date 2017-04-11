<template>
	<div><canvas style="width:100%"></canvas><resize-sensor @resize="resize"></resize-sensor></div>
</template>

<script>

const PDFJS = require('pdfjs-dist');
const resizeSensor = require('vue-resize-sensor');

function PDFJSWrapper(PDFJS, canvasElt) {
	
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

		pdfRender
		.then(function() {
			
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
				this.$el.firstElementChild.style.height = size.width / pageAspectRatio + 'px';
			
			// update the page when the resolution is too poor
			var resolutionScale = this.pdf.getResolutionScale();
			if ( resolutionScale < 0.85 || resolutionScale > 1.15 )
				this.pdf.renderPage(this.rotate);
		},
		print: function() {
			
			this.pdf.printPage();
		}
	},
	mounted: function() {
		
		this.pdf = new PDFJSWrapper(PDFJS, this.$el.firstElementChild);
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