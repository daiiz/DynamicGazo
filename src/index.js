const AnchorsInArea = require('anchors-in-area')
const axios = require('axios')

window.dynamicGazo = {
  env: process.env.NODE_ENV
}
const SVGSCREENSHOT_APP = (window.dynamicGazo.env === 'production') ?
    'https://svgscreenshot.appspot.com' : 'http://localhost:8080'

dynamicGazo.AnchorsInArea = AnchorsInArea

dynamicGazo.uploadToDynamicGazo = async ({svg, title, referer, base64Img, devicePixelRatio}) => {
  let res
  try {
    res = await axios.post(`${SVGSCREENSHOT_APP}/api/uploadsvg`, {
      svg: svg.outerHTML,
      base64png: base64Img,
      orgurl: referer,
      title,
      viewbox: svg.getAttribute('viewBox'),
      public: 'yes',
      dpr: devicePixelRatio
    })
  } catch (err) {
    console.error(err)
  }
  return res
}

dynamicGazo.uploadToGyazo = async ({scale, image, referer, title, svgScreenshotImageId}) => {
  const apiEndpoint = `https://upload.gyazo.com/api/upload/easy_auth`
  const clientId = 'a9544994509725a7ecceb7381661274751b5b31f006c7788c1d88517c13d1ebe'

  if (dynamicGazo.env !== 'production') return

  const dynamicGazoUrl = `${SVGSCREENSHOT_APP}/x/${svgScreenshotImageId}`
  const formdata = new window.FormData()
  formdata.append('client_id', clientId)
  formdata.append('image_url', image)
  formdata.append('title', title)
  formdata.append('referer_url', referer)
  formdata.append('scale', scale)
  formdata.append('desc', `\n${dynamicGazoUrl}\n#GyazoSVG`)

  const response = await window.fetch(apiEndpoint, {
    method: 'POST',
    body: formdata,
    credentials: 'include'
  })
  const _data = await response.json()

  const data = await window.fetch(_data.get_image_url, {
    method: 'GET',
    credentials: 'include'
  })
  const gyazoImageId = data.url.split('gyazo.com/')[1]

  chrome.tabs.create({
    url: data.url,
    active: false
  }, null)
  return gyazoImageId
}
