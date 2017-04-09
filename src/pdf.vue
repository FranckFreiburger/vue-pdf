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
		
		canvasElt.height = viewport.height;
		canvasElt.width = viewport.width;

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
		resize: function() {
		
			var resolutionScale = this.pdf.getResolutionScale();
			if ( resolutionScale < 0.8 || resolutionScale > 1.2 )
				this.pdf.renderPage(this.rotate);
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