"""
X27CN - 代码混淆加密库
Code obfuscation and encryption library

使用方法:
    import x27cn
    
    # 加密
    encrypted = x27cn.encrypt('Hello World')
    
    # 解密
    decrypted = x27cn.decrypt(encrypted)
    
    # 自定义密钥
    encrypted = x27cn.encrypt('data', key='mySecretKey')
    decrypted = x27cn.decrypt(encrypted, key='mySecretKey')
    
    # 文件混淆
    x27cn.obfuscate_file('app.html')  # 生成 app.obf.html
    x27cn.obfuscate_file('script.js')  # 生成 script.obf.js
"""

from .core import (
    encrypt,
    decrypt,
    encrypt_hex,
    decrypt_hex,
    encrypt_base64,
    decrypt_base64,
    generate_key,
    DEFAULT_KEY,
)

from .obfuscate import (
    obfuscate_html,
    obfuscate_js,
    obfuscate_css,
    obfuscate_file,
    obfuscate_inline_js,
    obfuscate_inline_css,
)

__version__ = '1.1.0'
__author__ = 'CFspider'
__all__ = [
    # 核心加密
    'encrypt',
    'decrypt',
    'encrypt_hex',
    'decrypt_hex',
    'encrypt_base64',
    'decrypt_base64',
    'generate_key',
    'DEFAULT_KEY',
    # 文件混淆
    'obfuscate_html',
    'obfuscate_js',
    'obfuscate_css',
    'obfuscate_file',
    'obfuscate_inline_js',
    'obfuscate_inline_css',
]

