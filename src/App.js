import React, { Component } from 'react';
import './App.css';
import createBufferSource from "./createBufferSource"
import createNode from "./createNode"
import IRFilter from "./IRFilter"
import DistortionFilter from "./DistortionFilter"

const ctx = new AudioContext()
const output = ctx.destination
const wav = createBufferSource(ctx)
const irFilter = new IRFilter()
const irNode = createNode(ctx, irFilter)
const distFilter = new DistortionFilter()
const distNode = createNode(ctx, distFilter)
const gain = ctx.createGain()
gain.gain.value = 0.5

wav.connect(distNode)
distNode.connect(irNode)
irNode.connect(gain)
gain.connect(output)

wav.load("assets/guitar.wav")
irFilter.load(ctx, "assets/awesome1.wav")

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

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      bypassDistortion: false,
      bypassCabinet: false,
      distGain: 1
    }
  }

  render() {
    const { bypassDistortion, bypassCabinet, distGain } = this.state
    distFilter.bypass = bypassDistortion
    distFilter.gain = distGain
    irFilter.bypass = bypassCabinet
    return (
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
    )
  }
}

export default App;
