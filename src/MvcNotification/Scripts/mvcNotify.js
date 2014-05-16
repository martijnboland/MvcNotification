//CREDIT: http://blogs.taiga.nl/martijn/2011/05/03/keep-your-users-informed-with-asp-net-mvc/
//Last modified by Cuong Vu (cuong@thevus.com) on 2014-05-15
//Tested in IE8, IE10, and Chrome with jQuery 1.7.2
var mvcNotify = mvcNotify || {};

//==================== COPY THESE TO YOUR SCRIPT TO OVERRIDE =====================
//TIP - don't put these into a $(document).ready area. Just call these after you include this JS file.
mvcNotify.autoClearTimeout = 0; //set in milliseconds
mvcNotify.elementsDontClearOnClick = ["a", ":button", ":submit"]; //on click of these elements, don't clear messages with fade
mvcNotify.typesToAutoClear = "all"; //if mvcNotify.autoClearTimeout > 0, auto clear these messages. Can be string like "all" or "success" or string array like ["success", "warning"].
mvcNotify.typesToConsoleLog = null; //Can be string like "all" or "error" or string array like ["error", "warning"].

//======================== DO NOT MODIFY BELOW THIS LINE =========================
mvcNotify.selectorHandle = "#mvcNotify";
mvcNotify.handle = null;

// Avoid `console` errors in browsers that lack a console.
(function () {
    //https://github.com/h5bp/html5-boilerplate/blob/master/js/plugins.js
    var method;
    var noop = function () { };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
} ());

$.fn.mySelector = function (boolIncludeID, boolIncludeCss, boolIncludeType) {
    //2014-04-15 by CV
    //returns a selector of the object. Changed name from .selector to .mySelector to not override the jQuery one.
    //Usage: var strSelector = $("#whatever").mySelector();
    //for example, will return input:submit#btnSubmit.className1.className2
    //Tested in IE8, IE10, Firefox and Chrome
    if (null == this || undefined == this) return "";

    if (boolIncludeID !== true) boolIncludeID = false;
    if (boolIncludeCss !== true) boolIncludeCss = false;
    if (boolIncludeType !== true) boolIncludeType = false;

    var jqTarget = $(this);
    var strID = boolIncludeID ? $.trim(jqTarget.attr("id")) : "";
    if (undefined == strID || null == strID || !strID) {
        strID = "";
    } else {
        strID = "#" + strID;
    }
    var strClasses = boolIncludeCss ? $.trim(jqTarget.attr('class')) : "";
    if (undefined == strClasses || null == strClasses || !strClasses) {
        strClasses = "";
    } else {
        strClasses = strClasses.replace(" ", ".");
        strClasses = "." + strClasses;
    }
    var strType = (boolIncludeType && jqTarget[0] && jqTarget[0].type ? ":" + jqTarget[0].type.toLowerCase() : "");
    return jqTarget[0].tagName.toLowerCase() + strType + strID + strClasses;
}

mvcNotify.initialize = function () {
    $(document).ready(function () {
        mvcNotify.handleAjaxMessages();
        mvcNotify.displayMessages();
        $(document).click(function (event) {
            //If you use client side JavaScript to displayMessage on click of anchor, input:button, or input:submit, the message will disappear immediately after click. Prevent that here.
            var jqTarget = $(event.target || event.srcElement);
            var strSelector = jqTarget.mySelector(false, false, true);

            if (mvcNotify.elementsDontClearOnClick) {
                if ($.type(mvcNotify.elementsDontClearOnClick) === "string") {
                    if (jqTarget.is(mvcNotify.elementsDontClearOnClick)) return;
                    if (mvcNotify.elementsDontClearOnClick.indexOf(":") >= 0 && strSelector.indexOf(mvcNotify.elementsDontClearOnClick) >= 0) return;
                } else if ($.isArray(mvcNotify.elementsDontClearOnClick) && mvcNotify.elementsDontClearOnClick.length > 0) {
                    for (var i = 0; i < mvcNotify.elementsDontClearOnClick.length; i++) {
                        if (jqTarget.is(mvcNotify.elementsDontClearOnClick[i])) return;
                        if (mvcNotify.elementsDontClearOnClick[i].indexOf(":") >= 0 && strSelector.indexOf(mvcNotify.elementsDontClearOnClick[i]) >= 0) return;
                    }
                }
            }

            //If not mvcNotify.elementsDontClearOnClick, then fade out messages
            mvcNotify.clearMessagesFadeOut();
        });
    });
};

mvcNotify.displayMessage = function (message, messageType) {
    if (!message || !messageType) return;
    mvcNotify.handle = mvcNotify.handle || $(mvcNotify.selectorHandle); //reuse handle for performance
    strHtml = '<div class="messagebox ' + messageType.toLowerCase() + '">' + message + '</div>';
    mvcNotify.handle.append(strHtml);
    mvcNotify.displayMessages();
};

mvcNotify.displayMessages = function () {
    mvcNotify.handle = mvcNotify.handle || $(mvcNotify.selectorHandle); //reuse handle for performance
    if (!mvcNotify.handle || mvcNotify.handle.length == 0) return;
    var children = mvcNotify.handle.find("div.messagebox");
    if (!children || children.length == 0) {
        mvcNotify.handle.hide();
        return;
    }
    //Log to console if needed
    var dateNow = new Date();
    children.each(function () {
        var jqThis = $(this);
        if (!jqThis.data("mvcNotifyDate")) {
            jqThis.data("mvcNotifyDate", dateNow);
            var strText = jqThis.text();
            if (!strText) {
                jqThis.empty();
                jqThis.hide();
                return true; //continue .each loop
            }
            if (mvcNotify.typesToConsoleLog) {
                var strClass = jqThis.attr('class').replace("messagebox ", "");
                if ($.type(mvcNotify.typesToConsoleLog) === "string") {
                    if (strClass == mvcNotify.typesToConsoleLog.toLowerCase() || "all" == mvcNotify.typesToConsoleLog.toLowerCase()) console.log("mvcNotify " + strClass + " = " + strText);
                } else if ($.isArray(mvcNotify.typesToConsoleLog) && mvcNotify.typesToConsoleLog.length > 0) {
                    for (var i = 0; i < mvcNotify.typesToConsoleLog.length; i++) {
                        if (strClass == mvcNotify.typesToConsoleLog[i].toLowerCase() || "all" == mvcNotify.typesToConsoleLog[i].toLowerCase()) console.log("MvcNotify " + strClass + " = " + strText);
                    }
                }
            }
        }
    });
    //Autoclear the messages if needed
    mvcNotify.handle.show();
    if ($.isNumeric(mvcNotify.autoClearTimeout) && mvcNotify.autoClearTimeout > 0) {
        setTimeout(function () { mvcNotify.autoClearMessages(dateNow); }, mvcNotify.autoClearTimeout);
    }
};

mvcNotify.autoClearMessages = function (dateNow) {
    if (mvcNotify.typesToAutoClear) {
        if ($.type(mvcNotify.typesToAutoClear) === "string") {
            mvcNotify.clearMessagesOfType(mvcNotify.typesToAutoClear, dateNow);
        } else if ($.isArray(mvcNotify.typesToAutoClear) && mvcNotify.typesToAutoClear.length > 0) {
            for (var i = 0; i < mvcNotify.typesToAutoClear.length; i++) {
                mvcNotify.clearMessagesOfType(mvcNotify.typesToAutoClear[i], dateNow);
            }
        }
    }
}

mvcNotify.clearMessagesOfType = function (strType, dateNow) {
    //strType will be "success", "warning" or "error"
    mvcNotify.handle = mvcNotify.handle || $(mvcNotify.selectorHandle); //reuse handle for performance
    if (!mvcNotify.handle || mvcNotify.handle.length == 0) return;
    var children = mvcNotify.handle.find("div.messagebox");
    if (!children || children.length == 0) return;

    children.each(function () {
        var jqThis = $(this);
        if (!dateNow || !jqThis.data("mvcNotifyDate") || dateNow == jqThis.data("mvcNotifyDate")) {
            var strClass = jqThis.attr('class').replace("messagebox ", "");
            if (!strType || strType.toLowerCase() == strClass || strType.toLowerCase() == "all") {
                jqThis.fadeOut(500, function () {
                    jqThis.empty();
                });
            }
        }
    });
};

mvcNotify.clearMessagesFadeOut = function () {
    //clear messages delayed with a fade out
    mvcNotify.handle = mvcNotify.handle || $(mvcNotify.selectorHandle); //reuse handle for performance
    mvcNotify.handle.fadeOut(500, function () {
        mvcNotify.handle.empty();
    });
};

mvcNotify.clearMessages = function () {
    //Immediately clear the messages
    mvcNotify.handle = mvcNotify.handle || $(mvcNotify.selectorHandle); //reuse handle for performance
    mvcNotify.handle.empty();
};

mvcNotify.handleAjaxMessages = function () {
    $(document).ajaxSuccess(function (event, request) {
        mvcNotify.checkAndHandleMessageFromHeader(request);
    }).ajaxError(function (event, request) {
        mvcNotify.displayMessage(request.responseText, "error");
    });
};

mvcNotify.checkAndHandleMessageFromHeader = function (request) {
    var msg = request.getResponseHeader('X-Message');
    if (msg) {
        mvcNotify.displayMessage(msg, request.getResponseHeader('X-Message-Type'));
    }
};

mvcNotify.initialize();