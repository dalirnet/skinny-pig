# SkinnyPig

![buther](https://raw.githubusercontent.com/dalirnet/skinnypig/master/banner.png)

<p align="center">😉 This is the <b>Butcher</b> of <a href="https://www.fatpigsignals.com/">FatPig</a> signals 😜</p>

### Installation

> ATTENTION: This package is not browser-compatible.

```bash
# npm
npm i skinnypig

# yarn
yarn add skinnypig
```

```javascript
// esm
import { butcher } from "skinnypig"

// cjs
const { butcher } = require("skinnypig")
```

### Usage

```javascript
// async
try {
    const { signal, confidence } = await butcher("path/Of/fitPigSignalImage.jpg")
    /** signal output
     *  {
     *      pair: ["BNB", "USDT"],
     *      entry: [560, 614],
     *      stop: [479],
     *      targets: [632, 658, 705, 780, 900, 1150]
     *  }
     */
} catch (e) {
    // The image is unrecognizable
}

// sync
startSession("path/Of/fitPigSignalImage.jpg")
    .then(({ signal, confidence }) => {
        /** confidence output
         *  92
         */
    })
    .catch((e) => {
        // The image is unrecognizable
    })
```

### Cli

```bash
# npm
npx plaintl "path/Of/fitPigSignalImage.jpg"

# github
npx github:dalirnet/plaintl "path/Of/fitPigSignalImage.jpg"
```

### Limitations

-   Not browser-compatible.
-   Only meant for like these images.

![buther](https://raw.githubusercontent.com/dalirnet/skinnypig/master/limitations.jpg)
