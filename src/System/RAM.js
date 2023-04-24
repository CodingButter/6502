class RAM {
  memory
  buffer
  //set max memory 32kb
  static MAX_MEM = 1024 * 64
  constructor(buffer) {
    // initialize buffer and memory
    this.buffer = new Uint8Array(RAM.MAX_MEM).fill(0x00)
    if (buffer) this.buffer.set(buffer)
    this.memory = new DataView(this.buffer.buffer)
  }
  set(data) {
    data = new Uint8Array(data)
    this.buffer = new Uint8Array(RAM.MAX_MEM).fill(0x00)
    this.buffer.set(data)
    this.memory = new DataView(this.buffer.buffer)
  }
  write(addr, value) {
    if (!RAM.isByte(value)) this.memory.setUint16(addr, value, true)
    else this.memory.setUint8(addr, value)
  }
  read(addr) {
    if (!RAM.isByte(addr)) return new Uint16Array(this.buffer)[addr]
    return new Uint8Array(this.buffer)[addr]
  }
  static isByte(value) {
    return value >= 0 && value <= 0xff
  }
}

export default RAM
