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

## API

### props

#### :src <sup>String / Object<sup>
The url of the pdf file. `src` may also be a `string|TypedArray|DocumentInitParameters|PDFDataRangeTransport` for more details, see [`PDFJS.getDocument()`](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js).

#### :page <sup>Number<sup>
The page number to display.

#### :password <sup>Function(updatePassword, reason)<sup>
  * `updatePassword`: The function to call with the pdf password.
  * `reason`: the reason why this function is called 'NEED_PASSWORD' or 'INCORRECT_PASSWORD'

### events

#### @numPages <sup>Number<sup>
The total number of pages of the pdf.
