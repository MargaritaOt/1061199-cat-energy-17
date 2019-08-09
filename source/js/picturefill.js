/ *! picturefill - v3.0.2 - 2016-02-12
 * https://scottjehl.github.io/picturefill/
 * Авторские права (c) 2016 г. https://github.com/scottjehl/picturefill/blob/master/Authors.txt; Лицензионный MIT
 * /
/ *! Геккон-Картинка - v1.0
 * https://github.com/scottjehl/picturefill/tree/3.0/src/plugins/gecko-picture
 * Ранняя реализация картинки Firefox (до FF41) является статичной и делает
 * не реагирует на изменения вида. Этот крошечный модуль исправляет это.
 * /
(функция (окно) {
	/ * jshint eqnull: true * /
	var ua = navigator.userAgent;

	if (window.HTMLPictureElement && ((/ecko/).test(ua) && ua.match (/ rv \: (\ d +) /) && RegExp. $ 1 <45)) {
		addEventListener ("resize", (function () {
			таймер вар;

			var dummySrc = document.createElement ("source");

			var fixRespimg = function (img) {
				вар источник, размеры;
				var picture = img.parentNode;

				if (picture.nodeName.toUpperCase () === "ИЗОБРАЖЕНИЕ") {
					source = dummySrc.cloneNode ();

					picture.insertBefore (source, picture.firstElementChild);
					setTimeout (function () {
						picture.removeChild (источник);
					});
				} else if (! img._pfLastSize || img.offsetWidth> img._pfLastSize) {
					img._pfLastSize = img.offsetWidth;
					размеры = img.sizes;
					img.sizes + = ", 100vw";
					setTimeout (function () {
						img.sizes = размеры;
					});
				}
			};

			var findPictureImgs = function () {
				вар я;
				var imgs = document.querySelectorAll ("picture> img, img [srcset] [sizes]");
				для (i = 0; i <imgs.length; i ++) {
					fixRespimg (ГИМ [I]);
				}
			};
			var onResize = function () {
				clearTimeout (таймер);
				timer = setTimeout (findPictureImgs, 99);
			};
			var mq = window.matchMedia && matchMedia ("(ориентация: ландшафт)");
			var init = function () {
				OnResize ();

				if (mq && mq.addListener) {
					mq.addListener (OnResize);
				}
			};

			dummySrc.srcset = "data: image / gif; base64, R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw ==";

			if (/^[c|i]|d$/.test(document.readyState || "")) {
				в этом();
			} еще {
				document.addEventListener ("DOMContentLoaded", init);
			}

			вернуть onResize;
		}) ());
	}
})(окно);

/ *! Picturefill - v3.0.2
 * http://scottjehl.github.io/picturefill
 * Авторские права (c) 2015 г. https://github.com/scottjehl/picturefill/blob/master/Authors.txt;
 * Лицензия: MIT
 * /

(функция (окно, документ, не определено) {
	// Включить строгий режим
	«использовать строгое»;

	// HTML shim | v для старого IE (IE9 все еще будет нуждаться в обходе тега HTML-видео)
	document.createElement ("изображение");

	var warn, eminpx, alwaysCheckWDescriptor, evalId;
	// локальный объект для ссылок на методы и тестирования воздействия
	var pf = {};
	var isSupportTestReady = false;
	var noop = function () {};
	var image = document.createElement ("img");
	var getImgAttr = image.getAttribute;
	var setImgAttr = image.setAttribute;
	var removeImgAttr = image.removeAttribute;
	var docElem = document.documentElement;
	var types = {};
	var cfg = {
		// выбор ресурса:
		алгоритм: ""
	};
	var srcAttr = "data-pfsrc";
	var srcsetAttr = srcAttr + "set";
	// сниффинг выполняется для незаметных функций загрузки img,
	// сделать некоторые несущественные перф оптимизации
	var ua = navigator.userAgent;
	var supportAbort = (/rident/).test(ua) || ((/ecko/).test(ua) && ua.match (/ rv \: (\ d +) /) && RegExp. $ 1> 35);
	var curSrcProp = "currentSrc";
	var regWDesc = / \ s + \ +? \ d + (e \ d +)? w /;
	var regSize = /(\([^)]+\))?\s*(.+)/;
	var setOptions = window.picturefillCFG;
	/ **
	 * Свойство ярлыка для https://w3c.github.io/webappsec/specs/mixedcontent/#restricts-mixed-content (для простого переопределения в тестах)
	 * /
	// baseStyle также используется getEmValue (то есть: width: 1em важно)
	var baseStyle = "position: absolute; left: 0; видимость: скрытая; display: block; padding: 0; border: none; размер шрифта: 1em; ширина: 1em; переполнение: скрытое; clip: rect (0px, 0px, 0px, 0px) ";
	var fsCss = "font-size: 100%! Important;";
	var isVwDirty = true;

	var cssCache = {};
	var sizeLengthCache = {};
	var DPR = window.devicePixelRatio;
	вар единицы = {
		px: 1,
		"в": 96
	};
	var anchor = document.createElement ("a");
	/ **
	 * флаг yesRun, используемый для setOptions. это правда, setOptions переоценит
	 * @type {boolean}
	 * /
	varreadyRun = false;

	// Многоразовые, не "g" регулярные выражения

	// (Не используйте \ s, чтобы избежать совпадения с неразрывным пробелом.)
	var regexLeadingSpaces = / ^ [\ t \ n \ r \ u000c] + /,
	    regexLeadingCommasOrSpaces = / ^ [, \ t \ n \ r \ u000c] + /,
	    regexLeadingNotSpaces = / ^ [^ \ t \ n \ r \ u000c] + /,
	    regexTrailingCommas = / [,] + $ /,
	    regexNonNegativeInteger = / ^ \ d + $ /,

	    // (положительные или отрицательные или беззнаковые целые или десятичные числа, без или без показателей степени.
	    // Должен содержать хотя бы одну цифру.
	    // В соответствии со спецификацией тестов любая десятичная точка должна сопровождаться цифрой.
	    // Не допускается начальный знак плюс.)
	    // https://html.spec.whatwg.org/multipage/infrastructure.html#valid-floating-point-number
	    regexFloatingPoint = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9]+)? $ /;

	var on = function (obj, evt, fn, capture) {
		if (obj.addEventListener) {
			obj.addEventListener (evt, fn, capture || false);
		} else if (obj.attachEvent) {
			obj.attachEvent ("on" + evt, fn);
		}
	};

	/ **
	 * простая функция памятки:
	 * /

	var memoize = function (fn) {
		var cache = {};
		функция возврата (вход) {
			if (! (вход в кеш)) {
				кеш [вход] = fn (вход);
			}
			возврат кеша [вход];
		};
	};

	// ПОЛЕЗНЫЕ ФУНКЦИИ

	// Руководство быстрее чем RegEx
	// http://jsperf.com/whitespace-character/5
	function isSpace (c) {
		return (c === "\ u0020" || // пробел
		        c === "\ u0009" || // горизонтальная вкладка
		        c === "\ u000A" || // новая линия
		        c === "\ u000C" || // подача формы
		        c === "\ u000D"); // возврат каретки
	}

	/ **
	 * получает медиазапрос и возвращает логическое значение или получает длину CSS и возвращает число
	 * @param css mediaqueries или css length
	 * @returns {логическое | число}
	 *
	 * на основании: https://gist.github.com/jonathantneal/db4f77009b155f083738
	 * /
	var evalCSS = (function () {

		var regLength = /^([\d\.]+)(em|vw|px)$/;
		var replace = function () {
			var args = arguments, index = 0, string = args [0];
			while (индекс ++ в аргументах) {
				string = string.replace (args [index], args [++ index]);
			}
			возвращаемая строка;
		};

		var buildStr = memoize (function (css) {

			return "return" + replace ((css || "") .toLowerCase (),
				// интерпретируем `и`
				/ \ band \ b / g, "&&",

				// интерпретируем `,`
				/, / г, "||",

				// интерпретировать `min-` как> =
				/ min - ([az- \ s] +): / g, "e. $ 1> =",

				// интерпретировать `max-` как <=
				/ max - ([az- \ s] +): / g, "e. $ 1 <=",

				// вычисляем значение
				/ calc ([^)] +) / g, "($ 1)",

				// интерпретировать значения CSS
				/(\d+[\.]*[\d]*)([az]+)/g, "($ 1 * e. $ 2)",
				// сделать eval менее злым
				/^(?!(e.[az]|[0-9\.&=|><\+\-\*\(\)\/])).*/ig, ""
			) + ";";
		});

		функция возврата (css, length) {
			var parsedLength;
			if (! (css в cssCache)) {
				cssCache [css] = false;
				if (length && (parsedLength = css.match (regLength))) {
					cssCache [css] = parsedLength [1] * единиц [parsedLength [2]];
				} еще {
					/ * jshint зло: правда * /
					пытаться{
						cssCache [css] = новая функция («e», buildStr (css)) (единицы измерения);
					} catch (e) {}
					/ * jshint зло: ложь * /
				}
			}
			return cssCache [css];
		};
	}) ();

	var setResolution = функция (кандидат, sizeattr) {
		if (candid.w) {// h = означает высоту: || descriptor.type === 'h' не обрабатывать пока ...
			кандидат.cWidth = pf.calcListLength (sizesattr || "100vw");
			Кандидат.рес = Кандидат.w / Кандидат.cWidth;
		} еще {
			кандидат.рес = кандидат.д;
		}
		вернуть кандидата;
	};

	/ **
	 *
	 * @param opt
	 * /
	var picturefill = function (opt) {

		if (! isSupportTestReady) {return;}

		элементы var, i, plen;

		var options = opt || {};

		if (options.elements && options.elements.nodeType === 1) {
			if (options.elements.nodeName.toUpperCase () === "IMG") {
				options.elements = [options.elements];
			} еще {
				options.context = options.elements;
				options.elements = null;
			}
		}

		elements = options.elements || pf.qsa ((options.context || документ), (options.reevaluate || options.reselect)? pf.sel: pf.selShort);

		if ((plen = elements.length)) {

			pf.setupRun (параметры);
			readyRun = true;

			// Перебираем все элементы
			для (i = 0; i <plen; i ++) {
				pf.fillImg (elements [i], options);
			}

			pf.teardownRun (параметры);
		}
	};

	/ **
	 * выводит предупреждение для разработчика
	 * @param {message}
	 * @type {Function}
	 * /
	warn = (window.console && console.warn)?
		функция (сообщение) {
			console.warn (сообщение);
		}:
		Noop
	;

	if (! (curSrcProp в изображении)) {
		curSrcProp = "src";
	}

	// Добавить поддержку стандартных типов пантомимы.
	types ["image / jpeg"] = true;
	types ["image / gif"] = true;
	types ["image / png"] = true;

	function detectTypeSupport (type, typeUri) {
		// на основе теста img-webp без потерь Modernizr
		// примечание: асинхронный
		var image = new window.Image ();
		image.onerror = function () {
			типы [тип] = ложь;
			picturefill ();
		};
		image.onload = function () {
			types [type] = image.width === 1;
			picturefill ();
		};
		image.src = typeUri;
		возврат "в ожидании";
	}

	// проверить поддержку SVG
	types ["image / svg + xml"] = document.implementation.hasFeature ("http://www.w3.org/TR/SVG11/feature#Image", "1.1");

	/ **
	 * обновляет внутреннее свойство vW с текущей шириной области просмотра в пикселях
	 * /
	function updateMetrics () {

		isVwDirty = false;
		DPR = window.devicePixelRatio;
		cssCache = {};
		sizeLengthCache = {};

		pf.DPR = DPR || 1;

		units.width = Math.max (window.innerWidth || 0, docElem.clientWidth);
		units.height = Math.max (window.innerHeight || 0, docElem.clientHeight);

		unit.vw = units.width / 100;
		unit.vh = unit.height / 100;

		evalId = [unit.height, unit.width, DPR] .join ("-");

		unit.em = pf.getEmValue ();
		unit.rem = units.em;
	}

	function chooseLowRes (lowerValue, upperValue, dprValue, isCached) {
		var bonusFactor, tooMuch, bonus, meanDensity;

		// экспериментальная
		if (cfg.algorithm === "saveData") {
			if (lowerValue> 2.7) {
				meanDensity = dprValue + 1;
			} еще {
				tooMuch = upperValue - dprValue;
				bonusFactor = Math.pow (lowerValue - 0,6, 1,5);

				bonus = tooMuch * bonusFactor;

				if (isCached) {
					бонус + = 0,1 * bonusFactor;
				}

				meanDensity = lowerValue + бонус;
			}
		} еще {
			meanDensity = (dprValue> 1)?
				Math.sqrt (lowerValue * upperValue):
				lowerValue;
		}

		return meanDensity> dprValue;
	}

	function applyBestCandidate (img) {
		var srcSetCandidates;
		var MatchSet = pf.getSet (img);
		переменная оценена = ложь;
		if (matchSet! == "pending") {
			оцененный = evalId;
			if (MatchSet) {
				srcSetCandidates = pf.setRes (MatchSet);
				pf.applySetCandidate (srcSetCandidates, img);
			}
		}
		img [pf.ns] .evaled = оцененный;
	}

	function ascendingSort (a, b) {
		вернуть a.res - b.res;
	}

	функция setSrcToCur (img, src, set) {
		Вар кандидат;
		if (! set && src) {
			set = img [pf.ns] .sets;
			set = set && set [set.length - 1];
		}

		кандидат = getCandidateForSrc (src, set);

		если (кандидат) {
			src = pf.makeUrl (src);
			img [pf.ns] .curSrc = src;
			img [pf.ns] .curCan = кандидат;

			if (! candid.res) {
				setResolution (кандидат, кандидат.set.sizes);
			}
		}
		вернуть кандидата;
	}

	function getCandidateForSrc (src, set) {
		я, кандидат, кандидаты;
		if (src && set) {
			андидаты = pf.parseSet (set);
			src = pf.makeUrl (src);
			для (я = 0; я <кандидатов. длина; я ++) {
				if (src === pf.makeUrl (андидаты [i] .url)) {
					кандидат = кандидаты [я];
					перерыв;
				}
			}
		}
		вернуть кандидата;
	}

	function getAllSourceElements (изображение, кандидаты) {
		var i, len, source, srcset;

		// Несоответствие SPEC, предназначенное для размера и производительности:
		// фактически должны использоваться только исходные элементы, предшествующие img
		// также обратите внимание: не используйте qsa здесь, потому что IE8 иногда не любит source как ключевую часть в селекторе
		var sources = picture.getElementsByTagName ("source");

		для (i = 0, len = sources.length; i <len; i ++) {
			источник = источники [я];
			source [pf.ns] = true;
			srcset = source.getAttribute ("srcset");

			// если у источника нет атрибута srcset, пропустить
			if (srcset) {
				кандидатов.пуш ({
					srcset: srcset,
					media: source.getAttribute ("media"),
					type: source.getAttribute ("type"),
					размеры: source.getAttribute ("размеры")
				});
			}
		}
	}

	/ **
	 * Srcset Parser
	 * Алекс Белл | Лицензия MIT
	 *
	 * @returns Array [{url: _, d: _, w: _, h: _, набор: _ (????)}, ...]
	 *
	 * На основе Super Duper тесно на эталонный алгоритм в:
	 * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-srcset-attribute
	 * /

	// 1. Пусть input будет значением, переданным этому алгоритму.
	// (TO-DO: Объясните, что такое аргумент «set». Возможно, выберите более
	// описательное и более доступное для поиска имя. Так как прохождение "набора" в самом деле
	// ничего общего с синтаксическим анализом, я бы предпочел это назначение в конце концов
	// перейти во внешний фн.)
	function parseSrcset (input, set) {

		function collectCharacters (regEx) {
			вар чарс,
			    match = regEx.exec (input.substring (pos));
			if (match) {
				chars = match [0];
				pos + = chars.length;
				возвратные символы;
			}
		}

		var inputLength = input.length,
		    URL,
		    дескрипторы,
		    currentDescriptor,
		    государство,
		    с,

		    // 2. Пусть position будет указателем на вход, изначально указывающий на начало
		    // строки.
		    pos = 0,

		    // 3. Пусть кандидаты будут изначально пустым исходным набором.
		    кандидаты = [];

		/ **
		* Добавляет свойства дескриптора к кандидату, толкает в массив кандидатов
		* возврат не определен
		* /
		// (Объявлен вне цикла while, так что он создается только один раз.
		// (Этот fn определен перед использованием, чтобы передать JSHINT.
		// К сожалению, это нарушает последовательность комментариев спецификации. : /)
		function parseDescriptors () {

			// 9. Парсер дескриптора: Пусть error будет no.
			var pError = false,

			// 10. Пусть ширина отсутствует.
			// 11. Пусть плотность отсутствует.
			// 12. Пусть future-compat-h отсутствует. (Мы реализуем это сейчас как ч)
			    ш, д, ч, я,
			    кандидат = {},
			    desc, lastChar, value, intVal, floatVal;

			// 13. Для каждого дескриптора в дескрипторах запускаем соответствующий набор шагов
			// из следующего списка:
			для (i = 0; i <descriptors.length; i ++) {
				desc = descriptors [i];

				lastChar = desc [desc.length - 1];
				значение = desc.substring (0, desc.length - 1);
				intVal = parseInt (значение, 10);
				floatVal = parseFloat (значение);

				// Если дескриптор состоит из действительного неотрицательного целого числа, за которым следует
				// символ U + 0077 LATIN SMALL LETTER W
				if (regexNonNegativeInteger.test (value) && (lastChar === "w")) {

					// Если ширина и плотность не отсутствуют, то пусть error будет yes.
					if (w || d) {pError = true;}

					// Применяем правила разбора неотрицательных целых чисел к дескриптору.
					// Если результат равен нулю, пусть error будет yes.
					// Иначе, пусть ширина будет результатом.
					if (intVal === 0) {pError = true;} else {w = intVal;}

				// Если дескриптор состоит из действительного числа с плавающей запятой, за которым следует
				// символ U + 0078 LATIN SMALL LETTER X
				} else if (regexFloatingPoint.test (value) && (lastChar === "x")) {

					// Если ширина, плотность и future-compat-h отсутствуют, тогда допустим ошибку
					// быть да.
					if (w || d || h) {pError = true;}

					// Применяем правила разбора значений чисел с плавающей запятой к дескриптору.
					// Если результат меньше нуля, пусть error будет yes. В противном случае, пусть плотность
					// быть результатом.
					if (floatVal <0) {pError = true;} else {d = floatVal;}

				// Если дескриптор состоит из действительного неотрицательного целого числа, за которым следует
				// символ U + 0068 LATIN SMALL LETTER H
				} else if (regexNonNegativeInteger.test (value) && (lastChar === "h")) {

					// Если высота и плотность не оба отсутствуют, тогда пусть error будет yes.
					if (h || d) {pError = true;}

					// Применяем правила разбора неотрицательных целых чисел к дескриптору.
					// Если результат равен нулю, пусть error будет yes. В противном случае, пусть в будущем compat-h
					// быть результатом.
					if (intVal === 0) {pError = true;} else {h = intVal;}

				// Все остальное, пусть ошибка будет да.
				} else {pError = true;}
			} // (закрыть шаг 13 для цикла)

			// 15. Если ошибки все еще нет, то добавляем новый источник изображения к кандидатам, чьи
			// URL - это URL, связанный с шириной ширины, если не отсутствует, и пикселем
			// плотность плотности, если не отсутствует. В противном случае возникает ошибка разбора.
			if (! pError) {
				кандидат.url = URL;

				if (w) {кандидат.w = w;}
				if (d) {кандидат.d = d;}
				if (h) {кандидат.h = h;}
				if (! h &&! d &&! w) {кандидат.d = 1;}
				if (андидат.d === 1) {set.has1x = true;}
				кандидат.сеть = набор;

				candidates.push (кандидат);
			}
		} // (закрыть parseDescriptors fn)

		/ **
		* Токенизирует свойства дескриптора до разбора
		* Возвращает неопределенное.
		* (Опять же, этот fn определен перед использованием, чтобы передать JSHINT.
		* К сожалению, это нарушает логическую последовательность комментариев к спецификации. : /)
		* /
		function tokenize () {

			// 8.1. Токенайзер дескриптора: пропустить пробел
			collectCharacters (regexLeadingSpaces);

			// 8.2. Пусть текущий дескриптор будет пустой строкой.
			currentDescriptor = "";

			// 8.3. Пусть состояние будет в дескрипторе.
			состояние = "в дескрипторе";

			while (true) {

				// 8.4. Пусть с будет символ в позиции.
				c = input.charAt (pos);

				// Выполните следующие действия в зависимости от значения состояния.
				// Для этого шага EOF - это специальный символ, представляющий
				// эта позиция после конца ввода.

				// в дескрипторе
				if (state === "in descriptor") {
					// Делаем следующее в зависимости от значения c:

				  // Пробел
				  // Если текущий дескриптор не пустой, добавляем текущий дескриптор к
				  // дескрипторы и пусть текущий дескриптор будет пустой строкой.
				  // Установить состояние после дескриптора.
					if (isSpace (c)) {
						if (currentDescriptor) {
							descriptors.push (currentDescriptor);
							currentDescriptor = "";
							состояние = "после дескриптора";
						}

					// U + 002C COMMA (,)
					// Переход на следующую позицию ввода. Если текущий дескриптор
					// не пусто, добавить текущий дескриптор к дескрипторам. Прыгать на ступеньку
					// помеченный дескриптор парсера.
					} else if (c === ",") {
						pos + = 1;
						if (currentDescriptor) {
							descriptors.push (currentDescriptor);
						}
						parseDescriptors ();
						вернуть;

					// U + 0028 ЛЕВОЙ РОДИТЕЛЬ (()
					// Добавить c к текущему дескриптору. Установите состояние в паранах.
					} else if (c === "\ u0028") {
						currentDescriptor = currentDescriptor + c;
						состояние = "в паранах";

					// EOF
					// Если текущий дескриптор не пустой, добавляем текущий дескриптор к
					// дескрипторы. Перейти к шагу, помеченному дескриптором парсера.
					} else if (c === "") {
						if (currentDescriptor) {
							descriptors.push (currentDescriptor);
						}
						parseDescriptors ();
						вернуть;

					// Что-нибудь еще
					// Добавить c к текущему дескриптору.
					} еще {
						currentDescriptor = currentDescriptor + c;
					}
				// (конец "в дескрипторе"

				// в паренсе
				} else if (state === "in parens") {

					// U + 0029 ПРАВЫЙ РОДИТЕЛЬ ())
					// Добавить c к текущему дескриптору. Установить состояние в дескрипторе.
					if (c === ")") {
						currentDescriptor = currentDescriptor + c;
						состояние = "в дескрипторе";

					// EOF
					// Добавляем текущий дескриптор к дескрипторам. Перейти к шагу с надписью
					// парсер дескриптора.
					} else if (c === "") {
						descriptors.push (currentDescriptor);
						parseDescriptors ();
						вернуть;

					// Что-нибудь еще
					// Добавить c к текущему дескриптору.
					} еще {
						currentDescriptor = currentDescriptor + c;
					}

				// после дескриптора
				} else if (state === "после дескриптора") {

					// Делаем следующее в зависимости от значения c:
					// Пробел: оставайтесь в этом состоянии.
					if (isSpace (c)) {

					// EOF: Перейти к шагу, помеченному синтаксическим анализатором дескриптора.
					} else if (c === "") {
						parseDescriptors ();
						вернуть;

					// Что-нибудь еще
					// Установить состояние в дескриптор. Установить позицию для предыдущего символа при вводе.
					} еще {
						состояние = "в дескрипторе";
						pos - = 1;

					}
				}

				// Переход на следующую позицию ввода.
				pos + = 1;

			// Повторить этот шаг.
			} // (закрываем пока истинный цикл)
		}

		// 4. Цикл разделения: Собираем последовательность символов, которые являются пробелами
		// символы или символы U + 002C COMMA. Если какие-либо символы U + 002C COMMA
		// были собраны, то есть ошибка разбора.
		while (true) {
			collectCharacters (regexLeadingCommasOrSpaces);

			// 5. Если позиция находится за концом ввода, вернуть кандидатов и отменить эти шаги.
			if (pos> = inputLength) {
				вернуть кандидатов; // (мы закончили, это единственный путь возврата)
			}

			// 6. Собрать последовательность символов, которые не являются пробелами,
			// и пусть это будет URL.
			url = collectCharacters (regexLeadingNotSpaces);

			// 7. Пусть дескрипторы будут новым пустым списком.
			дескрипторы = [];

			// 8. Если URL заканчивается символом COMMA U + 002C (,), выполните следующие подэтапы:
			// (1). Удалите все завершающие символы U + 002C COMMA из URL. Если это удалено
			// более одного символа, это ошибка разбора.
			if (url.slice (-1) === ",") {
				url = url.replace (regexTrailingCommas, "");
				// (Перейти к шагу 9, чтобы пропустить токенизацию и просто выдвинуть кандидата).
				parseDescriptors ();

			// В противном случае выполните следующие подэтапы:
			} еще {
				токенизировать ();
			} // (закрыть остальное из шага 8)

		// 16. Возвращаемся к шагу с меткой цикла разбиения.
		} // (Закрытие большого цикла while.)
	}

	/ *
	 * Размер парсера
	 *
	 * Алекс Белл | Лицензия MIT
	 *
	 * Не строгий, но точный и легкий JS Parser для строкового значения <img sizes = "here">
	 *
	 * Справочный алгоритм по адресу:
	 * https://html.spec.whatwg.org/multipage/embedded-content.html#parse-a-sizes-attribute
	 *
	 * Большинство комментариев копируются прямо из спецификации
	 * (кроме комментариев в скобках).
	 *
	 * Грамматика это:
	 * <source-size-list> = <source-size> # [, <source-size-value>]? | <Источник-размер-значение>
	 * <source-size> = <media-condition> <source-size-value>
	 * <source-size-value> = <длина>
	 * http://www.w3.org/html/wg/drafts/html/master/embedded-content.html#attr-img-sizes
	 *
	 * Например, "(максимальная ширина: 30em) 100vw, (максимальная ширина: 50em) 70vw, 100vw"
	 * или "(min-width: 30em), calc (30vw - 15px)" или просто "30vw"
	 *
	 * Возвращает первый допустимый <css-length> с условием носителя, которое оценивается как true,
	 * или "100vw", если все действительные условия носителей оцениваются как ложные.
	 *
	 * /

	function parseSizes (strValue) {

		// (Процент длины CSS не допускается в этом случае, чтобы избежать путаницы:
		// https://html.spec.whatwg.org/multipage/embedded-content.html#valid-source-size-list
		// CSS допускает один необязательный знак плюс или минус:
		// http://www.w3.org/TR/CSS2/syndata.html#numbers
		// CSS не зависит от регистра ASCII:
		// http://www.w3.org/TR/CSS2/syndata.html#characters)
		// Spec допускает экспоненциальную запись типа <number>:
		// http://dev.w3.org/csswg/css-values/#numbers
		var regexCssLengthWithUnits = /^(?:[+-]?[0-9]+|[0-9]*\.[0-9]+)(?:[eE][+-]?[0-9 ] +) (?: ч | см | эм | ех | в | мм | шт | пт | ПВ | бэр | В.Х. | Vmin | Vmax | оч.сл.) $ / я;

		// (Это быстрый и мягкий тест. Из-за необязательного внутреннего
		// группирование паренов и строгих правил пробелов, это может быть очень сложно.)
		var regexCssCalc = / ^ calc \ ((?: [0-9a-z \. \ + \ - \ * \ / \ (\)] +) \) $ / i;

		вар я;
		var unparsedSizesList;
		var unparsedSizesListLength;
		var unparsedSize;
		var lastComponentValue;
		размер вар;

		// ПОЛЕЗНЫЕ ФУНКЦИИ

		// (Игрушечный парсер CSS. Цели здесь:
		// 1) расширенный охват тестов без веса полного синтаксического анализатора CSS.
		// 2) Избегать регулярных выражений везде, где это удобно.
		// Быстрые тесты: http://jsfiddle.net/gtntL4gr/3/
		// Возвращает массив массивов.)
		function parseComponentValues ​​(str) {
			var chrctr;
			var component = "";
			var componentArray = [];
			var listArray = [];
			var parenDepth = 0;
			var pos = 0;
			var inComment = false;

			function pushComponent () {
				if (component) {
					componentArray.push (компонент);
					компонент = "";
				}
			}

			function pushComponentArray () {
				if (componentArray [0]) {
					listArray.push (componentArray);
					componentArray = [];
				}
			}

			// (цикл вперед от начала строки.)
			while (true) {
				chrctr = str.charAt (pos);

				if (chrctr === "") {// (Конец строки достигнут.)
					pushComponent ();
					pushComponentArray ();
					вернуть listArray;
				} else if (inComment) {
					if ((chrctr === "*") && (str [pos + 1] === "/")) {// (в конце комментария.)
						inComment = false;
						pos + = 2;
						pushComponent ();
						Продолжить;
					} еще {
						pos + = 1; // (Пропустить все символы внутри комментариев.)
						Продолжить;
					}
				} else if (isSpace (chrctr)) {
					// (Если предыдущий символ в цикле тоже был пробел, или если
					// в начале строки не добавлять пробел в
					// составная часть.)
					if ((str.charAt (pos-1) && isSpace (str.charAt (pos-1))) ||! component) {
						pos + = 1;
						Продолжить;
					} else if (parenDepth === 0) {
						pushComponent ();
						pos + = 1;
						Продолжить;
					} еще {
						// (Заменить любой пробел на простой для разборчивости.)
						chrctr = "";
					}
				} else if (chrctr === "(") {
					parenDepth + = 1;
				} else if (chrctr === ")") {
					parenDepth - = 1;
				} else if (chrctr === ",") {
					pushComponent ();
					pushComponentArray ();
					pos + = 1;
					Продолжить;
				} else if ((chrctr === "/") && (str.charAt (pos + 1) === "*")) {
					inComment = true;
					pos + = 2;
					Продолжить;
				}

				компонент = компонент + chrctr;
				pos + = 1;
			}
		}

		function isValidNonNegativeSourceSizeValue (s) {
			if (regexCssLengthWithUnits.test (s) && (parseFloat (s)> = 0)) {return true;}
			if (regexCssCalc.test (s)) {return true;}
			// (http://www.w3.org/TR/CSS2/syndata.html#numbers говорит:
			// "-0 эквивалентно 0 и не является отрицательным числом." Который означает, что
			// нулевой единичный и отрицательный нулевой без единицы должны приниматься как особые случаи.)
			if ((s === "0") || (s === "-0") || (s === "+0")) {return true;}
			вернуть ложь;
		}

		// Когда вас попросят проанализировать атрибут размеров у элемента,
		// разделенный запятыми список значений компонента из значения элемента
		// атрибуты размеров (или пустая строка, если атрибут отсутствует), и пусть
		// список неразобранных размеров будет результатом.
		// http://dev.w3.org/csswg/css-syntax/#parse-comma-separated-list-of-component-values

		unparsedSizesList = parseComponentValues ​​(strValue);
		unparsedSizesListLength = unparsedSizesList.length;

		// Для каждого необработанного размера в списке неразобранных размеров:
		for (i = 0; i <unparsedSizesListLength; i ++) {
			unparsedSize = unparsedSizesList [i];

			// 1. Удаляем все последовательные <whitespace-token> с конца неразобранного размера.
			// (parseComponentValues ​​() уже пропускает пробелы вне паренов.)

			// Если размер без разбора теперь пуст, это ошибка разбора; перейти к следующему
			// итерация этого алгоритма.
			// (parseComponentValues ​​() не будет выдвигать пустой массив.)

			// 2. Если последнее значение компонента в неразобранном размере является действительным неотрицательным
			// <source-size-value>, пусть size будет его значением и удалит значение компонента
			// из непарсированного размера. Любая функция CSS, кроме функции calc ()
			// недействительным. В противном случае возникает ошибка разбора; перейти к следующей итерации
			// этого алгоритма.
			// http://dev.w3.org/csswg/css-syntax/#parse-component-value
			lastComponentValue = unparsedSize [unparsedSize.length - 1];

			if (isValidNonNegativeSourceSizeValue (lastComponentValue)) {
				size = lastComponentValue;
				unparsedSize.pop ();
			} еще {
				Продолжить;
			}

			// 3. Удалить все последовательные <whitespace-token> с конца непарсированного
			// размер. Если непарсированный размер теперь пуст, верните размер и выйдите из этого алгоритма.
			// Если это был не последний элемент в списке неразобранных размеров, это ошибка разбора.
			if (unparsedSize.length === 0) {
				возвращаемый размер;
			}

			// 4. Анализируем оставшиеся значения компонентов в разобраном виде как
			// <медиа-условие>. Если он не анализируется правильно, или он анализирует
			// правильно, но <media-condition> оценивается как false, продолжаем до
			// следующая итерация этого алгоритма.
			// (Разбор всех возможных составных состояний среды в JS тяжелый, сложный,
			// и выигрыш неясен. Есть ли когда-нибудь ситуация, когда
			// условие носителя анализирует неправильно, но все равно каким-то образом оценивается как true?
			// Можем ли мы просто полагаться на браузер / полифилл, чтобы сделать это?)
			unparsedSize = unparsedSize.join ("");
			if (! (pf.matchesMedia (unparsedSize))) {
				Продолжить;
			}

			// 5. Вернуть размер и выйти из этого алгоритма.
			возвращаемый размер;
		}

		// Если приведенный выше алгоритм исчерпывает список непарсированных размеров, не возвращая
		// значение размера, возвращаемое 100vw.
		возврат "100vw";
	}

	// пространство имен
	pf.ns = ("pf" + new Date (). getTime ()). substr (0, 9);

	// тест поддержки srcset
	pf.supSrcset = "srcset" в изображении;
	pf.supSizes = "размеры" в изображении;
	pf.supPicture = !! window.HTMLPictureElement;

	// UC-браузер утверждает, что поддерживает srcset и picture, но не размеры,
	// этот расширенный тест показывает, что браузер ничего не поддерживает
	if (pf.supSrcset && pf.supPicture &&! pf.supSizes) {
		(функция (изображение2) {
			image.srcset = "data:, a";
			image2.src = "data:, a";
			pf.supSrcset = image.complete === image2.complete;
			pf.supPicture = pf.supSrcset && pf.supPicture;
		}) (Document.createElement ( "IMG"));
	}

	// Safari9 имеет базовую поддержку размеров, но не раскрывает атрибут `sizes` idl
	if (pf.supSrcset &&! pf.supSizes) {

		(function () {
			var width2 = "data: image / gif; base64, R0lGODlhAgABAPAAAP /// wAAACH5BAAAAAAALAAAAAACAAEAAAICBAoAOw ==";
			var width1 = "data: image / gif; base64, R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw ==";
			var img = document.createElement ("img");
			var test = function () {
				var width = img.width;

				if (width === 2) {
					pf.supSizes = true;
				}

				alwaysCheckWDescriptor = pf.supSrcset &&! pf.supSizes;

				isSupportTestReady = true;
				// принудительная асинхронность
				SetTimeout (picturefill);
			};

			img.onload = test;
			img.onerror = test;
			img.setAttribute («размеры», «9 пикселей»);

			img.srcset = width1 + "1w," + width2 + "9w";
			img.src = width1;
		}) ();

	} еще {
		isSupportTestReady = true;
	}

	// использование pf.qsa вместо обхода dom значительно лучше масштабируется,
	// особенно на сайтах, смешивающих отзывчивые и неотзывчивые изображения
	pf.selShort = "picture> img, img [srcset]";
	pf.sel = pf.selShort;
	pf.cfg = cfg;

	/ **
	 * Свойство ярлыка для `devicePixelRatio` (для легкого переопределения в тестах)
	 * /
	pf.DPR = (DPR || 1);
	pf.u = единицы;

	// контейнер поддерживаемых типов MIME, которые могут понадобиться для определения перед использованием
	pf.types = types;

	pf.setSize = noop;

	/ **
	 * Получает строку и возвращает абсолютный URL
	 * @param src
	 * @returns {String} абсолютный URL
	 * /

	pf.makeUrl = memoize (function (src) {
		anchor.href = src;
		вернуть anchor.href;
	});

	/ **
	 * Получает элемент DOM или документ и селектор и возвращает найденные совпадения
	 * Может быть расширен с поддержкой jQuery / Sizzle для IE7
	 * @param context
	 * @param sel
	 * @returns {NodeList | Array}
	 * /
	pf.qsa = function (context, sel) {
		возврат («querySelector» в контексте)? context.querySelectorAll (sel): [];
	};

	/ **
	 * Метод ярлыков для matchMedia (для легкого переопределения в тестах)
	 * будет ли использоваться родной или pf.mMQ, будет решено ленивым при первом вызове
	 * @returns {логическое значение}
	 * /
	pf.matchesMedia = function () {
		if (window.matchMedia && (matchMedia ("(min-width: 0.1em)") || {}). соответствует) {
			pf.matchesMedia = function (media) {
				вернуться! СМИ || (matchMedia (media) .matches);
			};
		} еще {
			pf.matchesMedia = pf.mMQ;
		}

		return pf.matchesMedia.apply (this, arguments);
	};

	/ **
	 * Упрощенная реализация matchMedia для IE8 и IE9
	 * обрабатывает только значения min-width / max-width со значениями px или em
	 * @param media
	 * @returns {логическое значение}
	 * /
	pf.mMQ = function (media) {
		вернуть СМИ? evalCSS (СМИ): правда;
	};

	/ **
	 * Возвращает рассчитанную длину в пикселе CSS из заданного sourceSizeValue
	 * http://dev.w3.org/csswg/css-values-3/#length-value
	 * предполагаемые несоответствия спецификации:
	 * * Не проверяет на недопустимое использование функций CSS
	 * * Обрабатывает ли вычисленная длина 0 то же самое, что и отрицательное и, следовательно, недопустимое значение
	 * @param sourceSizeValue
	 * @returns {Number}
	 * /
	pf.calcLength = function (sourceSizeValue) {

		var value = evalCSS (sourceSizeValue, true) || ложный;
		if (значение <0) {
			значение = ложь;
		}

		возвращаемое значение;
	};

	/ **
	 * Принимает строку типа и проверяет, поддерживается ли она
	 * /

	pf.supportsType = function (type) {
		возврат (тип)? типы [тип]: правда;
	};

	/ **
	 * Разбирает sourceSize в mediaCondition (media) и sourceSizeValue (length)
	 * @param sourceSizeStr
	 * @returns {*}
	 * /
	pf.parseSize = memoize (function (sourceSizeStr) {
		var match = (sourceSizeStr || "") .match (regSize);
		вернуть {
			media: match && match [1],
			длина: совпадение && совпадение [2]
		};
	});

	pf.parseSet = function (set) {
		if (! set.cands) {
			set.cands = parseSrcset (set.srcset, set);
		}
		вернуть set.cands;
	};

	/ **
	 * возвращает 1em в css px для размера html / body по умолчанию
	 * функция взята из responsejs
	 * @returns {* | номер}
	 * /
	pf.getEmValue = function () {
		вар тело;
		if (! eminpx && (body = document.body)) {
			var div = document.createElement ("div"),
				originalHTMLCSS = docElem.style.cssText,
				originalBodyCSS = body.style.cssText;

			div.style.cssText = baseStyle;

			// 1em в медиа-запросе - это значение размера шрифта браузера по умолчанию
			// сбрасываем docElem и body, чтобы гарантировать возвращение правильного значения
			docElem.style.cssText = fsCss;
			body.style.cssText = fsCss;

			body.appendChild (div);
			eminpx = div.offsetWidth;
			body.removeChild (div);

			// также обновляем eminpx перед возвратом
			eminpx = parseFloat (eminpx, 10);

			// восстановить исходные значения
			docElem.style.cssText = originalHTMLCSS;
			body.style.cssText = originalBodyCSS;

		}
		вернуть eminpx || 16;
	};

	/ **
	 * Принимает строку размеров и возвращает ширину в пикселях в виде числа
	 * /
	pf.calcListLength = function (sourceSizeListStr) {
		// Разделить список размеров источника, т.е. (max-width: 30em) 100%, (max-width: 50em) 50%, 33%
		//
		// или (min-width: 30em) calc (30% - 15px)
		if (! (sourceSizeListStr в sizeLengthCache) || cfg.uT) {
			var winLength = pf.calcLength (parseSizes (sourceSizeListStr));

			sizeLengthCache [sourceSizeListStr] =! victoryLength? unit.width: victoryLength;
		}

		return sizeLengthCache [sourceSizeListStr];
	};

	/ **
	 * Принимает объект-кандидат со свойством srcset в форме url /
	 * бывший "images / pic-medium.png 1x, images / pic-medium-2x.png 2x" или
	 * "images / pic-medium.png 400 Вт, images / pic-medium-2x.png 800 Вт" или
	 * "images / pic-small.png"
	 * Получить массив изображений кандидатов в виде
	 * {url: "/foo/bar.png", разрешение: 1}
	 * где разрешение: http://dev.w3.org/csswg/css-values-3/#resolution-value
	 * Если указаны размеры, рассчитывается res
	 * /
	pf.setRes = function (set) {
		вар кандидатов;
		if (set) {

			андидаты = pf.parseSet (set);

			for (var i = 0, len = кандидатов. длина; i <len; i ++) {
				setResolution (андидаты [i], set.sizes);
			}
		}
		вернуть кандидатов;
	};

	pf.setRes.res = setResolution;

	pf.applySetCandidate = функция (кандидаты, img) {
		if (! candid.length) {return;}
		кандидат в вар,
			я,
			J,
			длина,
			bestCandidate,
			curSrc,
			curCan,
			candidateSrc,
			abortCurSrc;

		var imageData = img [pf.ns];
		var dpr = pf.DPR;

		curSrc = imageData.curSrc || IMG [curSrcProp];

		curCan = imageData.curCan || setSrcToCur (img, curSrc ,андидаты [0] .set);

		// если у нас есть текущий источник, мы можем либо стать ленивыми, либо дать этому источнику некоторое преимущество
		if (curCan && curCan.set ===андидаты [0] .set) {

			// если браузер может прервать запрос изображения, а изображение имеет более высокую плотность пикселей, чем необходимо
			// и это изображение еще не загружено, мы пропускаем следующую часть и пытаемся сохранить пропускную способность
			abortCurSrc = (supportAbort &&! img.complete && curCan.res - 0.1> dpr);

			if (! abortCurSrc) {
				curCan.cached = true;

				// если текущий кандидат "лучший", "лучше" или "хорошо",
				// установить для bestCandidate
				if (curCan.res> = dpr) {
					bestCandidate = curCan;
				}
			}
		}

		if (! bestCandidate) {

			кандидатов.sort (ascendingSort);

			длина = кандидатов. длина;
			bestCandidate = кандидатов [длина - 1];

			для (i = 0; i <длина; i ++) {
				кандидат = кандидаты [я];
				if (candid.res> = dpr) {
					j = i - 1;

					// мы нашли идеального кандидата,
					// но давайте улучшим это немного с некоторыми предположениями ;-)
					если (кандидаты [j] &&
						(abortCurSrc || curSrc! == pf.makeUrl (андидат.url)) &&
						chooseLowRes (андидаты [j] .res, кандидат.res, dpr, кандидаты [j] .cached)) {

						bestCandidate = кандидатов [j];

					} еще {
						bestCandidate = кандидат;
					}
					перерыв;
				}
			}
		}

		if (bestCandidate) {

			КандидатСрк = pf.makeUrl (bestCandidate.url);

			imageData.curSrc = candidSrc;
			imageData.curCan = bestCandidate;

			if (candidSrc! == curSrc) {
				pf.setSrc (img, bestCandidate);
			}
			pf.setSize (img);
		}
	};

	pf.setSrc = function (img, bestCandidate) {
		var origWidth;
		img.src = bestCandidate.url;

		// хотя это конкретная проблема Safari, мы не хотим использовать слишком много разных путей кода
		if (bestCandidate.set.type === "image / svg + xml") {
			origWidth = img.style.width;
			img.style.width = (img.offsetWidth + 1) + "px";

			// только следующая строка должна вызвать перерисовку
			// если ... сделано только для обмана мертвого кода
			if (img.offsetWidth + 1) {
				img.style.width = origWidth;
			}
		}
	};

	pf.getSet = function (img) {
		var i, set, поддерживает тип;
		var match = false;
		var sets = img [pf.ns] .sets;

		for (i = 0; i <sets.length &&! match; i ++) {
			set = sets [i];

			if (! set.srcset ||! pf.matchesMedia (set.media) ||! (supportType = pf.supportsType (set.type))) {
				Продолжить;
			}

			if (supportType === "pending") {
				set = supportType;
			}

			match = set;
			перерыв;
		}

		ответный матч;
	};

	pf.parseSets = function (element, parent, options) {
		var srcsetAttribute, imageSet, isWDescripor, srcsetParsed;

		var hasPicture = parent && parent.nodeName.toUpperCase () === "PICTURE";
		var imageData = element [pf.ns];

		if (imageData.src === undefined || options.src) {
			imageData.src = getImgAttr.call (element, "src");
			if (imageData.src) {
				setImgAttr.call (element, srcAttr, imageData.src);
			} еще {
				removeImgAttr.call (element, srcAttr);
			}
		}

		if (imageData.srcset === undefined || options.srcset ||! pf.supSrcset || element.srcset) {
			srcsetAttribute = getImgAttr.call (element, "srcset");
			imageData.srcset = srcsetAttribute;
			srcsetParsed = true;
		}

		imageData.sets = [];

		if (hasPicture) {
			imageData.pic = true;
			getAllSourceElements (parent, imageData.sets);
		}

		if (imageData.srcset) {
			imageSet = {
				srcset: imageData.srcset,
				размеры: getImgAttr.call (элемент, «размеры»)
			};

			imageData.sets.push (imageSet);

			isWDescripor = (alwaysCheckWDescriptor || imageData.src) && regWDesc.test (imageData.srcset || "");

			// добавить нормальный src в качестве кандидата, если у источника нет дескриптора w
			if (! isWDescripor && imageData.src &&! getCandidateForSrc (imageData.src, imageSet) &&! imageSet.has1x) {
				imageSet.srcset + = "," + imageData.src;
				imageSet.cands.push ({
					URL: imageData.src,
					д: 1,
					набор: imageSet
				});
			}

		} else if (imageData.src) {
			imageData.sets.push ({
				srcset: imageData.src,
				размеры: ноль
			});
		}

		imageData.curCan = null;
		imageData.curSrc = undefined;

		// если у img есть изображение или srcset был удален или имеет srcset и вообще не поддерживает srcset
		// или имеет дескриптор aw (и не поддерживает размеры), устанавливающий поддержку false для оценки
		imageData.supported =! (hasPicture || (imageSet &&! pf.supSrcset) || (isWDescripor &&! pf.supSizes));

		if (srcsetParsed && pf.supSrcset &&! imageData.supported) {
			if (srcsetAttribute) {
				setImgAttr.call (element, srcsetAttr, srcsetAttribute);
				element.srcset = "";
			} еще {
				removeImgAttr.call (element, srcsetAttr);
			}
		}

		if (imageData.supported &&! imageData.srcset && ((! imageData.src && element.src) || ​​element.src! == pf.makeUrl (imageData.src)))) {
			if (imageData.src === null) {
				element.removeAttribute ( "SRC");
			} еще {
				element.src = imageData.src;
			}
		}

		imageData.parsed = true;
	};

	pf.fillImg = function (element, options) {
		var imageData;
		var extreme = options.reselect || options.reevaluate;

		// раскрываем для кеширования данных на img
		if (! element [pf.ns]) {
			element [pf.ns] = {};
		}

		imageData = element [pf.ns];

		// если элемент уже был оценен, пропустите его
		// если `options.reevaluate` не установлен в true (это, например,
		// устанавливается в true при запуске `picturefill` для` resize`).
		if (! extreme && imageData.evaled === evalId) {
			вернуть;
		}

		if (! imageData.parsed || options.reevaluate) {
			pf.parseSets (element, element.parentNode, options);
		}

		if (! imageData.supported) {
			applyBestCandidate (element);
		} еще {
			imageData.evaled = evalId;
		}
	};

	pf.setupRun = function () {
		if (!readyRun || isVwDirty || (DPR! == window.devicePixelRatio)) {
			updateMetrics ();
		}
	};

	// Если изображение поддерживается, это круто.
	if (pf.supPicture) {
		picturefill = noop;
		pf.fillImg = noop;
	} еще {

		 // Настройка рисунка для полифилла путем опроса документа
		(function () {
			var isDomReady;
			var regReady = window.attachEvent? / d $ | ^ c /: / d $ | ^ c | ^ i /;

			var run = function () {
				var readyState = document.readyState || "";

				timerId = setTimeout (run, readyState === "загрузка"? 200: 999);
				if (document.body) {
					pf.fillImgs ();
					isDomReady = isDomReady || regReady.test (readyState);
					if (isDomReady) {
						clearTimeout (timerId);
					}

				}
			};

			var timerId = setTimeout (run, document.body? 9: 99);

			// Также прикрепляем picturefill к resize и readystatechange
			// http://modernjavascript.blogspot.com/2013/08/building-better-debounce.html
			var debounce = function (func, wait) {
				var timeout, timestamp;
				var позже = function () {
					var last = (new Date ()) - отметка времени;

					if (last <wait) {
						timeout = setTimeout (позже, wait - последний);
					} еще {
						тайм-аут = ноль;
						FUNC ();
					}
				};

				функция возврата () {
					отметка времени = новая дата ();

					if (! timeout) {
						timeout = setTimeout (позже, подождите);
					}
				};
			};
			var lastClientWidth = docElem.clientHeight;
			var onResize = function () {
				isVwDirty = Math.max (window.innerWidth || 0, docElem.clientWidth)! == units.width || docElem.clientHeight! == lastClientWidth;
				lastClientWidth = docElem.clientHeight;
				if (isVwDirty) {
					pf.fillImgs ();
				}
			};

			on (окно, «изменить размер», debounce (onResize, 99));
			вкл (документ, «readystatechange», запустить);
		}) ();
	}

	pf.picturefill = picturefill;
	// используем это внутренне для легкого исправления обезьян / тестирования производительности
	pf.fillImgs = picturefill;
	pf.teardownRun = noop;

	/ * выставить методы для тестирования * /
	picturefill._ = pf;

	window.picturefillCFG = {
		пф: пф,
		push: function (args) {
			var name = args.shift ();
			if (typeof pf [name] === "function") {
				pf [имя] .apply (pf, args);
			} еще {
				cfg [name] = args [0];
				if (readyRun) {
					pf.fillImgs ({reselect: true});
				}
			}
		}
	};

	while (setOptions && setOptions.length) {
		window.picturefillCFG.push (setOptions.shift ());
	}

	/ * выставить картинку *
	window.picturefill = picturefill;

	/ * выставить картинку *
	if (typeof module === "object" && typeof module.exports === "object") {
		// CommonJS, просто экспорт
		module.exports = picturefill;
	} else if (typeof define === "function" && define.amd) {
		// Поддержка AMD
		define ("picturefill", function () {return picturefill;});
	}

	// IE8 проверяет эту синхронизацию, поэтому это должно быть последнее, что мы делаем
	if (! pf.supPicture) {
		types ["image / webp"] = detectTypeSupport ("image / webp", "data: image / webp; base64, UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR / QAERBQAAAAAAJAJAJAQAJAQAJAQAQAQAJAQAJAJAUBAGAUB)
	}

}) (окно, документ);
