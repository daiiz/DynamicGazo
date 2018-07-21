(function () {
  const replaceToDevUrls = () => {
    if (window.dynamicGazo.env === 'production') return
    const targets = [
      '#open',
      '#y-collection',
      '#login',
      '#collection'
    ]
    for (const target of targets) {
      const url = document.querySelector(target).href
      document.querySelector(target).href = url.replace(
        /^https\:\/\/svgscreenshot\.appspot\.com/, 'http://localhost:8080')
    }
  }

  const setCancelEvents = () => {
    document.querySelector('#img').addEventListener('click', () => {
      closeWindow()
    })

    console.log(document.querySelector('#img'))

    const aTags = document.querySelectorAll('a')
    for (const a of aTags) {
      console.log(a)
      a.addEventListener('click', () => { closeWindow() })
    }
  }

  const itemUrl = (url) => {
    if (!url) return ''
    if (window.dynamicGazo.env === 'production') return url
    return url.replace(/^https\:\/\/svgscreenshot\.appspot\.com/, 'http://localhost:8080')
  }

  var openN = () => {
    document.querySelector('#n').style.display = 'block';
    document.querySelector('#y').style.display = 'none';
  };

  var openY = () => {
    document.querySelector('#y').style.display = 'block';
    document.querySelector('#n').style.display = 'none';
  };

  window.addEventListener('load', function () {
    document.querySelector('#open').href = itemUrl(localStorage.item_url)
    var thumbnail = document.querySelector('#img');
    thumbnail.src = localStorage.item_img || '';
    thumbnail.dataset.clipboardText = itemUrl(localStorage.item_img)
    var err = localStorage.is_error || 'ようこそ';
    if (err !== 'y') {
      // キャプチャ失敗
      document.querySelector('#msg').innerText = err;
      openN();
    }else {
      new Clipboard('.copy-btn');
      openY();
    }
    replaceToDevUrls()
    setCancelEvents()
  }, false);

  document.querySelector('#open').addEventListener('click', function () {
    clearBadge();
  }, false);

  document.querySelector('#login').addEventListener('click', function () {
    clearBadge();
  }, false);

  // スクリーンショット撮影領域指定
  // document.querySelector('#btn-show-cropper').addEventListener('click', function () {
  //   chrome.tabs.getSelected(null, function (tab) {
  //     clearBadge();
  //     chrome.tabs.sendRequest(tab.id, {
  //       event: 'capture-range'
  //     })
  //     closeWindow()
  //   });
  // });

  // 範囲選択による撮影モード
  chrome.tabs.getSelected(null, function (tab) {
    chrome.tabs.sendRequest(tab.id, {
      event: 'capture-range'
    })
  })

  const closeWindow = () => {
    chrome.tabs.getSelected(null, function (tab) {
      chrome.tabs.sendRequest(tab.id, {
        event: 'cancel-capture-range'
      })
    })
    window.close()
  }
})()
