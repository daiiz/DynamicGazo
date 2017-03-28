'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var APP_PREFIX = 'dynamic_gazo';
var sendChromeMsg = function sendChromeMsg(json, callback) {
    chrome.runtime.sendMessage(json, callback);
};

var ScreenShot = function () {
    function ScreenShot() {
        _classCallCheck(this, ScreenShot);

        this.CROP_BOX_SIZE = 150;
        this.uiInit();
        this.positionLastRclick = [200, 200];
        this.linkdata = null;
        this.tmp = {
            // 右クリックされた画像要素
            '$contextMenuImg': []
        };
        this.inlineViewer = null;

        // アプリケーションとしてSVG撮影を使う場合，アプリ名がセットされる
        this.app = null;
    }

    _createClass(ScreenShot, [{
        key: 'renderCropper',
        value: function renderCropper() {
            var boxParams = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

            var self = this;
            chrome.runtime.sendMessage({
                command: 'get-scrapbox-list'
            }, function (info) {
                var scrapboxEnabled = info.scrapbox_enabled;
                var scrapboxIds = info.scrapbox_ids;
                if (scrapboxEnabled === 'yes' && scrapboxIds.length > 0) {
                    var $select = $('<select id="daiz-ss-cropper-scrap-select"></select>');
                    for (var i = 0; i < scrapboxIds.length; i++) {
                        var scrapboxId = scrapboxIds[i];
                        var $opt = $('<option value="' + scrapboxId + '">' + scrapboxId + '</option>');
                        $select.append($opt);
                    }
                    self.setCropper(boxParams, $select);
                } else {
                    self.setCropper(boxParams, null);
                }
            });
        }
    }, {
        key: 'uiInit',
        value: function uiInit() {
            this.bindEvents();
        }

        // 切り抜きボックス, a要素カバーボックス

    }, {
        key: '$genCropper',
        value: function $genCropper() {
            var $cropper = $('<div class="daiz-ss-cropper" style="position: fixed;"></div>');
            $cropper.css({
                top: 0,
                left: 0,
                width: this.CROP_BOX_SIZE,
                height: this.CROP_BOX_SIZE
            });
            return $cropper;
        }

        // true : 表示中のウェブページをスクロール不可にする
        // false: 解除する

    }, {
        key: 'fixHtml',
        value: function fixHtml(fg) {
            var fg = fg || false;
            if (fg) {
                $('html').css({
                    height: '100%',
                    width: '100%',
                    overflow: 'hidden'
                });
            } else {
                $('html').css({
                    height: '',
                    width: '',
                    overflow: 'auto'
                });
            }
        }

        // 範囲指定のための長方形を表示する

    }, {
        key: 'setCropper',
        value: function setCropper() {
            var _this = this;

            var boxParams = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
            var $scrapboxSelectBox = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            var $cropper = this.$genCropper();
            var closeBtnImg = chrome.extension.getURL('x.png');
            var $closeBtn = $('<div id="' + APP_PREFIX + '-daiz-ss-cropper-close" class="daiz-ss-cropper-close"></div>');
            var $captureBtn = $('<div id="' + APP_PREFIX + '-daiz-ss-cropper-capture" \n            class="daiz-ss-cropper-capture">Capture</div>');
            var $scrapboxBtn = $('<div id="daiz-ss-cropper-scrapbox">Scrap</div>');
            $closeBtn.css({
                'background-image': 'url(' + closeBtnImg + ')'
            });

            $cropper[0].className = 'daiz-ss-cropper-main';
            $cropper[0].id = APP_PREFIX + '-daiz-ss-cropper-main';
            // 切り抜きボックスの位置を初期化
            if (boxParams.length === 0) {
                $cropper.css({
                    left: this.positionLastRclick[0] - this.CROP_BOX_SIZE / 2,
                    top: this.positionLastRclick[1] - this.CROP_BOX_SIZE / 2,
                    width: this.CROP_BOX_SIZE,
                    height: this.CROP_BOX_SIZE
                });
            } else {
                $cropper.css({
                    left: boxParams[0],
                    top: boxParams[1],
                    width: boxParams[2],
                    height: boxParams[3]
                });
            }
            $cropper.append($captureBtn);
            if ($scrapboxSelectBox !== null) {
                $cropper.append($scrapboxBtn);
                $cropper.append($scrapboxSelectBox);
            }
            $cropper.append($closeBtn);

            // ドラッグ可能にする
            $cropper.draggable({
                stop: function stop(ev, ui) {
                    _this._setRects();
                }
            });

            // リサイズ可能にする
            $cropper.resizable({
                stop: function stop(ev, ui) {
                    _this._setRects();
                },
                handles: "all"
            });

            $('body').append($cropper);
            this._setRects();
        }
    }, {
        key: '_setRects',
        value: function _setRects() {
            var $cropper = $('#' + APP_PREFIX + '-daiz-ss-cropper-main');
            var rect = $cropper[0].getBoundingClientRect();
            if (rect === undefined) return;
            this.removeCropper();
            this.linkdata = this.setRects(rect);
        }

        // ページ上で選択されている文字列を取得

    }, {
        key: 'getSelectedText',
        value: function getSelectedText() {
            var self = this;
            var selection = window.getSelection();
            var text = selection.toString();
            return text;
        }
    }, {
        key: 'setRects',
        value: function setRects(croppedRect) {
            this.fixHtml(true);

            // リンク以外のテキスト:
            var text = this.getSelectedText();
            $('#daiz-ss-cropper-main').attr('title', text);

            // リンク: 切り抜かれた形内のみ，aタグを覆えばよい
            var idx = 0;
            var aTags = $('body').find('a');
            var aTagRects = [];
            for (var i = 0; i < aTags.length; i++) {
                var aTag = aTags[i];
                var rect = aTag.getBoundingClientRect();
                if (rect !== undefined) {
                    // 検出したaタグが切り抜かれた領域内に完全に含まれているかを確認する
                    var fg = this.isInCroppedBox(rect, croppedRect);
                    if (fg) {
                        // リンク要素の位置と大きさに合わせて，長方形カバーを被せる
                        var $cropper = this.$genCropper();
                        $cropper.css({
                            width: rect.width,
                            height: rect.height,
                            left: rect.left,
                            top: rect.top
                        });
                        var aid = 'daiz-ss-a' + idx;
                        var pos = this.correctPosition(rect, croppedRect);
                        pos.id = aid;
                        pos.href = $(aTag).prop('href');
                        pos.text = $(aTag)[0].innerText;
                        pos.fontSize = $(aTag).css('font-size');
                        pos.fontFamily = $(aTag).css('font-family');

                        $cropper.attr('title', $(aTag).attr('href'));
                        $cropper.attr('id', aid);
                        $('body').append($cropper);
                        aTagRects.push(pos);
                        idx += 1;
                        //console.info('[END] cover hovered a-tag');
                    }
                }
            }

            // 切り取り領域
            var pos_cropper = {
                x: 0,
                y: 0,
                orgX: croppedRect.left,
                orgY: croppedRect.top,
                width: croppedRect.width,
                height: croppedRect.height
            };

            var title = document.title || '';
            if (title.length === 0) {
                // PDFページの場合，embedタグからファイル名を抽出して
                // titleとする
                var embeds = $('embed');
                if (embeds.length > 0 && embeds[0].type === 'application/pdf') {
                    var pdfPath = '/' + embeds[0].src;
                    var toks = pdfPath.split('/');
                    title = toks[toks.length - 1];
                }
            }

            var res = {
                cropperRect: pos_cropper,
                aTagRects: aTagRects,
                text: text,
                winW: window.innerWidth,
                winH: window.innerHeight,
                baseUri: window.location.href,
                title: title
            };
            return res;
        }
    }, {
        key: 'isInCroppedBox',
        value: function isInCroppedBox(aTagRect, stageRect) {
            var xa = stageRect.left;
            var xb = stageRect.left + stageRect.width;
            var ya = stageRect.top;
            var yb = stageRect.top + stageRect.height;

            var x1 = aTagRect.left;
            var x2 = aTagRect.left + aTagRect.width;
            var y1 = aTagRect.top;
            var y2 = aTagRect.top + aTagRect.height;
            var w = x2 - x1;
            var h = y2 - y1;

            var fgX = xa <= x1 && x2 <= xb;
            var fgY = ya <= y1 && y2 <= yb;

            if (fgX && fgY && w >= 5 && h >= 5) {
                return true;
            }
            return false;
        }

        // aタグの位置補正
        // stageRectの左端，上端を基準とした距離表現に直す
        // aTagRect ⊂ stageRect は保証されている

    }, {
        key: 'correctPosition',
        value: function correctPosition(aTagRect, stageRect) {
            var res = {};
            var x1 = aTagRect.left - stageRect.left;
            var x2 = aTagRect.left + aTagRect.width - stageRect.left;
            var y1 = aTagRect.top - stageRect.top;
            var y2 = aTagRect.top + aTagRect.height - stageRect.top;
            res = {
                x: x1,
                y: y1,
                width: aTagRect.width,
                height: aTagRect.height
            };
            return res;
        }

        // 描画されている長方形カバーを全て消去

    }, {
        key: 'removeCropper',
        value: function removeCropper() {
            $('.daiz-ss-cropper').remove();
        }
    }, {
        key: 'removeCropperMain',
        value: function removeCropperMain() {
            $(".daiz-ss-cropper-main").remove();
        }
    }, {
        key: 'capture',
        value: function capture() {
            var mode = arguments.length <= 0 || arguments[0] === undefined ? 'capture' : arguments[0];
            var scrapboxBoxId = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

            var self = this;
            var res = [];
            window.getSelection().removeAllRanges();

            // 切り取りボックス内のa要素
            if (self.linkdata.aTagRects) {
                for (var j = 0; j < self.linkdata.aTagRects.length; j++) {
                    var aTagDatum = self.linkdata.aTagRects[j];
                    var aid = aTagDatum.id;
                    if ($('#' + aid).length > 0) {
                        res.push(aTagDatum);
                    }
                }
            }
            self.linkdata.aTagRects = res;

            self.removeCropperMain();
            self.removeCropper();
            self.fixHtml(false);

            // ページから不要なdivが消去されてからスクリーンショットを撮りたいので，
            // 1秒待ってから送信する
            window.setTimeout(function () {
                if (scrapboxBoxId.length === 0) mode = 'capture';
                if (self.linkdata !== null) {
                    var appName = self.app;
                    self.app = null;
                    sendChromeMsg({
                        command: 'make-screen-shot',
                        options: {
                            sitedata: self.linkdata,
                            mode: mode,
                            scrapbox_box_id: scrapboxBoxId,
                            app: appName
                        }
                    });
                }
            }, 1000);
        }
    }, {
        key: 'bindEvents',
        value: function bindEvents() {
            var _this2 = this;

            var self = this;
            var $body = $('body');

            // cropperがクリックされたとき
            // 自身を消去する
            $body.on('click', '.daiz-ss-cropper', function (ev) {
                $(ev.target).closest('.daiz-ss-cropper').remove();
            });

            // 撮影ボタンがクリックされたとき
            $body.on('click', '#' + APP_PREFIX + '-daiz-ss-cropper-capture', function () {
                _this2.capture('capture');
            });

            // 撮影してScrapboxのページを作成するボタンが
            // クリックされたとき
            $body.on('click', '#daiz-ss-cropper-scrapbox', function (ev) {
                var scrapboxBoxId = $('#daiz-ss-cropper-scrap-select').val() || '';
                _this2.capture('scrap', scrapboxBoxId);
            });

            // 切り抜きボックスの閉じるボタンがクリックされたとき
            $body.on('click', '#' + APP_PREFIX + '-daiz-ss-cropper-close', function (ev) {
                _this2.removeCropper();
                _this2.removeCropperMain();
                _this2.fixHtml(false);
            });

            // 画像上での右クリックを追跡
            $body.on('contextmenu', 'img', function (ev) {
                var $img = $(ev.target).closest('img');
                _this2.tmp.$contextMenuImg = $img;
            });

            $body.on('contextmenu', '.card-thumbnail', function (ev) {
                var $img = $(ev.target).closest('.card-area').find('.card-img');
                _this2.app = 'linkcard';
                self.tmp.$contextMenuImg = $img;
            });

            // ページでの右クリックを検出
            $(window).bind('contextmenu', function (e) {
                _this2.positionLastRclick = [e.clientX, e.clientY];
            });

            // コンテキストメニュー（右クリックメニュー）が押された通知をbackgroundページから受け取る
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                var re = request.event;
                if (re === 'click-context-menu') {
                    // 撮影領域を選択するやつを表示
                    if (request.elementType === 'image' || _this2.tmp.$contextMenuImg.length > 0) {
                        var $img = _this2.tmp.$contextMenuImg;
                        var imgRect = $img[0].getBoundingClientRect();
                        _this2.tmp.$contextMenuImg = [];
                        _this2.renderCropper([imgRect.left, imgRect.top, $img.width(), $img.height()]);
                    } else {
                        _this2.renderCropper();
                    }
                } else if (re === 'make-card-scrapbox') {
                    // リンクカードを作成
                    // ポップアップ画面から呼ばれる
                    var themeImg = chrome.extension.getURL('./linkcard/scrapbox_default.png');
                    var closeBtn = chrome.extension.getURL('x.png');
                    var $cardArea = $('<div class="card-area"><img class="card-close" src="' + closeBtn + '"></div>');
                    var $img = $('<img src="' + themeImg + '" class="card-img">');
                    var $title = $('<div class="card-a"><a href="' + window.location.href + '">' + document.title + '</a></div>');
                    var $thumbnail = $('<div class="card-thumbnail"></div>');
                    var ogImg = $('meta[property="og:image"]').attr('content');
                    if (ogImg) {
                        $thumbnail.css('background-image', 'url("' + ogImg + '")');
                    }
                    $cardArea.append($img);
                    $cardArea.append($title);
                    $cardArea.append($thumbnail);
                    $body.append($cardArea);
                }
            });

            $body.on('click', '.card-close', function (ev) {
                $('.card-area').remove();
            });
        }
    }]);

    return ScreenShot;
}();

var ss = new ScreenShot();

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    var mark = "chrome-ext";
    if (request.event === 'updated-location-href') {
        var $body = $('body');
        if ($body.length > 0) {
            $body[0].dataset.stat_daiz_svgss = mark;
        }
        if (ss.inlineViewer === null) {
            ss.inlineViewer = new InlineViewer();
        }
    }
});
