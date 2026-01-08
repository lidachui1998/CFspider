import CodeVideoRenderer

CodeVideoRenderer.CameraFollowCursorCV(code_string="""
import cfspider

response = cfspider.get("https://www.cfspider.com",impersonate="chrome131")

print(response.text)
""")