import cfspider

# 直接使用海外代理
response = cfspider.get(
    "https://httpbin.org/ip",
    proxies={
        "http": "http://us.cliproxy.io:3010",
        "https": "http://2e75108689-region-JP:nf9ssu7a@us.cliproxy.io:3010"
    }
)
print(response.json())