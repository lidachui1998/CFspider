import cfspider
import requests

worker_url = "ip.kami666.xyz"
cf_response = cfspider.get("https://httpbin.org/ip", cf_proxies=worker_url)

print(cf_response.text)