import { terser } from "rollup-plugin-terser"

const isProduction = process.env.NODE_ENV === "production"

export default [
    {
        input: "src/index.mjs",
        external: ["fs", "url", "path", "lodash", "sharp", "mustache", "tesseract.js"],
        plugins: isProduction ? [terser()] : [],
        output: [
            {
                file: "dist/index.mjs",
                format: "es",
                compact: isProduction,
            },
            {
                file: "dist/index.cjs",
                format: "cjs",
                compact: isProduction,
            },
        ],
    },
]
