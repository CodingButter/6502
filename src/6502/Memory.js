class Memory {
  memory
  static MAX_MEM = 1024 * 64
  Initialize() {
    this.memory = new Uint8Array(Memory.MAX_MEM).fill(0)
  }

  loadProgram(program) {
    for (let i = 0; i < program.length; i++) {
      if (program[i] !== 0) this.memory[i] = program[i]
    }
  }

  writeByte(addr, value) {
    if (addr >= this.length - 1) throw new Error("Memory out of bounds")
    this.memory[addr] = value
  }
  readByte(addr) {
    if (addr >= this.length - 1) throw new Error("Memory out of bounds")
    return this.memory[addr]
  }
  loadProgramFromUrl(url) {
    var byteArray = []
    var req = new XMLHttpRequest()
    req.open("GET", url, false)
    req.overrideMimeType("text/plain; charset=x-user-defined")
    req.send(null)
    if (req.status != 200) throw "Failed to load program"
    for (var i = 0; i < req.responseText.length; ++i) {
      byteArray.push(req.responseText.charCodeAt(i) & 0xff)
    }
    this.loadProgram(byteArray)
  }
}
export default Memory
