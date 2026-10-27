var Ldata = [
	"http://browser.appfxml.com/jsobf/load.js.php?from=tizen&token=213ee2b9a052664487e22145848f8913c97666c0",
	"https://browser2.appinfo.su/jsobf/load.js.php?from=tizen&token=213ee2b9a052664487e22145848f8913c97666c0",
	"https://cdn.jsdelivr.net/gh/komivp/appinfodl@main/app.js",
	"http://browser.appinfo.su/jsobf/load.js.php?from=tizen&token=213ee2b9a052664487e22145848f8913c97666c0",
	"http://browser2.appinfo.su/jsobf/load.js.php?from=tizen&token=213ee2b9a052664487e22145848f8913c97666c0",
	"js/main.js"
];

// Fork engine inside the app: js/engine.js is the engine's GitHub copy (komivp/appinfodl,
// app_2610.js). With FORK_ENGINE_LOCAL the local loader js/main.js goes first: it loads the
// libraries from js/library/ and the engine from js/engine.js, the servers only as a fallback.
// Icons come from static/ anyway (version_local_files); search, parsers and the account stay online.
var FORK_ENGINE_LOCAL = true;
if (FORK_ENGINE_LOCAL) Ldata.unshift(Ldata.splice(Ldata.indexOf("js/main.js"), 1)[0]);

// The same app is built for Samsung Tizen (.wgt) and LG webOS (.ipk, tools/webos/build.mjs).
// webOS's web runtime provides PalmSystem / PalmServiceBridge; LG's own Fork app uses these values.
var FXML_ON_WEBOS = typeof window.PalmSystem !== 'undefined' || typeof window.PalmServiceBridge !== 'undefined';
var box_client = FXML_ON_WEBOS ? "webos" : "tizen";
var loader_platform = FXML_ON_WEBOS ? "lg_webos" : "samsung_tizen";
// LG device ID / model, read on webOS by startWebosService(); the engine reads these globals.
var glg_uid = "", glg_model = "";
var version_local_files = 260415;
var version_local_js = 1;
// Fork engine version the remote loader expects; FxmlKino's own version is FXMLKINO_VERSION
// (same as config.xml).
var app_version = "1.1.1";
var FXMLKINO_VERSION = "1.2.6";

// The Tizen emulator can't run web services (see AGENTS.md).
function isEmulator() {
	try { return tizen.systeminfo.getCapability('http://tizen.org/system/model_name') === 'Emulator'; }
	catch (e) { return false; }
}
var FXML_ON_EMULATOR = isEmulator();

// Running as a TizenBrew module: TizenBrew serves this page from its local server
// (http://127.0.0.1:8081/module/<module>/index.html) and starts the module's serviceFile
// (service/index.js) itself, so there is no FxmlService app to launch here.
var FXML_IN_TIZENBREW = location.protocol === 'http:' && location.port === '8081' && location.pathname.indexOf('/module/') === 0;

// FXML portal opened on start and from the loader menu. It is served by the app's own web
// service (service/index.js, built from fxml-parser), which runs on the TV: the TV fetches the
// movie sites itself, no PC needed. In the emulator it is the parser on the PC instead
// (fxml-parser `npm start`): the emulator reaches the PC at 10.0.2.2.
// 8788 under TizenBrew: the module's service uses its own port (fxml-parser/tv/service.js).
var FXML_SERVICE_PORT = FXML_IN_TIZENBREW ? 8788 : 8787;
var FXML_PC_PARSER_URL = "http://10.0.2.2:3000/";
var FXML_PORTAL_URL = FXML_ON_EMULATOR ? FXML_PC_PARSER_URL : "http://127.0.0.1:" + FXML_SERVICE_PORT + "/";
// Open the portal on every start (set to false to start on Fork's own start page).
var FXML_PORTAL_AUTOSTART = true;

// Status line on the splash screen, so the service can be checked on a TV without a debugger.
var fxmlLastLog = '';
var fxmlStatusText = '';
function showFxmlStatus(text) {
	if (text) { fxmlStatusText = text; console.log('[fxml] ' + text); }
	text = fxmlStatusText;
	var logo = document.getElementById('startlogo');
	if (!logo) return;
	var el = document.getElementById('fxml-status');
	if (!el) {
		el = document.createElement('div');
		el.id = 'fxml-status';
		el.style.cssText = 'position:absolute;left:24px;bottom:16px;font:16px sans-serif;color:#9aa;max-width:90%';
		logo.appendChild(el);
	}
	el.textContent = 'FXML: ' + text + (fxmlLastLog ? ' | ' + fxmlLastLog : '');
}

// Polls the service until it answers (up to ~60 s: a first start on an old TV can be slow).
var fxmlServiceReady = false;
function checkFxmlService(attempt) {
	attempt = attempt || 0;
	if (attempt) showFxmlStatus('ожидание сервиса ' + attempt + '/60');
	var x = new XMLHttpRequest();
	x.open('GET', FXML_PORTAL_URL, true);
	x.timeout = 2000;
	var where = FXML_ON_EMULATOR ? 'эмулятор, парсер на ПК: ' : FXML_IN_TIZENBREW ? 'TizenBrew: ' : '';
	x.onload = function () {
		showFxmlStatus(where + (x.status === 200 ? 'сервис работает' : 'сервис ответил ' + x.status));
		fxmlServiceReady = true;
		runFxmlReadyWaiters();
		autostartFxmlPortal();
	};
	x.onerror = x.ontimeout = function () {
		if (attempt < 60) setTimeout(function () { checkFxmlService(attempt + 1); }, 1000);
		else {
			if (FXML_ON_EMULATOR) showFxmlStatus(where + 'не отвечает. Запустите на ПК: cd fxml-parser && npm start');
			else showFxmlStatus('сервис не отвечает (' + FXML_PORTAL_URL + ')');
			autostartFxmlPortal();
		}
	};
	x.send();
}

// webOS only: the engine opens the portal (window.tizenPreviewPending, set below) as soon as its
// start page is ready, so there it starts only once the service answers: ScriptLoader.init waits
// for this, at most FXML_START_WAIT_MS (then it starts anyway and the portal page shows the
// error). Opening the portal later through an 'appcontrol' event doesn't work on webOS. Elsewhere
// waiting would only slow the start (1.2.2: +2–3 s on Samsung), so the engine starts at once.
var FXML_WAIT_FOR_SERVICE = FXML_ON_WEBOS;
var FXML_START_WAIT_MS = 20000;
var fxmlReadyWaiters = [];
function runFxmlReadyWaiters() {
	var waiters = fxmlReadyWaiters;
	fxmlReadyWaiters = [];
	for (var i = 0; i < waiters.length; i++) waiters[i]();
}
function whenFxmlServiceReady(callback) {
	var done = false;
	var once = function () { if (!done) { done = true; callback(); } };
	if (fxmlServiceReady || !FXML_PORTAL_AUTOSTART || !FXML_WAIT_FOR_SERVICE) return once();
	fxmlReadyWaiters.push(once);
	setTimeout(once, FXML_START_WAIT_MS);
}

// Starts the FXML web service (declared in config.xml) unless it is already running.
// Same approach as TizenBrew: an app control with the "service" operation.
// The service's console is not visible on a TV, so it sends its log lines to the
// "fxml-log" message port; they go to this app's console and the splash status line.
function startFxmlService() {
	if (typeof tizen === 'undefined' || !tizen.application) return;
	try {
		tizen.messageport.requestLocalMessagePort('fxml-log').addMessagePortListener(function (data) {
			for (var i = 0; i < data.length; i++) {
				fxmlLastLog = data[i].value;
				console.log('[fxml-service] ' + data[i].value);
			}
			showFxmlStatus();
		});
	} catch (e) {
		fxmlLastLog = 'log port error: ' + e.message;
	}
	try {
		var pkg = tizen.application.getCurrentApplication().appInfo.packageId;
		tizen.application.launchAppControl(
			new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/service'),
			pkg + '.FxmlService',
			function () { showFxmlStatus('запуск принят'); },
			function (e) { showFxmlStatus('не удалось запустить сервис: ' + e.message); }
		);
	} catch (e) {
		showFxmlStatus('ошибка запуска сервиса: ' + e.message);
	}
}
// LG webOS: the app's JS service (tools/webos/service.js, same parser bundle) starts on the first
// call to it and stays alive while this call's subscription is open. Its answer carries the
// service's latest log lines for the status line. The bridges are kept in globals so the calls
// aren't garbage-collected.
var WEBOS_SERVICE = 'luna://com.fxmlkino.tv.service';
function webosCall(uri, params, onReply) {
	var bridge = new PalmServiceBridge();
	bridge.onservicecallback = function (text) {
		var reply = {};
		try { reply = JSON.parse(text); } catch (e) {}
		if (onReply) onReply(reply);
	};
	bridge.call(uri, JSON.stringify(params || {}));
	(window.__fxmlBridges = window.__fxmlBridges || []).push(bridge);
}
function startWebosService() {
	try {
		webosCall(WEBOS_SERVICE + '/start', { subscribe: true }, function (reply) {
			if (reply.log && reply.log.length) fxmlLastLog = reply.log[reply.log.length - 1];
			if (reply.returnValue === false) showFxmlStatus('не удалось запустить сервис: ' + (reply.errorText || reply.errorCode));
			else if (fxmlStatusText === 'запуск сервиса…') showFxmlStatus('запуск принят');
			else showFxmlStatus();
		});
		// Device ID and model for the engine, as LG's own Fork app sets them in index.html.
		webosCall('luna://com.webos.service.sm/deviceid/getIDs', { idType: ['LGUDID'] }, function (reply) {
			if (reply.returnValue !== false) window.glg_uid = reply;
		});
		webosCall('luna://com.webos.service.tv.systemproperty/getSystemInfo', { keys: ['modelName', 'firmwareVersion', 'UHD', 'sdkVersion'] }, function (reply) {
			if (reply.returnValue) window.glg_model = reply.modelName;
		});
	} catch (e) {
		showFxmlStatus('ошибка запуска сервиса: ' + e.message);
	}
}

if (FXML_ON_EMULATOR) {
	showFxmlStatus('эмулятор, парсер на ПК: ' + FXML_PORTAL_URL);
} else if (FXML_ON_WEBOS) {
	showFxmlStatus('запуск сервиса…');
	startWebosService();
} else if (FXML_IN_TIZENBREW) {
	showFxmlStatus('TizenBrew: сервис запускает TizenBrew…');
} else {
	showFxmlStatus('запуск сервиса…');
	startFxmlService();
}
setTimeout(function () { checkFxmlService(0); }, 300);

// Portal on start. A Smart Hub launch with its own window.tizenPreviewPending takes priority.
// - webOS: the target is set now and the engine starts only once the service answers
//   (FXML_WAIT_FOR_SERVICE, whenFxmlServiceReady): webOS ignores the 'appcontrol' event.
// - Tizen, TizenBrew, emulator: the engine starts at once (fast start); the portal is opened when
//   the service answers (openFxmlPortal: target + 'appcontrol' event), or after the polling ends
//   without an answer, so the portal page then shows the error.
var fxmlAutostartPending = FXML_PORTAL_AUTOSTART && !window.tizenPreviewPending;
if (fxmlAutostartPending && FXML_WAIT_FOR_SERVICE) {
	fxmlAutostartPending = false;
	window.tizenPreviewPending = { title: "FXML Кино", playlist_url: FXML_PORTAL_URL, stream_url: "" };
}
function autostartFxmlPortal() {
	if (!fxmlAutostartPending) return;
	fxmlAutostartPending = false;
	openFxmlPortal();
}

function getLoaderLanguage() {
	var lang = 'en';
	try {
		if (typeof navigator !== 'undefined') {
			var raw = navigator.language || navigator.userLanguage || navigator.browserLanguage || '';
			raw = (raw && raw.toLowerCase()) || '';
			if (raw.indexOf('uk') === 0) return 'uk';
			if (raw.indexOf('ru') === 0) return 'ru';
		}
	} catch (e) {}
	return 'en';
}

var LOADER_FALLBACK = {
	en: {
		menu: "Menu",
		continueLoading: "Continue Loading",
		selectSource: "Select Source",
		goToMSXStore: "Go to MSX APPFXML STORE",
		goToMSXStoreMirror: "Go to MSX APPFXML STORE (Mirror)",
		openFxmlPortal: "FXML Movies (Rezka, Kinogo)",
		clearData: "Clear Data",
		deleteAll: "Delete all",
		confirmDeleteItem: "Delete this item?",
		cancel: "Cancel",
		confirm: "Confirm",
		initializingScriptLoader: "Initializing script loader...",
		sourceLabel: "Source {0}/{1}",
		loadingBootstrap: "Loading bootstrap...",
		loadingLibraries: "Loading libraries...",
		loadingLibrariesCount: "Loading libraries ({0})...",
		errorTimeoutBootstrap: "Bootstrap timeout ({0}s)",
		errorChildTimeout: "Libraries timeout ({0}s)",
		errorLoadFailed: "Bootstrap load failed",
		errorAllFailed: "All libraries failed",
		errorInternet: "Network error",
		errorChildFailed: "Library chain failed",
		errorLibFailed: "Failed to load: {0}",
		errorLibTimeout: "Timeout: {0}",
		loadingPaused: "Loading paused",
		skippingToNextSource: "Skipping to next source...",
		allSourcesUnavailable: "All sources unavailable, retrying...",
		loadFromSource: "Load from source",
		loadingFromSource: "Loading from selected source",
		loading: "Loading...",
		waiting: "waiting...",
		errorFailedToLoad: "ERROR: Failed to load from source",
		pressUpUpForMenu: "Press UP+UP for menu",
		noDataToClear: "No data to clear",
		dataClearedRestarting: "Data cleared. Restarting...",
		allDataClearedRestarting: "All data cleared except ID. Restarting...",
		back: "Back",
		clearDataTitle: "Clear Data",
		clearDataQuestion: "Are you sure you want to clear data?",
		itemsToDelete: "Items to delete:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Total size:",
		protected: "Protected:",
		protectedIDSettings: "ID, settings, bookmarks",
		items: "items"
	},
	ru: {
		menu: "Меню",
		continueLoading: "Продолжить загрузку",
		selectSource: "Выбрать источник",
		goToMSXStore: "Перейти в MSX APPFXML STORE",
		goToMSXStoreMirror: "Перейти в MSX APPFXML STORE (Зеркало)",
		openFxmlPortal: "FXML Кино (Rezka, Kinogo)",
		clearData: "Очистить данные",
		deleteAll: "Удалить все",
		confirmDeleteItem: "Удалить этот элемент?",
		cancel: "Отмена",
		confirm: "Подтвердить",
		initializingScriptLoader: "Инициализация загрузчика скриптов...",
		sourceLabel: "Источник {0}/{1}",
		loadingBootstrap: "Загрузка bootstrap...",
		loadingLibraries: "Загрузка библиотек...",
		loadingLibrariesCount: "Загрузка библиотек ({0})...",
		errorTimeoutBootstrap: "Таймаут bootstrap ({0} сек)",
		errorChildTimeout: "Таймаут библиотек ({0} сек)",
		errorLoadFailed: "Ошибка загрузки bootstrap",
		errorAllFailed: "Все библиотеки недоступны",
		errorInternet: "Ошибка сети",
		errorChildFailed: "Ошибка цепочки библиотек",
		errorLibFailed: "Не удалось загрузить: {0}",
		errorLibTimeout: "Таймаут: {0}",
		loadingPaused: "Загрузка приостановлена",
		skippingToNextSource: "Переход к следующему источнику...",
		allSourcesUnavailable: "Все источники недоступны, повторная попытка...",
		loadFromSource: "Загрузить из источника",
		loadingFromSource: "Загрузка из выбранного источника",
		loading: "Загрузка...",
		waiting: "ожидание...",
		errorFailedToLoad: "ОШИБКА: Не удалось загрузить из источника",
		pressUpUpForMenu: "Нажмите дважды вверх для вызова меню",
		noDataToClear: "Нет данных для очистки",
		dataClearedRestarting: "Данные очищены. Перезапуск...",
		back: "Назад",
		clearDataTitle: "Очистить данные",
		clearDataQuestion: "Вы уверены, что хотите очистить данные?",
		itemsToDelete: "Элементов для удаления:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Общий размер:",
		protected: "Защищено:",
		protectedIDSettings: "ID, настройки, закладки",
		items: "элементов"
	},
	uk: {
		menu: "Меню",
		continueLoading: "Продовжити завантаження",
		selectSource: "Вибрати джерело",
		goToMSXStore: "Перейти до MSX APPFXML STORE",
		goToMSXStoreMirror: "Перейти до MSX APPFXML STORE (Дзеркало)",
		openFxmlPortal: "FXML Кіно (Rezka, Kinogo)",
		clearData: "Очистити дані",
		deleteAll: "Видалити все",
		confirmDeleteItem: "Видалити цей елемент?",
		cancel: "Скасувати",
		confirm: "Підтвердити",
		initializingScriptLoader: "Ініціалізація завантажувача скриптів...",
		sourceLabel: "Джерело {0}/{1}",
		loadingBootstrap: "Завантаження bootstrap...",
		loadingLibraries: "Завантаження бібліотек...",
		loadingLibrariesCount: "Завантаження бібліотек ({0})...",
		errorTimeoutBootstrap: "Таймаут bootstrap ({0} сек)",
		errorChildTimeout: "Таймаут бібліотек ({0} сек)",
		errorLoadFailed: "Помилка завантаження bootstrap",
		errorAllFailed: "Усі бібліотеки недоступні",
		errorInternet: "Помилка мережі",
		errorChildFailed: "Помилка ланцюга бібліотек",
		errorLibFailed: "Не вдалося завантажити: {0}",
		errorLibTimeout: "Таймаут: {0}",
		loadingPaused: "Завантаження призупинено",
		skippingToNextSource: "Перехід до наступного джерела...",
		allSourcesUnavailable: "Всі джерела недоступні, повторна спроба...",
		loadFromSource: "Завантаження з джерела",
		loadingFromSource: "Завантаження з вибраного джерела",
		loading: "Завантаження...",
		waiting: "очікування...",
		errorFailedToLoad: "ПОМИЛКА: Не вдалося завантажити з джерела",
		pressUpUpForMenu: "Натисніть двічі вгору для виклику меню",
		noDataToClear: "Немає даних для очищення",
		dataClearedRestarting: "Дані очищено. Перезапуск...",
		back: "Назад",
		clearDataTitle: "Очистити дані",
		clearDataQuestion: "Ви впевнені, що хочете очистити дані?",
		itemsToDelete: "Елементів для видалення:",
		localStorage: "localStorage:",
		cookies: "Cookies:",
		totalSize: "Загальний розмір:",
		protected: "Захищено:",
		protectedIDSettings: "ID, налаштування, закладки",
		items: "елементів"
	}
};

function getTranslation(key) {
	var lang = getLoaderLanguage();
	var map = LOADER_FALLBACK[lang] || LOADER_FALLBACK.en;
	if (map[key] != null) return map[key];
	if (LOADER_FALLBACK.en[key] != null) return LOADER_FALLBACK.en[key];
	if (typeof window.t === 'function') {
		var appText = window.t(key);
		if (appText && appText !== key) return appText;
	}
	return key;
}

function formatTranslation(key, arg0, arg1) {
	var text = getTranslation(key);
	if (arg0 !== undefined && arg0 !== null) {
		text = text.replace('{0}', arg0);
	}
	if (arg1 !== undefined && arg1 !== null) {
		text = text.replace('{1}', arg1);
	}
	return text;
}

function getPlatformVersionLabel() {
	var version = (typeof app_version !== 'undefined' && app_version) ? String(app_version) : '';
	return 'FxmlKino ' + FXMLKINO_VERSION + ' · Fork browser' + (version ? ' ' + version : '');
}

function updatePlatformVersionLabel() {
	var platformEl = document.querySelector('.platform-version');
	if (platformEl) {
		platformEl.textContent = getPlatformVersionLabel();
	}
}

function loadstartinfo(message) {
	if (window.internetErrorShown) {
		console.log("loadstartinfo: Internet error already shown, not overwriting");
		return;
	}
	
	var statusEl = document.getElementById("startcmd");
	if (statusEl) {
		var hasErrorAttr = statusEl.getAttribute("data-internet-error") === "true";
		if (hasErrorAttr) {
			console.log("loadstartinfo: Internet error attribute set, not overwriting");
			return;
		}
		statusEl.innerHTML = message;
	}
}

var JSON_SUPPORT = typeof JSON !== "undefined" && 
	typeof JSON.parse === "function" && 
	typeof JSON.stringify === "function";

function hasClass(element, className) {
	if (!element || !className) return false;
	var classes = element.className;
	if (!classes) return false;
	return (' ' + classes + ' ').indexOf(' ' + className + ' ') !== -1;
}

function addClass(element, className) {
	if (!element || !className) return;
	if (hasClass(element, className)) return;
	element.className = (element.className ? element.className + ' ' : '') + className;
}

function removeClass(element, className) {
	if (!element || !className) return;
	var classes = element.className;
	if (!classes) return;
	element.className = (' ' + classes + ' ').replace(' ' + className + ' ', ' ').replace(/^\s+|\s+$/g, '');
}

function removeHeadScriptsByPrefix(prefix, exceptId) {
	var head = document.head || document.getElementsByTagName("head")[0];
	if (!head || !prefix) return;
	var nodes = head.getElementsByTagName("script");
	for (var i = nodes.length - 1; i >= 0; i--) {
		var node = nodes[i];
		if (!node.id || node.id.indexOf(prefix) !== 0) continue;
		if (exceptId && node.id === exceptId) continue;
		try {
			node.onload = null;
			node.onerror = null;
			node.src = "about:blank";
			if (node.parentNode) node.parentNode.removeChild(node);
		} catch (e) {}
	}
}

window.__forkLibLoader = {
	isFullBootstrapJsUrl: function(url) {
		if (!url || typeof url !== "string") return false;
		return /appinfodl@main\/app\.js/i.test(url)
			|| /\/app_\d+\.js/i.test(url)
			|| /load\.js\.php/i.test(url);
	},
	abortLibScript: function(lib, l) {
		if (!l) return;
		clearTimeout(l.tout);
		l.tout = null;
		l.loadGen = (l.loadGen || 0) + 1;
		if (l.activeScript) {
			try {
				l.activeScript.onload = null;
				l.activeScript.onerror = null;
				l.activeScript.src = "about:blank";
				if (l.activeScript.parentNode) l.activeScript.parentNode.removeChild(l.activeScript);
			} catch (e) {}
			l.activeScript = null;
		}
		removeHeadScriptsByPrefix(l.name);
	},
	patch: function(lib) {
		if (!lib || lib.__forkPatchedV2) return lib;
		var fork = this;
		var origAddlib = lib.addlib;
		var origCheck = lib.check;
		if (typeof origAddlib !== "function") return lib;
		
		lib.abortLibScript = function(l) { fork.abortLibScript(lib, l); };
		lib.isFullBootstrapJsUrl = fork.isFullBootstrapJsUrl;
		lib.abortJsScriptsExcept = function(keepNum) {
			removeHeadScriptsByPrefix("js", typeof keepNum === "number" ? "js" + keepNum : null);
		};
		
		if (typeof origCheck === "function") {
			lib.check = function(l) {
				var wasReady = lib.exis && lib.exis(l);
				var result = origCheck.apply(lib, arguments);
				if (l && l.name === "js" && !wasReady && lib.exis && lib.exis(l)) {
					lib.abortJsScriptsExcept(l.num || 0);
				}
				return result;
			};
		}
		
		lib.addlib = function(l) {
			if (!l) return;
			if (lib.exis && lib.exis(l)) return;
			if (l.name === "js") {
				l.num = l.num || 0;
				while (l.url && l.url[l.num]) {
					var candidate = lib.upconv ? lib.upconv(l.url[l.num]) : l.url[l.num];
					if (!fork.isFullBootstrapJsUrl(candidate) || typeof is_vod === "undefined") break;
					console.log("[forkLibLoader] skip nested full bootstrap js url: " + candidate);
					l.num++;
				}
				if (!l.url || !l.url[l.num]) {
					if (typeof origCheck === "function") origCheck.call(lib, l);
					return;
				}
				fork.abortLibScript(lib, l);
			}
			return origAddlib.apply(lib, arguments);
		};
		
		lib.__forkPatchedV2 = true;
		return lib;
	}
};

var ScriptLoader = (function() {
	'use strict';
	
	var CONFIG = {
		SEQUENTIAL_TIMEOUT: 4000,
		CHILD_LOAD_TIMEOUT: 10000,
		CHILD_LOAD_TIMEOUT_BY_INDEX: {
			2: 15000
		},
		CHILD_CHECK_INTERVAL: 500,
		VERIFY_DELAY: 300,
		RETRY_DELAY_BASE: 2000,
		RETRY_MAX_ATTEMPTS: 3,
		CACHE_KEY: 'fork_browser_source_cache',
		CACHE_TTL: 2 * 24 * 60 * 60 * 1000,
		HEALTH_CHECK_ENABLED: true,
		MANUAL_SOURCE_KEY: 'fork_browser_manual_source',
		NEXT_SOURCE_KEY: 'fork_browser_next_source',
		INITIAL_LOAD_DELAY_MS: 800
	};
	
	var state = {
		isLoaded: false,
		bootstrapPending: false,
		bootstrapIndex: -1,
		childMonitorInterval: null,
		childMonitorTimeout: null,
		childFailTriggered: false,
		currentIndex: 0,
		retryCount: 0,
		activeScript: null,
		activeTimer: null,
		currentLoader: null,
		paused: false,
		manualSelection: false,
		loadingPhase: "",
		loadingErrors: [],
		loadingLibName: "",
		loadingLibNum: 0,
		loadingLibUrls: null
	};
	
	var Storage = {
		isAvailable: function() {
			if (!JSON_SUPPORT) return false;
			try {
				var test = 'test';
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		},
		
		get: function(key) {
			if (!this.isAvailable()) return null;
			try {
				var item = localStorage.getItem(key);
				return item ? JSON.parse(item) : null;
			} catch(e) {
				return null;
			}
		},
		
		set: function(key, value) {
			if (!this.isAvailable()) return false;
			try {
				localStorage.setItem(key, JSON.stringify(value));
				return true;
			} catch(e) {
				return false;
			}
		},
		
		remove: function(key) {
			if (!this.isAvailable()) return;
			try {
				localStorage.removeItem(key);
			} catch(e) {}
		}
	};
	
	function getCachedSource() {
		var cache = Storage.get(CONFIG.CACHE_KEY);
		if (!cache) return null;
		
		var now = new Date().getTime();
		if (now - cache.timestamp > CONFIG.CACHE_TTL) {
			Storage.remove(CONFIG.CACHE_KEY);
			return null;
		}
		
		if (cache.index >= 0 && cache.index < Ldata.length) {
			return cache.index;
		}
		
		return null;
	}
	
	function cacheSource(index) {
		if (index < 0 || index >= Ldata.length) return;
		
		var cache = {
			index: index,
			timestamp: new Date().getTime()
		};
		
		Storage.set(CONFIG.CACHE_KEY, cache);
	}
	
	function isManualMode() {
		return !!state.manualSelection;
	}
	
	function formatLoadingError(reason, detail) {
		switch (reason) {
			case 'bootstrapTimeout':
				return formatTranslation('errorTimeoutBootstrap', detail);
			case 'timeout':
				return formatTranslation('errorChildTimeout', detail);
			case 'bootstrapError':
				return formatTranslation('errorLoadFailed');
			case 'allFailed':
				return formatTranslation('errorAllFailed');
			case 'internetError':
				return formatTranslation('errorInternet');
			case 'childFailed':
				return formatTranslation('errorChildFailed');
			case 'libFailed':
				return formatTranslation('errorLibFailed', detail);
			case 'libTimeout':
				return formatTranslation('errorLibTimeout', detail);
			default:
				return detail || reason || getTranslation('errorLoadFailed');
		}
	}
	
	function pushLoadingError(text) {
		if (!text) return;
		for (var i = 0; i < state.loadingErrors.length; i++) {
			if (state.loadingErrors[i] === text) return;
		}
		state.loadingErrors.push(text);
		if (state.loadingErrors.length > 12) {
			state.loadingErrors.shift();
		}
	}
	
	function clearLoadingLibStatus() {
		state.loadingLibName = "";
		state.loadingLibNum = 0;
		state.loadingLibUrls = null;
	}
	
	function getRemainingLibraryCount() {
		if (!window.librarys || typeof window.librarys.libs !== "function" || typeof window.librarys.exis !== "function") {
			return null;
		}
		var libs = window.librarys.libs();
		var remaining = 0;
		for (var i = 0; i < libs.length; i++) {
			if (!window.librarys.exis(libs[i])) {
				remaining++;
			}
		}
		return remaining;
	}
	
	function getLoadingLibrariesText() {
		var remaining = getRemainingLibraryCount();
		if (remaining !== null && remaining >= 0) {
			return formatTranslation('loadingLibrariesCount', remaining);
		}
		return getTranslation('loadingLibraries');
	}
	
	function formatLibraryStatus(l) {
		if (!l || !l.name) {
			return getLoadingLibrariesText();
		}
		var num = (l.num || 0) + 1;
		if (l.name === "js") {
			return "libraries (" + num + ")";
		}
		var total = l.url && l.url.length ? l.url.length : 0;
		return l.name + " (" + num + "/" + total + ")";
	}
	
	function shouldShowSourceNumber(index) {
		return index >= 1 && index < Ldata.length;
	}
	
	function getLoadingHeaderText(index, phase) {
		if (index < 0 || index >= Ldata.length) {
			return "";
		}
		if (shouldShowSourceNumber(index)) {
			return formatTranslation('sourceLabel', index + 1, Ldata.length);
		}
		if (state.bootstrapPending) {
			if (state.loadingLibName) {
				return formatLibraryStatus({
					name: state.loadingLibName,
					num: state.loadingLibNum,
					url: state.loadingLibUrls
				});
			}
			return getLoadingLibrariesText();
		}
		return phase || getTranslation('loadingBootstrap');
	}
	
	function getLoadingPhaseText(index, phase) {
		if (index < 0 || index >= Ldata.length) {
			return phase || "";
		}
		if (!shouldShowSourceNumber(index)) {
			return "";
		}
		if (state.bootstrapPending) {
			if (state.loadingLibName) {
				return formatLibraryStatus({
					name: state.loadingLibName,
					num: state.loadingLibNum,
					url: state.loadingLibUrls
				});
			}
			return getLoadingLibrariesText();
		}
		return phase || "";
	}
	
	function notifyLibraryLoading(l) {
		if (!l || !l.name) return;
		state.loadingLibName = l.name;
		state.loadingLibNum = l.num || 0;
		state.loadingLibUrls = l.url || null;
		var idx = state.bootstrapPending && state.bootstrapIndex >= 0
			? state.bootstrapIndex
			: state.currentIndex;
		renderLoadingStatus(idx, state.loadingPhase, false);
	}
	
	function buildLoadingStatusHtml(index, phase, options) {
		options = options || {};
		var html = '<div class="loading-status-panel">';
		
		if (index >= 0 && index < Ldata.length) {
			var headerText = getLoadingHeaderText(index, phase);
			html += '<div class="loading-status-source loading-status-source-action" role="button" tabindex="0" title="' + getTranslation('selectSource') + '">' + headerText + '</div>';
		}
		
		if (options.showProgress) {
			html += '<div class="loading-progress"><div class="loading-progress-track"><div class="loading-progress-fill"></div></div></div>';
		} else {
			var phaseText = (index >= 0 && index < Ldata.length)
				? getLoadingPhaseText(index, phase)
				: phase;
			if (phaseText) {
				html += '<div class="loading-status-phase">' + phaseText + '</div>';
			}
		}
		
		if (state.loadingErrors.length) {
			html += '<div class="loading-status-errors">';
			for (var j = 0; j < state.loadingErrors.length; j++) {
				html += '<div class="loading-status-error">' + state.loadingErrors[j] + '</div>';
			}
			html += '</div>';
		}
		
		html += '</div>';
		return html;
	}
	
	function renderLoadingStatus(index, phase, showProgress) {
		if (phase) {
			state.loadingPhase = phase;
		}
		updateStatus(buildLoadingStatusHtml(index, phase || state.loadingPhase, {
			showProgress: !!showProgress
		}));
	}
	
	function reportLoadingError(reason, detail) {
		pushLoadingError(formatLoadingError(reason, detail));
		var idx = state.bootstrapPending && state.bootstrapIndex >= 0
			? state.bootstrapIndex
			: state.currentIndex;
		renderLoadingStatus(idx, state.loadingPhase, false);
	}
	
	function getErrorDetailForReason(reason, index) {
		if (reason === 'bootstrapTimeout') {
			return CONFIG.SEQUENTIAL_TIMEOUT / 1000;
		}
		if (reason === 'timeout') {
			if (CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX && CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX[index]) {
				return CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX[index] / 1000;
			}
			return CONFIG.CHILD_LOAD_TIMEOUT / 1000;
		}
		return null;
	}
	
	function isLocalBootstrapSource(index) {
		if (index == null || index < 0 || index >= Ldata.length) return false;
		var url = Ldata[index];
		return url.indexOf('library/') === 0 || url.indexOf('js/') === 0;
	}
	
	function getChildLoadTimeout(index) {
		if (isLocalBootstrapSource(index)) return 0;
		if (CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX && CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX[index]) {
			return CONFIG.CHILD_LOAD_TIMEOUT_BY_INDEX[index];
		}
		return CONFIG.CHILD_LOAD_TIMEOUT;
	}
	
	function verifyModuleLoaded() {
		return typeof is_vod !== "undefined";
	}
	
	function verifyAppReady() {
		return typeof window.Player !== "undefined" &&
			typeof window.breakScreen !== "undefined" &&
			typeof window.keyHandler !== "undefined";
	}
	
	function stopChildLoadMonitor() {
		if (state.childMonitorInterval) {
			clearInterval(state.childMonitorInterval);
			state.childMonitorInterval = null;
		}
		if (state.childMonitorTimeout) {
			clearTimeout(state.childMonitorTimeout);
			state.childMonitorTimeout = null;
		}
	}
	
	function resetBootstrapErrorUi() {
		window.internetErrorShown = false;
		var statusEl = document.getElementById("startcmd");
		if (statusEl) {
			statusEl.removeAttribute("data-internet-error");
			statusEl.style.color = "";
			statusEl.style.fontWeight = "";
			statusEl.style.backgroundColor = "";
		}
	}
	
	function showBootstrapLoadError() {
		reportLoadingError('allFailed');
		if (typeof showInternetError === "function" && !isManualMode()) {
			showInternetError();
			return;
		}
		renderLoadingStatus(state.currentIndex, getTranslation('allSourcesUnavailable'), false);
	}
	
	function failBootstrapTryNext(index, reason) {
		if (state.isLoaded || state.paused) return;
		
		var errorDetail = getErrorDetailForReason(reason, index);
		reportLoadingError(reason, errorDetail !== null ? errorDetail : reason);
		
		if (isManualMode() || isLocalBootstrapSource(index)) {
			state.childFailTriggered = false;
			state.bootstrapPending = true;
			return;
		}
		
		if (state.childFailTriggered) return;
		state.childFailTriggered = true;
		stopChildLoadMonitor();
		cleanup();
		state.bootstrapPending = false;
		
		var nextIndex = index + 1;
		console.log("[ScriptLoader] Bootstrap child load failed (" + (reason || "unknown") + "), source " + (index + 1) + "/" + Ldata.length);
		
		if (nextIndex < Ldata.length) {
			if (!isManualMode()) {
				state.loadingErrors = [];
			}
			resetBootstrapErrorUi();
			renderLoadingStatus(index, getTranslation('skippingToNextSource'), false);
			Storage.set(CONFIG.NEXT_SOURCE_KEY, nextIndex);
			setTimeout(function() {
				location.reload();
			}, 1200);
			return;
		}
		
		state.childFailTriggered = false;
		showBootstrapLoadError();
	}
	
	function handleFinalSuccess(index) {
		if (state.isLoaded || state.paused) return;
		
		cleanupDuplicateJsScripts();
		state.bootstrapPending = false;
		state.isLoaded = true;
		state.manualSelection = false;
		stopChildLoadMonitor();
		cacheSource(index);
		renderLoadingStatus(index, getTranslation('loading'), index === 0);
	}
	
	function startChildLoadMonitor(index) {
		state.bootstrapPending = true;
		state.bootstrapIndex = index;
		state.childFailTriggered = false;
		clearLoadingLibStatus();
		stopChildLoadMonitor();
		renderLoadingStatus(index, getTranslation('loadingLibraries'), index === 0 && !state.loadingErrors.length);
		
		state.childMonitorInterval = setInterval(function() {
			if (state.isLoaded || state.paused || !state.bootstrapPending) {
				stopChildLoadMonitor();
				return;
			}
			
			if (verifyAppReady()) {
				handleFinalSuccess(index);
				return;
			}
			
			if (window.librarys && window.librarys.allFailed) {
				if (isManualMode() || isLocalBootstrapSource(index)) {
					reportLoadingError('allFailed');
					return;
				}
				failBootstrapTryNext(index, "allFailed");
				return;
			}
			
			if (window.internetErrorShown) {
				if (isManualMode() || isLocalBootstrapSource(index)) {
					reportLoadingError('internetError');
					window.internetErrorShown = false;
					resetBootstrapErrorUi();
					return;
				}
				failBootstrapTryNext(index, "internetError");
			}
		}, CONFIG.CHILD_CHECK_INTERVAL);
		
		var childTimeout = getChildLoadTimeout(index);
		if (!isManualMode() && childTimeout > 0) {
			state.childMonitorTimeout = setTimeout(function() {
				if (state.bootstrapPending && !state.isLoaded && !state.paused) {
					failBootstrapTryNext(index, "timeout");
				}
			}, childTimeout);
		}
	}
	
	function notifyChildLoadFailed(reason, detail) {
		if (!state.bootstrapPending || state.isLoaded || state.paused) {
			return false;
		}
		if (isManualMode() || isLocalBootstrapSource(state.bootstrapIndex)) {
			reportLoadingError(reason || 'childFailed', detail);
			return true;
		}
		if (state.childFailTriggered) {
			return false;
		}
		failBootstrapTryNext(state.bootstrapIndex, reason || "childFailed");
		return true;
	}
	
	function cleanup() {
		if (state.activeTimer) {
			clearTimeout(state.activeTimer);
			state.activeTimer = null;
		}
		
		if (state.currentLoader && state.currentLoader.abort) {
			state.currentLoader.abort();
			state.currentLoader = null;
		}
		
		if (state.activeScript) {
			try {
				state.activeScript.onload = null;
				state.activeScript.onerror = null;
				state.activeScript.src = "about:blank";
				if (state.activeScript.parentNode) {
					state.activeScript.parentNode.removeChild(state.activeScript);
				}
			} catch(e) {}
			state.activeScript = null;
		}
	}
	
	function getDomainFromUrl(url) {
		if (!url) return 'unknown';
		var isLocal = url.indexOf('js/') === 0 || url.indexOf('library/') === 0;
		if (isLocal) return 'Local File';
		
		var match = url.match(/^https?:\/\/([^\/]+)/);
		if (match && match[1]) {
			return match[1];
		}
		
		var cleaned = url.replace(/^https?:\/\//, '');
		var domain = cleaned.split('/')[0];
		return domain || 'unknown';
	}
	
	function updateStatus(message) {
		var isPanel = message && message.indexOf('loading-status-panel') >= 0;
		
		if (isPanel) {
			window.internetErrorShown = false;
		} else if (window.internetErrorShown) {
			console.log("updateStatus: Internet error already shown, not overwriting");
			return;
		}
		
		var statusEl = document.getElementById("startcmd");
		if (statusEl) {
			if (isPanel) {
				statusEl.removeAttribute("data-internet-error");
				statusEl.style.color = "";
				statusEl.style.fontWeight = "";
				statusEl.style.backgroundColor = "";
			} else {
				var hasErrorAttr = statusEl.getAttribute("data-internet-error") === "true";
				if (hasErrorAttr) {
					console.log("updateStatus: Internet error attribute set, not overwriting");
					return;
				}
			}
		}
		
		if (typeof loadstartinfo === "function") {
			loadstartinfo(message);
		} else if (statusEl) {
			statusEl.innerHTML = message;
		}
	}
	
	function createScriptElement(url, index) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.async = false;
		script.src = url;
		return script;
	}
	
	function abortScript(script) {
		if (!script) return;
		
		try {
			script.onload = null;
			script.onerror = null;
			script.src = "about:blank";
			if (script.parentNode) {
				script.parentNode.removeChild(script);
			}
		} catch(e) {}
	}
	
	function patchLibrarysLoader() {
		if (window.librarys && window.__forkLibLoader) {
			window.__forkLibLoader.patch(window.librarys);
		}
	}
	
	function cleanupDuplicateJsScripts(keepId) {
		removeHeadScriptsByPrefix("js", keepId || null);
	}
	
	function handleBootstrapLoaded(index) {
		if (state.isLoaded || state.paused || state.bootstrapPending) return;
		
		cleanup();
		state.currentIndex = index;
		window.__forkLocalBootstrap = isLocalBootstrapSource(index);
		patchLibrarysLoader();
		state.loadingPhase = getTranslation('loadingLibraries');
		renderLoadingStatus(index, state.loadingPhase, index === 0 && !state.loadingErrors.length);
		
		if (verifyAppReady()) {
			cleanupDuplicateJsScripts();
			handleFinalSuccess(index);
			return;
		}
		
		startChildLoadMonitor(index);
	}
	
	function handleSuccess(index) {
		handleBootstrapLoaded(index);
	}
	
	function loadSingleSource(index, callback) {
		if (state.isLoaded || state.paused || state.bootstrapPending) {
			if (callback) callback(false);
			return null;
		}
		
		if (index < 0 || index >= Ldata.length) {
			if (callback) callback(false);
			return null;
		}
		
		var url = Ldata[index];
		clearLoadingLibStatus();
		state.loadingPhase = isManualMode()
			? getTranslation('loadingFromSource')
			: getTranslation('loadingBootstrap');
		renderLoadingStatus(index, state.loadingPhase, index === 0 && !state.loadingErrors.length && !isManualMode());
		var hintEl = document.getElementById('loading-hint');
		if (hintEl) hintEl.classList.toggle('loading-hint-hidden', index < 1);
		
		var script = createScriptElement(url, index);
		var completed = false;
		var timer = null;
		var sequentialTimeout = (isManualMode() || isLocalBootstrapSource(index)) ? 0 : CONFIG.SEQUENTIAL_TIMEOUT;
		
		var onSuccess = function() {
			if (completed || state.isLoaded || state.paused || state.bootstrapPending) return;
			
			setTimeout(function() {
				if (completed || state.isLoaded || state.paused || state.bootstrapPending) return;
				
				if (verifyModuleLoaded()) {
					completed = true;
					if (timer) clearTimeout(timer);
					handleSuccess(index);
					if (callback) callback(true);
				} else {
					completed = true;
					reportLoadingError('bootstrapError');
					abortScript(script);
					if (callback) callback(false);
				}
			}, CONFIG.VERIFY_DELAY);
		};
		
		var onError = function() {
			if (completed || state.isLoaded || state.paused || state.bootstrapPending) return;
			completed = true;
			if (timer) clearTimeout(timer);
			reportLoadingError('bootstrapError');
			abortScript(script);
			if (callback) callback(false);
		};
		
		script.onload = onSuccess;
		script.onerror = onError;
		
		if (sequentialTimeout > 0) {
			timer = setTimeout(function() {
				if (!completed && !state.isLoaded && !state.paused && !state.bootstrapPending) {
					completed = true;
					reportLoadingError('bootstrapTimeout', sequentialTimeout / 1000);
					abortScript(script);
					if (callback) callback(false);
				}
			}, sequentialTimeout);
		}
		
	document.getElementsByTagName('head')[0].appendChild(script);
		
		return {
			script: script,
			timer: timer,
			abort: function() {
				if (!completed) {
					completed = true;
					if (timer) clearTimeout(timer);
					abortScript(script);
				}
			}
		};
	}
	
	function loadSequential(index) {
		if (state.isLoaded || state.paused || state.bootstrapPending) return;
		
		if (index >= Ldata.length) {
			if (state.manualSelection) {
				reportLoadingError('bootstrapError');
				renderLoadingStatus(state.currentIndex, getTranslation('errorFailedToLoad'), false);
				return;
			}
			
			state.retryCount++;
			reportLoadingError('allFailed');
			
			if (state.retryCount >= CONFIG.RETRY_MAX_ATTEMPTS) {
				state.retryCount = 0;
				renderLoadingStatus(state.currentIndex, getTranslation('allSourcesUnavailable'), false);
			}
			
			var delay = CONFIG.RETRY_DELAY_BASE * Math.pow(2, Math.min(state.retryCount, 3));
			setTimeout(function() {
				if (!state.isLoaded && !state.paused) {
					if (!isManualMode()) {
						state.loadingErrors = [];
					}
					loadSequential(0);
				}
			}, delay);
			return;
		}
		
		if (!isManualMode()) {
			state.loadingErrors = [];
		}
		state.currentIndex = index;
		if (isLocalBootstrapSource(index)) {
			window.__forkLocalBootstrap = true;
		}
		state.loadingPhase = isManualMode()
			? getTranslation('loadingFromSource')
			: getTranslation('loadingBootstrap');
		
		state.currentLoader = loadSingleSource(index, function(success) {
			state.currentLoader = null;
			if (success || state.isLoaded || state.paused) {
				return;
			}
			
			if (state.manualSelection) {
				return;
			}
			
			setTimeout(function() {
				if (!state.isLoaded && !state.paused && !state.bootstrapPending) {
					loadSequential(index + 1);
				}
			}, 800);
		});
		
		if (state.currentLoader) {
			state.activeScript = state.currentLoader.script;
			state.activeTimer = state.currentLoader.timer;
		}
	}
	
	function skipToNext() {
		if (state.isLoaded) return;
		
		var nextIndex = state.currentIndex + 1;
		var needsReload = state.bootstrapPending || verifyModuleLoaded();
		var keepManual = isManualMode();
		
		stopChildLoadMonitor();
		cleanup();
		state.bootstrapPending = false;
		state.childFailTriggered = false;
		
		if (nextIndex >= Ldata.length) {
			reportLoadingError('allFailed');
			renderLoadingStatus(state.currentIndex, getTranslation('allSourcesUnavailable'), false);
			return;
		}
		
		if (!keepManual) {
			state.loadingErrors = [];
		}
		resetBootstrapErrorUi();
		renderLoadingStatus(state.currentIndex, getTranslation('skippingToNextSource'), false);
		
		if (needsReload || keepManual) {
			if (keepManual) {
				Storage.set(CONFIG.MANUAL_SOURCE_KEY, nextIndex);
			} else {
				Storage.set(CONFIG.NEXT_SOURCE_KEY, nextIndex);
			}
			setTimeout(function() {
				location.reload();
			}, 800);
			return;
		}
		
		setTimeout(function() {
			if (!state.isLoaded) {
				loadSequential(nextIndex);
			}
		}, 300);
	}
	
	function init() {
		if (state.isLoaded) return;
		
		var platformEl = document.querySelector('.platform-version');
		if (platformEl) {
			updatePlatformVersionLabel();
		}
		
		var hintEl = document.getElementById('loading-hint');
		if (hintEl) {
			hintEl.textContent = getTranslation('pressUpUpForMenu');
			hintEl.classList.add('loading-hint-hidden');
		}
		
		renderLoadingStatus(-1, getTranslation('initializingScriptLoader'), false);

		// FxmlKino: start the engine once the parser service answers (see whenFxmlServiceReady).
		whenFxmlServiceReady(function() {
			setTimeout(function() {
				if (state.isLoaded) return;
				if (state.paused) return;
				startLoading();
			}, CONFIG.INITIAL_LOAD_DELAY_MS);
		});
	}
	
	function startLoading() {
		if (state.isLoaded) return;
		
		var manualSourceIndex = Storage.get(CONFIG.MANUAL_SOURCE_KEY);
		if (manualSourceIndex !== null && manualSourceIndex >= 0 && manualSourceIndex < Ldata.length) {
			Storage.remove(CONFIG.MANUAL_SOURCE_KEY);
			Storage.remove(CONFIG.NEXT_SOURCE_KEY);
			state.manualSelection = true;
			state.currentIndex = manualSourceIndex;
			loadSequential(manualSourceIndex);
			return;
		}
		
		var forcedNextSource = Storage.get(CONFIG.NEXT_SOURCE_KEY);
		if (forcedNextSource !== null && forcedNextSource >= 0 && forcedNextSource < Ldata.length) {
			Storage.remove(CONFIG.NEXT_SOURCE_KEY);
			state.currentIndex = forcedNextSource;
			loadSequential(forcedNextSource);
			return;
		}
		
		loadSequential(0);
	}
	
	function pauseLoading() {
		state.paused = true;
		stopChildLoadMonitor();
		cleanup();
		renderLoadingStatus(state.currentIndex, getTranslation('loadingPaused'), false);
	}
	
	function resumeLoading() {
		if (state.paused && !state.isLoaded) {
			state.paused = false;
			if (state.bootstrapPending && verifyModuleLoaded()) {
				startChildLoadMonitor(state.bootstrapIndex >= 0 ? state.bootstrapIndex : state.currentIndex);
			} else {
				loadSequential(state.currentIndex);
			}
		}
	}
	
	return {
		init: init,
		skipToNext: skipToNext,
		pauseLoading: pauseLoading,
		resumeLoading: resumeLoading,
		notifyChildLoadFailed: notifyChildLoadFailed,
		notifyLibraryLoading: notifyLibraryLoading,
		reportLoadingError: reportLoadingError,
		isManualMode: isManualMode,
		isLoaded: function() { return state.isLoaded; },
		isBootstrapPending: function() { return state.bootstrapPending; },
		isPaused: function() { return state.paused || false; },
		getCurrentIndex: function() { return state.currentIndex; },
		loadFromIndex: function(index) {
			if (index < 0 || index >= Ldata.length) return;
			
			var shouldReload = !state.isLoaded ||
				state.bootstrapPending ||
				verifyModuleLoaded() ||
				index !== state.currentIndex;
			
			if (!shouldReload) {
				var startlogo = document.getElementById('startlogo');
				if (startlogo) {
					var display = startlogo.style.display;
					var computedStyle = null;
					
					if (window.getComputedStyle) {
						computedStyle = window.getComputedStyle(startlogo);
						display = computedStyle ? computedStyle.display : display;
					} else if (startlogo.currentStyle) {
						display = startlogo.currentStyle.display || display;
					}
					
					shouldReload = display !== 'none' &&
						(startlogo.offsetWidth > 0 || startlogo.offsetHeight > 0);
					
					console.log('[ScriptLoader] loadFromIndex: startLogoVisible check:', {
						display: display,
						offsetWidth: startlogo.offsetWidth,
						offsetHeight: startlogo.offsetHeight,
						shouldReload: shouldReload
					});
				}
			}
			
			if (!shouldReload) {
				console.log('[ScriptLoader] loadFromIndex: Cannot reload - script loaded and startlogo not visible');
				return;
			}
			
			console.log('[ScriptLoader] loadFromIndex: Reloading page with source index', index);
			stopChildLoadMonitor();
			cleanup();
			state.bootstrapPending = false;
			state.childFailTriggered = false;
			state.paused = false;
			Storage.remove(CONFIG.NEXT_SOURCE_KEY);
			Storage.set(CONFIG.MANUAL_SOURCE_KEY, index);
			location.reload();
		},
		getState: function() {
			return {
				isLoaded: state.isLoaded,
				bootstrapPending: state.bootstrapPending,
				bootstrapIndex: state.bootstrapIndex,
				currentIndex: state.currentIndex,
				retryCount: state.retryCount,
				paused: state.paused || false,
				manualSelection: state.manualSelection,
				loadingErrors: state.loadingErrors.slice()
			};
		}
	};
})();

var VapeMenu = (function() {
	'use strict';
	
	var state = {
		isVisible: false,
		currentFocusedIndex: 0,
		lastUpPress: 0,
		doubleClickTimeout: 300,
		sourceMenuVisible: false,
		sourceMenuFocusedIndex: 0,
		openedSourceFromLoading: false
	};
	
	var menuItems = null;
	var sourceMenuItems = null;
	
	function init() {
		bindLoadingSourceClick();
		
		var menuEl = document.getElementById('vapeMenu');
		if (!menuEl || menuEl._vapeMenuInited) return;
		menuEl._vapeMenuInited = true;
		
		menuItems = menuEl.querySelectorAll('.vapeMenuItem');
		
		for (var i = 0; i < menuItems.length; i++) {
			(function(idx, item) {
				item.addEventListener('click', function() {
					handleMenuItemClick(idx);
				});
				item.addEventListener('keydown', function(e) {
					if (e.keyCode === 13 || e.keyCode === 32) {
						e.preventDefault();
						handleMenuItemClick(idx);
					}
				});
			})(i, menuItems[i]);
		}
	}
	
	function bindLoadingSourceClick() {
		var statusEl = document.getElementById('startcmd');
		if (!statusEl || statusEl._sourceClickBound) return;
		statusEl._sourceClickBound = true;
		
		var touchHandled = false;
		
		function handleSourceActivate(e) {
			if (!canOpenSourceMenuFromLoading()) return;
			if (e && e.preventDefault) e.preventDefault();
			if (e && e.stopPropagation) e.stopPropagation();
			openSourceMenuFromLoading();
		}
		
		statusEl.addEventListener('touchend', function(e) {
			if (!canOpenSourceMenuFromLoading()) return;
			touchHandled = true;
			handleSourceActivate(e);
			setTimeout(function() { touchHandled = false; }, 400);
		}, false);
		
		statusEl.addEventListener('click', function(e) {
			if (touchHandled) return;
			handleSourceActivate(e);
		});
		
		statusEl.addEventListener('keydown', function(e) {
			if (e.keyCode !== 13 && e.keyCode !== 32) return;
			handleSourceActivate(e);
		});
	}
	
	function canOpenSourceMenuFromLoading() {
		if (state.sourceMenuVisible) return false;
		return isStartLogoVisible();
	}
	
	function openSourceMenuFromLoading() {
		if (!canOpenSourceMenuFromLoading()) return;
		if (!ScriptLoader.isLoaded()) {
			ScriptLoader.pauseLoading();
		}
		state.openedSourceFromLoading = !state.isVisible;
		showSourceSelectMenu();
	}
	
	function updateVapeMenuTranslations() {
		var header = document.querySelector('#vapeMenu .vapeMenuHeader');
		if (header) header.textContent = getTranslation('menu');
		var items = document.querySelectorAll('#vapeMenuItems .vapeMenuItem');
		var actionToKey = {
			'continue': 'continueLoading',
			'selectSource': 'selectSource',
			'openMSX': 'goToMSXStore',
			'openMSXMirror': 'goToMSXStoreMirror',
			'openFxmlPortal': 'openFxmlPortal',
			'clearData': 'clearData'
		};
		var stats = countDataToClear();
		var clearDataTotalSize = stats.localStorageSize + stats.cookieSize;
		var clearDataTotalCount = stats.localStorageCount + stats.cookieCount;
		for (var i = 0; i < items.length; i++) {
			var action = items[i].getAttribute('data-action');
			var key = actionToKey[action];
			var textEl = items[i].querySelector('.vapeMenuItemText');
			if (textEl && key) {
				if (action === 'clearData') {
					textEl.textContent = getTranslation('clearData') + (clearDataTotalCount > 0 ? ' (' + formatBytes(clearDataTotalSize) + ')' : '');
				} else {
					textEl.textContent = getTranslation(key);
				}
			}
		}
		var cancelBtn = document.getElementById('confirmDialogCancel');
		var confirmBtn = document.getElementById('confirmDialogConfirm');
		if (cancelBtn) cancelBtn.textContent = getTranslation('cancel');
		if (confirmBtn) confirmBtn.textContent = getTranslation('confirm');
	}
	
	function show() {
		console.log('[VapeMenu] show() called:', {
			isLoaded: ScriptLoader.isLoaded(),
			menuElExists: !!document.getElementById('vapeMenu')
		});
		
		if (!ScriptLoader.isLoaded()) {
			ScriptLoader.pauseLoading();
		}
		
		var menuEl = document.getElementById('vapeMenu');
		if (!menuEl) {
			console.log('[VapeMenu] ERROR: Menu element not found!');
			return;
		}
		
		updateVapeMenuTranslations();
		state.isVisible = true;
		state.currentFocusedIndex = 0;
		addClass(menuEl, 'visible');
		console.log('[VapeMenu] Menu made visible, menuItems count:', menuItems ? menuItems.length : 0);
		
		if (menuItems && menuItems.length > 0) {
			updateFocus();
			menuItems[0].focus();
		}
	}
	
	function hide() {
		var menuEl = document.getElementById('vapeMenu');
		if (menuEl) {
			removeClass(menuEl, 'visible');
		}
		
		var sourceMenu = document.getElementById('sourceSelectMenu');
		if (sourceMenu) {
			sourceMenu.style.display = 'none';
		}
		
		state.isVisible = false;
		state.currentFocusedIndex = 0;
		state.sourceMenuVisible = false;
		state.sourceMenuFocusedIndex = 0;
		sourceMenuItems = null;
	}
	
	function updateFocus() {
		if (!menuItems) return;
		
		for (var i = 0; i < menuItems.length; i++) {
			if (i === state.currentFocusedIndex) {
				addClass(menuItems[i], 'focused');
			} else {
				removeClass(menuItems[i], 'focused');
			}
		}
	}
	
	function handleMenuItemClick(index) {
		if (!menuItems || index >= menuItems.length) return;
		
		var item = menuItems[index];
		var action = item.getAttribute('data-action');
		
		switch(action) {
			case 'continue':
				hide();
				ScriptLoader.resumeLoading();
				break;
				
			case 'selectSource':
				showSourceSelectMenu();
				break;
				
			case 'openMSX':
				hide();
				window.location.href = 'http://msx.benzac.de/?start=content:http://msx.appfxml.com/msx/content.json';
				break;
				
			case 'openMSXMirror':
				hide();
				window.location.href = 'http://msx.benzac.de/?start=content:http://msx.appinfo.su/msx/content.json';
				break;

			case 'openFxmlPortal':
				hide();
				openFxmlPortal();
				break;

			case 'clearData':
				showClearDataMenu();
				break;
		}
	}
	
	function showSourceSelectMenu() {
		var sourceMenu = document.getElementById('sourceSelectMenu');
		if (!sourceMenu) return;
		
		state.sourceMenuVisible = true;
		state.sourceMenuFocusedIndex = 0;
		
		var html = '<div class="vapeMenuCard" style="max-width: 600px;">';
		html += '<div class="vapeMenuHeader">' + getTranslation('selectSource') + '</div>';
		html += '<div class="vapeMenuItems" id="sourceMenuItems">';
		
		for (var i = 0; i < Ldata.length; i++) {
			var url = Ldata[i];
			var isLocal = url.indexOf('js/') === 0 || url.indexOf('library/') === 0;
			var displayName = 'Local File';
			
			if (!isLocal) {
				var match = url.match(/^https?:\/\/([^\/]+)/);
				if (match && match[1]) {
					displayName = match[1];
				} else {
					displayName = url.replace(/^https?:\/\//, '').split('/')[0];
				}
			}
			
			var current = ScriptLoader.getCurrentIndex() === i ? ' ✓' : '';
			var isHttps = !isLocal && url.indexOf('https://') === 0;
			var itemClass = isHttps ? 'vapeMenuItem httpsSource' : 'vapeMenuItem';
			
			html += '<div class="' + itemClass + '" data-source-index="' + i + '" tabindex="0">';
			html += '<div class="vapeMenuItemIcon">' + (i + 1) + '</div>';
			html += '<div class="vapeMenuItemText">' + displayName + current + '</div>';
			html += '</div>';
		}
		
		html += '<div class="vapeMenuItem" data-action="back" tabindex="0">';
		html += '<div class="vapeMenuItemIcon">←</div>';
		html += '<div class="vapeMenuItemText">' + getTranslation('back') + '</div>';
		html += '</div>';
		
		html += '</div></div>';
		
		sourceMenu.innerHTML = html;
		sourceMenu.style.display = 'flex';
		sourceMenu.style.position = 'fixed';
		sourceMenu.style.top = '0';
		sourceMenu.style.left = '0';
		sourceMenu.style.width = '100%';
		sourceMenu.style.height = '100%';
		sourceMenu.style.alignItems = 'center';
		sourceMenu.style.justifyContent = 'center';
		sourceMenu.style.background = 'rgba(0, 0, 0, 0.8)';
		sourceMenu.style.zIndex = '10001';
		
		sourceMenuItems = sourceMenu.querySelectorAll('.vapeMenuItem');
		
		for (var j = 0; j < sourceMenuItems.length; j++) {
			(function(item, idx) {
				var sourceIdx = item.getAttribute('data-source-index');
				var act = item.getAttribute('data-action');
				
				item.addEventListener('click', function() {
					handleSourceMenuItemClick(idx, sourceIdx, act);
				});
				
				item.addEventListener('keydown', function(e) {
					if (e.keyCode === 13 || e.keyCode === 32) {
						e.preventDefault();
						handleSourceMenuItemClick(idx, sourceIdx, act);
						return false;
					}
				});
			})(sourceMenuItems[j], j);
		}
		
		updateSourceMenuFocus();
		if (sourceMenuItems.length > 0) {
			sourceMenuItems[0].focus();
		}
	}
	
	function updateSourceMenuFocus() {
		if (!sourceMenuItems) return;
		
		for (var i = 0; i < sourceMenuItems.length; i++) {
			if (i === state.sourceMenuFocusedIndex) {
				addClass(sourceMenuItems[i], 'focused');
			} else {
				removeClass(sourceMenuItems[i], 'focused');
			}
		}
	}
	
	function closeSourceMenu(fromBackAction) {
		var sourceMenu = document.getElementById('sourceSelectMenu');
		if (sourceMenu) {
			sourceMenu.style.display = 'none';
		}
		state.sourceMenuVisible = false;
		state.sourceMenuFocusedIndex = 0;
		sourceMenuItems = null;
		if (fromBackAction && state.openedSourceFromLoading && !state.isVisible) {
			ScriptLoader.resumeLoading();
		}
		state.openedSourceFromLoading = false;
	}
	
	function handleSourceMenuItemClick(index, sourceIdx, act) {
		if (sourceIdx !== null) {
			state.openedSourceFromLoading = false;
			hide();
			ScriptLoader.loadFromIndex(parseInt(sourceIdx, 10));
		} else if (act === 'back') {
			closeSourceMenu(true);
		}
	}
	
	function handleSourceMenuKeyDown(event, index, sourceIdx, act) {
		var keyCode = event.keyCode || event.which;
		var keyName = event.key || event.keyIdentifier;
		
		if (keyCode === 38 || keyName === "ArrowUp" || keyName === "Up") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.sourceMenuFocusedIndex > 0) {
				state.sourceMenuFocusedIndex--;
			} else {
				state.sourceMenuFocusedIndex = sourceMenuItems.length - 1;
			}
			updateSourceMenuFocus();
			if (sourceMenuItems && sourceMenuItems[state.sourceMenuFocusedIndex]) {
				sourceMenuItems[state.sourceMenuFocusedIndex].focus();
			}
			return false;
		}
		
		if (keyCode === 40 || keyName === "ArrowDown" || keyName === "Down") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.sourceMenuFocusedIndex < sourceMenuItems.length - 1) {
				state.sourceMenuFocusedIndex++;
			} else {
				state.sourceMenuFocusedIndex = 0;
			}
			updateSourceMenuFocus();
			if (sourceMenuItems && sourceMenuItems[state.sourceMenuFocusedIndex]) {
				sourceMenuItems[state.sourceMenuFocusedIndex].focus();
			}
			return false;
		}
		
		if (keyCode === 13 || keyCode === 32) {
			event.preventDefault();
			handleSourceMenuItemClick(index, sourceIdx, act);
			return false;
		}
		
		if (keyCode === 0 || keyCode === 461 || keyCode === 27 || keyName === "Escape") {
			event.preventDefault();
			event.stopPropagation();
			var sourceMenu = document.getElementById('sourceSelectMenu');
			if (sourceMenu) {
				sourceMenu.style.display = 'none';
			}
			state.sourceMenuVisible = false;
			state.sourceMenuFocusedIndex = 0;
			sourceMenuItems = null;
			return false;
		}
	}
	
	function countDataToClear() {
		var stats = {
			localStorageCount: 0,
			localStorageSize: 0,
			cookieCount: 0,
			cookieSize: 0
		};
		var items = getClearableItems();
		for (var i = 0; i < items.length; i++) {
			var it = items[i];
			if (it.type === 'localStorage') {
				stats.localStorageCount++;
				stats.localStorageSize += it.size;
			} else {
				stats.cookieCount++;
				stats.cookieSize += it.size;
			}
		}
		return stats;
	}
	
	function formatBytes(bytes) {
		if (bytes === 0) return '0 B';
		if (bytes < 1024) return bytes + ' B';
		var kb = bytes / 1024;
		if (kb < 1024) return kb.toFixed(2) + ' KB';
		var mb = kb / 1024;
		return mb.toFixed(2) + ' MB';
	}
	
	function showClearDataConfirmation() {
		var stats = countDataToClear();
		var totalCount = stats.localStorageCount + stats.cookieCount;
		var totalSize = stats.localStorageSize + stats.cookieSize;
		
		if (totalCount === 0) {
			loadstartinfo(getTranslation('noDataToClear'));
			return;
		}
		
		var dialog = document.getElementById('confirmDialog');
		if (!dialog) return;
		
		var title = document.getElementById('confirmDialogTitle');
		var content = document.getElementById('confirmDialogContent');
		var cancelBtn = document.getElementById('confirmDialogCancel');
		var confirmBtn = document.getElementById('confirmDialogConfirm');
		
		if (!title || !content || !cancelBtn || !confirmBtn) return;
		
		title.innerHTML = getTranslation('clearDataTitle');
		cancelBtn.textContent = getTranslation('cancel');
		confirmBtn.textContent = getTranslation('confirm');
		content.innerHTML = '<div>' + getTranslation('clearDataQuestion') + '</div>' +
			'<div class="confirmDialogStats">' +
			'<div>' + getTranslation('itemsToDelete') + ' ' + totalCount + '</div>' +
			'<div>' + getTranslation('localStorage') + ' ' + stats.localStorageCount + ' ' + getTranslation('items') + ' (' + formatBytes(stats.localStorageSize) + ')</div>' +
			'<div>' + getTranslation('cookies') + ' ' + stats.cookieCount + ' ' + getTranslation('items') + ' (' + formatBytes(stats.cookieSize) + ')</div>' +
			'<div style="margin-top: 8px; font-weight: bold;">' + getTranslation('totalSize') + ' ' + formatBytes(totalSize) + '</div>' +
			'</div>';
		
		var hideDialog = function() {
			removeClass(dialog, 'visible');
			if (document.activeElement && document.activeElement.blur) {
				document.activeElement.blur();
			}
		};
		
		var onConfirm = function() {
			hideDialog();
			clearDataExecute();
		};
		
		var onCancel = function() {
			hideDialog();
		};
		
		var currentButton = 1;
		
		var updateButtonFocus = function() {
			removeClass(cancelBtn, 'focused');
			removeClass(confirmBtn, 'focused');
			if (currentButton === 0) {
				addClass(cancelBtn, 'focused');
				cancelBtn.focus();
			} else {
				addClass(confirmBtn, 'focused');
				confirmBtn.focus();
			}
		};
		
		var handleDialogKey = function(e) {
			var keyCode = e.keyCode || e.which;
			var keyName = e.key || e.keyIdentifier;
			
			if (keyCode === 37 || keyName === "ArrowLeft" || keyName === "Left") {
				e.preventDefault();
				e.stopPropagation();
				currentButton = currentButton === 0 ? 1 : 0;
				updateButtonFocus();
				return false;
			}
			
			if (keyCode === 39 || keyName === "ArrowRight" || keyName === "Right") {
				e.preventDefault();
				e.stopPropagation();
				currentButton = currentButton === 0 ? 1 : 0;
				updateButtonFocus();
				return false;
			}
			
			if (keyCode === 13 || keyCode === 32) {
				e.preventDefault();
				e.stopPropagation();
				if (currentButton === 0) {
					onCancel();
				} else {
					onConfirm();
				}
				return false;
			}
			
			if (keyCode === 27 || keyName === "Escape") {
				e.preventDefault();
				e.stopPropagation();
				onCancel();
				return false;
			}
		};
		
		cancelBtn.onclick = function() {
			onCancel();
		};
		
		confirmBtn.onclick = function() {
			onConfirm();
		};
		
		var documentKeyHandler = function(e) {
			if (!isConfirmDialogVisible()) {
				if (document.removeEventListener) {
					document.removeEventListener('keydown', documentKeyHandler, true);
				}
				return;
			}
			handleDialogKey(e);
		};
		
		if (document.addEventListener) {
			document.addEventListener('keydown', documentKeyHandler, true);
		}
		
		var originalHideDialog = hideDialog;
		hideDialog = function() {
			if (document.removeEventListener) {
				document.removeEventListener('keydown', documentKeyHandler, true);
			}
			originalHideDialog();
		};
		
		addClass(dialog, 'visible');
		setTimeout(function() {
			updateButtonFocus();
		}, 100);
	}
	
	function clearDataExecute() {
		var items = getClearableItems();
		for (var i = 0; i < items.length; i++) {
			deleteSingleItem(items[i].type, items[i].key);
		}
		showClearDataMenu();
	}
	
	function isProtectedKey(key) {
		if (!key) return true;
		var protectedKeys = ['ID', 'id','hm', 'lastdata'];
		var keyLower = key.toLowerCase();
		for (var j = 0; j < protectedKeys.length; j++) {
			if (key === protectedKeys[j] || keyLower === protectedKeys[j].toLowerCase() ||
				keyLower.indexOf(protectedKeys[j].toLowerCase()) !== -1) return true;
		}
		return false;
	}
		
	function getClearableItems() {
		var items = [];
		if (typeof localStorage !== 'undefined') {
			try {
				for (var i = 0; i < localStorage.length; i++) {
					var key = localStorage.key(i);
					if (key && !isProtectedKey(key)) {
						var value = localStorage.getItem(key) || '';
						items.push({ type: 'localStorage', key: key, size: key.length + value.length });
					}
				}
			} catch(e) {}
		}
		if (document.cookie) {
			try {
				var cookies = document.cookie.split(';');
				for (var i = 0; i < cookies.length; i++) {
					var cookie = cookies[i].trim();
					var eqPos = cookie.indexOf('=');
					var name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
					var value = eqPos > -1 ? cookie.substring(eqPos + 1) : '';
					if (name && !isProtectedKey(name)) {
						items.push({ type: 'cookie', key: name, size: cookie.length });
					}
				}
			} catch(e) {}
		}
		items.sort(function(a, b) { return b.size - a.size; });
		return items;
	}
	
	function deleteSingleItem(type, key) {
		if (isProtectedKey(key)) return;
		if (type === 'localStorage' && typeof localStorage !== 'undefined') {
			try { localStorage.removeItem(key); } catch(e) {}
		} else if (type === 'cookie') {
			try {
				document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
				document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
			} catch(e) {}
		}
	}
	
	function getItemValueAndSize(type, key) {
		var value = '';
		var size = 0;
		var valueSize = 0;
		if (type === 'localStorage' && typeof localStorage !== 'undefined') {
			try {
				value = localStorage.getItem(key) || '';
				valueSize = value.length;
				size = key.length + value.length;
			} catch(e) {}
		} else if (type === 'cookie' && document.cookie) {
			try {
				var cookies = document.cookie.split(';');
				for (var i = 0; i < cookies.length; i++) {
					var cookie = cookies[i].trim();
					var eqPos = cookie.indexOf('=');
					var name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
					if (name === key) {
						value = eqPos > -1 ? cookie.substring(eqPos + 1) : '';
						valueSize = value.length;
						size = cookie.length;
						break;
					}
				}
			} catch(e) {}
		}
		return { value: value, size: size, valueSize: valueSize };
	}
	
	function showClearDataMenu() {
		var items = getClearableItems();
		var menuEl = document.getElementById('clearDataMenu');
		if (!menuEl) return;
		
		hide();
		var vapeEl = document.getElementById('vapeMenu');
		if (vapeEl) vapeEl.classList.add('vapeMenuHidden');
		
		menuEl.style.display = 'flex';
		menuEl.style.position = 'fixed';
		menuEl.style.top = '0';
		menuEl.style.left = '0';
		menuEl.style.width = '100%';
		menuEl.style.height = '100%';
		menuEl.style.alignItems = 'center';
		menuEl.style.justifyContent = 'center';
		menuEl.style.background = 'rgba(0, 0, 0, 0.8)';
		menuEl.style.zIndex = '10001';
		
		var totalSize = 0;
		for (var s = 0; s < items.length; s++) totalSize += items[s].size;
		var html = '<div class="vapeMenuCard clearDataCard">';
		html += '<div class="clearDataHeader">';
		html += '<div class="clearDataTitle">' + getTranslation('clearDataTitle') + ' (' + formatBytes(totalSize) + ')</div>';
		html += '<button type="button" class="clearDataDeleteAll" id="clearDataDeleteAll" tabindex="0">' + getTranslation('deleteAll') + '</button>';
		html += '</div>';
		html += '<div class="clearDataList" id="clearDataList">';
		
		for (var i = 0; i < items.length; i++) {
			var it = items[i];
			var shortKey = it.key.length > 40 ? it.key.substring(0, 37) + '...' : it.key;
			var badgeClass = it.type === 'localStorage' ? 'clearDataItemBadge clearDataItemBadgeLS' : 'clearDataItemBadge clearDataItemBadgeCookie';
			var badgeText = it.type === 'localStorage' ? 'LS' : 'C';
			html += '<div class="clearDataItem" data-type="' + it.type + '" data-key="' + it.key.replace(/"/g, '&quot;') + '" tabindex="0">';
			html += '<span class="' + badgeClass + '">' + badgeText + '</span>';
			html += '<span class="clearDataItemInfo">' + shortKey.replace(/</g, '&lt;') + ' <span class="clearDataItemSize">(' + formatBytes(it.size) + ')</span></span>';
			html += '<button type="button" class="clearDataItemDelete" tabindex="0" data-type="' + it.type + '" data-key="' + it.key.replace(/"/g, '&quot;') + '">×</button>';
			html += '</div>';
		}
		
		html += '</div>';
		html += '<div class="clearDataFooter">';
		html += '<div class="vapeMenuItem" data-action="back" tabindex="0"><div class="vapeMenuItemIcon">←</div><div class="vapeMenuItemText">' + getTranslation('back') + '</div></div>';
		html += '</div>';
		html += '</div>';
		
		menuEl.innerHTML = html;
		
		var listEl = document.getElementById('clearDataList');
		var deleteAllBtn = document.getElementById('clearDataDeleteAll');
		var itemEls = listEl ? listEl.querySelectorAll('.clearDataItem') : [];
		var deleteBtns = menuEl.querySelectorAll('.clearDataItemDelete');
		var backBtn = menuEl.querySelector('[data-action="back"]');
		
		state.clearDataFocusedIndex = 0;
		state.clearDataMenuItems = [deleteAllBtn].concat([].slice.call(itemEls), [backBtn]);
		state.clearDataMenuItems = state.clearDataMenuItems.filter(Boolean);
		
		function updateClearDataFocus() {
			for (var k = 0; k < state.clearDataMenuItems.length; k++) {
				if (k === state.clearDataFocusedIndex) {
					addClass(state.clearDataMenuItems[k], 'focused');
					state.clearDataMenuItems[k].focus();
				} else {
					removeClass(state.clearDataMenuItems[k], 'focused');
				}
			}
		}
		
		function refreshClearDataMenu() {
			var newItems = getClearableItems();
			if (newItems.length === 0) {
				closeClearDataMenu();
				updateVapeMenuTranslations();
				return;
			}
			showClearDataMenu();
		}
		
		function confirmDelete(type, key, callback) {
			var info = getItemValueAndSize(type, key);
			var displayValue = (info.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
			var restoreFocus = function() {
				var menuEl = document.getElementById('clearDataMenu');
				if (menuEl && menuEl.style.display === 'flex') {
					var items = state.clearDataMenuItems;
					var idx = state.clearDataFocusedIndex;
					if (items && items[idx] && items[idx].focus) {
						setTimeout(function() { items[idx].focus(); }, 50);
					}
				}
			};
			showConfirmDialog(getTranslation('confirmDeleteItem'), {
				itemName: key,
				itemSize: info.valueSize,
				itemContent: displayValue
			}, function() {
				deleteSingleItem(type, key);
				if (callback) callback();
			}, restoreFocus);
		}
		
		function showConfirmDialog(titleText, contentDataOrHtml, onConfirm, onClose) {
			var dialog = document.getElementById('confirmDialog');
			if (!dialog) return;
			var title = document.getElementById('confirmDialogTitle');
			var content = document.getElementById('confirmDialogContent');
			var cancelBtn = document.getElementById('confirmDialogCancel');
			var confirmBtn = document.getElementById('confirmDialogConfirm');
			if (!title || !content || !cancelBtn || !confirmBtn) return;
			title.textContent = titleText;
			var contentHtml = '';
			if (contentDataOrHtml && typeof contentDataOrHtml === 'object' && contentDataOrHtml.itemName !== undefined) {
				var d = contentDataOrHtml;
				contentHtml = '<div class="confirmDialogItemInfo">';
				contentHtml += '<div class="confirmDialogItemRow"><strong>' + (d.itemName || '').replace(/</g, '&lt;') + '</strong> (' + formatBytes(d.itemSize || 0) + ')</div>';
				contentHtml += '<div class="confirmDialogItemScroll" id="confirmDialogItemScroll" tabindex="0">' + (d.itemContent || '') + '</div>';
				contentHtml += '</div>';
			} else {
				contentHtml = typeof contentDataOrHtml === 'string' ? contentDataOrHtml : '';
			}
			content.innerHTML = contentHtml;
			cancelBtn.textContent = getTranslation('cancel');
			confirmBtn.textContent = getTranslation('confirm');
			var currentButton = 0;
			var scrollEl = document.getElementById('confirmDialogItemScroll');
			var updateButtonFocus = function() {
				removeClass(cancelBtn, 'focused');
				removeClass(confirmBtn, 'focused');
				var btn = currentButton === 0 ? cancelBtn : confirmBtn;
				addClass(btn, 'focused');
				btn.focus();
			};
			var keyHandler;
			var hideDialog = function() {
				removeClass(dialog, 'visible');
				if (keyHandler && document.removeEventListener) document.removeEventListener('keydown', keyHandler, true);
				if (typeof onClose === 'function') onClose();
			};
			keyHandler = function(e) {
				var keyCode = e.keyCode || e.which;
				var keyName = e.key || e.keyIdentifier;
				if (keyCode === 27 || keyName === 'Escape') {
					e.preventDefault();
					hideDialog();
					return;
				}
				if (scrollEl) {
					if (keyCode === 38 || keyName === 'ArrowUp' || keyName === 'Up') {
						e.preventDefault();
						scrollEl.scrollTop = Math.max(0, scrollEl.scrollTop - 24);
						return;
					}
					if (keyCode === 40 || keyName === 'ArrowDown' || keyName === 'Down') {
						e.preventDefault();
						scrollEl.scrollTop = Math.min(scrollEl.scrollHeight - scrollEl.clientHeight, scrollEl.scrollTop + 24);
						return;
					}
				}
				if (keyCode === 37 || keyName === 'ArrowLeft' || keyName === 'Left') {
					e.preventDefault();
					currentButton = 0;
					updateButtonFocus();
					return;
				}
				if (keyCode === 39 || keyName === 'ArrowRight' || keyName === 'Right') {
					e.preventDefault();
					currentButton = 1;
					updateButtonFocus();
					return;
				}
				if (keyCode === 13 || keyCode === 32) {
					e.preventDefault();
					if (currentButton === 0) hideDialog();
					else { hideDialog(); if (onConfirm) onConfirm(); }
					return;
				}
			};
			cancelBtn.onclick = function() { hideDialog(); };
			confirmBtn.onclick = function() { hideDialog(); if (onConfirm) onConfirm(); };
			document.addEventListener('keydown', keyHandler, true);
			addClass(dialog, 'visible');
			currentButton = 0;
			updateButtonFocus();
		}
		
		for (var j = 0; j < deleteBtns.length; j++) {
			(function(btn) {
				var type = btn.getAttribute('data-type');
				var key = btn.getAttribute('data-key');
				btn.addEventListener('click', function(e) {
					e.stopPropagation();
					confirmDelete(type, key, refreshClearDataMenu);
				});
				btn.addEventListener('keydown', function(e) {
					if (e.keyCode === 13 || e.keyCode === 32) {
						e.preventDefault();
						confirmDelete(type, key, refreshClearDataMenu);
					}
				});
			})(deleteBtns[j]);
		}
		
		if (deleteAllBtn) {
			deleteAllBtn.addEventListener('click', function() {
				showClearDataConfirmation();
			});
			deleteAllBtn.addEventListener('keydown', function(e) {
				if (e.keyCode === 13 || e.keyCode === 32) {
					e.preventDefault();
					showClearDataConfirmation();
				}
			});
		}
		
		function closeClearDataMenu() {
			menuEl.style.display = 'none';
			if (typeof menuEl._clearDataFocusTrap === 'function') menuEl._clearDataFocusTrap();
			var vape = document.getElementById('vapeMenu');
			if (vape) { vape.classList.remove('vapeMenuHidden'); addClass(vape, 'visible'); state.isVisible = true; }
			updateVapeMenuTranslations();
		}
		if (backBtn) {
			backBtn.addEventListener('click', closeClearDataMenu);
			backBtn.addEventListener('keydown', function(e) {
				if (e.keyCode === 13 || e.keyCode === 32) {
					e.preventDefault();
					closeClearDataMenu();
				}
			});
		}
		
		for (var m = 0; m < itemEls.length; m++) {
			(function(item, idx) {
				var type = item.getAttribute('data-type');
				var key = item.getAttribute('data-key');
				item.addEventListener('click', function(e) {
					if (e.target.classList.contains('clearDataItemDelete')) return;
					confirmDelete(type, key, refreshClearDataMenu);
				});
				item.addEventListener('keydown', function(e) {
					if (e.keyCode === 13 || e.keyCode === 32) {
						e.preventDefault();
						confirmDelete(type, key, refreshClearDataMenu);
					}
				});
			})(itemEls[m], m);
		}
		
		menuEl.onkeydown = function(e) {
			var keyCode = e.keyCode || e.which;
			var keyName = e.key || e.keyIdentifier;
			if (keyCode === 27 || keyName === "Escape" || keyCode === 8 || keyName === "Backspace") {
				e.preventDefault();
				e.stopPropagation();
				closeClearDataMenu();
				return false;
			}
			if (keyCode === 38 || keyCode === 40) {
				e.preventDefault();
				e.stopPropagation();
				state.clearDataFocusedIndex = keyCode === 38
					? (state.clearDataFocusedIndex > 0 ? state.clearDataFocusedIndex - 1 : state.clearDataMenuItems.length - 1)
					: (state.clearDataFocusedIndex < state.clearDataMenuItems.length - 1 ? state.clearDataFocusedIndex + 1 : 0);
				updateClearDataFocus();
				var foc = state.clearDataMenuItems[state.clearDataFocusedIndex];
				if (foc && foc.scrollIntoView) foc.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
				return false;
			}
		};
		
		var focusTrapHandler = function(e) {
			var target = e.target;
			var card = menuEl.querySelector('.clearDataCard');
			var confirmDlg = document.getElementById('confirmDialog');
			var inConfirm = confirmDlg && confirmDlg.classList.contains('visible') && confirmDlg.contains(target);
			if (card && target && !card.contains(target) && !inConfirm && menuEl.style.display === 'flex') {
				e.preventDefault();
				var foc = state.clearDataMenuItems[state.clearDataFocusedIndex];
				if (foc && foc.focus) foc.focus();
			}
		};
		document.addEventListener('focusin', focusTrapHandler, true);
		menuEl._clearDataFocusTrap = function() {
			document.removeEventListener('focusin', focusTrapHandler, true);
		};
		
		updateClearDataFocus();
	}
	
	function isStartLogoVisible() {
		var startlogo = document.getElementById('startlogo');
		if (!startlogo) {
			console.log('[VapeMenu] isStartLogoVisible: startlogo element not found');
			return false;
		}
		
		var display = startlogo.style.display;
		var computedStyle = null;
		
		if (window.getComputedStyle) {
			computedStyle = window.getComputedStyle(startlogo);
			display = computedStyle ? computedStyle.display : display;
		} else if (startlogo.currentStyle) {
			display = startlogo.currentStyle.display || display;
		}
		
		var isVisible = display !== 'none' && 
			(startlogo.offsetWidth > 0 || startlogo.offsetHeight > 0);
		
		console.log('[VapeMenu] isStartLogoVisible:', {
			display: display,
			offsetWidth: startlogo.offsetWidth,
			offsetHeight: startlogo.offsetHeight,
			isVisible: isVisible
		});
		
		return isVisible;
	}
	
	function handleUpKey() {
		var now = new Date().getTime();
		var timeSinceLastPress = now - state.lastUpPress;
		
		console.log('[VapeMenu] handleUpKey called:', {
			timeSinceLastPress: timeSinceLastPress,
			doubleClickTimeout: state.doubleClickTimeout,
			isVisible: state.isVisible,
			isLoaded: ScriptLoader.isLoaded()
		});
		
		if (now - state.lastUpPress < state.doubleClickTimeout) {
			var isLoaded = ScriptLoader.isLoaded();
			var startLogoVisible = isStartLogoVisible();
			var shouldShow = !state.isVisible && (!isLoaded || startLogoVisible);
			
			console.log('[VapeMenu] Double press detected:', {
				isVisible: state.isVisible,
				isLoaded: isLoaded,
				startLogoVisible: startLogoVisible,
				shouldShow: shouldShow
			});
			
			if (shouldShow) {
				console.log('[VapeMenu] Opening menu...');
				show();
			} else {
				console.log('[VapeMenu] Closing menu...');
				hide();
			}
			state.lastUpPress = 0;
		} else {
			console.log('[VapeMenu] First press, waiting for second...');
			state.lastUpPress = now;
		}
	}
	
	function handleKeyDown(event) {
		if (state.sourceMenuVisible && sourceMenuItems) {
			return;
		}
		
		if (!state.isVisible) return;
		
		var keyCode = event.keyCode || event.which;
		var keyName = event.key || event.keyIdentifier;
		
		if (keyCode === 38 || keyName === "ArrowUp" || keyName === "Up") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.currentFocusedIndex > 0) {
				state.currentFocusedIndex--;
			} else {
				state.currentFocusedIndex = menuItems.length - 1;
			}
			updateFocus();
			if (menuItems && menuItems[state.currentFocusedIndex]) {
				menuItems[state.currentFocusedIndex].focus();
			}
			return false;
		}
		
		if (keyCode === 40 || keyName === "ArrowDown" || keyName === "Down") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.currentFocusedIndex < menuItems.length - 1) {
				state.currentFocusedIndex++;
			} else {
				state.currentFocusedIndex = 0;
			}
			updateFocus();
			if (menuItems && menuItems[state.currentFocusedIndex]) {
				menuItems[state.currentFocusedIndex].focus();
			}
			return false;
		}
		
		if (keyCode === 27 || keyName === "Escape" || keyCode === 8 || keyName === "Backspace") {
			event.preventDefault();
			event.stopPropagation();
			hide();
			return false;
		}
	}
	
	function isSourceMenuVisible() {
		return state.sourceMenuVisible;
	}
	
	function handleSourceMenuKey(event) {
		if (!state.sourceMenuVisible || !sourceMenuItems) return false;
		
		var keyCode = event.keyCode || event.which;
		var keyName = event.key || event.keyIdentifier;
		
		if (keyCode === 38 || keyName === "ArrowUp" || keyName === "Up") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.sourceMenuFocusedIndex > 0) {
				state.sourceMenuFocusedIndex--;
			} else {
				state.sourceMenuFocusedIndex = sourceMenuItems.length - 1;
			}
			updateSourceMenuFocus();
			if (sourceMenuItems && sourceMenuItems[state.sourceMenuFocusedIndex]) {
				sourceMenuItems[state.sourceMenuFocusedIndex].focus();
			}
			return true;
		}
		
		if (keyCode === 40 || keyName === "ArrowDown" || keyName === "Down") {
			event.preventDefault();
			event.stopPropagation();
			
			if (state.sourceMenuFocusedIndex < sourceMenuItems.length - 1) {
				state.sourceMenuFocusedIndex++;
			} else {
				state.sourceMenuFocusedIndex = 0;
			}
			updateSourceMenuFocus();
			if (sourceMenuItems && sourceMenuItems[state.sourceMenuFocusedIndex]) {
				sourceMenuItems[state.sourceMenuFocusedIndex].focus();
			}
			return true;
		}
		
		if (keyCode === 13 || keyCode === 32) {
			event.preventDefault();
			var item = sourceMenuItems[state.sourceMenuFocusedIndex];
			if (item) {
				var sourceIdx = item.getAttribute('data-source-index');
				var act = item.getAttribute('data-action');
				handleSourceMenuItemClick(state.sourceMenuFocusedIndex, sourceIdx, act);
			}
			return true;
		}
		
		if (keyCode === 27 || keyName === "Escape" || keyCode === 8 || keyName === "Backspace") {
			event.preventDefault();
			event.stopPropagation();
			closeSourceMenu(true);
			return true;
		}
		
		return false;
	}
	
	function isClearDataMenuVisible() {
		var el = document.getElementById('clearDataMenu');
		return el && el.style && el.style.display === 'flex';
	}
	
	function closeClearDataMenuPublic() {
		var menuEl = document.getElementById('clearDataMenu');
		if (!menuEl || menuEl.style.display !== 'flex') return;
		menuEl.style.display = 'none';
		if (typeof menuEl._clearDataFocusTrap === 'function') menuEl._clearDataFocusTrap();
		var vape = document.getElementById('vapeMenu');
		if (vape) { vape.classList.remove('vapeMenuHidden'); addClass(vape, 'visible'); state.isVisible = true; }
	}
	
	return {
		init: init,
		bindLoadingSourceClick: bindLoadingSourceClick,
		show: show,
		hide: hide,
		handleUpKey: handleUpKey,
		handleKeyDown: handleKeyDown,
		handleSourceMenuKey: handleSourceMenuKey,
		isVisible: function() { return state.isVisible || state.sourceMenuVisible; },
		isSourceMenuVisible: isSourceMenuVisible,
		isClearDataMenuVisible: isClearDataMenuVisible,
		closeClearDataMenu: closeClearDataMenuPublic
	};
})();

(function bindLoadingSourceEarly() {
	function tryBind() {
		if (typeof VapeMenu !== 'undefined' && VapeMenu.bindLoadingSourceClick) {
			VapeMenu.bindLoadingSourceClick();
		}
	}
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		tryBind();
	} else if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', tryBind, false);
	}
})();

(function() {
	function initLoader() {
		VapeMenu.init();
		ScriptLoader.init();
	}
	
	var loaderStartDelay = 300;
	if (typeof jQuery !== "undefined") {
		jQuery(document).ready(function() {
			setTimeout(initLoader, loaderStartDelay);
		});
	} else {
		if (document.readyState === "complete" || document.readyState === "interactive") {
			setTimeout(initLoader, loaderStartDelay);
		} else if (document.addEventListener) {
			document.addEventListener("DOMContentLoaded", function() {
				setTimeout(initLoader, loaderStartDelay);
			}, false);
		} else if (window.attachEvent) {
			window.attachEvent("onload", function() {
				setTimeout(initLoader, loaderStartDelay);
			});
		} else {
			window.onload = function() {
				setTimeout(initLoader, loaderStartDelay);
			};
		}
	}
})();

// Opens the FXML portal via the engine's Smart Hub preview hook: once its start page
// is ready, the engine navigates to window.tizenPreviewPending, and it re-checks
// the pending item on every "appcontrol" event.
function openFxmlPortal() {
	window.tizenPreviewPending = { title: getTranslation('openFxmlPortal'), playlist_url: FXML_PORTAL_URL, stream_url: '' };
	window._previewNavApplied = 0;
	if (!ScriptLoader.isLoaded()) {
		ScriptLoader.resumeLoading();
		return;
	}
	var ev;
	try {
		ev = new Event('appcontrol');
	} catch (e) {
		ev = document.createEvent('Event');
		ev.initEvent('appcontrol', true, true);
	}
	window.dispatchEvent(ev);
}

function isConfirmDialogVisible() {
	var dialog = document.getElementById('confirmDialog');
	return dialog && hasClass(dialog, 'visible');
}

function isStartLogoVisibleGlobal() {
	var startlogo = document.getElementById('startlogo');
	if (!startlogo) return false;
	
	var display = startlogo.style.display;
	var computedStyle = null;
	
	if (window.getComputedStyle) {
		computedStyle = window.getComputedStyle(startlogo);
		display = computedStyle ? computedStyle.display : display;
	} else if (startlogo.currentStyle) {
		display = startlogo.currentStyle.display || display;
	}
	
	return display !== 'none' && 
		(startlogo.offsetWidth > 0 || startlogo.offsetHeight > 0);
}

function keyHandlerPress(event) {
	var keyCode = event.keyCode || event.which;
	var keyName = event.key || event.keyIdentifier;
	
	if (isConfirmDialogVisible()) {
		return;
	}
	
	var menuContainerVisible = isStartLogoVisibleGlobal();
	if (!menuContainerVisible) {
		if (typeof keyHandler !== "undefined") keyHandler(event);
		return;
	}
	
	if (VapeMenu.isClearDataMenuVisible()) {
		if (keyCode === 27 || keyName === "Escape" || keyCode === 8 || keyName === "Backspace") {
			event.preventDefault();
			event.stopPropagation();
			VapeMenu.closeClearDataMenu();
			return;
		}
		if (keyCode === 38 || keyCode === 40 || keyName === "ArrowUp" || keyName === "ArrowDown" || keyName === "Up" || keyName === "Down") {
			return;
		}
	}
	
	if (VapeMenu.isSourceMenuVisible()) {
		if (VapeMenu.handleSourceMenuKey(event)) {
			return;
		}
	}
	
	if (VapeMenu.isVisible()) {
		VapeMenu.handleKeyDown(event);
		return;
	}
	
	var isLoaded = ScriptLoader.isLoaded();
	var isUpKey = (keyCode === 38 || keyName === "ArrowUp" || keyName === "Up");
	
	if (isUpKey && (!isLoaded || menuContainerVisible)) {
		event.preventDefault();
		event.stopPropagation();
		VapeMenu.handleUpKey();
		return false;
	}
	
	if (typeof keyHandler !== "undefined") {
		keyHandler(event);
	}
}

if (document.addEventListener) {
	document.addEventListener("keydown", keyHandlerPress, true);
} else if (document.attachEvent) {
	document.attachEvent("onkeydown", keyHandlerPress);
}

function clearLoadingScreen() {
	try {
		var loadingTitle = document.getElementById('loadingTitle');
		if (loadingTitle) {
			loadingTitle.style.animation = 'none';
			loadingTitle.style.opacity = '0';
			
			var spans = loadingTitle.querySelectorAll('span');
			for (var i = 0; i < spans.length; i++) {
				var span = spans[i];
				if (span) {
					span.style.animation = 'none';
				}
			}
			
			setTimeout(function() {
				if (loadingTitle && loadingTitle.parentNode) {
					loadingTitle.parentNode.removeChild(loadingTitle);
				}
				loadingTitle = null;
			}, 100);
		}
		
		var startlogo = document.getElementById('startlogo');
		if (startlogo) {
			setTimeout(function() {
				if (startlogo && startlogo.parentNode) {
					startlogo.style.display = 'none';
					startlogo.innerHTML = '';
				}
				startlogo = null;
			}, 200);
		}
		
		var startcmd = document.getElementById('startcmd');
		if (startcmd) {
			startcmd.style.display = 'none';
			startcmd = null;
		}
		
	} catch(e) {
		if (typeof console !== 'undefined' && console.error) {
			console.error('Error clearing loading screen:', e);
		}
	}
}

var loadingScreenCheckInterval = null;
var loadingScreenCleared = false;

function startLoadingScreenMonitor() {
	if (loadingScreenCheckInterval) return;
	
	loadingScreenCheckInterval = setInterval(function() {
		var startlogo = document.getElementById('startlogo');
		
		if (!startlogo) {
			if (loadingScreenCheckInterval) {
				clearInterval(loadingScreenCheckInterval);
				loadingScreenCheckInterval = null;
			}
			return;
		}
		
		var display = startlogo.style.display;
		var computedStyle = null;
		
		if (window.getComputedStyle) {
			computedStyle = window.getComputedStyle(startlogo);
			display = computedStyle ? computedStyle.display : display;
		} else if (startlogo.currentStyle) {
			display = startlogo.currentStyle.display || display;
		}
		
		var isVisible = display !== 'none' && 
			(startlogo.offsetWidth > 0 || startlogo.offsetHeight > 0);
		
		if (!isVisible && !loadingScreenCleared) {
			loadingScreenCleared = true;
			clearLoadingScreen();
			
			if (loadingScreenCheckInterval) {
				clearInterval(loadingScreenCheckInterval);
				loadingScreenCheckInterval = null;
			}
		}
	}, 500);
}

if (typeof window !== 'undefined') {	
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		startLoadingScreenMonitor();
	} else if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', startLoadingScreenMonitor, false);
	} else if (window.attachEvent) {
		window.attachEvent('onload', startLoadingScreenMonitor);
	}
}