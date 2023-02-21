class Memory {
  memory

  //set max memory 32kb
  static MAX_MEM = 1024 * 64
  constructor() {}
  Initialize() {
    // initialize buffer and memory
    this.buffer = new Uint8Array(Memory.MAX_MEM).fill(0x00)
    this.memory = new DataView(this.buffer.buffer)
  }
  writeByte(addr, value) {
    if (!Memory.isByte(value)) return this.writeWord(addr, value)
    this.memory.setUint8(addr, value)
  }
  writeWord(addr, value) {
    this.memory.setUint16(addr, value, true)
  }
  readByte(addr) {
    if (!Memory.isByte(addr)) return this.readWord(addr)
    return new Uint8Array(this.buffer)[addr]
  }
  readWord(addr) {
    return new Uint16Array(this.buffer)[addr]
  }
  loadData(rom) {
    this.buffer = new Uint8Array(rom)
    this.memory = new DataView(this.buffer.buffer)
  }
  static moveBytes(src, srcOffset, dest, destOffset, length) {
    for (let i = 0; i < length; i++) {
      dest[destOffset + i] = src[srcOffset + i]
    }
  }
  static isByte(value) {
    return value >= 0 && value <= 0xff
  }
}

export default Memory
