const fs = require("fs")
const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "five.jpg")
const reflect = path.resolve("test", "reflects", "five.png")

let output = {}

beforeAll(async () => {
    if (fs.existsSync(reflect)) {
        fs.rmSync(reflect)
    }
    output = await butcher(target, { reflect, log: false })
})

test("Signal", () => {
    expect(output.signal).toEqual({
        pair: ["BNB", "USDT"],
        entry: [560, 614],
        stop: [479],
        targets: [632, 658, 705, 780, 900, 1150],
    })
})

test("Confidence", () => {
    expect(output.confidence).toBeGreaterThan(85)
})

test("Reflect", () => {
    expect(output.reflect).toBe(reflect)
})
