import Memory from "../6502/Memory.js"
class ROM extends Memory {
  loading = true
  constructor(data) {
    if (typeof data === "string") {
      this.loadFromURL(data)
    } else if (data instanceof ArrayBuffer) {
      this.loadData(data)
    }
  }

  async loadFromURL(url) {
    this.loadData(await fetch(url).then((response) => response.arrayBuffer()))
  }
}

export default ROM
