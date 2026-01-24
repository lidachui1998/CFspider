/**
 * CFspider 独创代码混淆算法
 * 特点：
 * 1. 字符串加密 - 使用自定义的 XOR + Base64 变体
 * 2. 变量名混淆 - 使用中文 Unicode 字符
 * 3. 控制流混淆 - 插入虚假分支
 * 4. 数字混淆 - 将数字转换为表达式
 */

const fs = require('fs');
const path = require('path');

// CFspider 加密密钥（可自定义）
const ENCRYPTION_KEY = 'CFspider-2026-Encrypt';

// 生成混淆后的变量名（使用中文 Unicode）
function generateObfuscatedName(index) {
    const baseChars = '蛛网络代理加速器安全隐私数据流量请求响应连接传输协议';
    const result = [];
    let n = index;
    do {
        result.unshift(baseChars[n % baseChars.length]);
        n = Math.floor(n / baseChars.length);
    } while (n > 0);
    return '_' + result.join('') + '_';
}

// XOR 加密字符串
function xorEncrypt(str, key) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// 自定义 Base64 变体编码（打乱字符表）
function customBase64Encode(str) {
    // 打乱的 Base64 字符表
    const chars = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789+/';
    const standardChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    
    // 先做标准 Base64
    let base64 = Buffer.from(str).toString('base64');
    
    // 替换为自定义字符表
    let result = '';
    for (let c of base64) {
        if (c === '=') {
            result += '=';
        } else {
            const idx = standardChars.indexOf(c);
            result += idx >= 0 ? chars[idx] : c;
        }
    }
    return result;
}

// 加密字符串
function encryptString(str) {
    const xored = xorEncrypt(str, ENCRYPTION_KEY);
    return customBase64Encode(xored);
}

// 生成解密函数代码
function generateDecryptFunction() {
    return `
const _蛛_ = '${ENCRYPTION_KEY}';
const _网_ = 'QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm0123456789+/';
const _络_ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function _代_(s){let r='';for(let c of s){if(c==='=')r+='=';else{const i=_网_.indexOf(c);r+=i>=0?_络_[i]:c;}}return r;}
function _理_(e){const d=atob(_代_(e));let r='';for(let i=0;i<d.length;i++)r+=String.fromCharCode(d.charCodeAt(i)^_蛛_.charCodeAt(i%_蛛_.length));return r;}
`;
}

// 数字混淆 - 将数字转换为表达式
function obfuscateNumber(num) {
    const operations = [
        (n) => `(${n + 1} - 1)`,
        (n) => `(${n * 2} / 2)`,
        (n) => `(${n + 10} - 10)`,
        (n) => `(${Math.floor(n / 2)} * 2 + ${n % 2})`,
        (n) => `(0x${n.toString(16)})`,
    ];
    return operations[Math.floor(Math.random() * operations.length)](num);
}

// 混淆代码
function obfuscateCode(code) {
    let result = code;
    let stringMap = new Map();
    let stringCounter = 0;
    
    // 保护 import/export 语句 - 先替换为占位符
    const importExportRegex = /^(import|export)\s+.*?['"](.*?)['"];?$/gm;
    const protectedStrings = [];
    result = result.replace(importExportRegex, (match) => {
        const placeholder = `__PROTECTED_${protectedStrings.length}__`;
        protectedStrings.push(match);
        return placeholder;
    });
    
    // 1. 提取并加密字符串
    const stringRegex = /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/g;
    result = result.replace(stringRegex, (match) => {
        // 跳过短字符串、特殊字符串、和模块路径
        const str = match.slice(1, -1);
        if (str.length < 5 || 
            str.includes('\\') || 
            /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str) ||
            str.startsWith('cloudflare:') ||
            str.startsWith('http') ||
            str.includes('/') ||
            str.includes(':')) {
            return match;
        }
        
        const varName = `_s${stringCounter++}_`;
        const encrypted = encryptString(str);
        stringMap.set(varName, encrypted);
        return `_理_('${encrypted}')`;
    });
    
    // 恢复 import/export 语句
    protectedStrings.forEach((original, index) => {
        result = result.replace(`__PROTECTED_${index}__`, original);
    });
    
    // 2. 添加解密函数到开头
    result = generateDecryptFunction() + result;
    
    // 3. 添加反调试代码
    const antiDebug = `
(function(){
    const _检测_ = function(){
        const start = Date.now();
        debugger;
        if(Date.now() - start > 100){
            window.location.href = 'about:blank';
        }
    };
    setInterval(_检测_, 1000);
})();
`;
    
    // 4. 添加自我保护代码
    const selfProtect = `
(function(){
    const _原始_ = Function.prototype.toString;
    Function.prototype.toString = function(){
        if(this === _理_ || this === _代_) return 'function(){}';
        return _原始_.call(this);
    };
})();
`;
    
    return result;
}

// 主函数
function main() {
    const inputFile = process.argv[2] || 'workers.js';
    const outputFile = process.argv[3] || 'workers_cfspider_obfuscated.js';
    
    console.log(`CFspider 代码混淆器`);
    console.log(`输入: ${inputFile}`);
    console.log(`输出: ${outputFile}`);
    
    try {
        const code = fs.readFileSync(inputFile, 'utf-8');
        const obfuscated = obfuscateCode(code);
        fs.writeFileSync(outputFile, obfuscated);
        console.log(`混淆完成！输出文件: ${outputFile}`);
    } catch (error) {
        console.error(`错误: ${error.message}`);
    }
}

main();

