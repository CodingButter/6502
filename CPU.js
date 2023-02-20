import Test from "./src/libs/client-unit-test/Test"
import CPU from "./src/6502/CPU"
import Memory from "./src/6502/Memory"

const Suite = "CPU"
let subSuite

// Setup function for all tests in this suite
function setup() {
  const cpu = new CPU() // Create a new CPU instance
  const memory = new Memory() // Create a new Memory instance
  cpu.Reset(memory) // Reset the CPU
  return { cpu, memory } // Return the objects for use in the test
}

// Test the general CPU functionality
subSuite = "GENERAL" // Set the subSuite name

new Test(
  Suite,
  subSuite,
  "Zero Cycle Instruction",
  function ({ cpu, memory }) {
    // given :
    const cycles = 0
    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, 0, "The number of cycles used")
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Bad Instruction",
  function ({ cpu, memory }) {
    // given :
    const cycles = 1
    //start - inline a little program
    memory.memory.setUint8(0xfffc, 0xff)

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, 1, "The number of cycles used")
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Less Cycles Than Required for Instruction",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 1
    const expectedCyclesUsed = 2

    //start - inline a little program
    memory.writeByte(0xfffc, CPU.INS_LDA_IM)
    memory.memory.setUint8(0xfffd, 0x84)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, expectedCyclesUsed, "The number of cycles used")
  },
  setup
)

// Test the LDA instruction set
subSuite = "LDA" // Set the subSuite name

// A reusable function to verify that the flags are unmodified
function VerifyUnmodifiedFlags(cpuCopy, cpu) {
  this.EXPECT_EQ(cpu.C, cpuCopy.C, "The Carry Flag")
  this.EXPECT_EQ(cpu.I, cpuCopy.I, "The Interrupt Flag")
  this.EXPECT_EQ(cpu.D, cpuCopy.D, "The Decimal Flag")
  this.EXPECT_EQ(cpu.B, cpuCopy.B, "The Break Flag")
  this.EXPECT_EQ(cpu.V, cpuCopy.V, "The Overflow Flag")
}

new Test(
  Suite,
  subSuite,
  "Immediate Load a Value into the A Register",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 2
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_IM)
    memory.memory.setUint8(0xfffd, 0x84)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Immediate Can Affect The Zero Flag",
  function ({ cpu, memory }) {
    // given :
    cpu.A = 0x44
    const cpuCopy = { ...cpu }
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_IM)
    memory.memory.setUint8(0xfffd, 0x0)

    //end - inline a little program

    // when :
    cpu.Execute(2, memory)

    // then :
    this.EXPECT_TRUE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Zero Page Load Value",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 3
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ZP)
    memory.memory.setUint8(0xfffd, 0x42)
    memory.memory.setUint8(0x42, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles)
    this.EXPECT_EQ(cpu.A, 0x37)
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Zero Page X Load Value",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 4
    cpu.X = 5
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ZPX)
    memory.memory.setUint8(0xfffd, 0x42)
    memory.memory.setUint8(0x0047, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37)
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Zero Page X Load Value Wrap Around",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 4
    cpu.X = 0xff
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ZPX)
    memory.memory.setUint8(0xfffd, 0x80)
    memory.memory.setUint8(0x007f, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37)
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Absolute Can Load Value into A Register",
  function ({ cpu, memory }) {
    // given :
    const cpuCopy = { ...cpu }
    const cycles = 4
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ABS)
    memory.memory.setUint8(0xfffd, 0x80)
    memory.memory.setUint8(0xfffe, 0x44)
    memory.memory.setUint8(0x4480, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Absolute X can load a value into the A register",
  function ({ cpu, memory }) {
    // given :
    cpu.X = 1
    const cpuCopy = { ...cpu }
    const cycles = 4
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ABSX)
    memory.memory.setUint8(0xfffd, 0x80)
    memory.memory.setUint8(0xfffe, 0x44)
    memory.memory.setUint8(0x4481, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Absolute X can load a value into the A register across a page boundary",
  function ({ cpu, memory }) {
    // given :
    cpu.X = 0xff
    const cpuCopy = { ...cpu }
    const cycles = 5
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ABSX)
    memory.memory.setUint8(0xfffd, 0x02)
    memory.memory.setUint8(0xfffe, 0x44) // 0x44
    memory.memory.setUint8(0x4501, 0x37) // 0x4402 + 0xff crosses a page boundary

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Absolute Y can load a value into the A register",
  function ({ cpu, memory }) {
    // given :
    cpu.Y = 1
    const cpuCopy = { ...cpu }
    const cycles = 4
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ABSY)
    memory.memory.setUint8(0xfffd, 0x80)
    memory.memory.setUint8(0xfffe, 0x44)
    memory.memory.setUint8(0x4481, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Absolute Y can load a value into the A register across a page boundary",
  function ({ cpu, memory }) {
    // given :
    cpu.Y = 0xff
    const cpuCopy = { ...cpu }
    const cycles = 5
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_ABSY)
    memory.memory.setUint8(0xfffd, 0x02)
    memory.memory.setUint8(0xfffe, 0x44) // 0x44
    memory.memory.setUint8(0x4501, 0x37) // 0x4402 + 0xff crosses a page boundary

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Indirect X can load a value into the A register",
  function ({ cpu, memory }) {
    // given :
    cpu.X = 0x04
    const cpuCopy = { ...cpu }
    const cycles = 6
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_INDX)
    memory.memory.setUint8(0xfffd, 0x04)
    memory.memory.setUint8(0x0006, 0x00) // 0x2 + 0x4
    memory.memory.setUint8(0x0007, 0x80)
    memory.memory.setUint8(0x8000, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Indirect Y can load a value into the A register",
  function ({ cpu, memory }) {
    // given :
    cpu.Y = 0x04
    const cpuCopy = { ...cpu }
    const cycles = 6
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_INDY)
    memory.memory.setUint8(0xfffd, 0x04)
    memory.memory.setUint8(0x0006, 0x00) // 0x2 + 0x4
    memory.memory.setUint8(0x0007, 0x80)
    memory.memory.setUint8(0x8000, 0x37)

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Indirect Y can load a value into the A register",
  function ({ cpu, memory }) {
    // given :
    cpu.Y = 0x04
    const cpuCopy = { ...cpu }
    const cycles = 5
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_INDY)
    memory.memory.setUint8(0xfffd, 0x02)
    memory.memory.setUint8(0x0002, 0x00) // 0x2 + 0x4
    memory.memory.setUint8(0x0003, 0x80)
    memory.memory.setUint8(0x8004, 0x37) // 0x8000 + 0x4

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)

new Test(
  Suite,
  subSuite,
  "Indirect Y can load a value into the A register across a page boundary",
  function ({ cpu, memory }) {
    // given :
    cpu.Y = 0xff
    const cpuCopy = { ...cpu }
    const cycles = 6
    //start - inline a little program
    memory.memory.setUint8(0xfffc, CPU.INS_LDA_INDY)
    memory.memory.setUint8(0xfffd, 0x02)
    memory.memory.setUint8(0x0002, 0x02) // 0x2 + 0x4
    memory.memory.setUint8(0x0003, 0x80)
    memory.memory.setUint8(0x8101, 0x37) // 0x8000 + 0xff

    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory)

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used")
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register")
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag")
    this.EXPECT_FALSE(cpu.N, "The Negative Flag")
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu)
  },
  setup
)
