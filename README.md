# CFspider

Cloudflare Workers 代理 IP 池，使用 Cloudflare 全球边缘节点 IP 作为代理出口。

## 安装

```bash
pip install cfspider
```

## 使用

```python
import cfspider

# 发送请求，使用 Cloudflare IP 出口
response = cfspider.get(
    "https://httpbin.org/ip",
    cf_proxies="https://your-workers.dev"  # 替换为你的 Workers 地址
)

print(response.text)      # {"origin": "172.64.xxx.xxx"}
print(response.cf_colo)   # NRT (节点代码)
```

## 使用 Session

```python
import cfspider

# 创建 Session，只需设置一次
session = cfspider.Session(cf_proxies="https://your-workers.dev")

# 之后无需再指定 cf_proxies
r1 = session.get("https://httpbin.org/ip")
r2 = session.get("https://example.com")

print(r1.text)
session.close()
```

## 部署 Workers

将 `workers.js` 代码复制到 Cloudflare Workers 即可部署你自己的代理节点。

## License

MIT
