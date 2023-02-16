import Test from "../../libs/client_unit_test/Test.js"
import CPU from "../CPU.js"
import Memory from "../Memory.js"

const Suite = "CPU"
const cpu = new CPU()
const memory = new Memory()
let program = []
Test.setup(Suite, () => {
  cpu.Reset(memory)
  program = new Array(Memory.MAX_MEM).fill(0)
})

function VerifyUnmodifiedFlags(cpuCopy) {
  this.EXPECT_EQ(cpu.C, cpuCopy.C, "The Carry Flag")
  this.EXPECT_EQ(cpu.I, cpuCopy.I, "The Interrupt Flag")
  this.EXPECT_EQ(cpu.D, cpuCopy.D, "The Decimal Flag")
  this.EXPECT_EQ(cpu.B, cpuCopy.B, "The Break Flag")
  this.EXPECT_EQ(cpu.V, cpuCopy.V, "The Overflow Flag")
}

new Test(Suite, "GENERAL", "Zero Cycle Instruction", function () {
  // given :
  const cycles = 0
  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, 0, "The number of cycles used")
})

new Test(Suite, "LDA", " Immediate Load Value", function () {
  // given :
  const cpuCopy = { ...cpu }
  const cycles = 2
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM
  program[0xfffd] = 0x84
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
})

new Test(Suite, "LDA", "Immediate Load Value", function () {
  // given :
  //start - inline a little program
  const cpuCopy = { ...cpu }
  const cycles = 2
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM
  program[0xfffd] = 0x84
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  this.EXPECT_EQ(cpu.A, 0x84, "The A Register")
  this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
  this.EXPECT_TRUE(cpu.N, "The Negative Flag")
  VerifyUnmodifiedFlags.call(this, cpuCopy)
})

new Test(Suite, "LDA", "Zero Page Load Value", function () {
  // given :
  //start - inline a little program
  const cpuCopy = { ...cpu }
  const cycles = 3
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZP
  program[0xfffd] = 0x42
  program[0x42] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, cycles)
  this.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags.call(this, cpuCopy)
})

new Test(Suite, "LDA", "Zero Page X Load Value", function () {
  // given :
  const cpuCopy = { ...cpu }
  const cycles = 4
  cpu.X = 5
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX
  program[0xfffd] = 0x42
  program[0x0047] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  this.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags.call(this, cpuCopy)
})

new Test(Suite, "LDA", " Zero Page X Load Value Wrap Around", function () {
  // given :
  const cpuCopy = { ...cpu }
  const cycles = 4
  cpu.X = 0xff
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX
  program[0xfffd] = 0x80
  program[0x007f] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  this.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags.call(this, cpuCopy)
})
