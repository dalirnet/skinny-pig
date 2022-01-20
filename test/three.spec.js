const fs = require("fs")
const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "three.jpg")
const reflect = path.resolve("test", "reflects", "three.png")

let output = {}

beforeAll(async () => {
    if (fs.existsSync(reflect)) {
        fs.rmSync(reflect)
    }
    output = await butcher(target, { reflect, log: false })
})

test("Signal", () => {
    expect(output.signal).toEqual({
        pair: ["FTM", "USDT"],
        entry: [1.5, 1.75],
        stop: [1.29],
        targets: [1.81, 1.9, 2.05, 2.25, 2.5, 3.14],
    })
})

test("Confidence", () => {
    expect(output.confidence).toBeGreaterThan(85)
})

test("Reflect", () => {
    expect(output.reflect).toBe(reflect)
})
