const APP_PREFIX='dynamic_gazo';const dynamicGazo=window.dynamicGazo;const sendChromeMsg=(json,callback)=>{chrome.runtime.sendMessage(json,callback)};class ScreenShot{constructor(){this.CROP_BOX_SIZE=150;this.uiInit();this.positionLastRclick=[200,200];this.linkdata=null;this.tmp={'$contextMenuImg':[]};this.inlineViewer=null;this.app=null}renderCropper(boxParams=[]){var self=this;chrome.runtime.sendMessage({command:'get-scrapbox-list'},info=>{var scrapboxEnabled=info.scrapbox_enabled;var scrapboxIds=info.scrapbox_ids;if(scrapboxEnabled==='yes'&&scrapboxIds.length>0){var $select=$(`<select id="daiz-ss-cropper-scrap-select"></select>`);for(var i=0;i<scrapboxIds.length;i++){var scrapboxId=scrapboxIds[i];var $opt=$(`<option value="${scrapboxId}">${scrapboxId}</option>`);$select.append($opt)}self.initCropperMain(boxParams,$select)}else{self.initCropperMain(boxParams,null)}})}uiInit(){this.bindEvents()}$genCropper(){var $cropper=$(`<div class="daiz-ss-cropper" style="position: fixed;"></div>`);$cropper.css({top:0,left:0,width:this.CROP_BOX_SIZE,height:this.CROP_BOX_SIZE});return $cropper}fixHtml(fg){var fg=fg||false;if(fg){$('html').css({height:'100%',width:'100%',overflow:'hidden'})}else{$('html').css({height:'',width:'',overflow:'auto'})}}initCropperMain(boxParams=[],$scrapboxSelectBox=null){var $cropper=this.$genCropper();var closeBtnImg=chrome.extension.getURL('./image/x.png');var $closeBtn=$(`<div id="${APP_PREFIX}-daiz-ss-cropper-close" class="daiz-ss-cropper-close"></div>`);var $captureBtn=$(`<div id="${APP_PREFIX}-daiz-ss-cropper-capture"
            class="daiz-ss-cropper-capture">Capture</div>`);var $scrapboxBtn=$('<div id="daiz-ss-cropper-scrapbox">Scrap</div>');$closeBtn.css({'background-image':`url(${closeBtnImg})`});$cropper[0].className='daiz-ss-cropper-main';$cropper[0].id=`${APP_PREFIX}-daiz-ss-cropper-main`;if(boxParams.length===0){$cropper.css({left:this.positionLastRclick[0]-this.CROP_BOX_SIZE/2,top:this.positionLastRclick[1]-this.CROP_BOX_SIZE/2,width:this.CROP_BOX_SIZE,height:this.CROP_BOX_SIZE})}else{$cropper.css({left:boxParams[0],top:boxParams[1],width:boxParams[2],height:boxParams[3]})}$cropper.append($captureBtn);if($scrapboxSelectBox!==null){$cropper.append($scrapboxBtn);$cropper.append($scrapboxSelectBox)}$cropper.append($closeBtn);this.movable($cropper);$('body').append($cropper);this._setRects()}movable($cropper){$cropper.draggable({stop:(ev,ui)=>{this._setRects()}});$cropper.resizable({stop:(ev,ui)=>{this._setRects()},handles:'all'})}_setRects(){var $cropper=$(`#${APP_PREFIX}-daiz-ss-cropper-main`);var rect=$cropper[0].getBoundingClientRect();if(rect===undefined)return;this.removeCropper();this.linkdata=this.setRects(rect)}getSelectedText(){var self=this;var selection=window.getSelection();var text=selection.toString();return text}setRects(range){this.fixHtml(true);const $cropperMain=$(this.removeCropperMain());const anchorsInArea=new dynamicGazo.AnchorsInArea(document);const aTags=anchorsInArea.find(range);this.movable($cropperMain);$('body').append($cropperMain);var text=this.getSelectedText();$('#daiz-ss-cropper-main').attr('title',text);var aTagRects=[];for(var i=0;i<aTags.length;i++){var aTag=aTags[i];var rect=aTag.position;if(rect!==undefined){const $cropper=this.$genCropper();$cropper.css({width:rect.width,height:rect.height,left:rect.left-window.scrollX,top:rect.top-window.scrollY});var aid=`daiz-ss-a${i}`;var pos=this.correctPosition(rect,range);pos.id=aid;pos.href=aTag.url;pos.text=aTag.text;$cropper.attr('title',aTag.url);$cropper.attr('id',aid);$('body').append($cropper);aTagRects.push(pos)}}var pos_cropper={x:0,y:0,orgX:range.left,orgY:range.top,width:range.width,height:range.height};var title=document.title||'';if(title.length===0){var embeds=$('embed');if(embeds.length>0&&embeds[0].type==='application/pdf'){var pdfPath='/'+embeds[0].src;var toks=pdfPath.split('/');title=toks[toks.length-1]}}var res={cropperRect:pos_cropper,aTagRects:aTagRects,text:text,winW:window.innerWidth,winH:window.innerHeight,baseUri:window.location.href,title:title};return res}correctPosition(aTagRect,stageRect){let res={};const x1=aTagRect.left-window.scrollX-stageRect.left;const y1=aTagRect.top-window.scrollY-stageRect.top;res={x:x1,y:y1,width:aTagRect.width,height:aTagRect.height};return res}removeCropper(){$('.daiz-ss-cropper').remove()}getCropperMain(){return $('.daiz-ss-cropper-main')[0]}removeCropperMain(){const $elem=$('.daiz-ss-cropper-main');$elem.draggable('destroy');$elem.resizable('destroy');const copy=$elem[0].cloneNode(true);$elem.remove();return copy}capture(mode='capture',scrapboxBoxId=''){var self=this;var res=[];window.getSelection().removeAllRanges();if(self.linkdata.aTagRects){for(var j=0;j<self.linkdata.aTagRects.length;j++){var aTagDatum=self.linkdata.aTagRects[j];var aid=aTagDatum.id;if($(`#${aid}`).length>0){res.push(aTagDatum)}}}self.linkdata.aTagRects=res;self.removeCropperMain();self.removeCropper();self.fixHtml(false);window.setTimeout(()=>{var rat=Math.max(window.devicePixelRatio,1);if(scrapboxBoxId.length===0)mode='capture';if(self.linkdata!==null){var appName=self.app;self.app=null;sendChromeMsg({command:'make-screen-shot',options:{sitedata:self.linkdata,mode:mode,scrapbox_box_id:scrapboxBoxId,app:appName,dpr:rat}})}},900)}bindEvents(){var self=this;var $body=$('body');$body.on('click','.daiz-ss-cropper',ev=>{$(ev.target).closest('.daiz-ss-cropper').remove()});$body.on('click',`#${APP_PREFIX}-daiz-ss-cropper-capture`,()=>{this.capture('capture')});$body.on('click','#daiz-ss-cropper-scrapbox',ev=>{var scrapboxBoxId=$('#daiz-ss-cropper-scrap-select').val()||'';this.capture('scrap',scrapboxBoxId)});$body.on('click',`#${APP_PREFIX}-daiz-ss-cropper-close`,ev=>{this.removeCropper();this.removeCropperMain();this.fixHtml(false)});$body.on('contextmenu','img',ev=>{var $img=$(ev.target).closest('img');this.tmp.$contextMenuImg=$img});$body.on('contextmenu','.card-thumbnail',ev=>{var $img=$(ev.target).closest('.card-area').find('.card-img');this.app='linkcard';self.tmp.$contextMenuImg=$img});$(window).bind('contextmenu',e=>{this.positionLastRclick=[e.clientX,e.clientY]});chrome.extension.onRequest.addListener((request,sender,sendResponse)=>{var re=request.event;if(re==='click-context-menu'){if(request.elementType==='image'||this.tmp.$contextMenuImg.length>0){var $img=this.tmp.$contextMenuImg;var imgRect=$img[0].getBoundingClientRect();this.tmp.$contextMenuImg=[];this.renderCropper([imgRect.left,imgRect.top,$img.width(),$img.height()])}else{this.renderCropper()}}else if(re==='make-card-scrapbox'){var themeImg=chrome.extension.getURL('.image/linkcard/scrapbox_default.png');var closeBtn=chrome.extension.getURL('./image/x.png');var $cardArea=$(`<div class="card-area"><img class="card-close" src="${closeBtn}"></div>`);var $img=$(`<img src="${themeImg}" class="card-img">`);var $title=$(`<div class="card-a"><a href="${window.location.href}">${document.title}</a></div>`);var $thumbnail=$(`<div class="card-thumbnail"></div>`);var ogImg=$('meta[property="og:image"]').attr('content');if(ogImg){$thumbnail.css({'background-color':'#fff','background-image':`url("${ogImg}")`})}else{$thumbnail.css('background-color','rgba(0, 0, 0, 0)')}$cardArea.append($img);$cardArea.append($title);$cardArea.append($thumbnail);$body.append($cardArea)}});$body.on('click','.card-close',ev=>{$('.card-area').remove()})}}var ss=new ScreenShot;chrome.extension.onRequest.addListener((request,sender,sendResponse)=>{var mark='chrome-ext';if(request.event==='updated-location-href'){var $body=$('body');if($body.length>0){$body[0].dataset.stat_daiz_svgss=mark}if(ss.inlineViewer===null){ss.inlineViewer=new InlineViewer}}});