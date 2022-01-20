import fs from "fs"
import url from "url"
import _, { cond } from "lodash"
import path from "path"
import sharp from "sharp"
import chalk from "chalk"
import mustache from "mustache"
import { createWorker } from "tesseract.js"

/**
 * Prepare default of inputs.
 */
const LOG = true
const CHANNEL = "blue"
const SEPARATOR = 175
const REFLECT = false

/**
 * Prepare global const to export.
 */
const CONST = { CHANNEL, SEPARATOR, REFLECT }

/**
 * Prepare root path.
 */
const DIRNAME = path.resolve(url.fileURLToPath(import.meta.url), "..", "..")

/**
 * Prepare defult state of logger.
 */
let stateOfLogger = LOG

/**
 * Change logger state.
 * @param {Boolean} state.
 */
const loggerState = (state) => {
    stateOfLogger = state
}

const logType = {
    info: chalk.gray,
    success: chalk.green,
    error: chalk.red,
    debug: chalk.yellow,
}

/**
 * Prepare logger.
 */
const logger = (type, scope, ...messages) => {
    if (stateOfLogger) {
        console.log(logType[type](`${new Date().toISOString()}`, `[${_.upperFirst(scope)}]`, ...messages))
    }
}

/**
 * Prepare debug logger.
 */
const debug = (...messages) => {
    logger("debug", "debug", ...messages)
}

/**
 * Clean signal image.
 * @param {Image} input - Path of image or image buffer.
 * @param {Object} options - Cleaner options.
 * @param {String} options.channel - Channel to extract.
 * @param {Number} options.separator - Channel separator to detect the target pixel.
 * @returns {Object}
 */
const cleaner = async (input, { channel = CHANNEL, separator = SEPARATOR } = {}) => {
    /**
     * Set start time.
     */
    const startTime = Date.now()
    logger("info", "cleaner", "Starting")

    try {
        /**
         * Prepare Sharp instance.
         */
        const sharpInstance = sharp(input)

        /**
         * Extract channel.
         * Convert to raw data.
         */
        const extractedChannel = sharpInstance.extractChannel(channel).raw()
        logger("info", "cleaner", "Extracted", channel, "channel")
        /**
         * Resolve as buffer object.
         */
        const { data, info } = await extractedChannel.toBuffer({ resolveWithObject: true })

        /**
         * Prepare image info.
         */
        const { width, height, channels } = info

        /**
         * A flag to control target pixels.
         */
        let onTargetPixels = false

        /**
         * Convert pixels to white and black.
         */
        const convertedBuffer = new Uint8ClampedArray(data.buffer).map((value, index) => {
            /**
             * Control the first pixels to the right of the image.
             * Whenever the value of this pixel is greater than 5, the next pixels become the target.
             */
            if (index % width === width - 1 && value > 5) {
                onTargetPixels = true
            }

            /**
             * It will turn black if it is on the target pixels and it is greater than the separator value.
             * Otherwise it will turn white.
             */
            return onTargetPixels && value > separator ? 0 : 255
        })

        /**
         * Prepare Sharp instance of cleaned image.
         */
        const cleanedImage = sharp(convertedBuffer, { raw: { width, height, channels } })
        logger("info", "cleaner", "Cleaned pixels")

        /**
         * Trim image edges.
         */
        const trimmedImage = await cleanedImage.trim().toBuffer({ resolveWithObject: true })
        logger("info", "cleaner", "Trimed edges")

        /**
         * Prepare trimmed data.
         */
        const trimmedData = {
            buffer: new Uint8ClampedArray(trimmedImage.data.buffer),
            raw: {
                width: trimmedImage.info.width,
                height: trimmedImage.info.height,
                channels: trimmedImage.info.channels,
            },
            offset: {
                top: trimmedImage.info.trimOffsetTop,
                left: trimmedImage.info.trimOffsetLeft,
            },
        }

        /**
         * Options to extend the cropped image.
         */
        const extendOptions = {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10,
            background: { r: 255, g: 255, b: 255 },
        }

        /**
         * Extend image edges.
         */
        const extendedImage = sharp(trimmedData.buffer, { raw: trimmedData.raw }).extend(extendOptions)
        logger("info", "cleaner", "Extended edges")

        /**
         * Prepare png buffer.
         */
        const buffer = await extendedImage.png().removeAlpha().toBuffer()

        /**
         * Calculate proccess duration.
         */
        logger("success", "cleaner", "Done at", `${(Date.now() - startTime) / 1000}ms.`)

        return {
            buffer,
            width,
            height,
            crop: {
                top: Math.abs(trimmedData.offset.top) - extendOptions.top,
                left: Math.abs(trimmedData.offset.left) - extendOptions.left,
                width: trimmedData.raw.width + extendOptions.left + extendOptions.right,
                height: trimmedData.raw.height + extendOptions.top + extendOptions.bottom,
            },
        }
    } catch (error) {
        logger("error", "cleaner", error.message)

        throw error
    }
}

/**
 * Extract data from signal image.
 * @param {Image} input - Path of image or image buffer.
 * @returns {Promise}
 */
const extractor = async (input) => {
    /**
     * Set start time.
     */
    const startTime = Date.now()
    logger("info", "extractor", "Starting")

    try {
        /**
         * Prepare Tesseract worker instance.
         */
        const ocr = createWorker()

        /**
         * Load worker config.
         */
        await ocr.load()

        /**
         * Prepare worker language.
         */
        await ocr.loadLanguage("eng")
        await ocr.initialize("eng")
        logger("info", "extractor", "Prepared worker")

        /**
         * Prepare worker options.
         */
        await ocr.setParameters({ user_defined_dpi: "70" })

        /**
         * Prepare recognized data.
         */
        const recognized = await ocr.recognize(input)
        logger("info", "extractor", "Recognized data")

        /**
         * Terminate worker instance.
         */
        await ocr.terminate()

        /**
         * Prepare signal patterns.
         */
        const patterns = {
            pair: /^\w+(\s?)\/(\s?)\w+$/,
            entry: /^(enter|between|(\d+((\.\d+)?)))/i,
            stop: /^(stop|(\d+((\.\d+)?)))/i,
            targets: /^(target|(\d+((\.\d+)?)))/i,
        }

        /**
         * Extract words from input.
         * @param {String} input.
         * @returns {Array}
         */
        const wordExtractor = (input) => {
            return input.match(/(\w+)/g)
        }

        /**
         * Extract ans sort numbers from input.
         * @param {String} input.
         * @returns {Array}
         */
        const numberExtractor = (input) => {
            const match = input.match(/(\d+((\.\d+)?))/g)
            if (match) {
                return _.filter(_.sortBy(_.map(match, (number) => _.toNumber(number))))
            }
        }

        /**
         * Prepare data object.
         */
        const data = _.reduce(
            recognized.data.lines,
            (keep, line) => {
                /**
                 * Iterate line words.
                 */
                _.each(line.words, (word) => {
                    /**
                     * Trim word text.
                     */
                    const text = _.trim(word.text)

                    /**
                     * Iterate over patterns.
                     * Check pattern.
                     */
                    _.each(keep.patterns, (pattern, key) => {
                        if (text.match(pattern)) {
                            /**
                             * Add edges of symbols.
                             */
                            _.each(word.symbols, ({ bbox: { x0, y0, x1, y1 } }) => {
                                keep.coordinates.push({ left: x0, top: y0, right: x1, bottom: y1 })
                            })

                            /**
                             * Call pattern extractor.
                             * Check pattern extracted value.
                             */
                            const extractedValue = key === "pair" ? wordExtractor(text) : numberExtractor(text)
                            if (extractedValue) {
                                /**
                                 * Set extracted value to lines object.
                                 */
                                keep.lines[key] = extractedValue

                                /**
                                 * Add confidence to confidence array.
                                 */
                                keep.confidence.push(line.confidence)

                                /**
                                 * Omit current key from patterns.
                                 */
                                keep.patterns = _.omit(keep.patterns, [key])

                                /**
                                 * Break patterns iterate for current word.
                                 */
                                return false
                            }
                        }
                    })
                })

                return keep
            },
            {
                patterns,
                lines: {},
                coordinates: [],
                confidence: [],
            }
        )

        /**
         * Calculate proccess duration.
         */
        logger("success", "extractor", "Done at", `${(Date.now() - startTime) / 1000}ms.`)

        return {
            signal: data.lines,
            coordinates: data.coordinates,
            confidence: _.toSafeInteger(_.round(_.mean(data.confidence))),
        }
    } catch (error) {
        logger("error", "extractor", error.message)

        throw error
    }
}

/**
 * Reflect output.
 * @param {Image} input - Same with cleaner input.
 * @param {Object} cleaned - Cleaner output.
 * @param {Object} extracted - Extractor output.
 * @param {Any} reflecct - Reflect type.
 * @returns {Promise}
 */
const reflector = async (input, { cleaned, extracted, reflect }) => {
    /**
     * Set start time.
     */
    const startTime = Date.now()
    logger("info", "reflector", "Starting")

    try {
        /**
         * Prepare path of mask mustache template.
         */
        const maskPath = path.resolve(DIRNAME, "src", "mask.mustache")

        /**
         * Prepare mustache template.
         */
        const maskTemplate = _.toString(fs.readFileSync(maskPath))
        logger("info", "reflector", "Loading mask template")

        /**
         * Prepare extracted area coordinates.
         */
        const coordinates = _.map(extracted.coordinates, ({ top, left, right, bottom }) => {
            return {
                top: cleaned.crop.top + top,
                left: cleaned.crop.left + left,
                width: right - left,
                height: bottom - top,
            }
        })

        /**
         * Prepare edges of extracted area.
         */
        const coordinatesOfMaskLayer = {
            top: _.min(_.map(coordinates, "top")),
            left: _.min(_.map(coordinates, "left")),
            bottom: _.max(_.map(coordinates, ({ top, height }) => top + height)),
            right: _.max(_.map(coordinates, ({ left, width }) => left + width)),
        }

        /**
         * Render mustache template.
         */
        const maskLayer = mustache.render(maskTemplate, { width: cleaned.width, height: cleaned.height, coordinates })
        logger("info", "reflector", "Rendred mask template")

        /**
         * Prepare composition of mask layer.
         */
        const compositionMaksLayers = [{ input: new Buffer.from(maskLayer) }]

        /**
         * Mask input buffer.
         */
        const maskedImage = await sharp(input).grayscale().composite(compositionMaksLayers).toBuffer()
        logger("info", "reflector", "Composited mask layer")

        /**
         * Resize masked buffer to constant width and auto height.
         */
        const resizedBuffer = await sharp(maskedImage).resize({ width: 680 }).toBuffer({ resolveWithObject: true })
        logger("info", "reflector", "Resized masked")

        /**
         * Calculate new scaled value after resizing.
         * @param {Number} value
         * @returns {Number}
         */
        const toResizedScale = (value) => {
            return _.floor((value * resizedBuffer.info.width) / cleaned.width)
        }

        /**
         * Prepare composition of ui layers.
         */
        const compositionUiLayers = [
            {
                input: path.resolve(DIRNAME, "src", "tape.svg"),
                top: toResizedScale(coordinatesOfMaskLayer.bottom) + 20,
                left: 0,
            },
            {
                input: path.resolve(DIRNAME, "src", "butcher.svg"),
                top: resizedBuffer.info.height - 280,
                left: toResizedScale(coordinatesOfMaskLayer.right) + 20,
            },
        ]

        /**
         * Composite and sharpen ui layers.
         */
        const reflectBuffer = await sharp(resizedBuffer.data).composite(compositionUiLayers).sharpen().toBuffer()
        logger("info", "reflector", "Composited ui layer")

        /**
         * When reflect is not specified, return the reflect buffer.
         */
        if (_.isBoolean(reflect)) {
            /**
             * Calculate proccess duration.
             */
            logger("success", "reflector", "Done at", `${(Date.now() - startTime) / 1000}ms.`)

            return reflectBuffer
        }

        /**
         * Otherwise resolve path of reflect.
         */
        const reflectFilePath = path.resolve(reflect)

        /**
         * Write reflect file.
         */
        fs.writeFileSync(reflectFilePath, reflectBuffer)

        /**
         * Calculate proccess duration.
         */
        logger("success", "reflector", "Done at", `${(Date.now() - startTime) / 1000}ms.`)

        /**
         * Return path of reflect file.
         */
        return reflectFilePath
    } catch (error) {
        logger("error", "reflector", error.message)

        throw error
    }
}

/**
 * Butcher FatPig.
 * @param {Image} input - Path of image or image buffer.
 * @param {Object} options - Butcher options.
 * @param {String} options.channel - Channel to extract.
 * @param {Number} options.separator - Channel separator to detect the target pixel.
 * @param {Any} options.reflect - Create reflect image.
 * @param {Boolean} options.log - Log state.
 * @returns {Promise}
 */
const butcher = (input, { channel = CHANNEL, separator = SEPARATOR, reflect = REFLECT, log = LOG } = {}) => {
    /**
     * Set logger state.
     */
    loggerState(log)

    /**
     * Set start time.
     */
    const startTime = Date.now()
    logger("info", "butcher", "Starting")

    /**
     * Prepare main promise.
     */
    return new Promise(async (resolve, reject) => {
        try {
            /**
             * Call cleaner method.
             */
            const cleaned = await cleaner(input, { channel, separator })

            /**
             * Call extractor method.
             */
            const extracted = await extractor(cleaned.buffer)

            /**
             * Validate extracted data.
             */
            const signalValues = [
                extracted.signal.pair,
                extracted.signal.entry,
                extracted.signal.stop,
                extracted.signal.targets,
            ]
            if (_.some(signalValues, _.isEmpty)) {
                logger("error", "extractor", "Invalid input")
                throw new Error("Invalid input")
            }

            /**
             * Prepare base output.
             */
            const output = {
                signal: extracted.signal,
                confidence: extracted.confidence,
            }

            if (reflect) {
                /**
                 * When reflect is requested.
                 * Call reflector method.
                 */
                const reflectedData = await reflector(input, { cleaned, extracted, reflect })

                /**
                 * Set reflect data to output.
                 */
                _.set(output, "reflect", reflectedData)
            }

            /**
             * Calculate proccess duration.
             */
            logger("success", "butcher", "Done at", `${(Date.now() - startTime) / 1000}ms.`)

            /**
             * Resolve main promise.
             */
            resolve(output)
        } catch (error) {
            logger("error", "butcher", error.message)

            /**
             * Reject main promise.
             */
            reject(error)
        }
    })
}

export { butcher, CONST }
