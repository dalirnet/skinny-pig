const path = require("path")
const { butcher } = require("../dist/index.cjs")

const target = path.resolve("test", "targets", "invalid.jpg")

test("Invalid", async () => {
    await expect(butcher(target, { log: false })).rejects.toThrow("Invalid input")
})
