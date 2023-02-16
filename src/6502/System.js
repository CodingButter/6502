import CPU, { INST, A } from "./CPU.js"
import Memory from "./Memory.js"
const cpu = new CPU()
const memory = new Memory()
class System {
  constructor() {
    cpu.Reset(memory)
  }
  reset() {
    cpu.Reset(memory)
  }
  loadProgram(program) {
    memory.loadProgram(program)
  }

  execute(cycles) {
    cpu.Execute(cycles, memory)
  }
}

export default System
