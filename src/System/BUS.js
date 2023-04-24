import M6502 from "./M6502"
import RAM from "./RAM"
class BUS {
  cpu = new M6502()
  ram = new RAM()
  constructor() {
    this.cpu.attachBus(this)
  }
  deconstruct() {}
  write(addr, value) {
    if (addr >= 0x0000 && addr <= 0xffff) {
      this.ram.write(addr, value)
    }
  }
  read(addr, bReadOnly = false) {
    if (addr >= 0x0000 && addr <= 0xffff) {
      return this.ram.read(addr)
    }
    return 0x00
  }
}

export default BUS
