<script>

function PDFJSWrapper(PDFJS, canvasElt) {
	
	var pdfDoc = null;
	var pdfPage = null;
	var pdfRender = null;
	
	this.pdfEvent = function(name) {

		if ( name in this )
			this[name].apply(this, Array.prototype.slice.call(arguments, 1));
	}
	
	function clearCanvas() {
		
		canvasElt.getContext('2d').clearRect(0, 0, canvasElt.width, canvasElt.height);
	}
	
	this.renderPage = function() {

		if ( pdfRender !== null )
			return pdfRender.cancel();

		if ( pdfPage === null )
			return;

		var viewport = pdfPage.getViewport(canvasElt.offsetWidth / pdfPage.getViewport(1).width);
		
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
				this.renderPage();
			else
				this.pdfEvent('onError', err);

		}.bind(this))
	}		

	this.loadPage = function(pageNumber) {
		
		if ( pdfDoc === null )
			return;
		
		pdfDoc.getPage(pageNumber)
		.then(function(page) {

			pdfPage = page;
			this.renderPage();
		}.bind(this))
		.catch(function(err) {
			
			clearCanvas();
			this.pdfEvent('onError', err);
		}.bind(this));
	}

	this.loadDocument = function(src, options) {
		
		pdfDoc = null;
		pdfPage = null;
		
		this.pdfEvent('onNumPages', undefined);

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
					this.pdfEvent('onPassword', updatePassword, reasonStr);
				}
			}.bind(this);
		}
		
		loadingTask.onProgress = function(status) {
			
			this.pdfEvent('onProgress', status);
		}.bind(this);
		
		loadingTask
		.then(function(pdf) {
			
			pdfDoc = pdf;
			this.pdfEvent('onNumPages', pdf.numPages);
			this.pdfEvent('onDocumentLoaded');
		}.bind(this))
		.catch(function(err) {
			
			clearCanvas();
			this.pdfEvent('onError', err);
		}.bind(this))
	}
}

const PDFJS = require('pdfjs-dist');
const resizeSensor = require('vue-resize-sensor');

module.exports = {
	components: {
		'resize-sensor': resizeSensor,
	},
	template:'<div><canvas style="width:100%"></canvas><resize-sensor @resize="resize"></resize-sensor></div>',
	props: {
		src: {
			type: [String, Object],
			default: '',
		},
		page: {
			type: Number,
			default: 1,
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
			
			this.pdf.loadPage(this.page);
		},
	},
	methods: {
		resize: function(event) {
			
			this.pdf.renderPage();
		}
	},
	mounted: function() {
		
		this.pdf = new PDFJSWrapper(PDFJS, this.$el.firstElementChild);
		this.pdf.onPassword = this.password;
		this.pdf.onNumPages = function(numPages) {
			
			this.$emit('numPages', numPages);
		}.bind(this);
		
		this.pdf.loadDocument(this.src);
		
		this.pdf.onDocumentLoaded = function() {
			
			this.pdf.loadPage(this.page);
		}.bind(this);
		
		this.pdf.onError = function(err) {
			
			console.log(err);
		}
	}
}

</script>