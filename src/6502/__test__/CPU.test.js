import CPU from "../CPU"
import Memory from "../Memory"

const cpu = new CPU()
const memory = new Memory()
let program = []
const initialize = (_program = []) => {
  cpu.Reset(memory)
  program = _program
  memory.loadData(program)
}

describe("CPU", () => {
  describe("GENERAL", () => {
    test("LDA Zero Cycles", () => {
      //given
      initialize()
      const expectedCycles = 0
      //when
      const cyclesUsed = cpu.Execute(expectedCycles, memory)
      //then
      expect(cyclesUsed).toBe(expectedCycles)
    })

    test("Bad Instruction", () => {
      //given
      program[0xfffc] = 0x00
      initialize(program)
      const expectedCycles = 1
      //when
      const cyclesUsed = cpu.Execute(expectedCycles, memory)
      //then
      expect(cyclesUsed).toBe(expectedCycles)
    })

    test("Less Cycles than Required for Instruction", () => {
      //given
      program[0xfffc] = CPU.INS_LDA_IM
      program[0xfffd] = 0x84
      initialize(program)
      const expectedCycles = 2
      const cyclesToExecute = 1

      //when
      const cyclesUsed = cpu.Execute(cyclesToExecute, memory)
      //then
      expect(cyclesUsed).toBe(expectedCycles)
    })
  })

  describe("LDA", () => {
    function VerifyUnmodifiedFlags(cpuCopy, cpu) {
      expect(cpu.C).toBe(cpuCopy.C)
      expect(cpu.I).toBe(cpuCopy.I)
      expect(cpu.D).toBe(cpuCopy.D)
      expect(cpu.B).toBe(cpuCopy.B)
      expect(cpu.V).toBe(cpuCopy.V)
    }

    test("Immediately Load a value into A Register", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 2
      const expectedAValue = 0x84
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_IM
      program[0xfffd] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cpu.A).toBe(expectedAValue)
      expect(cpu.Z).toBe(0)
      expect(cpu.N).toBe(1)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Immediate can affect the Z flag", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 2
      const expectedAValue = 0x00
      cpu.A = 0x44
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_IM
      program[0xfffd] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cpu.Z).toBe(1)
      expect(cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Zero Page Load Value", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 3
      cpu.A = 0x39
      const expectedAValue = 0x37
      const expectedZPageAddr = 0x42
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_ZP
      program[0xfffd] = expectedZPageAddr
      program[expectedZPageAddr] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      cpu.Execute(cycles, memory)

      //then
      expect(cpu.A).toBe(expectedAValue)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Zero Page X Load Value", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 4
      cpu.X = 5
      const expectedAValue = 0x37
      const expectedZPageAddr = 0x42
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_ZPX
      program[0xfffd] = expectedZPageAddr
      program[expectedZPageAddr + cpu.X] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cyclesUsed).toBe(cycles)
      expect(cpu.A).toBe(expectedAValue)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Zero Page X Load Value Wrap Around", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 4
      cpu.X = 0xff
      const expectedAValue = 0x37
      const expectedZPageAddr = 0x42
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_ZPX
      program[0xfffd] = expectedZPageAddr
      program[expectedZPageAddr + cpu.X] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cyclesUsed).toBe(cycles)
      expect(cpu.A).toBe(expectedAValue)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Absolute Load Value into A Register", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 4
      const expectedAValue = 0x37
      const expectedAbsAddr = 0x42
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_ABS
      program[0xfffd] = expectedAbsAddr
      program[0xfffe] = 0x00
      program[expectedAbsAddr] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cyclesUsed).toBe(cycles)
      expect(cpu.A).toBe(expectedAValue)
      expect(cpu.Z).toBe(0)
      expect(cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })

    test("Absolute X can load a value into the A Register", () => {
      //given:
      const cpuCopy = { ...cpu }
      const cycles = 4
      cpu.X = 0x01
      const expectedAValue = 0x37
      const expectedAbsAddr = 0x42
      //start - inline a little program
      program[0xfffc] = CPU.INS_LDA_ABSX
      program[0xfffd] = expectedAbsAddr
      program[0xfffe] = 0x00
      program[expectedAbsAddr + cpu.X] = expectedAValue
      initialize(program)
      //end - inline a little program

      //when
      const cyclesUsed = cpu.Execute(cycles, memory)

      //then
      expect(cyclesUsed).toBe(cycles)
      expect(cpu.A).toBe(expectedAValue)
      expect(cpu.Z).toBe(0)
      expect(cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, cpu)
    })
  })
})
