class CPU {
  PC // Program Counter
  SP // Stack Pointer
  A // Accumulator
  X // X Register
  Y // Y Register
  C // Carry Flag
  Z // Zero Flag
  I // Interrupt Flag
  D // Decimal Flag
  B // Break Flag
  V // Overflow Flag
  N // Negative Flag
  Reset(bus) {
    this.PC = 0xfffc
    this.SP = 0x0100
    this.status
    this.D = 0
    this.C = 0
    this.Z = 0
    this.I = 0
    this.D = 0
    this.B = 0
    this.V = 0
    this.N = 0
    this.A = 0
    this.X = 0
    this.Y = 0
  }

  constructor() {
    this.Reset()
  }

  attachBus(bus) {
    this.bus = bus
  }

  Execute(cycles, bus) {
    const cycleObj = { cycles }
    while (cycleObj.cycles > 0) {
      const Ins = this.FetchByte(cycleObj, bus)
      this.doInstruction(Ins, cycleObj, bus)
    }
    const NumCyclesUsed = cycles - cycleObj.cycles
    return NumCyclesUsed
  }

  doInstruction(ins, cycleObj, bus) {
    switch (ins) {
      // LDA
      case CPU.INS_LDA_IM:
        {
          this.A = this.FetchByte(cycleObj, bus)
          this.SetStatusFlags("A")
        }
        break
      case CPU.INS_LDA_ZP:
        {
          let ZPageAddr = this.FetchByte(cycleObj, bus)
          this.A = this.ReadByte(cycleObj, ZPageAddr, bus)
          this.SetStatusFlags("A")
        }
        break
      case CPU.INS_LDA_ZPX:
        {
          let ZPageAddr = this.FetchByte(cycleObj, bus) + this.X
          if (ZPageAddr > 0xff) ZPageAddr -= 0x100
          this.A = this.ReadByte(cycleObj, ZPageAddr, bus)
          cycleObj.cycles--
          this.SetStatusFlags("A")
        }
        break
      case CPU.INS_LDA_ABS:
        {
          let AbsAddr = this.FetchWord(cycleObj, bus)
          this.A = this.ReadByte(cycleObj, AbsAddr, bus)
        }
        break
      case CPU.INS_LDA_ABSX:
        {
          let AbsAddr = this.FetchWord(cycleObj, bus)
          let AbsAddrX = AbsAddr + this.X
          this.A = this.ReadByte(cycleObj, AbsAddrX, bus)
          if (AbsAddrX - AbsAddr >= 0xff) {
            cycleObj.cycles--
          }
        }
        break
      case CPU.INS_LDA_ABSY:
        {
          let AbsAddr = this.FetchWord(cycleObj, bus)
          let AbsAddrY = AbsAddr + this.Y
          this.A = this.ReadByte(cycleObj, AbsAddrY, bus)
          if (AbsAddrY - AbsAddr >= 0xff) {
            cycleObj.cycles--
          }
        }
        break
      case CPU.INS_LDA_INDX:
        {
          let ZPageAddr = this.FetchByte(cycleObj, bus)
          let ZPageAddrX = ZPageAddr + this.X
          cycleObj.cycles--
          const EffectiveAddrX = this.ReadWord(cycleObj, ZPageAddrX, bus)
          this.A = this.ReadByte(cycleObj, EffectiveAddrX, bus)
          if (ZPageAddrX - ZPageAddr >= 0xff) cycleObj.cycles--
        }
        break
      case CPU.INS_LDA_INDY:
        {
          let ZPageAddr = this.FetchByte(cycleObj, bus)
          let EffectiveAddr = this.ReadWord(cycleObj, ZPageAddr, bus)
          let EffectiveAddrY = EffectiveAddr + this.Y
          this.A = this.ReadByte(cycleObj, EffectiveAddrY, bus)
          if (EffectiveAddrY - EffectiveAddr >= 0xff) cycleObj.cycles--
        }
        break

      // LDX
      case CPU.INS_LDX_IM:
        {
          this.X = this.FetchByte(cycleObj, bus)
          this.SetStatusFlags("X")
        }
        break
      // LDY
      case CPU.INS_LDY_IM:
        {
          this.Y = this.FetchByte(cycleObj, bus)
          this.SetStatusFlags("Y")
        }
        break
      // JSR
      case CPU.INS_JSR:
        {
          const SubAddr = this.FetchWord(cycleObj, bus)
          this.writeWord(cycleObj, this.PC - 1, this.SP, bus)
          this.PC = SubAddr
          this.SP += 2
          cycleObj.cycles--
        }
        break
      default: {
        throw new Error(`Bad Instruction: ${ins.toString()}`)
      }
    }
  }

  SetStatusFlags(Register) {
    this.Z = this[Register] === 0 ? 1 : 0
    this.N = (this[Register] & 0x80) > 0 ? 1 : 0
  }

  FetchByte(cycleObj, bus) {
    const data = bus.read(this.PC)
    this.PC++
    cycleObj.cycles--
    return data
  }

  ReadByte(cycleObj, addr, bus) {
    const data = bus.read(addr)
    cycleObj.cycles--
    return data
  }

  FetchWord(cycleObj, bus) {
    const lo = this.FetchByte(cycleObj, bus)
    const hi = this.FetchByte(cycleObj, bus)
    return (hi << 8) | lo
  }

  ReadWord(cycleObj, addr, bus) {
    const lo = this.ReadByte(cycleObj, addr, bus)
    const hi = this.ReadByte(cycleObj, addr + 1, bus)
    return (hi << 8) | lo
  }

  writeByte(cycleObj, addr, value, bus) {
    bus.write(addr, value)
    cycleObj.cycles--
  }

  writeWord(cycleObj, addr, value, bus) {
    bus.write(addr, value & 0xff)
    bus.write(addr + 1, value >> 8)
    cycleObj.cycles -= 2
  }
  // Instructions

  // LDA
  static INS_LDA_IM = 0xa9
  static INS_LDA_ZP = 0xa5
  static INS_LDA_ZPX = 0xb5
  static INS_LDA_ABS = 0xad
  static INS_LDA_ABSX = 0xbd
  static INS_LDA_ABSY = 0xb9
  static INS_LDA_INDX = 0xa1
  static INS_LDA_INDY = 0xb1

  // LDX
  static INS_LDX_IM = 0xa2
  static INS_LDX_ZP = 0xa6
  static INS_LDX_ZPY = 0xb6
  static INS_LDX_ABS = 0xae

  // LDY
  static INS_LDY_IM = 0xa0
  static INS_LDY_ZP = 0xa4
  static INS_LDY_ZPX = 0xb4
  static INS_LDY_ABS = 0xac
  static INS_LDY_ABSX = 0xbc

  // JSR
  static INS_JSR = 0x20
}

export default CPU
