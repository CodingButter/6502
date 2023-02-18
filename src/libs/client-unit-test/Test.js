class Timing {
  name
  startTime
  endTime
  constructor(name) {
    this.name = name
  }
  start() {
    this.startTime = window.performance.now()
  }
  end() {
    this.endTime = window.performance.now()
  }
  getDuration() {
    return Math.floor(1000000 * (this.endTime - this.startTime)) / 1000000
  }
}

class Test {
  static gui = false
  static tests = {}
  timings = {}
  testResults = []
  constructor(suite, subSuite, name, test, setup, tearDown) {
    this.suite = suite
    this.subSuite = subSuite
    this.name = name
    this.test = test
    this.setup = setup
    this.tearDown = tearDown
    Test.tests[suite] = Test.tests[suite] || {}
    Test.tests[suite][subSuite] = Test.tests[suite][subSuite] || []
    Test.tests[suite][subSuite].push(this)
    this.timings.setup = new Timing("setup")
    this.timings.test = new Timing("test")
    this.timings.tearDown = new Timing("tearDown")
  }
  run() {
    let setupVals
    this.timings.setup.start()
    if (this.setup) setupVals = this.setup.call(this)
    this.timings.setup.end()
    this.timings.test.start()
    const result = this.test.call(this, setupVals)
    this.timings.test.end()
    this.timings.tearDown.start()
    if (this.tearDown) this.teardown.call(this)
    this.timings.tearDown.end()
    return result
  }
  getTotalTime() {
    return (
      this.timings.setup.getDuration() +
      this.timings.test.getDuration() +
      this.timings.tearDown.getDuration()
    )
  }
  static getTotalTestTime() {
    let total = 0
    Object.keys(Test.tests).forEach((mainSuiteKey) => {
      const mainSuite = Test.tests[mainSuiteKey]
      Object.keys(mainSuite).forEach((subSuiteKey) => {
        const subSuite = Test.tests[mainSuiteKey][subSuiteKey]
        subSuite.forEach((test) => {
          total += test.getTotalTime()
        })
      })
    })
    return total
  }
  EXPECT_EQ(a, b, descriptor) {
    this.testResults.push({
      result: a === b,
      message: `Expected ${descriptor?.trim() || a} to equal ${b}${
        descriptor ? ` received ${a}` : ""
      }`,
    })
  }

  EXPECT_NOT_EQ(a, b, descriptor) {
    this.testResults.push({
      result: a !== b,
      message: `Expected ${descriptor?.trim() || a} to not equal ${b}${
        descriptor ? ` received ${a}` : ""
      }`,
    })
  }

  EXPECT_DEEP_NOT_EQ(a, b, descriptor) {
    this.EXPECT_NOT_EQ(JSON.stringify(a), JSON.stringify(b), descriptor)
  }

  EXPECT_DEEP_EQ(a, b, descriptor) {
    this.EXPECT_EQ(JSON.stringify(a), JSON.stringify(b), descriptor)
  }

  EXPECT_FALSE(a, descriptor) {
    this.EXPECT_EQ(a, false, descriptor)
  }

  EXPECT_TRUE(a, descriptor) {
    this.EXPECT_EQ(a, true, descriptor)
  }

  static run() {
    Object.keys(Test.tests).forEach((mainSuiteKey) => {
      const mainSuite = Test.tests[mainSuiteKey]
      Object.keys(mainSuite).forEach((subSuiteKey) => {
        const subSuite = Test.tests[mainSuiteKey][subSuiteKey]
        Object.keys(subSuite).forEach((testNameKey) => {
          subSuite[testNameKey].run()
        })
      })
      const mainSuiteFailes = Object.keys(mainSuite).reduce((acc, subSuiteKey) => {
        const subSuite = Test.tests[mainSuiteKey][subSuiteKey]
        const subSuiteFailes = Object.keys(subSuite).reduce((acc, testNameKey) => {
          const test = subSuite[testNameKey]
          const testFailes = test.testResults.filter((result) => !result.result)
          return acc + testFailes.length > 0 ? 1 : 0
        }, 0)
        return acc + subSuiteFailes
      }, 0)
      const mainSuitePasses = Object.keys(mainSuite).reduce((acc, subSuiteKey) => {
        const subSuite = Test.tests[mainSuiteKey][subSuiteKey]
        const subSuitePasses = Object.keys(subSuite).reduce((acc, testNameKey) => {
          const test = subSuite[testNameKey]
          const testPasses = test.testResults.filter((result) => result.result)
          return acc + testPasses.length > 0 ? 1 : 0
        }, 0)
        return acc + subSuitePasses
      }, 0)
      const allPassed = mainSuiteFailes === 0
      console.groupCollapsed(
        `%c${mainSuiteKey}%c passes: ${mainSuitePasses} %cfails: ${mainSuiteFailes}`,
        Test.getStyle(allPassed, "SUITE"),
        Test.getStyle(true, "SUITE_RESULTS"),
        Test.getStyle(false, "SUITE_RESULTS")
      )
      console.log(`%cTotal Time: ${Test.getTotalTestTime()}ms`, Test.getStyle(null, "TIMINGS"))

      Object.keys(mainSuite).forEach((subSuiteKey) => {
        const subSuite = Test.tests[mainSuiteKey][subSuiteKey]
        const subSuiteFailes = Object.keys(subSuite).reduce((acc, testNameKey) => {
          const test = subSuite[testNameKey]
          const testFailes = test.testResults.filter((result) => !result.result)
          return acc + (testFailes.length > 0 ? 1 : 0)
        }, 0)
        const subSuitePasses = Object.keys(subSuite).reduce((acc, testNameKey) => {
          const test = subSuite[testNameKey]
          const testPasses = test.testResults.filter((result) => result.result)
          return acc + (testPasses.length > 0 ? 1 : 0)
        }, 0)
        const subSuiteTime = Object.keys(subSuite).reduce((acc, testNameKey) => {
          const test = subSuite[testNameKey]
          return acc + test.getTotalTime()
        }, 0)

        console.groupCollapsed(
          `%c${subSuiteKey}%c passes: ${subSuitePasses} %cfails: ${subSuiteFailes}`,
          Test.getStyle(allPassed, "SUB_SUITE"),
          Test.getStyle(true, "SUB_SUITE_RESULTS"),
          Test.getStyle(false, "SUB_SUITE_RESULTS")
        )
        console.log(`%cTotal Time: ${subSuiteTime}ms`, Test.getStyle(null, "TIMINGS"))
        Object.keys(subSuite).forEach((testNameKey) => {
          const test = subSuite[testNameKey]
          const testFailes = test.testResults.filter((result) => !result.result)
          const testPasses = test.testResults.filter((result) => result.result)
          const testTime = test.getTotalTime()
          console.groupCollapsed(
            `%c${test.name.trim()}%c passes: ${testPasses.length} %cfails: ${testFailes.length}`,
            Test.getStyle(allPassed, "TEST"),
            Test.getStyle(true, "TEST_RESULTS"),
            Test.getStyle(false, "TEST_RESULTS")
          )
          console.log(`%cTotal Time: ${testTime}ms`, Test.getStyle(null, "TIMINGS"))
          test.testResults.forEach((result) => {
            console.log(`%c${result.message}`, Test.getStyle(result.result, "TEST_RESULTS"))
          })
          console.groupEnd()
        })
        console.groupEnd()
      })
      console.groupEnd()
    })
  }
  static getStyle(passed, key) {
    let color
    if (passed !== null) {
      if (passed) {
        color = Test.STYLES.PASS
      } else {
        color = Test.STYLES.FAIL
      }
    } else {
    }
    const style = [
      ...Object.keys(Test.STYLES[key]).map((styleKey) => {
        return `${styleKey}:${Test.STYLES[key][styleKey]}`
      }),
    ]
    if (color) {
      style.push(`color:${color}`)
    }
    return style.join(";")
  }

  static STYLES = {
    GUI_CONTAINER: {
      "border-radius": "4px",
      padding: "2px",
      "font-weight": "bold",
      "font-size": "1.5em",
      margin: "2px",
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      display: "flex",
      "flex-direction": "column",
      "align-items": "center",
      "justify-content": "center",
      background:
        "radial-gradient(circle at 50% 50%, rgba(55, 00, 120, 0.7) 0%, rgba(55, 0, 120, 0.9)",
    },
    SUITE_CONTAINER: {
      display: "flex",
      "justify-content": "start",
      "align-items": "center",
    },
    SUITE: {
      padding: "2px 4px",
      "background-color": "#f0f0f0",
      "border-radius": "4px",
      "font-weight": "bold",
      "font-size": "2em",
    },
    SUITE_RESULTS: {
      "font-weight": "bold",
      "font-size": "1.5em",
    },
    SUB_SUITE: {
      "background-color": "#f0f0f0",
      "border-radius": "2px",
      padding: "2px",
      "font-weight": "bold",
      "font-size": "1.5em",
    },
    SUB_SUITE_RESULTS: {
      "font-weight": "bold",
      "font-size": "1.5em",
    },
    TEST: {
      padding: "2px 4px",
      "border-radius": "4px",
      "background-color": "#f0f0f0",
      "font-weight": "bold",
      "font-size": "1.4em",
    },
    TEST_RESULTS: {
      "font-weight": "bold",
      "font-size": "1.2em",
    },
    TIMINGS: {
      "font-weight": "bold",
      "font-size": "1em",
      color: "white",
    },
    FAIL: "#f00",
    PASS: "green",
  }
}

export default Test
