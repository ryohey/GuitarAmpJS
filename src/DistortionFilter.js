export default class DistortionFilter {
  constructor() {
    this.bypass = false
    this._gain = 1
  }

  set gain(val) {
    this._gain = Math.max(val, 0)
  }

  process(val) {
    if (this.bypass) {
      return val
    }

    const input = val * this._gain
    let result
    if (val > 0) {
       result = 1 - Math.exp(-input)
    } else {
       result = -1 + Math.exp(input)
    }
    return result
  }
}
