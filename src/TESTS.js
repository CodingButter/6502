import Test from "./libs/client-unit-test/Test"
import "./libs/log/Log"
import "./6502/__TEST__/CPU"
Test.run()
const data = Test.getCSVTestResults()
  .split("\n")
  .map((line) => {
    const [suite, subSuite, test, result, condition] = line.split(",")

    return {
      suite,
      subSuite,
      test,
      result,
      condition,
    }
  })
const spreadNS = GC.Spread.Sheets

window.onload = function () {
  var spread = new spreadNS.Workbook(document.getElementById("ss"), { sheetCount: 0 })
  initSpread(spread)
}
function initSpread(spread) {
  spread.suspendPaint()

  // add data manager and table
  const dataManager = new spread.dataManager()
  const myTable = dataManager.addTable("MainTable", {
    data,
    schema: {
      columns: {
        suite: { dataType: "string" },
        subSuite: { dataType: "string" },
        test: { dataType: "string" },
        result: { dataType: "string" },
        condition: { dataType: "string" },
      },
    },
  })
  const testStyle = {}
  formulaRule = {
    ruleType: "formulaRule",
    formulatext: "='FAIL'",
    style: {
      backColor: "red",
      color: "white",
    },
  }
  const sheet = spread.addSheetTab(0, "Test Results", spreadNS.SheetType.tableSheet)
  myTable.fetch().then(() => {
    const view = myTable.addView("myView", [
      { value: "suite", caption: "Suite", width: 100 },
      { value: "subSuite", caption: "Sub Suite", width: 100 },
      {
        value: "test",
        width: 100,
        caption: "Test",
      },
      {
        value: "result",
        width: 100,
        caption: "Result",
        style: { conditionalFormats: [formulaRule] },
      },
      { value: "condition", width: 300, caption: "Condition" },
    ])
    sheet.setDataView(view)
    sheet.options.allowAddNew = false //hide new row

    spread.resumePaint()
  })
}
