# SkinnyPig

![buther](https://raw.githubusercontent.com/dalirnet/skinnypig/master/banner.png)

## <p align="center">🐷😄 This is <b>Butcher</b> of <a href="https://www.fatpigsignals.com/">FatPig</a> signals 😄🐷</p>

### Installation

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
    const { signal, confidence } = await butcher("path/Of/fatPigSignalImage.jpg")
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
startSession("path/Of/fatPigSignalImage.jpg")
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
npx skinnypig "path/Of/target.jpg" -r "path/of/reflect.jpg"

# github
npx github:dalirnet/skinnypig "path/Of/target.jpg" -r "path/of/reflect.jpg"
```

### Limitations

-   Not browser-compatible.
-   Only images like [targets](#targets) are supported.

#### Targets

![targets](https://raw.githubusercontent.com/dalirnet/skinnypig/master/targets.png)

#### Reflects

![reflects](https://raw.githubusercontent.com/dalirnet/skinnypig/master/reflects.png)
