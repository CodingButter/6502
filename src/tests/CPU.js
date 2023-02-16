import Test from "../Test.js"
import CPU from "../6502/CPU.js"
import Memory from "../6502/Memory.js"

const Suite = "CPU"
const cpu = new CPU()
const memory = new Memory()
let program = []
Test.setup(Suite, () => {
  cpu.Reset(memory)
  program = new Array(Memory.MAX_MEM).fill(0)
})

const VerifyUnmodifiedFlags = (self, cpuCopy) => {
  self.EXPECT_EQ(cpu.C, cpuCopy.C, "The Carry Flag")
  self.EXPECT_EQ(cpu.I, cpuCopy.I, "The Interrupt Flag")
  self.EXPECT_EQ(cpu.D, cpuCopy.D, "The Decimal Flag")
  self.EXPECT_EQ(cpu.B, cpuCopy.B, "The Break Flag")
  self.EXPECT_EQ(cpu.V, cpuCopy.V, "The Overflow Flag")
}

new Test(Suite, "GENERAL", "Zero Cycle Instruction", (self) => {
  // given :
  // when :
  const cycles = 0
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, 0, "The number of cycles used")
})

new Test(Suite, "LDA", " Immediate Load Value", (self) => {
  // given :
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM
  program[0xfffd] = 0x84
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cpuCopy = { ...cpu }
  const cycles = 2
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
})

new Test(Suite, "LDA", "Immediate Load Value", (self) => {
  // given :
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM
  program[0xfffd] = 0x84
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cpuCopy = { ...cpu }
  const cycles = 2
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  self.EXPECT_EQ(cpu.A, 0x84, "The A Register")
  self.EXPECT_FALSE(cpu.Z, "The Zero Flag")
  self.EXPECT_TRUE(cpu.N, "The Negative Flag")
  VerifyUnmodifiedFlags(self, cpuCopy)
})

new Test(Suite, "LDA", "Zero Page Load Value", (self) => {
  // given :
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZP
  program[0xfffd] = 0x42
  program[0x42] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cpuCopy = { ...cpu }
  const cycles = 3
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, cycles)
  self.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags(self, cpuCopy)
})

new Test(Suite, "LDA", "Zero Page X Load Value", (self) => {
  // given :
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX
  program[0xfffd] = 0x42
  program[0x0047] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cpuCopy = { ...cpu }
  const cycles = 4
  cpu.X = 5
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  self.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags(self, cpuCopy)
})

new Test(Suite, "LDA", " Zero Page X Load Value Wrap Around", (self) => {
  // given :
  //start - inline a little program
  program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX
  program[0xfffd] = 0x80
  program[0x007f] = 0x37
  memory.loadProgram(program)
  //end - inline a little program

  // when :
  const cpuCopy = { ...cpu }
  const cycles = 4
  cpu.X = 0xff
  const cyclesUsed = cpu.Execute(cycles, memory)

  // then :
  self.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  self.EXPECT_EQ(cpu.A, 0x37)
  VerifyUnmodifiedFlags(self, cpuCopy)
})
