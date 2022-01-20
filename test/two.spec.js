const fs = require("fs")
const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "two.jpg")
const reflect = path.resolve("test", "reflects", "two.png")

let output = {}

beforeAll(async () => {
    if (fs.existsSync(reflect)) {
        fs.rmSync(reflect)
    }
    output = await butcher(target, { reflect, log: false })
})

test("Signal", () => {
    expect(output.signal).toEqual({
        pair: ["MANA", "USDT"],
        entry: [3.4, 3.96],
        stop: [2.9],
        targets: [4.1, 4.3, 4.66, 5.13, 5.88, 7.9],
    })
})

test("Confidence", () => {
    expect(output.confidence).toBeGreaterThan(85)
})

test("Reflect", () => {
    expect(output.reflect).toBe(reflect)
})
