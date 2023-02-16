import { INST } from "./CPU.js"
import Memory from "./Memory.js"
const Program = new Array(Memory.MAX_MEM).fill(0)

Program[0xfffc] = INST.INS_JSR
Program[0xfffd] = 0x42
Program[0xfffe] = 0x42
Program[0x4242] = INST.INS_LDA_IM
Program[0x4243] = 0x84

export default Program
