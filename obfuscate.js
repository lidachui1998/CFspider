const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');

const code = fs.readFileSync('workers.js', 'utf8');

const result = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    stringArray: false,
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    selfDefending: false,
    unicodeEscapeSequence: true  // 将所有字符转为 Unicode 转义
});

fs.writeFileSync('workers_obf.js', result.getObfuscatedCode(), 'utf8');
console.log('混淆完成: workers_obf.js');


