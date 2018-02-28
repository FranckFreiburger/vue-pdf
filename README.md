# vue-pdf
vue.js pdf viewer

## Install
```bash
npm install --save vue-pdf
```

## Example - basic
```js
<template>
  <vue-pdf src="./static/relativity.pdf" />
</template>

<script>
import VuePdf from 'vue-pdf'
export default {
  components: {
    VuePdf
  }
}
</script>
```

## Demo

[vue-pdf demo on jsfiddle](https://jsfiddle.net/fossfiddler/5k4ptmqg/145/)

## Browser support
Same browser support as [Vue.js 2](https://github.com/vuejs/vue/blob/dev/README.md)

## Note
since v2.x, the script is exported as esm.
## API
### Props
|Name|Type|Default|Description|
|---|---|------|----------|
|src | Object \|\| String | Null | The url of the pdf file. 
|number| Number | 1|The page number to display.
|rotate| Number | 0|The page rotation in degrees, only multiple of 90 are valid.

### Events
|Name|Attributes|Listen to|Description|
|---|---|------|----------|
|Password | (updatePassword, reason) | @password | The url of the pdf file.<br/> `updatePassword`: The function to call with the pdf password. <br/> `reason`: the reason why this function is called `'NEED_PASSWORD'` or `'INCORRECT_PASSWORD'`
|Progress|Number|@progress|Document loading progress. Range [0, 1].|
|Loaded|Null|@loaded|Triggered when the document is loaded.|
|Page Loaded|Number|@page-loaded|Triggered when a page is loaded.|
|Number Pages|Number|@num-pages|The total number of pages of the pdf.|
|Error|Object|@error|Triggered when an error occurred.|

### Public methods
|Name|Parameters|Description|
|----|----------|-----------|
|print|dpi, pageList|  **_experimental_** <br/> `dpi`: the print rezolution of the document (try 100).<br/> `pageList`: the list (array) of pages to print.|

### Public static methods
|Name|Parameters|Description|
|----|----------|-----------|
|createLoadingTask|src|`src`: see `:src` prop This function creates a PDFJS loading task that can be used and reused as `:src` property.<br/>The loading task is a promise that resolves with the PDFJS pdf document that exposes the `numPages` property (see example below).|

## Examples

##### Example - current page / page count
```js
<template>
  <div>
    {{currentPage}} / {{pageCount}}
    <vue-pdf
      src="https://cdn.mozilla.net/pdfjs/tracemonkey.pdf"
      @num-pages="pageCount = $event"
      @page-loaded="currentPage = $event" />
  </div>
</template>

<script>
import VuePdf from 'vue-pdf'
export default {
  data() {
    return {
      currentPage: 0,
      pageCount: 0
    }
   },
   components: {
    VuePdf
  }
</script>
```

##### Example - display multiple pages of the same pdf document
```
<template>
  <div>
    <vue-pdf
      v-for="i in numPages"
      :key="i"
      :src="src"
      :page="i"
      style="display: inline-block; width: 25%" />
  </div>
</template>

<script>
import VuePdf from 'vue-pdf'
var loadingTask = pdf.createLoadingTask('https://cdn.mozilla.net/pdfjs/tracemonkey.pdf');
export default {
  data() {
    return {
      src: loadingTask,
      numPages: undefined,
    }
  },
  mounted() {
    this.src.then(pdf => {
      this.numPages = pdf.numPages;
   });
  },
  components: {
    VuePdf
  }
}
</script>
```

##### Example - print all pages
```
<template>
  <div>
    <button @click="$refs.myPdfComponent.print()">print</button>
    <vue-pdf ref="myPdfComponent" src="https://cdn.mozilla.net/pdfjs/tracemonkey.pdf" />
  </div>
</template>
```

##### Example - print multiple pages
```
<template>
  <div>
    <button 
      @click="$refs.myPdfComponent.print(100, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])">
        print
      </button>
    <vue-pdf 
      ref="myPdfComponent" 
      src="https://cdn.mozilla.net/pdfjs/tracemonkey.pdf" />
  </div>
</template>
```


##### Example - get text content
```
<template>
  <div>
    <button @click="logContent">log content</button>
    <vue-pdf
      ref="myPdfComponent"
      src="https://cdn.mozilla.net/pdfjs/tracemonkey.pdf" />
  </div>
</template>

<script>
import VuePdf from 'vue-pdf'
export default {
  methods: {
    logContent() {
      this.$refs.myPdfComponent.pdf.forEachPage(function(page) {
        return page.getTextContent()
        .then(function(content) {
          var text = content.items.map(item => item.str);
	  console.log(text);
        })
      });
    }
  },
  components: {
    VuePdf
  }
}

</script>
```


##### Example - complete
```
<template>
  <div>
    <input type="checkbox" v-model="show">
    <select v-model="src" style="width: 30em">
      <option v-for="item in pdfList" :value="item" v-text="item"></option>
    </select>
    <input v-model.number="page" type="number" style="width: 5em"> /{{numPages}}
    <button @click="rotate += 90">&#x27F3;</button>
    <button @click="rotate -= 90">&#x27F2;</button>
    <button @click="$refs.pdf.print()">print</button>
    <div style="width: 50%">
      <div 
        v-if="loadedRatio > 0 && loadedRatio < 1" 
        style="background-color: green; color: white; text-align: center" 
        :style="{ width: loadedRatio * 100 + '%' }">
          {{ Math.floor(loadedRatio * 100) }}%
       </div>
       <vue-pdf 
        v-if="show" 
        ref="pdf" 
        style="border: 1px solid red" 
        :src="src" :page="page" 
        :rotate="rotate" 
        @password="password" 
        @progress="loadedRatio = $event" 
        @error="error" 
        @num-pages="numPages = $event" />
    </div>
  </div>
</template>
<script>
import VuePdf from 'vue-pdf'
export default {
  data () {
    return {
      show: true,
      pdfList: [
        '',
	'https://cdn.mozilla.net/pdfjs/tracemonkey.pdf',
	'https://cdn.rawgit.com/mozilla/pdf.js/c6e8ca86/test/pdfs/freeculture.pdf',
	'https://cdn.rawgit.com/mozilla/pdf.js/c6e8ca86/test/pdfs/annotation-link-text-popup.pdf',
	'https://cdn.rawgit.com/mozilla/pdf.js/c6e8ca86/test/pdfs/calrgb.pdf',
	'https://cdn.rawgit.com/sayanee/angularjs-pdf/68066e85/example/pdf/relativity.protected.pdf',
        data:application/pdf;base64,JVBERi0xLjUKJbXtrvsKMyAwIG9iago8PCAvTGVuZ3RoIDQgMCBSCiAgIC9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+CnN0cmVhbQp4nE2NuwoCQQxF+/mK+wMbk5lkHl+wIFislmIhPhYEi10Lf9/MVgZCAufmZAkMppJ6+ZLUuFWsM3ZXxvzpFNaMYjEriqpCtbZSBOsDzw0zjqPHZYtTrEmz4eto7/0K54t7GfegOGCBbBdDH3+y2zsMsVERc9SoRkXORqKGJupS6/9OmMIUfgypJL4KZW5kc3RyZWFtCmVuZG9iago0IDAgb2JqCiAgIDEzOAplbmRvYmoKMiAwIG9iago8PAogICAvRXh0R1N0YXRlIDw8CiAgICAgIC9hMCA8PCAvQ0EgMC42MTE5ODcgL2NhIDAuNjExOTg3ID4+CiAgICAgIC9hMSA8PCAvQ0EgMSAvY2EgMSA+PgogICA+Pgo+PgplbmRvYmoKNSAwIG9iago8PCAvVHlwZSAvUGFnZQogICAvUGFyZW50IDEgMCBSCiAgIC9NZWRpYUJveCBbIDAgMCA1OTUuMjc1NTc0IDg0MS44ODk3NzEgXQogICAvQ29udGVudHMgMyAwIFIKICAgL0dyb3VwIDw8CiAgICAgIC9UeXBlIC9Hcm91cAogICAgICAvUyAvVHJhbnNwYXJlbmN5CiAgICAgIC9DUyAvRGV2aWNlUkdCCiAgID4+CiAgIC9SZXNvdXJjZXMgMiAwIFIKPj4KZW5kb2JqCjEgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzCiAgIC9LaWRzIFsgNSAwIFIgXQogICAvQ291bnQgMQo+PgplbmRvYmoKNiAwIG9iago8PCAvQ3JlYXRvciAoY2Fpcm8gMS4xMS4yIChodHRwOi8vY2Fpcm9ncmFwaGljcy5vcmcpKQogICAvUHJvZHVjZXIgKGNhaXJvIDEuMTEuMiAoaHR0cDovL2NhaXJvZ3JhcGhpY3Mub3JnKSkKPj4KZW5kb2JqCjcgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cKICAgL1BhZ2VzIDEgMCBSCj4+CmVuZG9iagp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDA1ODAgMDAwMDAgbiAKMDAwMDAwMDI1MiAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAyMzAgMDAwMDAgbiAKMDAwMDAwMDM2NiAwMDAwMCBuIAowMDAwMDAwNjQ1IDAwMDAwIG4gCjAwMDAwMDA3NzIgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA4CiAgIC9Sb290IDcgMCBSCiAgIC9JbmZvIDYgMCBSCj4+CnN0YXJ0eHJlZgo4MjQKJSVFT0YK',
	],
	src:'',
	loadedRatio: 0,
	page: 1,
	numPages: 0,
	rotate: 0,
    }
  },
  methods: {
    password (updatePassword, reason) {
    updatePassword(prompt('password is "test"'));
    },
    error (err) {
      console.log(err);
    }
  },
  components: {
    VuePdf
  }
}
</script>
```

## Credits
[<img src="https://www.franck-freiburger.com/FF.png" width="16"> Franck Freiburger](https://www.franck-freiburger.com)
