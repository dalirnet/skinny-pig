#!/usr/bin/env node

const _ = require("lodash")
const path = require("path")
const yargs = require("yargs/yargs")
const { butcher, CONST } = require("./dist/index.cjs")

var { argv } = yargs(process.argv.slice(2))

const cli = async () => {
    try {
        const target = path.resolve(_.head(argv._) || "./")
        const options = {
            channel: argv.channel || argv.c || CONST.CHANNEL,
            separator: argv.separator || argv.s || CONST.SEPARATOR,
            reflect: argv.reflect || argv.r || CONST.REFLECT,
            log: argv.log || argv.l || CONST.LOG,
        }
        const output = await butcher(target, options)
        console.log(output)
    } catch ({ message }) {
        console.error(message)
    }
}

cli()
