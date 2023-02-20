class CPU {
  PC // Program Counter
  SP // Stack Pointer
  A // Accumulator
  X // X Register
  Y // Y Register
  C // Carry Flag
  Z = false // Zero Flag
  I // Interrupt Flag
  D // Decimal Flag
  B // Break Flag
  V // Overflow Flag
  N = false // Negative Flag

  Reset(memory) {
    this.PC = 0xfffc
    this.SP = 0x0100
    this.D =
      this.C =
      this.Z =
      this.I =
      this.D =
      this.B =
      this.V =
      this.N =
      this.A =
      this.X =
      this.Y =
        0
    memory.Initialize()
  }

  Execute(cycles, memory) {
    const cycleObj = { cycles }
    while (cycleObj.cycles > 0) {
      const Ins = this.FetchByte(cycleObj, memory)
      this.doInstruction(Ins, cycleObj, memory)
    }
    const NumCyclesUsed = cycles - cycleObj.cycles
    return NumCyclesUsed
  }

  doInstruction(ins, cycleObj, memory) {
    switch (ins) {
      case CPU.INS_LDA_IM:
        this.A = this.FetchByte(cycleObj, memory)
        this.LDASetStatus()
        break
      case CPU.INS_LDA_ZP:
        const ZPageAddr = this.FetchByte(cycleObj, memory)
        this.A = this.ReadByte(cycleObj, ZPageAddr, memory)
        this.LDASetStatus()
        break
      case CPU.INS_LDA_ZPX:
        let ZPageXAddr = this.FetchByte(cycleObj, memory) + this.X
        if (ZPageXAddr > 0xff) ZPageXAddr -= 0x100
        this.A = this.ReadByte(cycleObj, ZPageXAddr, memory)
        cycleObj.cycles--
        this.LDASetStatus()
        break
      case CPU.INS_LDA_ABS:
        const AbsAddr = this.FetchWord(cycleObj, memory)
        this.A = this.ReadByte(cycleObj, AbsAddr, memory)
        break
      case CPU.INS_LDA_ABSX:
        const AbsXAddr = this.FetchWord(cycleObj, memory) + this.X
        this.A = this.ReadByte(cycleObj, AbsXAddr, memory)
        this.LDASetStatus()
        break
      case CPU.INS_JSR:
        const SubAddr = this.FetchWord(cycleObj, memory)
        this.writeWord(cycleObj, this.PC - 1, this.SP, memory)
        this.PC = SubAddr
        this.SP += 2
        cycleObj.cycles--
        break
      default:
        console.log(`Unknown Instruction: 0x${ins?.toString(16).toUpperCase() || ins}`)
    }
  }

  LDASetStatus() {
    this.Z = this.A === 0 ? 1 : 0
    this.N = (this.A & 0x80) > 0 ? 1 : 0
  }

  FetchByte(cycleObj, memory) {
    const data = memory.readByte(this.PC)
    this.PC++
    cycleObj.cycles--
    return data
  }

  ReadByte(cycleObj, addr, memory) {
    const data = memory.readByte(addr)
    cycleObj.cycles--
    return data
  }

  FetchWord(cycleObj, memory) {
    const lo = this.FetchByte(cycleObj, memory)
    const hi = this.FetchByte(cycleObj, memory)
    return (hi << 8) | lo
  }

  ReadWord(cycleObj, addr, memory) {
    const lo = memory.readByte(addr)
    const hi = memory.readByte(addr + 1)
    cycleObj.cycles -= 2
  }

  writeByte(cycleObj, addr, value, memory) {
    memory.writeByte(addr, value)
    cycleObj.cycles--
  }

  writeWord(cycleObj, addr, value, memory) {
    memory.writeByte(addr, value & 0xff)
    memory.writeByte(addr + 1, value >> 8)
    cycleObj.cycles -= 2
  }

  static RESET_VECTOR = 0xfffc
  static NMI_VECTOR = 0xfffa
  static IRQ_VECTOR = 0xfffe

  static INS_LDA_IM = 0xa9
  static INS_LDA_ZP = 0xa5
  static INS_LDA_ZPX = 0xb5
  static INS_LDA_ABS = 0xad
  static INS_LDA_ABSX = 0xbd
  static INS_LDA_ABSY = 0xb9
  static INS_LDA_INDX = 0xa1
  static INS_LDA_INDY = 0xb1
  static INS_JSR = 0x20
}

export default CPU
