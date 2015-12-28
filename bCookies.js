/*
 *  Read, write, and delete browser cookies and subcookies
 *
 *  Version1.2
 *  2015-12-28
 *
 *  This framework is released under the GNU Public License, version 3 or later.
 *  http://www.gnu.org/licenses/gpl-3.0-standalone.html
 *
 *  Syntaxes:
 *  * bCookie.setItem(name, value[, end[, path[, domain[, secure]]]])
 *  * bCookie.getItem(name)
 *  * bCookie.removeItem(name[, path[, domain]])
 *  * bCookie.hasItem(name)
 *  * bCookie.keys()
*/
var bCookie_Expire_Prior = 'Thu, 01 Jan 1970 00:00:01 GMT'; /* 1 (epoch) or 1970/01/01 @ 00:00:01 */
var bCookie_Expire_Infinity_Epoch = 2145916800; /* 2038/01/01 @ 00:00:00 - 2038 bug */
var bCookie_Expire_Infinity = 'Fri, 01 Jan 2038 00:00:00 GMT'; /* 2038/01/01 @ 00:00:00 - 2038 bug */
var bCookie_max_age = {
	"Infinity": bCookie_Expire_Infinity_Epoch - Math.round( new Date().valueOf() / 1000 ),
	"one_year": 60*60*24*365,
	"thirty_days": 60*60*24*30,
	"fifteen_days": 60*60*24*15,
	"five_days": 60*60*24*5,
	"one_day": 60*60*24,
	"one_hour": 60*60,
	"five_minutes": 60*5,
	"one_minute": 60,
	"one_second": 1
};
var bCookie_Delimiters = {
	"nameValue": "|",
	"key": "="
};

var bCookie = {
  getCookie: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setCookie: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
		vEnd = this.setExpiresFormat(vEnd);
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + vEnd + (sDomain ? ";domain=" + sDomain : "") + (sPath ? ";path=" + sPath : "") + (bSecure ? ";secure" : "");
    return true;
  },
  getSubCookie: function (sKey, sSubKey) {
		/* Put Existing Cookie Data In Array */
		var cookieSubCookies = bCookie.getCookie(sKey);  var sendValue = "";
		if( cookieSubCookies ) {
			var cookieSubCookiesNameValueArray = cookieSubCookies.split(bCookie_Delimiters['nameValue']);

			jQuery.each( cookieSubCookiesNameValueArray, function( subCookieKey, subCookieArray ) {
				var subCookieNameValue = subCookieArray.split(bCookie_Delimiters['key']);
				if( subCookieNameValue[0] == sSubKey ) {
					sendValue = subCookieNameValue[1]; return;
				}
			});
			return sendValue;
		} else {
			return false;
		}
  },
  setSubCookie: function (sKey, sValues, vEnd, sPath, sDomain, bSecure) {
  	if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
		if( bCookie.getCookie(sKey) ) {
			/* sValues format:  key1=value1|key2=value2 */

			/* Put Existing Cookie Data In Array */
			var currentValue = bCookie.getCookie(sKey);
			var cookieNameValueArray = currentValue.split(bCookie_Delimiters['nameValue']);
			var cookieCookiesArray = new Array();
			jQuery.each( cookieNameValueArray, function( key, value ) {
				cookieCookiesArray[key] = value.split(bCookie_Delimiters['key']);
			});

			/* Process Sub-Cookie Data */
			var cookieNameValueArrayNew = sValues.split(bCookie_Delimiters['nameValue']);
			var cookieCookiesArrayNew = new Array();
			jQuery.each( cookieNameValueArrayNew, function( newKey, newValue ) {
				var cookieCookiesArrayNew = newValue.split(bCookie_Delimiters['key']);
					/* Look through exisiting sub cookies to find a match */
					var subCookiePos = "-1"; var subCookieIndex = 0;
					jQuery.each( cookieCookiesArray, function( subCookieKey, subCookieArray ) {
						 var arrayPos = jQuery.inArray( cookieCookiesArrayNew[0], subCookieArray );
						 if( arrayPos > -1 ) { subCookiePos = subCookieIndex; return false; }
						 subCookieIndex++;
					});
					/* Update subcookies */
					if( subCookiePos > -1 ) {
						/* Key already exists in cookie */
						cookieCookiesArray[subCookiePos][1] = cookieCookiesArrayNew[1];
					} else {
						/* New key for this cookie */
						cookieCookiesArray.push(cookieCookiesArrayNew);
					}
			});

			/* Put Sub-Cookie Data Into String For Writing To Cookie */
			var sValueNew = ""; var index = 0;
			jQuery.each( cookieCookiesArray, function( key, value ) {
				if( key > 0 ) { sValueNew += bCookie_Delimiters['nameValue']; }
				sValueNew += value[0]+bCookie_Delimiters['key']+value[1];
				index++;
			});

			vEnd = this.setExpiresFormat(vEnd);
			sValues = sValueNew;
		}
		this.setCookie(sKey, sValues, vEnd, sPath, sDomain, bSecure);
  },
  removeCookie: function (sKey, sPath, sDomain) {
    if (!this.hasCookie(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=;expires=" + bCookie_Expire_Prior + (sDomain ? ";domain=" + sDomain : "") + (sPath ? ";path=" + sPath : "");
    return true;
  },
  hasCookie: function (sKey) {
    if (!sKey) { return false; }
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  },
  setExpiresFormat: function (vEnd) {
		var sExpires = "";
		if (vEnd) {
			switch (vEnd.constructor) {
				case Number:
					if( vEnd === Infinity ) {
						sExpires = ";expires=" + bCookie_Expire_Infinity + ";max-age=" + bCookie_max_age['Infinity'];
					} else {
						var today = new Date();
						var expireOn = new Date(today.valueOf() + (vEnd*1000));
						sExpires = ";expires=" + expireOn.toUTCString() + ";max-age=" + vEnd;
					}
					break;
				case String:
					sExpires = ";expires=" + vEnd;
					break;
				case Date:
					sExpires = ";expires=" + vEnd.toUTCString() + ";max-age=" + vEnd;
					break;
			}
		}
		return sExpires;
	}
};