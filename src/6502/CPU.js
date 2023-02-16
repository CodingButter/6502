import { NthBit } from "./BitUtils.js"
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
    return cycles - cycleObj.cycles
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
      case CPU.INS_JSR:
        const SubAddr = this.FetchWord(cycleObj, memory)
        this.writeWord(cycleObj, this.SP, this.PC - 1, memory)
        this.PC = SubAddr
        this.SP += 2
        cycleObj.cycles--
        break
      default:
        console.log("Instruction not implemented: " + ins)
    }
  }

  LDASetStatus() {
    this.Z = this.A === 0
    this.N = (this.A & 0x80) > 0
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
    this.PC += 2
    cycleObj.cycles -= 2
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
  static INS_JSR = 0x20
}

export default CPU
