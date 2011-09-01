/*1314585034,169775812*/

if (window.CavalryLogger) { CavalryLogger.start_js(["FT9FG"]); }

var ChannelRebuildReasons={Unknown:0,AsyncError:1,TooLong:2,Refresh:3,RefreshDelay:4,UIRestart:5,NeedSeq:6,PrevFailed:7,IFrameLoadGiveUp:8,IFrameLoadRetry:9,IFrameLoadRetryWorked:10,PageTransitionRetry:11,IFrameLoadMaxSubdomain:12,NoChannelInfo:13,NoChannelHost:14,ChannelUnknown:100,ChannelNoCUser:101,ChannelInvalidCUser:102,ChannelInvalidChanstr:103,ChannelChDistribTimeout:104,ChannelGetChannelOther:105,ChannelNodeShutdown:106,ChannelTermination:107,ChannelUserMismatch:108,ChannelUserMismatchShady:109,ChannelBadXs:110,ChannelSeqNeg:111,ChannelSeqTooBig:112,ChannelSeqTooSmall:113,ChannelUnexpectedJoin:114,ChannelInvalidXsCookie:115,ChannelRelocate:116,ChannelWrongPartition:117};
var CrossDocument={};(function(){CrossDocument.setListener=function(eventHandler){if(window.postMessage){if(window.addEventListener){window.addEventListener('message',eventHandler,false);}else window.onmessage=eventHandler;}else if(document.postMessage)document.addEventListener('message',eventHandler,false);};CrossDocument.mkPostMessage=function(targetWindow,targetDocument,msgHandler){if(window.postMessage){if("object"==typeof window.postMessage){return function(message,origin){targetWindow.postMessage(message,origin);};}else return bind(targetWindow,targetWindow.postMessage);}else if(document.postMessage){return bind(targetDocument,targetDocument.postMessage);}else return bind(targetWindow,msgHandler);};CrossDocument.targetOrigin=function(parent){if(window.postMessage||document.postMessage){var parentLoc=parent.location;var parentHost=parentLoc.hostname;if(parentHost=='facebook.com'||parentHost.substring(parentHost.length-13)=='.facebook.com')return parentLoc.protocol+'//'+parentLoc.host;}else return null;};var _handleMessage=function(msgCallback,msgStr){if(!msgStr||msgStr.charAt(0)!='{')return;var msg=eval('('+msgStr+')');return msgCallback(msg);};CrossDocument.mkEventHandler=function(msgCallback){return function(event){event=event||window.event;var domain=(event.domain||event.origin);if(domain.substring(domain.length-13)!='.facebook.com'&&domain.substring(domain.length-15)!='://facebook.com'&&domain!='facebook.com')return;return _handleMessage(msgCallback,event.data);};};CrossDocument.mkMessageHandler=function(msgCallback){return function(msgStr){return _handleMessage(msgCallback,msgStr);};};})();
function ChannelManager(b,e,d,a,c){this.user=e;this.iframeLoadMaxRetries=1;this.iframeLoadMaxSubdomain=6;this.expectResponseTimeout=5000;this.retryInterval=d;this.channelConfig=a;this._init(b,c);}ChannelManager.CONN_LOG_INTERVAL=10000;ChannelManager.prototype={_init:function(c,e){this.channelManagerId=rand32();this.config={};this.channel={};this.isActionRequest=true;this.isReady=false;this.isRebuilding=false;this.iframeIsLoaded=false;this.iframeEverLoaded=false;this.iframeCheckFailedCount=0;this.shouldClearSubdomain=false;this.subframe=c;Event.listen(this.subframe,'load',this._iframeLoadCheck.bind(this));this.postMessage=null;var a=presenceCookieManager.getSubCookie('ch');if(e){this.iframeSubdomain=null;}else{this.iframeSubdomain=0;if(a&&a.sub){for(var b=0;b<a.sub.length;b++)if(!a.sub[b]){this.iframeSubdomain=b;break;}if(b==a.sub.length)if(b==this.iframeLoadMaxSubdomain&&URI().isSecure()){this.iframeSubdomain=null;this._sendDummyReconnect(ChannelRebuildReasons.IFrameLoadMaxSubdomain);}else this.iframeSubdomain=a.sub.length;}}this.handleIframeEvent=CrossDocument.mkEventHandler(this._handleIframeMessage.bind(this));this.handleIframeMessage=CrossDocument.mkMessageHandler(this._handleIframeMessage.bind(this));CrossDocument.setListener(this.handleIframeEvent.bind(this));presenceCookieManager.register('ch',this._getCookieInfo.bind(this));if(typeof window.onpageshow!='undefined'){Event.listen(window,'pagehide',this._onUnload.bind(this));Event.listen(window,'pageshow',this.rebuild.bind(this,ChannelRebuildReasons.Refresh));}else onunloadRegister(this._onUnload.bind(this));this._connLogger=EagleEye.createLogger('channel-connectivity',this.getConfig('CONNECTIVITY_SAMPLING',.01));this._connTime=Env.start;this._connT=2000;this._connectivity={};(this._connSample=this._connSample.bind(this))();(this._connLog=this._connLog.bind(this))();var d=0;UserActivity.subscribe(function(){if(new Date()-d>3000){d=new Date();this.setActionRequest(true);}}.bind(this));},_connSample:function(){var a=new Date(),b=this._connState||'idle';var c=a-this._connTime;this._connAdd(b,c);this._connTime=a;setTimeout(this._connSample,1000*(1+Math.random()),false);},_connAdd:function(a,b){this._connectivity[a]=(this._connectivity[a]||0)+b;},_connLog:function(){this._connLogger(this._connectivity);this._connectivity={};this._connT=Math.min(60000,2*this._connT);setTimeout(this._connLog,this._connT,false);},sendIframeMessage:function(b){if(!this.postMessage)return;var c=JSON.stringify(b);try{this.postMessage(c,this.targetOrigin);}catch(a){presence.error('channel: iframe msg error: '+'message "'+c+'" and error '+a.toString());}},_handleIframeMessage:function(g){var f=this.channel.currentSeq;if('seq' in g){this.channel.currentSeq=g.seq;presence.doSync();}switch(g.t){case 'init':this._connState=null;this.iframeLoaded();break;case 'log':break;case 'reconnect':if(window.loaded){presence.error('channel:refresh_'+g.reason);this.rebuild(g.reason);this.channel.shutdownHandler(true);}break;case 'connectivity':delete g.t;if('state' in g){this._connState=g.state;delete g.state;}for(var e in g)this._connAdd(e,g[e]);break;case 'fullReload':presence.error('channel:fullReload');presenceCookieManager.clear();Arbiter.inform('channel/invalid_history');break;case 'msg':var a=this.channel;var h=g.ms;var i=a.currentSeq-h.length;for(var d=0;d<h.length;d++,i++)if(i>=f){var b=h[d];try{a.msgHandler(a.name,b);}catch(c){presence.error('channel: error while handling '+b.type+' - '+c.toString());}}break;default:presence.error('channel: unknown msg type - '+g.t);presence.permaShutdown();this.stop();break;}},_onUnload:function(){this.shouldClearSubdomain=true;presenceCookieManager.setCheckUserCookie(true);presence.doSync(true);},addChannel:function(a,d,b,f,e,c){if(this.channel.name){presence.error("channel: addChannel called twice");return;}this.channel={name:a,currentSeq:d,msgHandler:b,startHandler:f,shutdownHandler:e,restartHandler:c};presence.doSync();},_getCookieInfo:function(){var b={};if(this.config.host){b.h=this.config.host;if(this.config.port)b.p=this.config.port;if(null!==this.iframeSubdomain){var a=presenceCookieManager.getSubCookie('ch');var e=(a&&a.sub)?a.sub:[];var d=e.length;if(this.shouldClearSubdomain){e[this.iframeSubdomain]=0;}else{e[this.iframeSubdomain]=1;for(var c=d;c<=this.iframeSubdomain;c++)if(!e[c])e[c]=0;}b.sub=e;}b[this.channel.name]=this.channel.currentSeq;}b.ri=this.retryInterval;return b;},getConfig:function(c,b){var a=this.channelConfig;return a&&(c in a)?a[c]:b;},stop:function(){this.stopped=true;this.setReady(false);},setReady:function(a){this.isReady=a;var b={type:'isReady',isReady:a,isActionRequest:this.isActionRequest};if(a&&this.isActionRequest)this.isActionRequest=false;if(a){b.channelName=this.channel.name;b.currentSeq=this.channel.currentSeq;b.channelManagerId=this.channelManagerId;b.channelConfig=this.channelConfig;}this.sendIframeMessage(b);},setActionRequest:function(a){this.sendIframeMessage({type:'isActionRequest',isActionRequest:a});},expectResponse:function(){this.sendIframeMessage({type:'expectResponse',newTimeout:this.expectResponseTimeout});},_iframeUrl:function(a,c,b){var d;if(null===this.iframeSubdomain){d='';}else{d=this.iframeSubdomain;d+=URI().isSecure()?'-':'.';}return new URI().setDomain(d+a+'.facebook.com').setPort(c).setPath(b).setSecure(URI().isSecure()).toString();},iframeLoad:function(a,c){this.isReady=c;this.iframeIsLoaded=false;this.config=a;var e=this._iframeUrl(a.host,a.port,a.path);clearTimeout(this._checkTimer);this._checkTimer=this._iframeCheck.bind(this).defer(this.getConfig('IFRAME_LOAD_TIMEOUT',30000),false);var d=null;if(!ua.ie()||ua.ie()<8)try{d=this.subframe.contentDocument;}catch(b){}if(d){try{d.location.replace(e);}catch(b){presence.error('channel: error setting location: '+b.toString());}}else if(this.subframe.contentWindow){this.subframe.src=e;}else if(this.subframe.document){this.subframe.src=e;}else presence.error('channel: error setting subframe url');presence.debug('channel: done with iframeLoad, subframe sent to '+e);},_iframeLoadCheck:function(){try{this.subframe.contentWindow.document.body.innerHTML;}catch(a){presence.error('channel:iframe load check error:(check #'+this.iframeCheckFailedCount+'):'+a);}},iframeLoaded:function(){if(!this.iframeIsLoaded){this.iframeIsLoaded=true;this.postMessage=CrossDocument.mkPostMessage(this.subframe.contentWindow,this.subframe.contentDocument,this.subframe.contentWindow.channelUplink.handleParentMessage);this.targetOrigin="*";this.setReady(this.isReady);if(this.iframeCheckFailedCount){this.channel.restartHandler(false);this._sendDummyReconnect(ChannelRebuildReasons.IFrameLoadRetryWorked);}else this.channel.startHandler();this.iframeCheckFailedCount=0;this.iframeEverLoaded=true;}},_diagnoseIframeError:function(b){function a(j){var k={},l=new Date();var h=j=='channel'?b.host:b.host2;var g=function(m){if(!k.result){k.t=new Date()-l;k.result=m?'contact':'error';e();}};k.toString=function(){return 'NAME STATUS (t=TIME)'.replace('NAME',j).replace('STATUS',k.result||'timeout').replace('TIME',Math.round(k.t/1000));};var i=new Image();i.onload=g.bind(null,true);i.onerror=g.bind(null,false);i.src=new URI().setDomain(h+'.facebook.com').setPort(b.port).setPath('/iping').setSecure(URI().isSecure());return k;}function e(g){if(g||(c.result&&d.result))presence.error('channel:iframe_failed:'+c+', '+d);}var f=e.bind(null,true).defer(120000,false);var c=a('channel'),d=a('alias');},_iframeCheck:function(){delete this._checkTimer;if(!this.iframeIsLoaded){this.iframeCheckFailedCount++;var a=this.config;this.config={};presenceCookieManager.store();if(this.iframeCheckFailedCount<=this.iframeLoadMaxRetries){this.rebuild(ChannelRebuildReasons.IFrameLoadRetry);}else{this.channel.shutdownHandler();this._sendDummyReconnect(ChannelRebuildReasons.IFrameLoadGiveUp);this._diagnoseIframeError(a);}}else this.retryInterval=0;},_sendDummyReconnect:function(b){var a=new AsyncRequest().setURI('/ajax/presence/reconnect.php').setData({reason:b,iframe_loaded:this.iframeEverLoaded}).setOption('suppressErrorHandlerWarning',true).setOption('retries',1).setMethod('GET').setReadOnly(true).setAllowCrossPageTransition(true);a.specifiesWriteRequiredParams()&&a.send();},_rebuildResponse:function(c){var b=c.getPayload();if(!b.user_channel){presence.error('channel: invalid channel name - '+this.channel.name);presence.permaShutdown();this.stop();return;}var a=b.user_channel;presence.debug('got rebuild response with channel '+a+', seq '+b.seq+', host '+b.host+', port '+b.port);this.channel.currentSeq=b.seq;this.isRebuilding=false;if(b.path!=this.config.path||b.host!=this.config.host){this.iframeLoad(b,true);}else this.setReady(true);presenceCookieManager.store();if(typeof chatOptions!='undefined')chatOptions.setVisibility(b.visibility);this.channel.restartHandler(true);},_retryRebuild:function(c,a){var d=this.getConfig('MAX_RETRY_INTERVAL',60000);var e=this.getConfig('MIN_RETRY_INTERVAL',10000);if(a){this.retryInterval=d;}else if(this.retryInterval==0){this.retryInterval=e;}else this.retryInterval=Math.min(d,this.retryInterval*2);var b=this.retryInterval*(.75+Math.random()*.5);presence.warn('channel: retry: manager trying again in '+(b*.001)+' secs');setTimeout(this._rebuildSend.bind(this,c),this.retryInterval,false);},_rebuildError:function(a,b){this.channel.shutdownHandler(true);presence.error('channel: got rebuild error: '+b.getErrorDescription());if(presence.checkMaintenanceError(b)){presence.warn('channel: manager not trying again');}else if(presence.checkLoginError(b)){if(presence.inPopoutWindow){this._retryRebuild(ChannelRebuildReasons.PrevFailed,true);}else presence.warn('channel: manager not trying again');}else this._retryRebuild(ChannelRebuildReasons.PrevFailed,false);},_rebuildTransportError:function(a,b){this.channel.shutdownHandler(true);presence.error('channel: got rebuild transport error: '+b.getErrorDescription());this._retryRebuild(a,false);},_rebuildSend:function(b){if(!presence.hasUserCookie(true))return;if(typeof b!='number')b=ChannelRebuildReasons.Unknown;presence.debug('channel: sending rebuild');var a=new AsyncRequest().setURI('/ajax/presence/reconnect.php').setData({reason:b,iframe_loaded:this.iframeEverLoaded}).setHandler(this._rebuildResponse.bind(this)).setErrorHandler(this._rebuildError.bind(this,b)).setTransportErrorHandler(this._rebuildTransportError.bind(this,b)).setOption('suppressErrorAlerts',true).setOption('retries',1).setMethod('GET').setReadOnly(true).setAllowCrossPageTransition(true);return a.specifiesWriteRequiredParams()&&a.send();},rebuild:function(a){presenceCookieManager.setCheckUserCookie(false);if(this.stopped)return;if(this.isRebuilding){presence.debug('channel: rebuild called, but already rebuilding');return;}this.setReady(false);this.isRebuilding=true;presence.debug('channel: rebuilding');if(a==ChannelRebuildReasons.RefreshDelay)this.retryInterval=this.channelConfig.MAX_RETRY_INTERVAL;setTimeout(this._rebuildSend.bind(this,a),this.retryInterval,false);}};
function TinyPresence(g,c,b,a,e,d,f){this.user=g;this.name=c;this.firstName=b;this.alias=a;this.sitevars=f;this.popoutURL=env_get('www_base')+'presence/popout.php';this.updateServerTime(e);this.pageLoadTime=this.getTime();this._init(d);}TinyPresence.prototype={cookiePollTime:2000,popoutHeartbeatTime:1000,popoutHeartbeatAllowance:4000,popoutHeartbeatFirstAllowance:15000,shutdownDelay:5000,restartDelay:3000,_init:function(a){this.stateStorers=[];this.stateLoaders=[];this._syncTimeout=null;this.windowID=rand32()+1;this.cookiePoller=null;this.heartbeat=null;this.stateUpdateTime=0;this.loaded=false;this.isShutdown=false;this.isShuttingDown=false;this.isRestarting=false;this.isPermaShutdown=false;this.shutdownTime=0;this.justPoppedOut=false;this.syncPaused=0;this.poppedOut=a;this.inPopoutWindow=a;presenceCookieManager.register('state',this._getCookieData.bind(this));Arbiter.subscribe("page_transition",this.checkRebuild.bind(this));this.load();},init:function(){var b={ON_CONNECT:function(){Arbiter.inform(PresenceMessage.STARTED,{sender:this});this._restart(0);},SHUTDOWN:function(d,c){switch(cause){case channel.HINT_AUTH:return this.loginShutdown();case channel.HINT_CONN:return this.connectionShutdown();case channel.HINT_MAINT:return this.maintenanceShutdown();default:return this.permaShutdown();}}};for(var a in b)Arbiter.subscribe(channel[a],b[a].bind(this));},updateServerTime:function(a){this.timeSkew=new Date().getTime()-a;},getTime:function(){return new Date().getTime()-this.timeSkew;},debug:function(a){},warn:function(a){this.logError("13003:warning:"+a);},error:function(a){this.logError("13002:error:"+a);},logError:function(a){window.EagleEye&&EagleEye.log('realtime-error',{data:a});},load:function(){var b=presenceCookieManager.getSubCookie('state');if(!b){this.debug('presence: got null state cookie, loading with current state');this._load(this._getCookieData());return;}try{this._load(b);}catch(a){this.error('presence: got load exception: '+a.toString());this._load(this._getCookieData());}},_load:function(b){this.syncPaused++;this.stateUpdateTime=verifyNumber(b.ut);this.popoutTime=verifyNumber(b.pt);this.poppedOut=!!b.p;if(this.poppedOut){if(this.inPopoutWindow)if(!this.heartbeat)this.heartbeat=setInterval(this._popoutHeartbeat.bind(this),this.popoutHeartbeatTime);}else if(this.inPopoutWindow){if(!this.loaded){this.poppedOut=true;this.doSync();}}else this.justPoppedOut=true;if(!this.inPopoutWindow&&!this.cookiePoller)this.cookiePoller=setInterval(this._pollCookie.bind(this),this.cookiePollTime);this.state=b;for(var a=0;a<this.stateLoaders.length;a++)this.stateLoaders[a](b);this.syncPaused--;this._loaded();},_loaded:function(){this.loaded=true;},_pollCookie:function(){var e=presenceCookieManager.getSubCookie('state');if(!e)return;var d=this.popoutTime;if(e.ut>this.stateUpdateTime){this.load(e);return;}if(this.poppedOut&&!this.inPopoutWindow){var a=verifyNumber(e.pt);var b=new Date().getTime()-a;var c=this.popoutHeartbeatTime+this.popoutHeartbeatAllowance;if(this.justPoppedOut)if(a==d){c+=this.popoutHeartbeatFirstAllowance;}else this.justPoppedOut=false;this.popoutTime=a;if(b>c){this.poppedOut=false;this.doSync();}}},_popoutHeartbeat:function(){this._pollCookie();if(this.poppedOut)presenceCookieManager.store();},_getCookieData:function(){var b={p:this.poppedOut?1:0,ut:this.stateUpdateTime,pt:this.inPopoutWindow?new Date().getTime():this.popoutTime};for(var a=0;a<this.stateStorers.length;a++)b=this.stateStorers[a](b);this.state=b;return this.state;},doSync:function(a){if(this.syncPaused)return;if(a){this._doSync();}else if(!this._syncTimeout)this._syncTimeout=this._doSync.bind(this).defer();},_doSync:function(){clearTimeout(this._syncTimeout);this._syncTimeout=null;this.stateUpdateTime=new Date().getTime();presenceCookieManager.store();this._load(this.state);},pauseSync:function(){this.syncPaused++;},resumeSync:function(){this.syncPaused--;this.doSync();},handleMsg:function(a,b){this._handleMsg.bind(this,a,b).defer();},_handleMsg:function(a,b){if(typeof b=='string'){if(b=='shutdown'){this.connectionShutdown();}else if(b=='restart')if(this.isShutdown)this.restart();return;}if(this.isShutdown)return false;if(!b.type)return;Arbiter.inform(PresenceMessage.getArbiterMessageType(b.type),{sender:this,channel:a,obj:b});},checkRebuild:function(){if(this.isShutdown&&!this.isPermaShutdown)channelManager.rebuild(ChannelRebuildReasons.PageTransitionRetry);},getErrorDescription:function(a){var c=a.getError();var b=a.getErrorDescription();if(!b)b=_tx("An error occurred.");if(c==1357001)b=_tx("Your session has timed out. Please log in.");return b;},checkLoginError:function(a){var b=a.getError();if(b==1357001||b==1357004||b==1348009){this.loginShutdown();return true;}return false;},checkMaintenanceError:function(a){if(a.getError()==1356007){this.maintenanceShutdown();return true;}return false;},permaShutdown:function(){this.isPermaShutdown=true;var a=_tx("Facebook {Chat} is experiencing technical problems.",{Chat:_tx("Chat")});this.shutdown(false,a,"perma_shutdown");},loginShutdown:function(){var a=_tx("Your session has timed out. Please log in.");this.shutdown(false,a,"login_shutdown");},connectionShutdown:function(b){var a=_tx("Could not connect to Facebook {Chat} at this time.",{Chat:_tx("Chat")});this.shutdown(b,a,"connection_shutdown");},maintenanceShutdown:function(){var a=_tx("Facebook {Chat} is down for maintenance at this time.",{Chat:_tx("Chat")});this.shutdown(false,a,"maintenance_shutdown");channelManager.stop();},versionShutdown:function(){var a=_tx("Please refresh the page to get the latest version of Facebook {Chat}.",{Chat:_tx("Chat")});this.shutdown(false,a,"version_shutdown");channelManager.stop();},shutdown:function(d,c,a){this.isRestarting=false;this.isShuttingDown=true;var b=new Date().getTime();this.shutdownTime=b;if(!d){this._shutdown(c,0,a);}else setTimeout(this._shutdown.bind(this,c,b,a),this.shutdownDelay,false);},_shutdown:function(b,c,a){if(!this.isShuttingDown&&c==this.shutdownTime)return;if(c&&this.isShutdown)return;if(typeof b!='string'||!b)b=_tx("Facebook {Chat} is experiencing technical problems.",{Chat:_tx("Chat")});if(typeof a!='string'||!a)a="undefined";this.warn("presence:displaying_shutdown:"+a);if(this.isShutdown)return;this.logError("13001:shutdown:presence:"+a);this.isShutdown=true;Arbiter.inform(PresenceMessage.SHUTDOWN,{sender:this,reason:b});},restart:function(a){this.isShuttingDown=false;this.isRestarting=true;if(!a){this._restart(0);}else this._restart.bind(this,this.shutdownTime).defer(this.restartDelay,false);},_restart:function(a){if(!this.isRestarting||(a&&a!=this.shutdownTime))return;this.debug("presence: restarting");this.isShutdown=false;this.load();Arbiter.inform(PresenceMessage.RESTARTED,{sender:this});},start:function(){Arbiter.inform(PresenceMessage.STARTED,{sender:this});},registerStateStorer:function(a){this.stateStorers.push(a);},registerStateLoader:function(a){this.stateLoaders.push(a);},hasUserCookie:function(a){var b=this.user==getCookie('c_user');if(!b&&a)this.permaShutdown();return b;}};
function Presence(g,c,b,a,e,d,f){this.parent.construct(this,g,c,b,a,e,d,f);}Class.extend(Presence,'TinyPresence');Presence.prototype={minWidth:100,minHeight:100,defWidth:900,defHeight:650,defX:30,defY:30,_init:function(b){if(!b){this.holder=$('fbDockChat');}else this.holder=document.body;this.parent._init(b);this.popoutWidth=this.defWidth;this.popoutHeight=this.defHeight;this.popoutClicked=false;this.popinClicked=false;if(this.inPopoutWindow){Util.fallbackErrorHandler=null;onbeforeunloadRegister(this.popin.bind(this,false));onunloadRegister(this.popin.bind(this,false));}if(this.inPopoutWindow){Event.listen(window,'resize',this._windowOnResize.bind(this));Event.listen(window,'keypress',this._documentKeyPress.bind(this));}var c=ua.safari();this.isSafari2=(c&&c<500);var a=ua.firefox();this.isFF2=(a&&a<3);this.isWindows=ua.windows();if(this.inPopoutWindow){this._windowOnResize.bind(this).defer();setTimeout(this._windowOnResize.bind(this),3000,false);}},_load:function(a){this.parent._load(a);if(this.poppedOut){if(!this.inPopoutWindow)CSS.addClass(this.holder,'popped_out');}else{if(this.inPopoutWindow)if(this.loaded)if(!this.popinClicked)window.close();CSS.removeClass(this.holder,'popped_out');}if(this.inPopoutWindow){this._handleResize.bind(this,0,0).defer();setTimeout(this._handleResize.bind(this,0,0),100,false);}this.parent._loaded();},_loaded:bagofholding,_handleMsg:function(a,b){this.parent._handleMsg(a,b);if(typeof b=='string'||!b.type)return;if(this.isShutdown)return false;if(b.type=='app_msg')if(b.event_name=='beep_event'){if(!this.inPopoutWindow)Bootloader.loadComponents('beeper',function(){Beeper.ensureInitialized();LiveMessageReceiver.route(b);});}else LiveMessageReceiver.route(b);},popout:function(){if(this.inPopoutWindow||this.poppedOut){this.popin(true);return;}if(this.popoutClicked)return;this.popoutClicked=true;var a=window.open(this.popoutURL,"fbChatWindow","status=0,toolbar=0,location=0,menubar=0,"+"directories=0,resizable=1,scrollbars=0,"+"width="+this.popoutWidth+",height="+this.popoutHeight+","+"left="+this.defX+",top="+this.defY);CSS.removeClass(this.holder,'popped_out');this.poppedOut=true;this.justPoppedOut=true;this.popoutTime=(new Date()).getTime();this.doSync();this.popoutClicked=false;},popin:function(a){if(typeof a=='undefined')a=true;if(this.inPopoutWindow){if(this.popinClicked)return;this.popinClicked=true;}this.poppedOut=false;this.doSync();if(this.inPopoutWindow&&a)window.close();},_windowOnResize:function(){if(!this.inPopoutWindow)return;this.contentResized={};var a=Vector2.getViewportDimensions();this._handleResize(a.x-this.virtPopoutWidth,a.y-this.virtPopoutHeight);if(this.inPopoutWindow)this.popoutHeight=a.y;},_handleResize:function(b,c){var a=this.loaded?100:10;if(this.handleResizeTimer)clearTimeout(this.handleResizeTimer);this.handleResizeTimer=setTimeout(function(){this.virtPopoutWidth+=b;this.virtPopoutHeight+=c;this.popoutWidth=Math.max(this.virtPopoutWidth,this.minWidth);this.popoutHeight=Math.max(this.virtPopoutHeight,this.minHeight);Arbiter.inform(PresenceMessage.WINDOW_RESIZED,{sender:this});},a,false);},_documentKeyPress:function(a){if(!this.inPopoutWindow)return;a=$E(a);var b=a?a.keyCode:-1;if(b==KEYS.ESC)Event.kill(a);},renderLink:function(b,c,a){return '<a href="'+b+'"'+(this.inPopoutWindow?' target="_blank"':'')+(a?a:'')+'>'+c+'</a>';},_shutdown:function(c,d,b){this.parent._shutdown(c,d,b);if((!this.isShuttingDown&&d===this.shutdownTime)||(d&&this.isShutdown))return;if(!this.inPopoutWindow){if(Chat.isOnline())CSS.addClass(this.holder,'presence_error');var a=$('fbChatErrorNub');TooltipLink.setTooltipText(DOM.find(a,'a.fbNubButton'),c);}else{if(this.shutdownErrorDialog)this.shutdownErrorDialog.hide();this.shutdownErrorDialog=ErrorDialog.show(_tx("Facebook Chat Error"),c);}},_restart:function(a){this.parent._restart(a);if(!this.isRestarting||(a&&a!=this.shutdownTime))return;if(!this.inPopoutWindow){CSS.removeClass(this.holder,'presence_error');}else if(this.shutdownErrorDialog)this.shutdownErrorDialog.hide();},isOnline:function(){return this.state&&this.state.vis;}};function getFirstName(c){var d=c.split(" ");var b=d[0];var a=b.length;if(typeof d[1]!='undefined'&&(a==1||(a==2&&b.indexOf('.')!=-1)||(a==3&&b.toLowerCase()=='the')))b+=' '+d[1];return b;}
function LiveMessageReceiver(a){this.eventName=a;this.subs=null;this.handler=bagofholding;this.shutdownHandler=null;this.restartHandler=null;this.registered=false;this.appId=1;}LiveMessageReceiver.prototype.setAppId=function(a){this.appId=a;return this;};LiveMessageReceiver.prototype.setHandler=function(a){this.handler=a;this._dirty();return this;};LiveMessageReceiver.prototype.setRestartHandler=function(a){this.restartHandler=a.shield();this._dirty();return this;};LiveMessageReceiver.prototype.setShutdownHandler=function(a){this.shutdownHandler=a.shield();this._dirty();return this;};LiveMessageReceiver.prototype._dirty=function(){if(this.registered){this.unregister();this.register();}};LiveMessageReceiver.prototype.register=function(){var b=function(d,c){return this.handler(c);}.bind(this);var a=PresenceMessage.getAppMessageType(this.appId,this.eventName);this.subs={};this.subs.main=Arbiter.subscribe(a,b);if(this.shutdownHandler)this.subs.shut=Arbiter.subscribe(PresenceMessage.SHUTDOWN,this.shutdownHandler);if(this.restartHandler)this.subs.restart=Arbiter.subscribe(PresenceMessage.RESTARTED,this.restartHandler);this.registered=true;return this;};LiveMessageReceiver.prototype.unregister=function(){if(!this.subs)return this;for(var a in this.subs)if(this.subs[a])Arbiter.unsubscribe(this.subs[a]);this.subs=null;this.registered=false;return this;};LiveMessageReceiver.route=function(b){var a=function(c){var d=PresenceMessage.getAppMessageType(b.app_id,b.event_name);Arbiter.inform(d,c,Arbiter.BEHAVIOR_PERSISTENT);};if(b.hasCapture){new AsyncRequest().setHandler(function(c){a(c.getPayload());}).setAllowCrossPageTransition(true).handleResponse(b.response);}else a(b.response);};
function VideoEvents(){}Function.mixin(VideoEvents,'Arbiter',{ACTIVATING:'videochat/activating',LOGGING_IN:'videochat/logging_in',GETTING_TOKEN:'videochat/getting_token',CONNECTING:'videochat/connecting',CALL_INCOMING:'videochat/call_incoming',CALL_CONNECTED:'videochat/call_connected',GOT_CALLEE:'videochat/got_callee',CALL_HANDLED:'videochat/call_handled',CALLEE_ANSWERING:'videochat/callee_answering',FATAL_ERROR:'videochat/fatal_error',CALL_IN_PROGRESS:'videochat/call_in_progress',NOT_AVAILABLE:'videochat/not_available',SERVER_ERROR:'videochat/server_error',ACTIVATE_FAILED:'videochat/activate_failed',FATAL_PLUGIN_ERROR:'videochat/plugin_fatality',SILENT_PLUGIN_ERROR:'videochat/plugin_silent_fatality',START_CALL_UI:'videochat/start_call_ui',START_CALL:'videochat/start_call',ANSWER_CALL:'videochat/answer_call',IGNORE_CALL:'videochat/ignore_call',CANCEL_CALL:'videochat/cancel_call',INSTALL_COMPLETED:'videochat/install_completed',log:function(a){window.console&&console.log&&console.log(a);},warn:function(a){window.console&&console.warn&&console.warn(a);},error:function(a){window.console&&console.error&&console.error(a);}});
function ChatOptions(b,a){this.visibility=!!b;this.settings=a;}ChatOptions.prototype={load:function(){presence.registerStateStorer(this._storeState.bind(this));presence.registerStateLoader(this._loadState.bind(this));Arbiter.subscribe(channel.ON_CONFIG,function(b,a){this.setVisibility(a.getConfig('visibility'));}.bind(this));Arbiter.subscribe(PresenceMessage.getArbiterMessageType('visibility'),function(a,b){var c=b.obj;if(c.window_id===presence.windowID)return;this.setVisibility(c.visibility);}.bind(this));Arbiter.subscribe(PresenceMessage.getArbiterMessageType('setting'),function(a,b){var c=b.obj;if(c.window_id===presence.windowID)return;this.setSetting(c.setting,!!c.value);}.bind(this));Arbiter.inform('chat-options/initialized',this,Arbiter.BEHAVIOR_PERSISTENT);},_storeState:function(a){a.vis=this.visibility?1:0;a.bls=this.getSetting('sticky_buddylist');a.blc=this.getSetting('compact_buddylist');a.snd=this.getSetting('sound');return a;},_loadState:function(a){if(a.vis!=this.visibility)this.setVisibility(!!a.vis);this.setSetting('sticky_buddylist',a.bls);this.setSetting('compact_buddylist',a.blc);this.setSetting('sound',a.snd);},setVisibility:function(a){if(a===this.visibility)return;this.visibility=a;if(!ChatConfig.get('always_connect'))if(a){channelManager.isActionRequest=true;channelManager.rebuild(ChannelRebuildReasons.UIRestart);}else channelManager.setReady(false);Arbiter.inform('chat/visibility-changed',{sender:this});},_onVisibilityResponse:function(a){if(a)this.setVisibility(a);presence.doSync();if(presence.poppedOut)presence.popout();},_onVisibilityError:function(b){this.setVisibility(b);var a=_tx("Chat");Chat.enterErrorMode(_tx("Unable to save your {Chat} settings",{Chat:a}));},toggleVisibility:function(){this.sendVisibility(!this.visibility);},sendVisibility:function(b){if(this.visibility==b)return;var a={visibility:b,notify_ids:Chat.getActiveFriendChats()};if(!b)this.setVisibility(b);new AsyncRequest(chatDisplay.visibilityURL).setHandler(this._onVisibilityResponse.shield(this,b)).setErrorHandler(this._onVisibilityError.shield(this,!b)).setData(a).setAllowCrossPageTransition(true).send();Arbiter.inform(b?'chat/connect':'chat/disconnect');},getSetting:function(a){return this.settings[a];},setSetting:function(a,b){if(this.getSetting(a)==b)return;this.settings[a]=b;Arbiter.inform('chat/option-changed',{name:a,value:b});}};