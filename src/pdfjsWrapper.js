import { CMapCompressionType } from 'pdfjs-dist/lib/shared/util';

export default function(PDFJS) {

	function isPDFDocumentLoadingTask(obj) {

		return typeof(obj) === 'object' && obj !== null && obj.__PDFDocumentLoadingTask === true;
	}

	function createLoadingTask(src, options) {

		var source;
		if ( typeof(src) === 'string' )
			source = { url: src };
		else
		if ( typeof(src) === 'object' && src !== null )
			source = Object.assign({}, src);
		else
			throw new TypeError('invalid src type');

		// see https://github.com/mozilla/pdf.js/blob/628e70fbb5dea3b9066aa5c34cca70aaafef8db2/src/display/dom_utils.js#L64
		source.CMapReaderFactory = function() {

			this.fetch = function(query) {

				return import('raw-loader!pdfjs-dist/cmaps/'+query.name+'.bcmap' /* webpackChunkName: "noprefetch-[request]" */)
				.then(function(bcmap) {

					return {
						cMapData: bcmap,
						compressionType: CMapCompressionType.BINARY,
					};
				});
			}
		};
		

		var loadingTask = PDFJS.getDocument(source);
		loadingTask.__PDFDocumentLoadingTask = true; // since PDFDocumentLoadingTask is not public
		
		if ( options && options.onPassword )
			loadingTask.onPassword = options.onPassword;

		if ( options && options.onProgress )
			loadingTask.onProgress = options.onProgress;

		return loadingTask;
	}


	function PDFJSWrapper(canvasElt, annotationLayerElt, emitEvent) {
		
		var pdfDoc = null;
		var pdfPage = null;
		var pdfRender = null;
		var canceling = false;

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

		this.printPage = function(dpi, pageNumberOnly) {

			if ( pdfPage === null )
				return;
			
			// 1in == 72pt
			// 1in == 96px
			var PRINT_RESOLUTION = dpi === undefined ? 150 : dpi;
			var PRINT_UNITS = PRINT_RESOLUTION / 72.0;
			var CSS_UNITS = 96.0 / 72.0;
			
			var iframeElt = document.createElement('iframe');

			function removeIframe() {

				iframeElt.parentNode.removeChild(iframeElt);
			}
			
			new Promise(function(resolve, reject) {

				iframeElt.frameBorder = '0';
				iframeElt.scrolling = 'no';
				iframeElt.width = '0px;' 
				iframeElt.height = '0px;'
				iframeElt.style.cssText = 'position: absolute; top: 0; left: 0';

				iframeElt.onload = function() {
					
					resolve(this.contentWindow);
				}
				
				window.document.body.appendChild(iframeElt);
			})
			.then(function(win) {
				
				win.document.title = '';

				return pdfDoc.getPage(1)
				.then(function(page) {
					
					var viewport = page.getViewport(1);
					win.document.head.appendChild(win.document.createElement('style')).textContent = 
						'@supports ((size:A4) and (size:1pt 1pt)) {' +
							'@page { margin: 1pt; size: ' + ((viewport.width * PRINT_UNITS) / CSS_UNITS) + 'pt ' + ((viewport.height * PRINT_UNITS) / CSS_UNITS) + 'pt; }' +
						'}' +

						'@media print {' +
							'body { margin: 0 }' +
							'canvas { page-break-before: avoid; page-break-after: always; page-break-inside: avoid }' +
						'}'+

						'@media screen {' +
							'body { margin: 0 }' +
						'}'+

						''
					return win;
				})
			})
			.then(function(win) {
				
				var allPages = [];
				
				for ( var pageNumber = 1; pageNumber <= pdfDoc.numPages; ++pageNumber ) {
					
					if ( pageNumberOnly !== undefined && pageNumberOnly.indexOf(pageNumber) === -1 )
						continue;
					
					allPages.push(
						pdfDoc.getPage(pageNumber)
						.then(function(page) {

							var viewport = page.getViewport(1);
						
							var printCanvasElt = win.document.body.appendChild(win.document.createElement('canvas'));
							printCanvasElt.width = (viewport.width * PRINT_UNITS);
							printCanvasElt.height = (viewport.height * PRINT_UNITS);

							return page.render({
								canvasContext: printCanvasElt.getContext('2d'),
								transform: [ // Additional transform, applied just before viewport transform.
									PRINT_UNITS, 0, 0,
									PRINT_UNITS, 0, 0
								],
								viewport: viewport,
								intent: 'print'
							}).promise;
						})
					);
				}
				
				Promise.all(allPages)
				.then(function() {
					
					win.focus(); // Required for IE
					win.print();
					removeIframe();
				})
				.catch(function(err) {
				
					removeIframe();
					emitEvent('error', err);
				})
			})
		}
		
		this.renderPage = function(rotate) {
			
			if ( pdfRender !== null ) {

				if ( canceling )
					return;
				canceling = true;

				setTimeout(function() {

					if ( canceling )
						pdfRender.cancel();
				})
				return;
			}

			if ( pdfPage === null )
				return;

			if ( rotate === undefined )
				rotate = 0;

			var scale = canvasElt.offsetWidth / pdfPage.getViewport(1).width * (window.devicePixelRatio || 1);
			var viewport = pdfPage.getViewport(scale, rotate);

			emitEvent('page-size', viewport.width, viewport.height);

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
				canceling = false;
				pdfRender = null;
			})
			.catch(function(err) {

				pdfRender = null;
				if ( err instanceof PDFJS.RenderingCancelledException ) {

					canceling = false;
					this.renderPage(rotate);
					return;
				}
				emitEvent('error', err);
			}.bind(this))
		}		


		this.forEachPage = function(pageCallback) {

			var numPages = pdfDoc.pdfInfo.numPages;

			(function next(pageNum) {

				pdfDoc.getPage(pageNum)
				.then(pageCallback)
				.then(function() {
					
					if ( ++pageNum <= numPages )
						next(pageNum);
				})
			})(1);
		}


		this.loadPage = function(pageNumber, rotate) {
			
			pdfPage = null;
			
			if ( pdfDoc === null )
				return;
			
			pdfDoc.getPage(pageNumber)
			.then(function(page) {

				pdfPage = page;
				this.renderPage(rotate);
				emitEvent('page-loaded', page.pageNumber);
			}.bind(this))
			.catch(function(err) {
				
				clearCanvas();
				clearAnnotations();
				emitEvent('error', err);
			});
		}

		this.loadDocument = function(src) {
			
			pdfDoc = null;
			pdfPage = null;
			
			emitEvent('num-pages', undefined);

			if ( !src ) {
				
				canvasElt.removeAttribute('width');
				canvasElt.removeAttribute('height');
				clearAnnotations();
				return;
			}
			
			if ( isPDFDocumentLoadingTask(src) ) {

				var loadingTask = src;
			} else {

				var loadingTask = createLoadingTask(src, {
					onPassword: function(updatePassword, reason) {
						
						var reasonStr;
						switch (reason) {
							case PDFJS.PasswordResponses.NEED_PASSWORD:
								reasonStr = 'NEED_PASSWORD';
								break;
							case PDFJS.PasswordResponses.INCORRECT_PASSWORD:
								reasonStr = 'INCORRECT_PASSWORD';
								break;
						}
						emitEvent('password', updatePassword, reasonStr);
					},
					onProgress: function(status) {
						
						var ratio = status.loaded / status.total;
						emitEvent('progress', Math.min(ratio, 1));
					}
				});
			}
			
			loadingTask
			.then(function(pdf) {
				
				pdfDoc = pdf;
				emitEvent('num-pages', pdf.numPages);
				emitEvent('loaded');
			})
			.catch(function(err) {
				
				clearCanvas();
				clearAnnotations();
				emitEvent('error', err);
			})
		}
		
		annotationLayerElt.style.transformOrigin = '0 0';
	}

	return {
		createLoadingTask: createLoadingTask,
		PDFJSWrapper: PDFJSWrapper,
	}
}
