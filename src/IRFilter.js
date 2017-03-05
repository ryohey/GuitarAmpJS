import loadSound from "./loadSound"

export default class IRFilter {
  constructor() {
  	this.state = {
      count: 0,
      impulseResponse: [],
      delayLine: [],
      length: 0
    }

    this.bypass = false
  }

  load(context, url) {
    loadSound(context, url, (error, buf) => {
      const arr = buf.getChannelData(0)
      this.state.impulseResponse = arr
      this.state.length = arr.length
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

    return result
  }
}
