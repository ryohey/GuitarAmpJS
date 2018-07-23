import React, { Component, Fragment } from 'react'
import './App.css'
import createBufferSource from "./createBufferSource"
import createNode from "./createNode"
import IRFilter from "./IRFilter"
import DistortionFilter from "./DistortionFilter"

const MAX_GAIN = 400

function Knob({ name, value, onChange }) {
  function handleWheel(e) {
    e.preventDefault()
    const movement = e.deltaY > 0 ? -1 : 1
    onChange(value + movement)
  }

  function handleMouseDown(e) {
    const startY = e.clientY

    function onMouseMove(e) {
      const delta = e.clientY - startY
      onChange(value - Math.ceil(delta / 2))
    }

    function onMouseUp(e) {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }

  const OFFSET_DEG = 120
  const MAX_DEG = 240

  return <div className="Knob"
    onWheel={handleWheel}
    onMouseDown={handleMouseDown}>
    <div className="body">
      <div className="mark" style={{transform: `rotate(${value / MAX_GAIN * MAX_DEG - OFFSET_DEG}deg)`}}>
        <div className="top" />
        <div className="bottom" />
      </div>
    </div>
    <div className="value">{value}</div>
    <div className="title">{name}</div>
  </div>
}

function StompBox({ name, bypass, onClick, children }) {
  return <div className={`StompBox ${name}`}>
    <div className="title">{name}</div>
    <div className="content">{children}</div>
    <div className="switch" onClick={onClick}>
      { !bypass ?
        <div className="switch-on">ON</div> :
        <div className="switch-off">OFF</div>
      }
    </div>
  </div>
}

const initialState = {
  bypassDistortion: false,
  bypassCabinet: false,
  distGain: 1,
  inputType: "mic"
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = initialState

    this.changeInput(initialState.inputType)
  }

  componentDidMount() {
    this.drawVisual()
  }

  setupMic() {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    }).then(stream => {
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      this.setupAudio(ctx, source)
    }).catch(error => {
      alert(error.message)
    })
  }

  setupLoop() {
    const ctx = new AudioContext()
    const wav = createBufferSource(ctx)
    wav.load("assets/guitar.wav")
    this.setupAudio(ctx, wav)
  }

  setupAudio(ctx, source) {
    const inputAnalyser = ctx.createAnalyser()
    inputAnalyser.fftSize = 2048
    const inputAnalyserData = new Uint8Array(inputAnalyser.frequencyBinCount)
    inputAnalyser.getByteTimeDomainData(inputAnalyserData)
    
    const outputAnalyser = ctx.createAnalyser()
    outputAnalyser.fftSize = 2048
    const outputAnalyserData = new Uint8Array(outputAnalyser.frequencyBinCount)
    outputAnalyser.getByteTimeDomainData(outputAnalyserData)

    const output = ctx.destination
    const irFilter = new IRFilter()
    const irNode = createNode(ctx, irFilter)
    const distFilter = new DistortionFilter()
    const distNode = createNode(ctx, distFilter)
    const gain = ctx.createGain()
    gain.gain.value = 0.5

    source.connect(distNode)
    source.connect(inputAnalyser)
    distNode.connect(irNode)
    irNode.connect(gain)
    gain.connect(output)
    gain.connect(outputAnalyser)

    irFilter.load(ctx, "assets/awesome1.wav")

    this.audioNodes = {
      ctx,
      inputAnalyser,
      inputAnalyserData,
      outputAnalyser,
      outputAnalyserData,
      distFilter,
      irFilter
    }
  }

  drawVisual() {
    requestAnimationFrame(() => this.drawVisual())
    
    if (!this.audioNodes) {
      return
    }
    if (this.inputCanvas) {
      this.drawAnalyser(this.inputCanvas, this.audioNodes.inputAnalyser, this.audioNodes.inputAnalyserData)
    }
    if (this.outputCanvas) {
      this.drawAnalyser(this.outputCanvas, this.audioNodes.outputAnalyser, this.audioNodes.outputAnalyserData)
    }
  }

  drawAnalyser(canvas, analyser, analyserData) {
    const ctx = canvas.getContext("2d")
    const bufferLength = analyser.frequencyBinCount
    const WIDTH = canvas.width
    const HEIGHT = canvas.height

    analyser.getByteTimeDomainData(analyserData)

    ctx.fillStyle = 'rgb(200, 200, 200)'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgb(0, 0, 0)'

    ctx.beginPath()

    const sliceWidth = WIDTH * 1.0 / bufferLength
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const v = analyserData[i] / 128.0
      const y = v * HEIGHT/2

      if(i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(canvas.width, canvas.height/2)
    ctx.stroke()
  }

  disposeCurrentAudioNodes() {
    if (!this.audioNodes) {
      return
    }
    const { ctx } = this.audioNodes
    ctx.close()
    this.audioNodes = null
  }

  changeInput(inputType) {
    this.disposeCurrentAudioNodes()
    switch (inputType) {
      case "demo": 
        this.setupLoop()
        break
      case "mic":
        this.setupMic()
        break
    }
    this.setState({ 
      bypassDistortion: initialState.bypassDistortion,
      bypassCabinet: initialState.bypassCabinet,
      distGain: initialState.distGain,
      inputType 
    })
  }

  render() {
    const { bypassDistortion, bypassCabinet, distGain } = this.state
    if (this.audioNodes) { 
      const { distFilter, irFilter } = this.audioNodes
      distFilter.bypass = bypassDistortion
      distFilter.gain = distGain
      irFilter.bypass = bypassCabinet
    }
    return <Fragment>
      <div className="mode">
        <select value={this.state.inputType} onChange={e => this.changeInput(e.target.value)}>
          {["demo", "mic"].map(m => <option value={m}>{m}</option>)}
        </select>
      </div>
      <div className="effects">
        <StompBox
          name="Distortion"
          bypass={bypassDistortion}
          onClick={() => this.setState({
            bypassDistortion: !bypassDistortion
          })}>
          <Knob
            name="Gain"
            value={distGain}
            onChange={val => this.setState({distGain: Math.min(MAX_GAIN, Math.max(0, val))})}
            />
        </StompBox>
        <StompBox
          name="Cabinet"
          bypass={bypassCabinet}
          onClick={() => this.setState({
            bypassCabinet: !bypassCabinet
          })}
          />
      </div>
      <div className="analysers">
        <div className="analyser">
          <p>input</p>
          <canvas ref={c => this.inputCanvas = c} width={320} height={200} />
        </div>
        <div className="analyser">
          <p>output</p>
          <canvas ref={c => this.outputCanvas = c} width={320} height={200} />
        </div>
      </div>
    </Fragment>
  }
}

export default App
