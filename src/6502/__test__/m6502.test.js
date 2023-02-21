import M6502 from "../m6502"
import Memory from "../Memory"

let my6502
let memory
let program = new Uint8Array(Memory.MAX_MEM).fill(0x00)
const initialize = () => {
  my6502 = new M6502()
  memory = new Memory()
  my6502.Reset(memory)
  memory.loadData([...program])
  program = new Uint8Array(Memory.MAX_MEM).fill(0x00)
}

const VerifyUnmodifiedFlags = (my6502Copy, my6502) => {
  expect(my6502.C).toBe(my6502Copy.C)
  expect(my6502.I).toBe(my6502Copy.I)
  expect(my6502.D).toBe(my6502Copy.D)
  expect(my6502.B).toBe(my6502Copy.B)
  expect(my6502.V).toBe(my6502Copy.V)
}

const TestLoadRegisterImmediate = (OpcodeToTest, RegisterToTest) => {
  //given:
  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x84
  //end - inline a little program
  initialize()
  const my6502Copy = { ...my6502 }
  const cycles = 2

  //when:
  const cyclesUsed = my6502.Execute(cycles, memory)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(my6502[RegisterToTest]).toBe(0x84)
  expect(my6502.Z).toBe(0)
  expect(my6502.N).toBe(1)
  VerifyUnmodifiedFlags(my6502Copy, my6502)
}

const TestCanAffectZeroFlag = (OpcodeToTest, RegisterToTest) => {
  //given:

  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x00
  initialize()
  //end - inline a little program
  const my6502Copy = { ...my6502 }
  const cycles = 2
  my6502[RegisterToTest] = 0x44

  //when:
  const cyclesUsed = my6502.Execute(cycles, memory)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(my6502.Z).toBe(1)
  expect(my6502.N).toBe(0)
  VerifyUnmodifiedFlags(my6502Copy, my6502)
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
  my6502[RegisterToTest] = 0x44
  const my6502Copy = { ...my6502 }

  //when:
  const cyclesUsed = my6502.Execute(cycles, memory)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(my6502[RegisterToTest]).toBe(0x37)
  VerifyUnmodifiedFlags(my6502Copy, my6502)
}

const TestLoadRegisterZeroPageChangeRegister = (OpcodeToTest, RegisterToTest, RegisterToChange) => {
  //given:

  //start - inline a little program
  program[0xfffc] = OpcodeToTest
  program[0xfffd] = 0x42
  program[0x47] = 0x37 //0x42 + 5 = 0x47
  initialize()
  const my6502Copy = { ...my6502 }
  const cycles = 4
  my6502[RegisterToChange] = 5
  //end - inline a little program

  //when:
  const cyclesUsed = my6502.Execute(cycles, memory)

  //then:
  expect(cyclesUsed).toBe(cycles)
  expect(my6502[RegisterToTest]).toBe(0x37)
  VerifyUnmodifiedFlags(my6502Copy, my6502)
}

describe("M6502", () => {
  describe("GENERAL", () => {
    test("LDA Zero Cycles", () => {
      //given:

      initialize()
      const expectedCycles = 0

      //when:
      const cyclesUsed = my6502.Execute(expectedCycles, memory)

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
      const cyclesUsed = my6502.Execute(cyclesToExecute, memory)

      //then:
      expect(cyclesUsed).toBe(expectedCycles)
    })
  })

  describe("LDA", () => {
    /**
     * 
        LDA Load Accumulator with Memory
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
      const my6502Copy = { ...my6502 }
      const cycles = 4
      my6502.X = 0xff

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      const cycles = 4

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      const cycles = 4
      my6502.X = 1

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(my6502.A).toBe(0x37)
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      my6502.X = 0xff
      const cycles = 5

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      const cycles = 4
      my6502.Y = 1

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(my6502.A).toBe(0x37)
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      my6502.Y = 0xff
      const my6502Copy = { ...my6502 }

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      my6502.X = 0x04
      const my6502Copy = { ...my6502 }

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      const cycles = 5
      my6502.Y = 0x04

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
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
      const my6502Copy = { ...my6502 }
      const cycles = 6
      my6502.Y = 0xff
      //end - inline a little program

      //when:
      const cyclesUsed = my6502.Execute(cycles, memory)

      //then:
      expect(cyclesUsed).toBe(cycles)
      expect(my6502.A).toBe(0x37)
      expect(my6502.Z).toBe(0)
      expect(my6502.N).toBe(0)
      VerifyUnmodifiedFlags(my6502Copy, my6502)
    })
  })

  describe("LDX", () => {
    /**
    * 
        LDX Load Index X with Memory
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
        LDY Load Index Y with Memory
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
