const fs = require("fs")
const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "four.jpg")
const reflect = path.resolve("test", "reflects", "four.png")

let output = {}

beforeAll(async () => {
    if (fs.existsSync(reflect)) {
        fs.rmSync(reflect)
    }
    output = await butcher(target, { reflect, log: false })
})

test("Signal", () => {
    expect(output.signal).toEqual({
        pair: ["CRV", "USDT"],
        entry: [3.85, 4.22],
        stop: [3.19],
        targets: [4.35, 4.49, 4.85, 5, 5.38],
    })
})

test("Confidence", () => {
    expect(output.confidence).toBeGreaterThan(85)
})

test("Reflect", () => {
    expect(output.reflect).toBe(reflect)
})
