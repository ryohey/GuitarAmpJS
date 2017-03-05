export default function createNode(context, filter) {
  const bufferSize = 1024
  const node = context.createScriptProcessor(bufferSize, 1, 1)

  node.onaudioprocess = e => {
    const input = e.inputBuffer.getChannelData(0)
    const output = e.outputBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = filter.process(input[i])
    }
  }
  return node
}
