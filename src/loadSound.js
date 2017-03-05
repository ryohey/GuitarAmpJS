export default function loadSound(context, url, callback) {
  const request = new XMLHttpRequest()
  request.open("GET", url, true)
  request.responseType = "arraybuffer"

  request.onload = () => {
    const res = request.response
    context.decodeAudioData(res, buf => {
      callback(null, buf)
    }, error => {
      callback(error, null)
    })
  }

  request.send()
}
