class RAMFlasher {
  static clearRAM(ram) {
    ram.buffer.fill(0)
  }
  static flash(ram, data) {
    RAMFlasher.clearRAM(ram)
    data = new Uint8Array(data)
    ram.buffer.set(data)
    ram.memory = new DataView(ram.buffer.buffer)
  }
}
