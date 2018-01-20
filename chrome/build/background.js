(function(){var SVGSCREENSHOT_APP='https://svgscreenshot.appspot.com';var SVGSCREENSHOT_DEV='';var MODE='capture';var SCRAP_BOX_ID='';var SITE_TITLE='';var SITE_URL='';var APP_NAME='';var showBrowserPopup=(itemUrl='',bgImg='',err=false,msg='')=>{localStorage.item_url=itemUrl;var imgUrl=itemUrl.replace('/x/','/c/x/')+'.png';localStorage.item_img=bgImg;localStorage.item_img_url=imgUrl;localStorage.is_error=err?msg:'y';var color=err?'red':'#4abb0c';chrome.browserAction.setBadgeBackgroundColor({'color':color});var badge=err?'\u2717':'\u2714';chrome.browserAction.setBadgeText({'text':badge});chrome.browserAction.setPopup({'popup':'popup.html'})};const setBadgeCaptureCompleted=()=>{chrome.browserAction.setBadgeBackgroundColor({'color':'#4abb0c'});chrome.browserAction.setBadgeText({'text':'\u25CB'})};const setBadgeCaptureGyazoCompleted=()=>{chrome.browserAction.setBadgeBackgroundColor({'color':'#4abb0c'});chrome.browserAction.setBadgeText({'text':'G'})};var getSettings=()=>{var s=null;if(localStorage.svgscreenshot_settings){s=JSON.parse(localStorage.svgscreenshot_settings)}return s};var makeScrapboxPage=(xKey='')=>{if(xKey.length===0)return;var s=getSettings();if(s===null||s.use_scrapbox==='no')return;var xUrl=SVGSCREENSHOT_APP+`/c/x/${xKey}.png`;var scrapboxId=SCRAP_BOX_ID||s.id_scrapbox[0];var title=encodeURIComponent(SITE_TITLE.trim());var body=encodeURIComponent(`[${xUrl}]\n[${SITE_TITLE} ${SITE_URL}]`);var scrapboxBookmarkletUrl=`https://scrapbox.io/${scrapboxId}/${title}?body=${body}`;chrome.tabs.create({url:scrapboxBookmarkletUrl},null)};const uploadToDynamicGazo=async(svgtag,svgBgBase64Img,devicePixelRatio)=>{SITE_TITLE=svgtag.getAttribute('data-title')||'';SITE_URL=svgtag.getAttribute('data-url')||'';const gyazoImageId=await window.dynamicGazo.uploadToGyazo({title:SITE_TITLE,referer:SITE_URL,image:svgBgBase64Img,scale:devicePixelRatio});await setBadgeCaptureGyazoCompleted();$.ajax({url:`${SVGSCREENSHOT_APP}/api/uploadsvg`,type:'POST',dataType:'json',contentType:'application/json; charset=utf-8',data:JSON.stringify({svg:svgtag.outerHTML,base64png:svgBgBase64Img,orgurl:SITE_URL,title:SITE_TITLE,viewbox:svgtag.getAttribute('viewBox'),public:'yes',gyazo:'yes',gyazo_image_id:gyazoImageId,dpr:devicePixelRatio,app_name:APP_NAME})}).success(data=>{var stat=data.status;if(stat==='ok-saved-new-screenshot'){var itemUrl=SVGSCREENSHOT_APP+data.url;showBrowserPopup(itemUrl,svgBgBase64Img,false);if(MODE==='scrap'){makeScrapboxPage(data.x_key)}}else if(stat==='exceed-screenshots-upper-limit'){showBrowserPopup('','',true,'\u30D5\u30A1\u30A4\u30EB\u306E\u4E0A\u9650\u6570\u306B\u9054\u3057\u3066\u3044\u307E\u3059')}else if(stat=='no-login'){showBrowserPopup('','',true,'\u30A6\u30A7\u30D6\u30A2\u30D7\u30EA\u306B\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u3044\u307E\u305B\u3093')}else{showBrowserPopup('','',true,'\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306B\u5931\u6557\u3057\u307E\u3057\u305F')}console.log(data)}).fail(data=>{showBrowserPopup('','',true,'Unknown error')})};var renderImage=function(linkdata,base64img,devicePixelRatio){var rat=devicePixelRatio;var canvas=document.querySelector('#cav');var pos_cropper=linkdata.cropperRect;var baseUri=linkdata.baseUri;var title=linkdata.title;var w=+pos_cropper.width;var h=+pos_cropper.height;canvas.width=rat*w;canvas.height=rat*h;var ctx=canvas.getContext('2d');var img=new Image;img.onload=function(){ctx.drawImage(img,rat*pos_cropper.orgX,rat*pos_cropper.orgY,rat*w,rat*h,0,0,rat*w,rat*h);var screenshot=canvas.toDataURL('image/png');makeSVGtag(linkdata.aTagRects,linkdata.text,screenshot,w,h,baseUri,title,rat)};img.src=base64img};var makeSVGtag=function(aTagRects,text,base64img,width,height,baseUri,title,devicePixelRatio){var svgns='http://www.w3.org/2000/svg';var hrefns='http://www.w3.org/1999/xlink';var rootSVGtag=document.createElementNS(svgns,'svg');rootSVGtag.setAttributeNS(null,'version','1.1');rootSVGtag.setAttribute('xmlns','http://www.w3.org/2000/svg');rootSVGtag.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');rootSVGtag.setAttributeNS(null,'class','svg-screenshot');rootSVGtag.setAttributeNS(null,'viewBox','0 0 '+width+' '+height);var img=document.createElementNS(svgns,'image');img.setAttributeNS(null,'width',width);img.setAttributeNS(null,'height',height);img.setAttributeNS(null,'x',0);img.setAttributeNS(null,'y',0);img.setAttributeNS(null,'data-selectedtext',text);img.setAttributeNS(hrefns,'href',base64img);for(var i=0;i<aTagRects.length;i++){var aTagRect=aTagRects[i];var a=document.createElementNS(svgns,'a');var url=validateUrl(aTagRect.href);if(url.length===0)continue;a.setAttributeNS(hrefns,'href',url);a.setAttributeNS(null,'target','_blank');var rect=document.createElementNS(svgns,'rect');rect.setAttributeNS(null,'width',aTagRect.width);rect.setAttributeNS(null,'height',aTagRect.height);rect.setAttributeNS(null,'x',aTagRect.x);rect.setAttributeNS(null,'y',aTagRect.y);rect.setAttributeNS(null,'fill','rgba(0, 0, 0, 0)');var text=document.createElementNS(svgns,'text');text.setAttributeNS(null,'x',aTagRect.x);text.setAttributeNS(null,'y',aTagRect.y+aTagRect.height);var txt=validateTitle(aTagRect.text);text.textContent=txt;text.setAttributeNS(null,'fill','rgba(0, 0, 0, 0)');a.appendChild(rect);a.appendChild(text);rootSVGtag.appendChild(a)}rootSVGtag.setAttributeNS(null,'width',width);rootSVGtag.setAttributeNS(null,'height',height);rootSVGtag.setAttributeNS(null,'data-url',validateUrl(baseUri));rootSVGtag.setAttributeNS(null,'data-title',validateTitle(title));uploadToDynamicGazo(rootSVGtag,base64img,devicePixelRatio)};chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){var opts=request.options;if(request.command==='make-screen-shot'){var linkdata=opts.sitedata;chrome.tabs.captureVisibleTab({format:'png'},function(dataUrl){setBadgeCaptureCompleted();MODE=opts.mode;APP_NAME=opts.app||'';SCRAP_BOX_ID=opts.scrapbox_box_id;renderImage(linkdata,dataUrl,opts.dpr)})}else if(request.command==='get-scrapbox-list'){var scrapboxIds=[];var scrapboxEnabled='no';var s=getSettings();if(s!=null){scrapboxIds=s.id_scrapbox;scrapboxEnabled=s.use_scrapbox}sendResponse({scrapbox_enabled:scrapboxEnabled,scrapbox_ids:scrapboxIds})}});chrome.browserAction.onClicked.addListener(tab=>{chrome.tabs.create({url:SVGSCREENSHOT_APP},null)});var getContextMenuTitle=title=>{var prefix=SVGSCREENSHOT_DEV;return prefix+title};var initScreenShotMenu=()=>{chrome.contextMenus.create({title:getContextMenuTitle('DynamicGazo\u3092\u64AE\u308B'),contexts:['page','selection'],onclick:function(clicked,tab){clearBadge();chrome.tabs.sendRequest(tab.id,{event:'click-context-menu'})}});chrome.contextMenus.create({title:getContextMenuTitle('DynamicGazo\u3092\u64AE\u308B'),contexts:['image'],onclick:function(clicked,tab){clearBadge();chrome.tabs.sendRequest(tab.id,{event:'click-context-menu',elementType:'image'})}})};initScreenShotMenu();chrome.tabs.onUpdated.addListener(function(tabId,info,tab){if(info.status==='complete'){chrome.tabs.sendRequest(tab.id,{event:'updated-location-href'})}})})();