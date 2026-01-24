"""
X27CN 文件混淆加密模块

支持对整个 HTML/JS/CSS 文件进行加密混淆，生成自解密代码。
"""

import os
import re
from typing import Optional
from .core import encrypt, DEFAULT_KEY


def obfuscate_html(content: str, key: str = DEFAULT_KEY) -> str:
    """
    混淆加密 HTML 文件内容
    
    生成一个自解密的 HTML 页面，浏览器加载时自动解密并渲染原始内容。
    
    Args:
        content: HTML 文件内容
        key: 加密密钥
        
    Returns:
        自解密 HTML 代码
        
    Example:
        >>> html = '<h1>Hello</h1>'
        >>> obfuscated = obfuscate_html(html)
        >>> # 浏览器加载 obfuscated 会显示 "Hello"
    """
    encrypted = encrypt(content, key)
    key_bytes = key.encode('utf-8')
    key_array = ','.join(hex(b) for b in key_bytes)
    
    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body>
<script>
(function(){{var _$='{encrypted.replace("'", "\\'")}';var _k=[{key_array}];var _d=function(_e,_k){{if(!_e)return'';var _h='',_m,_p=/<([0-9a-fA-F]{{1,4}})>/g;while((_m=_p.exec(_e))!==null)_h+=_m[1];if(!_h||_h.length%2!==0)return'';var _kb=new Uint8Array(_k.length);for(var i=0;i<_k.length;i++)_kb[i]=_k[i];var _ek=new Uint8Array(256),_sb=new Uint8Array(256),_isb=new Uint8Array(256);for(var i=0;i<256;i++){{_ek[i]=(_kb[i%_kb.length]^((7*i+13)&255))&255;_sb[i]=((167*i+89)&255)}}for(var i=0;i<256;i++)_isb[_sb[i]]=i;var _eb=new Uint8Array(_h.length/2);for(var i=0;i<_h.length;i+=2)_eb[i/2]=parseInt(_h.substr(i,2),16);var _st=0;for(var i=0;i<_kb.length;i++)_st^=_kb[i];var _db=new Uint8Array(_eb.length);for(var i=0;i<_eb.length;i++){{var v=_eb[i],_ns=(_st+v+_ek[(i+128)%256])&255;v=((v-3*i-_st)%256+256)%256;v=((v>>5)|(v<<3))&255;v=_isb[v];v=v^_ek[i%256];_st=_ns;_db[i]=v}}return new TextDecoder().decode(_db)}};var _c=_d(_$,_k);document.open();document.write(_c);document.close()}})();
</script>
</body>
</html>'''


def obfuscate_js(content: str, key: str = DEFAULT_KEY) -> str:
    """
    混淆加密 JavaScript 文件内容
    
    生成一个自解密的 JS 代码，加载时自动解密并执行原始代码。
    
    Args:
        content: JavaScript 文件内容
        key: 加密密钥
        
    Returns:
        自解密 JavaScript 代码
        
    Example:
        >>> js = 'alert("Hello");'
        >>> obfuscated = obfuscate_js(js)
        >>> # 执行 obfuscated 会弹出 "Hello"
    """
    encrypted = encrypt(content, key)
    key_bytes = key.encode('utf-8')
    key_array = ','.join(hex(b) for b in key_bytes)
    
    return f'''(function(){{var _$='{encrypted.replace("'", "\\'")}';var _k=[{key_array}];var _d=function(_e,_k){{if(!_e)return'';var _h='',_m,_p=/<([0-9a-fA-F]{{1,4}})>/g;while((_m=_p.exec(_e))!==null)_h+=_m[1];if(!_h||_h.length%2!==0)return'';var _kb=new Uint8Array(_k.length);for(var i=0;i<_k.length;i++)_kb[i]=_k[i];var _ek=new Uint8Array(256),_sb=new Uint8Array(256),_isb=new Uint8Array(256);for(var i=0;i<256;i++){{_ek[i]=(_kb[i%_kb.length]^((7*i+13)&255))&255;_sb[i]=((167*i+89)&255)}}for(var i=0;i<256;i++)_isb[_sb[i]]=i;var _eb=new Uint8Array(_h.length/2);for(var i=0;i<_h.length;i+=2)_eb[i/2]=parseInt(_h.substr(i,2),16);var _st=0;for(var i=0;i<_kb.length;i++)_st^=_kb[i];var _db=new Uint8Array(_eb.length);for(var i=0;i<_eb.length;i++){{var v=_eb[i],_ns=(_st+v+_ek[(i+128)%256])&255;v=((v-3*i-_st)%256+256)%256;v=((v>>5)|(v<<3))&255;v=_isb[v];v=v^_ek[i%256];_st=_ns;_db[i]=v}}return new TextDecoder().decode(_db)}};eval(_d(_$,_k))}})();'''


def obfuscate_css(content: str, key: str = DEFAULT_KEY) -> str:
    """
    混淆加密 CSS 文件内容
    
    生成一个自解密的 JS 代码，加载时自动解密并注入样式。
    
    Args:
        content: CSS 文件内容
        key: 加密密钥
        
    Returns:
        自解密 JavaScript 代码（用于注入 CSS）
        
    Example:
        >>> css = 'body { color: red; }'
        >>> obfuscated = obfuscate_css(css)
        >>> # 执行 obfuscated 会注入样式
    """
    encrypted = encrypt(content, key)
    key_bytes = key.encode('utf-8')
    key_array = ','.join(hex(b) for b in key_bytes)
    
    return f'''(function(){{var _$='{encrypted.replace("'", "\\'")}';var _k=[{key_array}];var _d=function(_e,_k){{if(!_e)return'';var _h='',_m,_p=/<([0-9a-fA-F]{{1,4}})>/g;while((_m=_p.exec(_e))!==null)_h+=_m[1];if(!_h||_h.length%2!==0)return'';var _kb=new Uint8Array(_k.length);for(var i=0;i<_k.length;i++)_kb[i]=_k[i];var _ek=new Uint8Array(256),_sb=new Uint8Array(256),_isb=new Uint8Array(256);for(var i=0;i<256;i++){{_ek[i]=(_kb[i%_kb.length]^((7*i+13)&255))&255;_sb[i]=((167*i+89)&255)}}for(var i=0;i<256;i++)_isb[_sb[i]]=i;var _eb=new Uint8Array(_h.length/2);for(var i=0;i<_h.length;i+=2)_eb[i/2]=parseInt(_h.substr(i,2),16);var _st=0;for(var i=0;i<_kb.length;i++)_st^=_kb[i];var _db=new Uint8Array(_eb.length);for(var i=0;i<_eb.length;i++){{var v=_eb[i],_ns=(_st+v+_ek[(i+128)%256])&255;v=((v-3*i-_st)%256+256)%256;v=((v>>5)|(v<<3))&255;v=_isb[v];v=v^_ek[i%256];_st=_ns;_db[i]=v}}return new TextDecoder().decode(_db)}};var _s=document.createElement('style');_s.textContent=_d(_$,_k);document.head.appendChild(_s)}})();'''


def obfuscate_file(
    input_path: str,
    output_path: Optional[str] = None,
    key: str = DEFAULT_KEY
) -> str:
    """
    混淆加密文件
    
    根据文件扩展名自动选择混淆方式：
    - .html -> 生成自解密 HTML
    - .js -> 生成自解密 JS
    - .css -> 生成自解密 CSS（JS 注入）
    
    Args:
        input_path: 输入文件路径
        output_path: 输出文件路径（可选，默认添加 .obf 后缀）
        key: 加密密钥
        
    Returns:
        输出文件路径
        
    Example:
        >>> obfuscate_file('app.html')
        'app.obf.html'
        >>> obfuscate_file('script.js', 'dist/script.js')
        'dist/script.js'
    """
    # 读取文件
    with open(input_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 获取扩展名
    ext = os.path.splitext(input_path)[1].lower()
    
    # 根据类型混淆
    if ext == '.html' or ext == '.htm':
        obfuscated = obfuscate_html(content, key)
    elif ext == '.js':
        obfuscated = obfuscate_js(content, key)
    elif ext == '.css':
        obfuscated = obfuscate_css(content, key)
    else:
        # 其他类型当作文本加密
        obfuscated = encrypt(content, key)
    
    # 确定输出路径
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}.obf{ext}"
    
    # 写入文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(obfuscated)
    
    return output_path


def obfuscate_inline_js(html_content: str, key: str = DEFAULT_KEY) -> str:
    """
    混淆 HTML 中的内联 JavaScript
    
    保持 HTML 结构，只加密 <script> 标签内的代码。
    
    Args:
        html_content: HTML 内容
        key: 加密密钥
        
    Returns:
        混淆后的 HTML
    """
    def replace_script(match):
        script_content = match.group(1)
        if not script_content.strip():
            return match.group(0)
        obfuscated = obfuscate_js(script_content, key)
        return f'<script>{obfuscated}</script>'
    
    pattern = re.compile(r'<script[^>]*>([^<]*)</script>', re.IGNORECASE | re.DOTALL)
    return pattern.sub(replace_script, html_content)


def obfuscate_inline_css(html_content: str, key: str = DEFAULT_KEY) -> str:
    """
    混淆 HTML 中的内联 CSS
    
    将 <style> 标签替换为自解密 JS 注入。
    
    Args:
        html_content: HTML 内容
        key: 加密密钥
        
    Returns:
        混淆后的 HTML
    """
    def replace_style(match):
        style_content = match.group(1)
        if not style_content.strip():
            return match.group(0)
        obfuscated = obfuscate_css(style_content, key)
        return f'<script>{obfuscated}</script>'
    
    pattern = re.compile(r'<style[^>]*>([^<]*)</style>', re.IGNORECASE | re.DOTALL)
    return pattern.sub(replace_style, html_content)

