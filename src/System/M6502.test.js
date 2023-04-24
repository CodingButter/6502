import BUS from "./BUS"
import M6502 from "./M6502"

let bus = new BUS()
let program
const initialize = () => {
  bus.cpu.Reset()
  bus.ram.set(program)
  program = []
}
initialize()

const VerifyUnmodifiedFlags = (cpuCopy, cpu) => {
  expect(cpu.C).toBe(cpuCopy.C)
  expect(cpu.I).toBe(cpuCopy.I)
  expect(cpu.D).toBe(cpuCopy.D)
  expect(cpu.B).toBe(cpuCopy.B)
  expect(cpu.V).toBe(cpuCopy.V)
}

const TestLoadRegisterImmediate = (OpcodeToTest, RegisterToTest) => {
  //given:
  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x84
  //end - inline a little program
  initialize()
  const cpuCopy = { ...bus.cpu }
  const cycles = 2

  //when:
  const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(bus.cpu[RegisterToTest]).toBe(0x84)
  expect(bus.cpu.Z).toBe(0)
  expect(bus.cpu.N).toBe(1)
  VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
}

const TestCanAffectZeroFlag = (OpcodeToTest, RegisterToTest) => {
  //given:

  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x00
  initialize()
  //end - inline a little program
  const cpuCopy = { ...bus.cpu }
  const cycles = 2
  bus.cpu[RegisterToTest] = 0x44

  //when:
  const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(bus.cpu.Z).toBe(1)
  expect(bus.cpu.N).toBe(0)
  VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
}

const TestLoadRegisterZeroPage = (OpcodeToTest, RegisterToTest) => {
  //given:

  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x42
  program[0x42] = 0x37
  //end - inline a little program
  initialize()
  const cycles = 3
  bus.cpu[RegisterToTest] = 0x44
  const cpuCopy = { ...bus.cpu }

  //when:
  const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(bus.cpu[RegisterToTest]).toBe(0x37)
  VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
}

const TestLoadRegisterZeroPageChangeRegister = (OpcodeToTest, RegisterToTest, RegisterToChange) => {
  //given:

  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x42
  program[0x47] = 0x37 //0x42 + 5 = 0x47
  initialize()
  const cpuCopy = { ...bus.cpu }
  const cycles = 4
  bus.cpu[RegisterToChange] = 5
  //end - inline a little program

  //when:
  const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(bus.cpu[RegisterToTest]).toBe(0x37)
  VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
}

describe("M6502", () => {
  describe("GENERAL", () => {
    test("LDA Zero Cycles", () => {
      //given:

      initialize()
      const expectedCycles = 0

      //when:
      const cyclesUsed = bus.cpu.Execute(expectedCycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(expectedCycles)
    })

    test("Less Cycles than Required for Instruction", () => {
      //given:
      program[0xfffc] = M6502.INS_LDA_IM
      program[0xfffd] = 0x84
      initialize()
      const expectedCycles = 2
      const cyclesToExecute = 1

      //when:
      const cyclesUsed = bus.cpu.Execute(cyclesToExecute, bus.ram)

      //then:
      expect(cyclesUsed).toBe(expectedCycles)
    })
  })

  describe("LDA", () => {
    /**
     * 
        LDA Load Accumulator with RAM
          M -> A                          N	Z	C	I	D	V
                                          +	+	-	-	-	-
          addressing    assembler	  opc   bytes	cycles
          --------------------------------------------
          immediate	    LDA #oper	    A9	2	    2  
          zeropage	    LDA oper	    A5	2	    3  
          zeropage,X	  LDA oper,X	  B5	2	    4  
          absolute	    LDA oper	    AD	3	    4  
          absolute,X	  LDA oper,X	  BD	3	    4* 
          absolute,Y	  LDA oper,Y	  B9	3	    4* 
          (indirect,X)	LDA (oper,X)  A1	2	    6  
          (indirect),Y	LDA (oper),Y  B1	2	    5* 
     * 
     */

    test("Immediate can Load a value into A Register", () => {
      TestLoadRegisterImmediate(M6502.INS_LDA_IM, "A")
    })

    test("Immediate can affect the Z flag", () => {
      TestCanAffectZeroFlag(M6502.INS_LDA_IM, "A")
    })

    test("Zero Page Load Value Into the A Register", () => {
      TestLoadRegisterZeroPage(M6502.INS_LDA_ZP, "A")
    })

    test("Zero Page X Load Value into the A register", () => {
      TestLoadRegisterZeroPageChangeRegister(M6502.INS_LDA_ZPX, "A", "X")
    })

    test("Zero Page X Load Value into the A register when Wrapping Around", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ZPX
      program[0xfffd] = 0x42
      program[0x41] = 0x37 //0x42 + 0xff = 0x41
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      const cycles = 4
      bus.cpu.X = 0xff

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Absolute Load Value into A Register", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ABS
      program[0xfffd] = 0x80
      program[0xfffe] = 0x44
      program[0x4480] = 0x37
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      const cycles = 4

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Absolute X can load a value into the A Register", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ABSX
      program[0xfffd] = 0x80
      program[0xfffe] = 0x44 //0x4480
      program[0x4481] = 0x37
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      const cycles = 4
      bus.cpu.X = 1

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(bus.cpu.A).toBe(0x37)
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Absolute X can load a value into the A Register accross a page boundary", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ABSX
      program[0xfffd] = 0x02
      program[0xfffe] = 0x44 // 0x4402
      program[0x4501] = 0x37 /// 0x4402 + 0xff = 0x4501
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      bus.cpu.X = 0xff
      const cycles = 5

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Absolute Y can load a value into the A Register", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ABSY
      program[0xfffd] = 0x80
      program[0xfffe] = 0x44 //0x4480
      program[0x4481] = 0x37
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      const cycles = 4
      bus.cpu.Y = 1

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(bus.cpu.A).toBe(0x37)
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Absolute Y can load a value into the A Register accross a page boundary", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_ABSY
      program[0xfffd] = 0x02
      program[0xfffe] = 0x44
      program[0x4501] = 0x37 /// 0x4500 + 0xff
      initialize()
      //end - inline a little program
      const cycles = 5
      bus.cpu.Y = 0xff
      const cpuCopy = { ...bus.cpu }

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Indirect X can load a value into the A Register", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_INDX
      program[0xfffd] = 0x02
      program[0x0006] = 0x00
      program[0x0007] = 0x80
      program[0x8000] = 0x37 //0x8000 + 0x04 = 0x8004
      initialize()
      //end - inline a little program
      const cycles = 6
      bus.cpu.X = 0x04
      const cpuCopy = { ...bus.cpu }

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Indirect Y can load a value into the A Register", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_INDY
      program[0xfffd] = 0x02
      program[0x0002] = 0x00
      program[0x0003] = 0x80
      program[0x8004] = 0x37 //0x8000 + 0x04 = 0x8004
      initialize()
      //end - inline a little program
      const cpuCopy = { ...bus.cpu }
      const cycles = 5
      bus.cpu.Y = 0x04

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })

    test("Indirect Y can load a value into the A Register accross a page boundary", () => {
      //given:

      //start - inline a little program
      program[0xfffc] = M6502.INS_LDA_INDY
      program[0xfffd] = 0x02
      program[0x0002] = 0x02
      program[0x0003] = 0x80
      program[0x8101] = 0x37 //0x8002 + 0xff
      initialize()
      const cpuCopy = { ...bus.cpu }
      const cycles = 6
      bus.cpu.Y = 0xff
      //end - inline a little program

      //when:
      const cyclesUsed = bus.cpu.Execute(cycles, bus.ram)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(bus.cpu.A).toBe(0x37)
      expect(bus.cpu.Z).toBe(0)
      expect(bus.cpu.N).toBe(0)
      VerifyUnmodifiedFlags(cpuCopy, bus.cpu)
    })
  })

  describe("LDX", () => {
    /**
    * 
        LDX Load Index X with RAM
        M -> X                           N Z C I D V
                                         + + - - - -
        addressing    assembler    opc  bytes  cyles
        --------------------------------------------
        immediate     LDX #oper     A2    2     2
        zeropage      LDX oper      A6    2     3
        zeropage,Y    LDX oper,Y    B6    2     4
        absolute      LDX oper      AE    3     4
        absolute,Y    LDX oper,Y    BE    3     4*
    *    
    **/

    test("Immediate can Load a value into X Register", () => {
      TestLoadRegisterImmediate(M6502.INS_LDX_IM, "X")
    })

    test("Immediate can affect the Z flag", () => {
      TestCanAffectZeroFlag(M6502.INS_LDX_IM, "X")
    })

    test("Zero Page can Load a value into X Register", () => {
      TestLoadRegisterZeroPage(M6502.INS_LDX_ZP, "X")
    })

    test("Zero Page Y Load Value into the X register", () => {
      TestLoadRegisterZeroPageChangeRegister(M6502.INS_LDA_ZPY, "X", "Y")
    })
  })

  describe("LDY", () => {
    /**
     *  
        LDY Load Index Y with RAM
        M -> Y                            N Z C I D V
                                          + + - - - -
        addressing    assembler    opc  bytes  cyles
        --------------------------------------------
        immediate     LDY #oper     A0    2     2
        zeropage      LDY oper      A4    2     3
        zeropage,X    LDY oper,X    B4    2     4
        absolute      LDY oper      AC    3     4
        absolute,X    LDY oper,X    BC    3     4*
      *
    **/

    test("Immediate can Load a value into Y Register", () => {
      TestLoadRegisterImmediate(M6502.INS_LDY_IM, "Y")
    })

    test("Immediate can affect the Z flag", () => {
      TestCanAffectZeroFlag(M6502.INS_LDX_IM, "Y")
    })

    test("Zero Page can Load a value into Y Register", () => {
      TestLoadRegisterZeroPage(M6502.INS_LDY_ZP, "Y")
    })

    test("Zero Page X Load Value into the Y register", () => {
      TestLoadRegisterZeroPageChangeRegister(M6502.INS_LDY_ZPX, "Y", "X")
    })
  })
})
