import loadSound from "./loadSound"

export default class IRFilter {
  constructor() {
  	this.state = {
      count: 0,
      impulseResponse: [],
      delayLine: [],
      gain: 1,
      length: 0
    }

    this.bypass = false
  }

  setIR(arr) {
    this.state.impulseResponse = arr
    this.state.length = arr.length

    // クリップしないように畳み込みでの増幅を計算する (式の妥当性は不明)
    let pow = 0
    for (let val of arr) {
      pow += val * val
    }
    this.state.gain = 1 / pow // 増幅分小さくする
  }

  load(context, url) {
    loadSound(context, url, (error, buf) => {
      this.setIR(buf.getChannelData(0))
    })
  }

  process(val) {
    if (this.bypass || this.state.length === 0) {
      return val
    }

    const st = this.state
    let result = 0
    let index = st.count

    st.delayLine[st.count] = val

    for (let i = 0; i < st.length; i++) {
    	result += st.impulseResponse[i] * st.delayLine[index]

      index--
      if (index < 0) {
      	index = st.length - 1
      }
    }

    st.count++
    if (st.count >= st.length) {
    	st.count = 0
    }

    return result * this.state.gain
  }
}
