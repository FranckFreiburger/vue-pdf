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

## API

### props

#### :src <sup>String / Object<sup>
The url of the pdf file. `src` may also be a `string|TypedArray|DocumentInitParameters|PDFDataRangeTransport` for more details, see [`PDFJS.getDocument()`](https://github.com/mozilla/pdf.js/blob/8ff1fbe7f819513e7d0023df961e3d223b35aefa/src/display/api.js#L117).

#### :page <sup>Number<sup>
The page number to display.

#### :password <sup>Function(updatePassword, reason)<sup>
  * `updatePassword`: The function to call with the pdf password.
  * `reason`: the reason why this function is called `'NEED_PASSWORD'` or `'INCORRECT_PASSWORD'`

### events

#### @numPages <sup>Number<sup>
The total number of pages of the pdf.
