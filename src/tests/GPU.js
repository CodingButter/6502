import Test from "../Test.js"
import CPU from "../6502/CPU.js"
import Memory from "../6502/Memory.js"

const Suite = "GPU"
const cpu = new CPU()
const memory = new Memory()
let program = []
Test.setup(Suite, () => {
  cpu.Reset(memory)
  program = new Array(0x10000).fill(0)
  program.fill(0)
})
