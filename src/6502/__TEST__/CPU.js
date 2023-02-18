import Test from "../../libs/client-unit-test/Test";
import CPU from "../CPU";
import Memory from "../Memory";

const Suite = "CPU";
let subSuite;

// Setup function for all tests in this suite
function setup() {
  const cpu = new CPU(); // Create a new CPU instance
  const memory = new Memory(); // Create a new Memory instance
  const program = new Array(Memory.MAX_MEM).fill(0); // Create a new program array
  cpu.Reset(memory); // Reset the CPU
  return { cpu, memory, program }; // Return the objects for use in the test
}

// Test the general CPU functionality
subSuite = "GENERAL"; // Set the subSuite name

// A test to verify that the CPU can execute zero cycles without error
new Test(
  Suite,
  subSuite,
  "Zero Cycle Instruction",
  function ({ cpu, memory, program }) {
    // given :
    const cycles = 0;
    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, 0, "The number of cycles used");
  },
  setup
);

// A test to verify that there are no errors when the CPU executes a bad instruction
new Test(
  Suite,
  subSuite,
  "Bad Instruction",
  function ({ cpu, memory, program }) {
    // given :
    const cycles = 1;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = 0xff;
    memory.loadProgram(program);
    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, 1, "The number of cycles used");
  },
  setup
);

// A test to verify that the CPU can execute with less cycles than required for an instruction without error
new Test(
  Suite,
  subSuite,
  "Less Cycles Than Required for Instruction",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 1;
    const expectedCyclesUsed = 2;

    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM;
    program[0xfffd] = 0x84;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, expectedCyclesUsed, "The number of cycles used");
  },
  setup
);

// Test the LDA instruction set
subSuite = "LDA"; // Set the subSuite name

// A reusable function to verify that the flags are unmodified
function VerifyUnmodifiedFlags(cpuCopy, cpu) {
  this.EXPECT_EQ(cpu.C, cpuCopy.C, "The Carry Flag");
  this.EXPECT_EQ(cpu.I, cpuCopy.I, "The Interrupt Flag");
  this.EXPECT_EQ(cpu.D, cpuCopy.D, "The Decimal Flag");
  this.EXPECT_EQ(cpu.B, cpuCopy.B, "The Break Flag");
  this.EXPECT_EQ(cpu.V, cpuCopy.V, "The Overflow Flag");
}

/*
  A test to verify that the LDA instruction can load
  an immediate value into the A register
*/

new Test(
  Suite,
  subSuite,
  " Immediate Load Value",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 2;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM;
    program[0xfffd] = 0x84;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used");
  },
  setup
);

/* 
  A test to verify that the LDA instruction can load 
  a zero page value into the A register
*/
new Test(
  Suite,
  subSuite,
  "Immediate Load Value",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 2;

    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_IM;
    program[0xfffd] = 0x84;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used");
    this.EXPECT_EQ(cpu.A, 0x84, "The A Register");
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag");
    this.EXPECT_TRUE(cpu.N, "The Negative Flag");
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu);
  },
  setup
);

/*
  A test to verify that the LDA instruction can load 
  a zero page value into the A register
*/
new Test(
  Suite,
  subSuite,
  "Zero Page Load Value",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 3;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZP;
    program[0xfffd] = 0x42;
    program[0x42] = 0x37;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles);
    this.EXPECT_EQ(cpu.A, 0x37);
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu);
  },
  setup
);

/*
  A test to verify that the LDA instruction can load a zero page value
  into the A register
*/
new Test(
  Suite,
  subSuite,
  "Zero Page X Load Value",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 4;
    cpu.X = 5;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX;
    program[0xfffd] = 0x42;
    program[0x0047] = 0x37;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used");
    this.EXPECT_EQ(cpu.A, 0x37);
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu);
  },
  setup
);

/*
 A test to verify that the LDA instruction can load a zero page value
 into the A register even when the X register wraps around
 */

new Test(
  Suite,
  subSuite,
  "Zero Page X Load Value Wrap Around",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 4;
    cpu.X = 0xff;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_ZPX;
    program[0xfffd] = 0x80;
    program[0x007f] = 0x37;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used");
    this.EXPECT_EQ(cpu.A, 0x37);
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu);
  },
  setup
);

/*
  A test to verify that the LDA instruction can load into A register
  in absolute mode
 */

new Test(
  Suite,
  subSuite,
  "Absolute Can Load Value into A Register",
  function ({ cpu, memory, program }) {
    // given :
    const cpuCopy = { ...cpu };
    const cycles = 4;
    //start - inline a little program
    program[CPU.RESET_VECTOR] = CPU.INS_LDA_ABS;
    program[0xfffd] = 0x80;
    program[0xfffe] = 0x44;
    program[0x4480] = 0x37;
    memory.loadProgram(program);
    //end - inline a little program

    // when :
    const cyclesUsed = cpu.Execute(cycles, memory);

    // then :
    this.EXPECT_EQ(cyclesUsed, cycles, "The number of cycles used");
    this.EXPECT_EQ(cpu.A, 0x37, "The A Register");
    this.EXPECT_FALSE(cpu.Z, "The Zero Flag");
    this.EXPECT_FALSE(cpu.N, "The Negative Flag");
    VerifyUnmodifiedFlags.call(this, cpuCopy, cpu);
  },
  setup
);
