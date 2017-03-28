'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * ウェブページ中で DynamicGazo のプレビューを展開する
 * 対象画像をホバーしたときにSVGコンテンツを重ねて表示する
 */

var InlineViewer = function () {
  function InlineViewer() {
    _classCallCheck(this, InlineViewer);

    this.appUrl = 'https://svgscreenshot.appspot.com';
    this.gyazo = 'https://gyazo.com';
    this.gyazoImageUrlPatterns = ['//gyazo.com/(.+)/raw', '//i.gyazo.com/(.+)'];
    this.svgScreenShotUrlPatterns = [this.appUrl + '/c/x/(.+)'];
    /* 直近で検出した画像のID */
    this.latestImageId = null;
    this.hideAllSVGScreenShots();
    this.bindEvents();
  }

  _createClass(InlineViewer, [{
    key: 'detectImageId',
    value: function detectImageId(src, urlPatterns) {
      var imgId = null;
      for (var i = 0; i < urlPatterns.length; i++) {
        var pattern = urlPatterns[i];
        var reg = new RegExp(pattern);
        var matched = src.match(reg);
        if (matched && matched.length >= 2) {
          imgId = matched[1].split('.')[0];
          break;
        }
      }
      if (imgId === null) return null;
      if (imgId.indexOf('/') !== -1) return null;
      return imgId;
    }

    /* cid: Gyazo Image ID */

  }, {
    key: '$getCover',
    value: function $getCover() {
      var cid = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
      var $img = arguments[1];

      // cid is cover-id!
      var coverId = 'daiz-ss-iv-cover-c-' + cid;
      var pageX = window.pageXOffset;
      var pageY = window.pageYOffset;

      var $cover = $('#' + coverId);
      var newCover = false;

      // 存在しない場合は新規作成する
      if ($cover.length === 0) {
        newCover = true;
        var optionClassName = '';
        if (window.location.host === 'gyazo.com') {
          optionClassName = 'gyazo-com';
        }
        $cover = $('<div id="' + coverId + '" class="daiz-ss-iv-cover ' + optionClassName + '">\n        <div class="daiz-ss-iv-svg">\n        </div>\n        <div class="daiz-ss-iv-cover-foot">\n          <a href="#" class="svgss footlink" target="_blank">DynamicGazo</a>\n          <a href="#" class="gyazo footlink" target="_blank">Gyazo</a>\n          <a href="#" class="jump" target="_blank">Original site</a>\n        </div>\n      </div>');

        $cover.css({
          width: $img.width(),
          height: $img.height(),
          display: 'none'
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

  }, {
    key: 'renderSVGScreenShot',
    value: function renderSVGScreenShot($cover) {
      var _this = this;

      var cid = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];
      var appImg = arguments.length <= 2 || arguments[2] === undefined ? 'd/g' : arguments[2];

      var cover = $cover[0];
      var coverWidth = $cover.width();
      var coverHeight = $cover.height();
      var $svgArea = $cover.find('.daiz-ss-iv-svg');
      var svgUrl = this.appUrl + '/' + appImg + '/' + cid;

      $.ajax({
        url: svgUrl,
        method: "POST",
        dataType: "json"
      }).success(function (data) {
        var svgTag = data.svg_tag;
        var appName = data.app_name || null;
        if (svgTag.length === 0) return;
        var doc = new DOMParser().parseFromString(svgTag, 'application/xml');
        $svgArea[0].appendChild(cover.ownerDocument.importNode(doc.documentElement, true));
        var svg = cover.querySelector('svg.svg-screenshot');
        var orgUrl = data.url;
        var title = data.title;
        // SVGレイヤーのサイズを設定
        // viewBox.width, viewBox.height: SVGのオリジナルサイズ
        // coverWidth, coverHeight: サムネイルのサイズ
        svg.setAttribute('width', coverWidth);
        svg.setAttribute('height', coverHeight);

        // cover footerを設定
        var $cFoot = $cover.find('.daiz-ss-iv-cover-foot');
        $cFoot.find('a.jump').attr('href', validateUrl(orgUrl));
        $cFoot.find('a.jump')[0].innerText = validateTitle(title);
        $cFoot.find('a.svgss').attr('href', _this.appUrl + '/x/' + data.screenshot_id);
        $cFoot.find('a.gyazo').attr('href', _this.gyazo + '/' + data.gyazo_image_id);
        if (!data.gyazo_image_id) {
          $cFoot.find('a.gyazo').hide();
        }
        if (appName !== null && appName.length > 0) {
          $cFoot.hide();
        } else {
          $cFoot.show();
        }

        $cover.show();
      });
    }

    // SVGコンテンツを最新のサムネイルのサイズに合わせる

  }, {
    key: 'updateSVGScreenShotSize',
    value: function updateSVGScreenShotSize($cover, $img) {
      if ($cover.find('.daiz-ss-iv-svg')[0].innerHTML.trim() === '') return;

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

  }, {
    key: 'hideAllSVGScreenShots',
    value: function hideAllSVGScreenShots() {
      // 既存の消し忘れカバーを消す
      $('.daiz-ss-iv-cover').css('display', 'none');
    }
  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      var _this2 = this;

      var self = this;
      var $body = $('body');

      // 画像mouseenter時
      $body.on('mouseenter', 'img', function (e) {
        var $img = $(e.target).closest('img');

        // 対象画像であるかを確認
        var src = decodeURIComponent($img[0].src);
        var imageId = self.detectImageId(src, self.gyazoImageUrlPatterns);
        var appImg = 'd/g';
        if (imageId === null) {
          imageId = self.detectImageId(src, self.svgScreenShotUrlPatterns);
          appImg = 'd/s';
        }

        if (imageId === null) return;
        if (imageId !== _this2.latestImageId) {
          _this2.latestImageId = imageId;
        }

        self.hideAllSVGScreenShots();
        var coverInfo = self.$getCover(imageId, $img);
        var $cover = coverInfo[0];
        if (coverInfo[1]) {
          // 新規作成されたカバー
          $body.append($cover);
          self.renderSVGScreenShot($cover, imageId, appImg);
        } else {
          self.updateSVGScreenShotSize($cover, $img);
        }
      });

      // 画像mouseleave時
      $body.on('mouseleave', '.daiz-ss-iv-cover', function (e) {
        var $cover = $(e.target).closest('.daiz-ss-iv-cover');
        $cover.hide();
      });
    }
  }]);

  return InlineViewer;
}();
