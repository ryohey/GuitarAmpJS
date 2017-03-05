import loadSound from "./loadSound"

export default function createBufferSource(context) {
  const source = context.createBufferSource()
  source.load = (url) => {
    loadSound(context, url, (error, buf) => {
      source.buffer = buf
      source.loop = true
      source.start()
    })
  }
  return source
}
