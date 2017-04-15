# vue-pdf
vue.js pdf viewer

## Install
```
npm install --save vue-pdf
```

## Example
```
<template>
  <pdf src="./static/relativity.pdf" style="width:50%"></pdf>
</template>

<script>
import pdf from 'vue-pdf'

export default {
  components: {
    pdf
  }
}
```

## Demo

[vue-pdf demo on jsfiddle](https://jsfiddle.net/9zm9c1sf/)

## Browser support
Same browser support as [Vue.js 2](https://github.com/vuejs/vue/blob/dev/README.md)

## API

### Props

#### :src <sup>String / Object - default: ''<sup>
The url of the pdf file. `src` may also be a `string|TypedArray|DocumentInitParameters|PDFDataRangeTransport` for more details, see [`PDFJS.getDocument()`](https://github.com/mozilla/pdf.js/blob/8ff1fbe7f819513e7d0023df961e3d223b35aefa/src/display/api.js#L117).

#### :page <sup>Number - default: 1<sup>
The page number to display.

#### :rotate <sup>Number - default: 0<sup>
The page rotation in degrees, only multiple of 90 are valid.

### Events

#### @password <sup>(updatePassword, reason)<sup>
  * `updatePassword`: The function to call with the pdf password.
  * `reason`: the reason why this function is called `'NEED_PASSWORD'` or `'INCORRECT_PASSWORD'`

#### @progress <sup>Number<sup>
Document loading progress. Range [0, 1].

#### @loaded
Triggered when the document is loaded.

#### @pageLoaded <sup>Number<sup>
Triggered when a page is loaded.

#### @numPages <sup>Number<sup>
The total number of pages of the pdf.

#### @error <sup>Object<sup>
Triggered when an error occurred.


### Public methods

#### print() * _experimental_ *
Prints the current page.

##### example
```
<template>
	<button @click="print">print</button>
	<pdf ref="myPdfComponent" src="https://cdn.mozilla.net/pdfjs/tracemonkey.pdf"></pdf>
</template>

<script>
	...
	methods: {
		print() {
			
			this.$refs.myPdfComponent.print();
		}
	}
	...
</script>

```


## To do

- [ ] Simplified non-webpack integration
- [ ] Added more advanced examples
- [x] Add `@progress` event
- [x] Add `:rotate` prop
- [x] Handle PDF.js errors
- [ ] Give access to the text content of the page
- [ ] Make `<resize-sensor>` optional (implies adding a `:scale` prop)
- [x] Handle resize-sensor event throttle
- [x] Print the current page
- [ ] Print the whole document
- [ ] Buy more coffee


## Credits
[<img src="https://www.franck-freiburger.com/FF.png" width="16"> Franck Freiburger](https://www.franck-freiburger.com)

