function sanitizeString (inString) {
    if (typeof inString === 'undefined')
        return undefined;
    else {
        var outString = "";
        for (var i = 0; i < inString.length; i++) {
            if (inString.charAt(i) != "\&" && inString.charAt(i) != "<" && inString.charAt(i) != ">" &&
                inString.charAt(i) != "*"  && inString.charAt(i) != ";" && inString.charAt(i) != " "){
                outString = outString + inString.charAt(i);
            }
        }
        return outString;
    }
}

module.exports = sanitizeString;