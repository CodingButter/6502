class Log {
  static logs = []
  static add(code, level, message) {
    Log.logs.push({ code, level, message })
  }
  static clear() {
    Log.logs = []
  }
  static getLogs(levels) {
    return levels ? Log.logs.filter((log) => levels.includes(log.level)) : Log.logs
  }
  static printLogs(levels) {
    console.groupCollapsed(`%c${levels ? levels.join(" ") : "All"} Logs:`, "color: purple")
    Log.getLogs(levels).forEach((log) => {
      console.log(
        `%cLevel: ${Log.getLevelName(log.level)} Code: ${Log.getCodeName(log.code)} Message: ${
          log.message
        }`,
        Log.STYLE[Log.getLevelName(log.level)]
      )
    })
    console.groupEnd()
  }
  static exportLogs(levels) {
    const logs = this.getLogs(levels)
    let csv = "Level,Code,Message\n"
    csv += logs
      .map((log) => {
        return `${Log.getLevelName(log.level)},${Log.getCodeName(log.code)},${log.message}`
      })
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "logs.csv")
    link.click()
  }
  static getLevelName(level) {
    return Object.keys(Log.LEVEL).find((key) => Log.LEVEL[key] === level)
  }
  static getCodeName(code) {
    return Object.keys(Log.CODES).find((key) => Log.CODES[key] === code)
  }
  static CODES = {
    BAD_INSTRUCTION: 0,
    BAD_ADDRESS: 1,
    BAD_VALUE: 2,
    BAD_REGISTER: 3,
    BAD_FLAG: 4,
  }
  static LEVEL = {
    CRITICAL: 0,
    ERROR: 1,
    WARNING: 2,
    INFO: 3,
    DEBUG: 4,
  }

  static STYLE = {
    CRITICAL: "color: red",
    ERROR: "color: orange",
    WARNING: "color: yellow",
    INFO: "color: blue",
    DEBUG: "color: green",
  }
}
window.Log = Log
export default Log
