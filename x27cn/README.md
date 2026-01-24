# X27CN

X27CN 代码混淆加密库 - Code obfuscation and encryption library

## 安装

```bash
pip install x27cn
```

## 快速开始

```python
import x27cn

# 加密
encrypted = x27cn.encrypt('Hello World')
print(encrypted)  # <faee><38db>...

# 解密
decrypted = x27cn.decrypt(encrypted)
print(decrypted)  # Hello World

# 使用自定义密钥
encrypted = x27cn.encrypt('敏感数据', key='mySecretKey')
decrypted = x27cn.decrypt(encrypted, key='mySecretKey')
```

## 文件混淆（前端代码保护）

### Python API

```python
import x27cn

# 混淆整个 HTML 文件（生成自解密页面）
x27cn.obfuscate_file('index.html')  # 生成 index.obf.html

# 混淆 JavaScript 文件
x27cn.obfuscate_file('app.js')  # 生成 app.obf.js

# 混淆 CSS 文件
x27cn.obfuscate_file('style.css')  # 生成 style.obf.css

# 自定义输出路径和密钥
x27cn.obfuscate_file('app.html', 'dist/app.html', key='myKey')
```

### 命令行

```bash
# 混淆 HTML
x27cn obfuscate index.html

# 混淆 JS
x27cn obfuscate app.js dist/app.js

# 使用自定义密钥
x27cn obfuscate app.html --key=mySecretKey

# 加密文本
x27cn encrypt -t "Hello World"

# 解密文本
x27cn decrypt -t "<faee><38db>..."
```

### 混淆效果

**原始 HTML:**
```html
<!DOCTYPE html>
<html>
<body>
  <h1>Hello World</h1>
  <script>alert('Secret!');</script>
</body>
</html>
```

**混淆后:**
```html
<!DOCTYPE html>
<html>
<body>
<script>
(function(){var _$='<9525><0d5b>...';var _k=[0x78,0x32,...];...})();
</script>
</body>
</html>
```

浏览器加载混淆后的文件会自动解密并正常显示原始内容。

### 内联混淆

```python
import x27cn

html = '''
<html>
<style>body { color: red; }</style>
<script>alert('hello');</script>
</html>
'''

# 只混淆内联 JS
result = x27cn.obfuscate_inline_js(html)

# 只混淆内联 CSS
result = x27cn.obfuscate_inline_css(html)
```

## API 参考

### 基础加密/解密

```python
# 标准格式（<xxxx> 标签）
encrypted = x27cn.encrypt('text')
decrypted = x27cn.decrypt(encrypted)

# 纯十六进制格式
hex_encrypted = x27cn.encrypt_hex('text')
decrypted = x27cn.decrypt_hex(hex_encrypted)

# Base64 格式
b64_encrypted = x27cn.encrypt_base64('text')
decrypted = x27cn.decrypt_base64(b64_encrypted)
```

### 文件混淆

```python
# 混淆整个文件
x27cn.obfuscate_file(input_path, output_path=None, key='x27cn2026')

# 混淆 HTML 字符串
x27cn.obfuscate_html(html_content, key='x27cn2026')

# 混淆 JS 字符串
x27cn.obfuscate_js(js_content, key='x27cn2026')

# 混淆 CSS 字符串
x27cn.obfuscate_css(css_content, key='x27cn2026')
```

### 密钥管理

```python
# 使用默认密钥
x27cn.encrypt('data')  # 使用 'x27cn2026'

# 自定义密钥
x27cn.encrypt('data', key='myKey')

# 生成随机密钥
random_key = x27cn.generate_key(16)  # 16 字符随机密钥
```

## 算法说明

X27CN v2 使用以下加密步骤:

1. **密钥扩展** - 将密钥扩展为 256 字节
2. **S-Box 替换** - 非线性字节替换
3. **位旋转** - 循环左移 5 位
4. **状态混合** - 使用累积状态值混淆

## 安全说明

X27CN 设计用于**代码混淆**，不是密码学安全的加密算法。

适用场景:
- 前端代码混淆保护
- API 响应混淆
- 配置文件保护
- 防止代码被轻易复制

不适用场景:
- 密码存储（请使用 bcrypt/argon2）
- 敏感数据加密（请使用 AES-256）
- 通信加密（请使用 TLS）

## License

MIT

