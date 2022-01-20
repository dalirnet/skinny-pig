const fs = require("fs")
const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "one.jpg")
const reflect = path.resolve("test", "reflects", "one.png")

let output = {}

beforeAll(async () => {
    if (fs.existsSync(reflect)) {
        fs.rmSync(reflect)
    }
    output = await butcher(target, { reflect, log: false })
})

test("Signal", () => {
    expect(output.signal).toEqual({
        pair: ["LUNA", "USDT"],
        entry: [75, 88],
        stop: [66.56],
        targets: [91.2, 94.5, 101.3, 114.5, 128, 160],
    })
})

test("Confidence", () => {
    expect(output.confidence).toBeGreaterThan(85)
})

test("Reflect", () => {
    expect(output.reflect).toBe(reflect)
})
