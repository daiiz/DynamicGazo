/**
 * ウェブページ中で DynamicGazo のプレビューを展開する
 * 対象画像をホバーしたときにSVGコンテンツを重ねて表示する
 */
class InlineViewer {
  constructor () {
    this.appHost = 'svgscreenshot.appspot.com';
    this.appUrl = 'https://svgscreenshot.appspot.com';
    this.appImg = 'c/g/';
    this.contentBaseUrl = `${this.appUrl}/g`;
    this.gyazoImageUrlPatterns = [
      'https://gyazo.com/(.+)/raw',
      'https://i.gyazo.com/(.+)'
    ];
    /* 直近で検出した画像のGyazoID */
    this.latestGyazoImageId = null;
    this.hideAllSVGScreenShots();
    this.bindEvents();
  }

  detectGyazoImageId (src) {
    let imgId = null;
    for (let i = 0; i < this.gyazoImageUrlPatterns.length; i++) {
      let pattern = this.gyazoImageUrlPatterns[i];
      let reg = new RegExp(pattern);
      let matched = src.match(reg);
      if (matched && matched.length >= 2) {
        imgId = matched[1];
        break;
      }
    }

    imgId = imgId.split('.')[0];
    if (imgId.indexOf('/') !== -1) return null;
    return imgId;
  }

  /* cid: Gyazo Image ID */
  $getCover (cid='', $img) {
    // cid is cover-id!
    var coverId = 'daiz-ss-iv-cover-c-' + cid;
    var pageX = window.pageXOffset;
    var pageY = window.pageYOffset;

    var $cover = $(`#${coverId}`);
    var newCover = false;

    // 存在しない場合は新規作成する
    if ($cover.length === 0) {
      newCover = true;
      $cover = $(`<div id="${coverId}" class="daiz-ss-iv-cover">
        <div class="daiz-ss-iv-svg">
        </div>
        <div class="daiz-ss-iv-cover-foot">
          <a href="#" class="svgss" target="_blank">SVG ScreenShot</a>
          <a href="#" class="jump" target="_blank">Original site</a>
        </div>
      </div>`);

      $cover.css({
        width: $img.width(),
        height: $img.height()
      });
    }

    var imgRect = $img[0].getBoundingClientRect();
    $cover.css({
        left: imgRect.left + pageX,
        top: imgRect.top + pageY
    });

    return [$cover, newCover];
  }

  // SVGコンテンツを表示する
  renderSVGScreenShot ($cover, cid='') {
    var cover = $cover[0];
    var coverWidth = $cover.width();
    var coverHeight = $cover.height();
    var $svgArea = $cover.find('.daiz-ss-iv-svg');
    var appImg = this.appImg;
    var svgUrl = `${this.appUrl}/${appImg}${cid}.svg`;
    console.info(svgUrl);

    $.ajax({
      url: svgUrl,
      dataType: "text"
    }).success(svgTag => {
      if (svgTag.length === 0) return;
      var doc = new DOMParser().parseFromString(svgTag, 'application/xml');
      $svgArea[0].appendChild(cover.ownerDocument.importNode(doc.documentElement, true));
      var svg = cover.querySelector('svg.svg-screenshot');
      var orgUrl = svg.getAttribute('data-url');
      var title = svg.getAttribute('data-title');
      // SVGレイヤーのサイズを設定
      // viewBox.width, viewBox.height: SVGのオリジナルサイズ
      // coverWidth, coverHeight: サムネイルのサイズ
      svg.setAttribute('width', coverWidth);
      svg.setAttribute('height', coverHeight);

      // cover footerを設定
      var $cFoot = $cover.find('.daiz-ss-iv-cover-foot');
      $cFoot.find('a.jump').attr('href', validateUrl(orgUrl));
      $cFoot.find('a.jump')[0].innerText = validateTitle(title);
      $cFoot.find('a.svgss').attr('href', `${this.contentBaseUrl}/${cid}`);
      $cFoot.show();
    });
  }

  // SVGコンテンツを最新のサムネイルのサイズに合わせる
  updateSVGScreenShotSize ($cover, $img) {
    var w = $img.width();
    var h = $img.height();
    $cover.css({
      width: w,
      height: h
    });
    var svg = $cover[0].querySelector('svg.svg-screenshot');
    if (svg) {
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
    }
    $cover.show();
  }

  // 全てのcoverを非表示にする
  hideAllSVGScreenShots () {
    // 既存の消し忘れカバーを消す
    $('.daiz-ss-iv-cover').css('display', 'none');
  }

  bindEvents () {
    var self = this;
    var $body = $('body');

    // 画像mouseenter時
    $body.on('mouseenter', 'img', e => {
      var $img = $(e.target).closest('img');
      // 対象画像であるかを確認
      var src = decodeURIComponent($img[0].src);
      var gyazoImageId = self.detectGyazoImageId(src);

      if (gyazoImageId !== this.latestGyazoImageId) {
        this.latestGyazoImageId = gyazoImageId;
      }
      if (gyazoImageId === null) return;

      self.hideAllSVGScreenShots();
      var coverInfo = self.$getCover(gyazoImageId, $img);
      var $cover = coverInfo[0];
      if (coverInfo[1]) {
        // 新規作成されたカバー
        $body.append($cover);
        self.renderSVGScreenShot($cover, gyazoImageId);
      }else {
        self.updateSVGScreenShotSize($cover, $img);
      }
    });

    // 画像mouseleave時
    $body.on('mouseleave', '.daiz-ss-iv-cover', e => {
      var $cover = $(e.target).closest('.daiz-ss-iv-cover');
      $cover.hide();
    });
  }
}
