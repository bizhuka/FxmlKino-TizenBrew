/// <reference path="../../index.d.ts" />

var loader_platform=window.loader_platform||'browser';
tFlp='localAndroid'; 
ipS=2117;
token='213ee2b9a052664487e22145848f8913c97666c0';
ipG='local';
ipCountry='local';
ipC='';

var ua=navigator.userAgent.toLowerCase(),booting=true,JtvServ=null,JtvC={},JtvE={},JtvEF={},JtvCF={};
if(!window.console) console={};
if(!console.log) console.log=function(a){if(ua.match(/maple/i)) alert(a);};
if(!console.trace){console.trace=function(a){};}

var translations = {
	en: {
		internetError: "Check your internet connection or network settings (DNS) and try again.",
		menu: "Menu",
		continueLoading: "Continue Loading",
		selectSource: "Select Source",
		goToMSXStore: "Go to MSX APPFXML STORE",
		goToMSXStoreMirror: "Go to MSX APPFXML STORE (Mirror)",
		openFxmlPortal: "FXML Movies (Rezka, Kinogo)",
		clearData: "Clear Data",
		deleteAll: "Delete all",
		confirmDeleteItem: "Delete this item?",
		clearAllData: "Clear All Data (except ID)",
		confirm: "Confirm",
		cancel: "Cancel",
		clearDataTitle: "Clear Data",
		clearDataQuestion: "Are you sure you want to clear data?",
		clearAllDataTitle: "Clear All Data",
		clearAllDataQuestion: "Are you sure you want to clear ALL data?",
		itemsToDelete: "Items to delete:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Total size:",
		protected: "Protected:",
		protectedIDSettings: "ID, settings, bookmarks",
		protectedIDOnly: "ID only",
		thisWillDelete: "This will delete everything except ID!",
		items: "items",
		selectSource: "Select Source",
		back: "Back",
		loadingFromSource: "Loading from selected source",
		loadFromSource: "Load from source",
		loading: "Loading...",
		errorFailedToLoad: "ERROR: Failed to load from source",
		pressUpUpForMenu: "Press UP+UP for menu",
		allSourcesUnavailable: "All sources unavailable, retrying...",
		skippingToNextSource: "Skipping to next source...",
		initializingScriptLoader: "Initializing script loader...",
		loadingPaused: "Loading paused",
		waiting: "waiting...",
		noDataToClear: "No data to clear",
		dataClearedRestarting: "Data cleared. Restarting...",
		allDataClearedRestarting: "All data cleared except ID. Restarting..."
	},
	ru: {
		internetError: "Проверьте подключение к интернету или настройки сети (DNS) и попробуйте снова.",
		menu: "Меню",
		continueLoading: "Продолжить загрузку",
		selectSource: "Выбрать источник",
		goToMSXStore: "Перейти в MSX APPFXML STORE",
		goToMSXStoreMirror: "Перейти в MSX APPFXML STORE (Зеркало)",
		openFxmlPortal: "FXML Кино (Rezka, Kinogo)",
		clearData: "Очистить данные",
		deleteAll: "Удалить все",
		confirmDeleteItem: "Удалить этот элемент?",
		clearAllData: "Очистить все данные (кроме ID)",
		confirm: "Подтвердить",
		cancel: "Отмена",
		clearDataTitle: "Очистить данные",
		clearDataQuestion: "Вы уверены, что хотите очистить данные?",
		clearAllDataTitle: "Очистить все данные",
		clearAllDataQuestion: "Вы уверены, что хотите очистить ВСЕ данные?",
		itemsToDelete: "Элементов для удаления:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Общий размер:",
		protected: "Защищено:",
		protectedIDSettings: "ID, настройки, закладки",
		protectedIDOnly: "Только ID",
		thisWillDelete: "Это удалит всё, кроме ID!",
		items: "элементов",
		selectSource: "Выбрать источник",
		back: "Назад",
		loadingFromSource: "Загрузка из выбранного источника",
		loadFromSource: "Загрузить из источника",
		loading: "Загрузка...",
		errorFailedToLoad: "ОШИБКА: Не удалось загрузить из источника",
		pressUpUpForMenu: "Нажмите дважды вверх для вызова меню",
		allSourcesUnavailable: "Все источники недоступны, повторная попытка...",
		skippingToNextSource: "Переход к следующему источнику...",
		initializingScriptLoader: "Инициализация загрузчика скриптов...",
		loadingPaused: "Загрузка приостановлена",
		waiting: "ожидание...",
		noDataToClear: "Нет данных для очистки",
		dataClearedRestarting: "Данные очищены. Перезапуск...",
		allDataClearedRestarting: "Все данные очищены, кроме ID. Перезапуск..."
	},
	uk: {
		internetError: "Перевірте підключення до інтернету або налаштування мережі (DNS) і спробуйте знову.",
		menu: "Меню",
		continueLoading: "Продовжити завантаження",
		selectSource: "Вибрати джерело",
		goToMSXStore: "Перейти до MSX APPFXML STORE",
		goToMSXStoreMirror: "Перейти до MSX APPFXML STORE (Дзеркало)",
		openFxmlPortal: "FXML Кіно (Rezka, Kinogo)",
		clearData: "Очистити дані",
		deleteAll: "Видалити все",
		confirmDeleteItem: "Видалити цей елемент?",
		clearAllData: "Очистити всі дані (крім ID)",
		confirm: "Підтвердити",
		cancel: "Скасувати",
		clearDataTitle: "Очистити дані",
		clearDataQuestion: "Ви впевнені, що хочете очистити дані?",
		clearAllDataTitle: "Очистити всі дані",
		clearAllDataQuestion: "Ви впевнені, що хочете очистити ВСІ дані?",
		itemsToDelete: "Елементів для видалення:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Загальний розмір:",
		protected: "Захищено:",
		protectedIDSettings: "ID, налаштування, закладки",
		protectedIDOnly: "Тільки ID",
		thisWillDelete: "Це видалить все, крім ID!",
		items: "елементів",
		selectSource: "Вибрати джерело",
		back: "Назад",
		loadingFromSource: "Завантаження з вибраного джерела",
		loadFromSource: "Завантаження з джерела",
		loading: "Завантаження...",
		errorFailedToLoad: "ПОМИЛКА: Не вдалося завантажити з джерела",
		pressUpUpForMenu: "Натисніть двічі вгору для виклику меню",
		allSourcesUnavailable: "Всі джерела недоступні, повторна спроба...",
		skippingToNextSource: "Перехід до наступного джерела...",
		initializingScriptLoader: "Ініціалізація завантажувача скриптів...",
		loadingPaused: "Завантаження призупинено",
		waiting: "очікування...",
		noDataToClear: "Немає даних для очищення",
		dataClearedRestarting: "Дані очищено. Перезапуск...",
		allDataClearedRestarting: "Всі дані очищено, крім ID. Перезапуск..."
	}
};

// Определение языка браузера (с поддержкой старых браузеров)
function getBrowserLanguage() {
	var lang = 'en'; // По умолчанию английский
	
	try {
		// navigator.language поддерживается с 2011+ (Chrome, Firefox, Safari, Edge)
		// navigator.userLanguage для старых IE (с 1990-х)
		// navigator.browserLanguage для некоторых старых браузеров
		if (typeof navigator !== 'undefined') {
			lang = navigator.language 
				|| navigator.userLanguage 
				|| navigator.browserLanguage 
				|| navigator.systemLanguage 
				|| 'en';
		}
	} catch (e) {
		// Если navigator недоступен, используем английский
		console.log('getBrowserLanguage: navigator not available, using default');
	}
	
	// Приводим к нижнему регистру для сравнения
	if (typeof lang === 'string') {
		lang = lang.toLowerCase();
	} else {
		lang = 'en';
	}
	
	// Проверяем поддержку языков
	if (lang.indexOf('uk') === 0 || lang.indexOf('uk-') === 0) {
		return 'uk';
	} else if (lang.indexOf('ru') === 0 || lang.indexOf('ru-') === 0) {
		return 'ru';
	} else {
		return 'en'; // По умолчанию английский
	}
}

// Установка текущего языка
var currentLang = getBrowserLanguage();
window.appLanguage = currentLang;

// Функция для получения перевода (глобальная)
window.t = function(key) {
	return translations[currentLang] && translations[currentLang][key] 
		? translations[currentLang][key] 
		: (translations['en'][key] || key);
};
var t = window.t; // Локальная ссылка для использования в этом файле

function showInternetError() {
	console.log("showInternetError: called");
	if (typeof ScriptLoader !== "undefined" && ScriptLoader.isBootstrapPending && ScriptLoader.isBootstrapPending()) {
		if (ScriptLoader.notifyChildLoadFailed("internetError")) {
			return;
		}
	}
	var msg = t("internetError");
	var statusEl = document.getElementById("startcmd");
	if (statusEl) {
		console.log("showInternetError: updating statusEl");
		statusEl.innerHTML = msg;
		statusEl.style.color = "#d32f2f";
		statusEl.style.fontWeight = "bold";
		statusEl.style.backgroundColor = "#ffebee";
		statusEl.setAttribute("data-internet-error", "true");
	} else {
		console.log("showInternetError: statusEl not found");
	}
	window.internetErrorShown = true;
	if (typeof loadstartinfo === "function") {
		console.log("showInternetError: calling loadstartinfo");
		loadstartinfo(msg);
	} else {
		console.log("showInternetError: loadstartinfo function not found");
	}
}

var librarys={
	err:"",
	allFailed: false,
	checkInternetTimeout: null,
	notifyBootstrapFailed:function(reason){
		if (typeof ScriptLoader !== "undefined" && ScriptLoader.notifyChildLoadFailed) {
			var code = (reason === "js") ? "allFailed" : "libFailed";
			return ScriptLoader.notifyChildLoadFailed(code, reason);
		}
		return false;
	},
	reportLibError:function(l, code){
		if (typeof ScriptLoader !== "undefined" && ScriptLoader.reportLoadingError) {
			var idx = (l.num || 0) + 1;
			ScriptLoader.reportLoadingError(code || "libFailed", l.name + " (" + idx + "/" + l.url.length + ")");
		}
	},
		getLibTimeoutMs:function(){
		if (typeof ScriptLoader !== "undefined" && ScriptLoader.isManualMode && ScriptLoader.isManualMode()) {
			return 0;
		}
		if (window.__forkLocalBootstrap) {
			return 0;
		}
		return 4000;
	},
	isFullBootstrapJsUrl:function(url){
		if (!url || typeof url !== "string") return false;
		return /appinfodl@main\/app\.js/i.test(url)
			|| /\/app_\d+\.js/i.test(url)
			|| /load\.js\.php/i.test(url);
	},
	abortLibScript:function(l){
		if (!l) return;
		clearTimeout(l.tout);
		l.tout = null;
		l.loadGen = (l.loadGen || 0) + 1;
		if (l.activeScript) {
			try {
				l.activeScript.onload = null;
				l.activeScript.onerror = null;
				l.activeScript.src = "about:blank";
				if (l.activeScript.parentNode) {
					l.activeScript.parentNode.removeChild(l.activeScript);
				}
			} catch(e) {}
			l.activeScript = null;
		}
		if (!l.name) return;
		var head = document.head || document.getElementsByTagName("head")[0];
		if (!head) return;
		var prefix = l.name;
		var nodes = head.getElementsByTagName("script");
		for (var i = nodes.length - 1; i >= 0; i--) {
			var node = nodes[i];
			if (!node.id || node.id.indexOf(prefix) !== 0) continue;
			try {
				node.onload = null;
				node.onerror = null;
				node.src = "about:blank";
				if (node.parentNode) node.parentNode.removeChild(node);
			} catch(e) {}
		}
	},
	abortJsScriptsExcept:function(keepNum){
		var head = document.head || document.getElementsByTagName("head")[0];
		if (!head) return;
		var keepId = "js" + keepNum;
		var nodes = head.getElementsByTagName("script");
		for (var i = nodes.length - 1; i >= 0; i--) {
			var node = nodes[i];
			if (!node.id || node.id.indexOf("js") !== 0 || node.id === keepId) continue;
			try {
				node.onload = null;
				node.onerror = null;
				node.src = "about:blank";
				if (node.parentNode) node.parentNode.removeChild(node);
			} catch(e) {}
		}
	},
	versions:function(){
		return {old:2101,
		oldstable:2209,
		stable:2306,
		beta:2512};
	},
	getver:function(){
		var n="ver",ver="";
		try{				
			if(window.localStorage&&localStorage.getItem) ver=localStorage.getItem(n);
			if(!ver){
				var matches = document.cookie.match(new RegExp("(?:^|; )" + n.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
				ver= matches ? decodeURIComponent(matches[1]) : "";
			}	
			if(!ver){
				if(ua.match(/maple/i)&&window.FileSystem&&window.curWidget){				
					var fileSystemObj = new FileSystem();
					if(!fileSystemObj.isValidCommonPath(curWidget.id)) fileSystemObj.createCommonDir(curWidget.id);					
					var fileObj = fileSystemObj.openCommonFile(curWidget.id + '/'+n,'r');
					if(fileObj!=null){
						ver=fileObj.readAll();
						fileSystemObj.closeCommonFile(fileObj); 
					}
				}
			}		
		}			
		catch(e){}	
		return (ver||"");	
	},
	libs:function(){
		
		return [
		{name:"jquery",important:0,url:["library/jquery-1.12.4.min.js","http://browser.appfxml.com/library/jquery-1.12.4.min.js","http://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js","http://komivp.github.appfxml.com/library/jquery-1.12.4.min.js"]},
		{name:"json",important:1,url:["library/json.js","http://browser.appfxml.com/library/json.js","http://komivp.github.appfxml.com/library/json.js","https://cdnjs.cloudflare.com/ajax/libs/json2/20160511/json2.min.js"]},
		{name:"underscore",important:1,require:"jquery",url:["library/underscore_1.8.3.js","http://browser.appfxml.com/library/underscore_1.8.3.js","http://komivp.github.appfxml.com/library/underscore_1.8.3.js","https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"]},
		{name:"md5",important:1,url:["library/md5.js","http://browser.appfxml.com/library/md5.js","http://komivp.github.appfxml.com/library/md5.js","https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.19.0/js/md5.min.js"]},
		{name:"langs",important:0,url:["library/langs.js","http://browser.appfxml.com/library/langs.js","http://komivp.github.appfxml.com/library/langs.js"]},
		{name:"guide",important:0,url:["library/jtv.js","http://exec.remotecurl.appfxml.com/curl/jtv.js","http://85.17.30.89/common/jtv.js?v=6","http://46.36.220.208/common/jtv.js?v=6"]},
		{name:"webOS",important:0,url:["library/webOS.js","http://browser.appfxml.com/library/webOS.js","http://komivp.github.appfxml.com/library/webOS.js"]},
		{name:"jw",important:0,url:["library/jwplayer_8.20.1.js","http://browser.appfxml.com/library/jwplayer_8.20.1.js","http://komivp.github.appfxml.com/library/jwplayer_8.20.1.js"]},	
		{name:"js",require:"jquery",important:0,url:["http://browser.appfxml.com/jsobf/beta.js.php?ver="+this.getver(),"http://browser2.appfxml.com/jsobf/beta.js.php?ver="+this.getver(),"http://komivp.github.appfxml.com/app_"+(this.getver()||this.versions().stable)+".js","http://browser2.appinfo.su/jsobf/beta.js.php?ver="+this.getver()]}		
		];
	},
	exis:function(l){
		var n=l.name||l;
		switch(n){
			case "jquery":
				return window.$ && window.jQuery &&  window.jQuery().jquery && window.jQuery().jquery.indexOf("1.12")>=0;
			break;
			case "js":
				return window.Player&&window.breakScreen&&window.keyHandler;
			break;
			case "json":
				if(!window.JSON) JSON={};
				return window.JSON && window.JSON.parse; 
			break;
			case "underscore":
				return window._ && window._.random && window._.each; 
			break;
			case "langs":
				return window._lang && window._lang.en; 
			break;
			case "webOS":
				return !ua.match(/webos/) || !window.webOS; 
			break;
			case "jw":
				var t=document.createElement("video");
				if(t && t.canPlayType && t.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')) return window.jwplayer;
				else return 1; 
			break;
			case "guide":
				return window.JtvServ; 
			break;
			case "md5":
				return window.md5; 
			break;
			
		}
		return 0;
	},
	require:function(l){
		var c=this;
		if(l.require){
			if(!c.exis({name:l.require})){
				console.log("wait require for "+l.name);
				setTimeout(function(){
					console.log("refresh state require "+l.require);
					c.addlib(l);
				},1500);
				return 0;
			}
			else if(l.require=="jquery"){
				console.log("Version jquery "+jQuery().jquery);				
			}
		}
		return 1;
	},
	check:function(l){
		var c=this;
		console.log("check load "+l.name+" "+l.num);
		clearTimeout(l.tout);
		l.load=1;
		if(!c.exis(l)){
			console.log("err load "+l.name+" "+l.num);
			c.reportLibError(l, "libFailed");
			var nextIndex = (l.num || 0) + 1;
			if(l.url[nextIndex] && l.name!="jw") {
				l.err++;
				c.abortLibScript(l);
				l.num = nextIndex;
				c.addlib(l);
			}
			else {
				l.err++;
				console.log("All attempts failed for "+l.name+", currentNum: "+(l.num || 0)+", url.length: "+l.url.length+", nextIndex: "+nextIndex);
				if(l.name === "js"){
					console.log("Calling checkAllFailed for js library - all URLs attempted");
					console.log("Passing jsLib object with num: "+(l.num || 0)+", url.length: "+l.url.length+", nextIndex: "+nextIndex);
					c.checkAllFailed(l, nextIndex);
				} else if (l.important) {
					c.allFailed = true;
					if (!c.notifyBootstrapFailed(l.name)) {
						showInternetError();
					}
				}
			}
		}
		else {
			l.ok=1;
			if(l.name === "js"){
				c.allFailed = false;
				c.abortJsScriptsExcept(l.num || 0);
				if (c.checkInternetTimeout) {
					clearTimeout(c.checkInternetTimeout);
					c.checkInternetTimeout = null;
				}
			}
		}
	},
	checkAllFailed:function(jsLib, nextIndex){
		var c=this;
		console.log("checkAllFailed: starting check");
		
		if(!jsLib){
			console.log("checkAllFailed: jsLib parameter not provided, searching...");
			for(var i=0;i<c.libs().length;i++){
				var l=c.libs()[i];
				if(l.name === "js"){
					jsLib = l;
					break;
				}
			}
		}
		
		if(!jsLib){
			console.log("checkAllFailed: js library not found");
			return;
		}
		
		console.log("checkAllFailed: jsLib received, num: "+(jsLib.num || 0)+", url.length: "+jsLib.url.length+", nextIndex: "+(nextIndex !== undefined ? nextIndex : "not provided"));
		
		if(c.exis(jsLib)){
			console.log("checkAllFailed: js library exists, resetting error flag");
			c.allFailed = false;
			if (c.checkInternetTimeout) {
				clearTimeout(c.checkInternetTimeout);
				c.checkInternetTimeout = null;
			}
			return;
		}
		
		console.log("checkAllFailed: js library does not exist");
		
		var hasRemoteUrls = false;
		var currentNum = jsLib.num || 0;
		
		for(var j=0;j<jsLib.url.length;j++){
			var url = jsLib.url[j];
			if(url && (url.indexOf('http://') === 0 || url.indexOf('https://') === 0)){
				hasRemoteUrls = true;
				console.log("checkAllFailed: found remote URL at index "+j+": "+url);
				break;
			}
		}
		
		console.log("checkAllFailed: hasRemoteUrls: "+hasRemoteUrls);
		
		if(nextIndex === undefined){
			nextIndex = currentNum + 1;
		}
		
		var allUrlsTried = nextIndex >= jsLib.url.length;
		
		console.log("checkAllFailed: currentNum: "+currentNum+", nextIndex: "+nextIndex+", url.length: "+jsLib.url.length+", allUrlsTried: "+allUrlsTried);
		
		if(allUrlsTried && hasRemoteUrls && !c.exis(jsLib) && !c.allFailed){
			console.log("checkAllFailed: All URLs tried and failed, showing internet error");
			c.allFailed = true;
			if (!c.notifyBootstrapFailed("js")) {
				showInternetError();
			}
		} else {
			console.log("checkAllFailed: Not showing error - allUrlsTried: "+allUrlsTried+", hasRemoteUrls: "+hasRemoteUrls+", libraryExists: "+c.exis(jsLib)+", allFailed: "+c.allFailed);
		}
	},
	upconv:function(link) {
		if (!link || typeof link !== "string") {
			return link; 
		}
		try {
			var scheme = window.location.protocol; 
			var host = window.location.host;
			if(scheme.indexOf("http")===0 && host.indexOf("browser")===0){
				var old_http = "http://browser.appfxml.com";
				var new_url = scheme + "//" + host;
				var result = link.replace(old_http, new_url);			
				return result;
			}
		} catch (e) {}
		return link;
	},
	addlib:function(l){
		var c=this;
		if(c.exis(l)){
			console.log("exists "+l.name);
			return;
		}
		if(!c.require(l)){
			return;
		}
		
		l["num"] = l.num||0;
		l["err"] = l.err||0;
		
		if (l.name === "js") {
			var candidateUrl = c.upconv(l.url[l.num]);
			while (candidateUrl && c.isFullBootstrapJsUrl(candidateUrl) && typeof is_vod !== "undefined") {
				console.log("skip nested full bootstrap js url: " + candidateUrl);
				l.num++;
				candidateUrl = l.url[l.num] ? c.upconv(l.url[l.num]) : null;
			}
			if (!l.url[l.num]) {
				c.check(l);
				return;
			}
			c.abortLibScript(l);
		} else if (l.num > 0 || l.err > 0) {
			c.abortLibScript(l);
		}
		
		console.log("start "+l.name+" "+l.num);
		if (typeof ScriptLoader !== "undefined" && ScriptLoader.notifyLibraryLoading) {
			ScriptLoader.notifyLibraryLoading(l);
		}
		l.loadGen = (l.loadGen || 0) + 1;
		var loadGen = l.loadGen;
		var script = document.createElement('script');
		script.id = l.name + l.num;
		script.type = 'text/javascript';
		script.async = false;
		script.src = c.upconv(l.url[l.num]);
		l.activeScript = script;
		
		script.onload = function(){
			if (loadGen !== l.loadGen || c.exis(l)) return;
			c.check(l);
		};
		script.onerror = function(){
			if (loadGen !== l.loadGen || c.exis(l)) return;
			c.check(l);
		};
		
		var head = document.head || document.getElementsByTagName("head")[0];
		head.appendChild(script);
		
		var timeoutMs = c.getLibTimeoutMs();
		if (timeoutMs > 0) {
			l.tout = setTimeout(function(){
				if (loadGen !== l.loadGen || c.exis(l)) return;
				console.log("timeout "+l.name+" "+l.num);
				c.reportLibError(l, "libTimeout");
				c.abortLibScript(l);
				l.num = (l.num || 0) + 1;
				if (typeof l.url[l.num] !== "undefined") {
					c.addlib(l);
				} else {
					l.num = Math.max(0, (l.num || 1) - 1);
					c.check(l);
				}
			}, timeoutMs);
		}
	},
	adds:function(){
		var c=this;
		if (window.__forkLibrarysStarted) {
			console.log("librarys.adds: already started, skip duplicate");
			return c;
		}
		window.__forkLibrarysStarted = true;
		for(var i=0;i<c.libs().length;i++){
			c.addlib(c.libs()[i]);
		}
		return c;
	},
	loaded:function(){
		var c=this,n=0,onlyload=0;
		c.err="";
		for(var i=0;i<c.libs().length;i++){
			var l=c.libs()[i];
			if(c.exis(l)) n++;
			else {
				console.log("non exists "+l.name);
				c.err+=l.name+" ";
				if(l.important){
					return 0;
				}
				else if(l.load) {
					onlyload=1;
					n++;
				}
			}
		}
		if(n==c.libs().length) {
			if(onlyload) return 2;
			else return 3;
		}
		else return 1;
	},
	capability:function(){
		var js="function tomflight_fail";
	}
};
if (window.__forkLibLoader) {
	window.__forkLibLoader.patch(librarys);
}
if (!window.__forkLibrarysStarted) {
	window.__forkLibrarysStarted = true;
	librarys.adds();
}
var tomflight_fail=function(){}
var is_vod=function(){}

// Функция для обновления текстов меню
function updateMenuTranslations() {
	// Обновляем заголовок и пункты только главного меню (#vapeMenu)
	var menuHeader = document.querySelector('#vapeMenu .vapeMenuHeader');
	if (menuHeader) {
		menuHeader.textContent = t('menu');
	}
	
	var menuItems = document.querySelectorAll('#vapeMenuItems .vapeMenuItem');
	menuItems.forEach(function(item) {
		var action = item.getAttribute('data-action');
		var textEl = item.querySelector('.vapeMenuItemText');
		if (textEl && action) {
			switch(action) {
				case 'continue':
					textEl.textContent = t('continueLoading');
					break;
				case 'selectSource':
					textEl.textContent = t('selectSource');
					break;
				case 'openMSX':
					textEl.textContent = t('goToMSXStore');
					break;
				case 'openMSXMirror':
					textEl.textContent = t('goToMSXStoreMirror');
					break;
				case 'openFxmlPortal':
					textEl.textContent = t('openFxmlPortal');
					break;
				case 'clearData':
					textEl.textContent = t('clearData');
					break;
			}
		}
	});
	
	var cancelBtn = document.getElementById('confirmDialogCancel');
	var confirmBtn = document.getElementById('confirmDialogConfirm');
	if (cancelBtn) {
		cancelBtn.textContent = t('cancel');
	}
	if (confirmBtn) {
		confirmBtn.textContent = t('confirm');
	}
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', updateMenuTranslations);
} else {
	updateMenuTranslations();
}

