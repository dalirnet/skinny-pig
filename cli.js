#!/usr/bin/env node

const _ = require("lodash")
const path = require("path")
const yargs = require("yargs/yargs")
const { butcher, CONST } = require("./dist/index.cjs")

var { argv } = yargs(process.argv.slice(2))

butcher(path.resolve(_.head(argv._)), {
    channel: argv.channel || argv.c || CONST.CHANNEL,
    separator: argv.separator || CONST.SEPARATOR,
    reflect: argv.reflect || argv.r || CONST.REFLECT,
})
    .then((output) => {
        console.log(output)
        process.exit(0)
    })
    .catch(({ message }) => {
        console.error(message)
        process.exit(1)
    })
