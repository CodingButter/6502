class Test {
  static tests = {}
  static setupFuncs = {}
  static tearDownFuncs = {}
  testResults = []
  constructor(suite, subSuite, name, test) {
    this.suite = suite
    this.subSuite = subSuite
    this.name = name
    this.test = test
    Test.tests[suite] = Test.tests[suite] || {}
    Test.tests[suite][subSuite] = Test.tests[suite][subSuite] || []
    Test.tests[suite][subSuite].push(this)
  }
  run() {
    if (Test.setupFuncs[this.suite]) Test.setupFuncs[this.suite]()
    const result = this.test.call(this, this)
    if (Test.tearDownFuncs[this.suite]) Test.tearDownFuncs[this.suite]()
    return result
  }

  EXPECT_EQ(a, b, descriptor) {
    this.testResults.push({
      result: a === b,
      message: `Expected ${descriptor?.trim() || a} to equal ${b}${
        descriptor ? ` received ${a}` : ""
      }`,
    })
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

  static setup(suite, func) {
    Test.setupFuncs[suite] = func
  }
  static tearDown(suite, func) {
    Test.tearDownFuncs[suite] = func
  }
  /*
  Test{
    tests:{
        CPU:{
            LDA:[Test,Test,Test]
        }
    }
  }

*/
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
        console.groupCollapsed(
          `%c${subSuiteKey}%c passes: ${subSuitePasses} %cfails: ${subSuiteFailes}`,
          Test.getStyle(allPassed, "SUB_SUITE"),
          Test.getStyle(true, "SUB_SUITE_RESULTS"),
          Test.getStyle(false, "SUB_SUITE_RESULTS")
        )
        Object.keys(subSuite).forEach((testNameKey) => {
          const test = subSuite[testNameKey]
          const testFailes = test.testResults.filter((result) => !result.result)
          const testPasses = test.testResults.filter((result) => result.result)
          console.groupCollapsed(
            `%c${test.name.trim()}%c passes: ${testPasses.length} %cfails: ${testFailes.length}`,
            Test.getStyle(allPassed, "TEST"),
            Test.getStyle(true, "TEST_RESULTS"),
            Test.getStyle(false, "TEST_RESULTS")
          )
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
    const style = [
      ...Object.keys(Test.STYLES[key]).map((styleKey) => {
        return `${styleKey}:${Test.STYLES[key][styleKey]}`
      }),
      `color:${passed ? Test.STYLES.PASS : Test.STYLES.FAIL}`,
    ]
    return style.join(";")
  }

  static STYLES = {
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
    FAIL: "#f00",
    PASS: "green",
  }
}

export default Test
