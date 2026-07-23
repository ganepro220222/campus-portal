Set sh = CreateObject("Shell.Application")
url = "http://127.0.0.1:8199/studio.html"
If WScript.Arguments.Count > 0 Then url = WScript.Arguments(0)
sh.ShellExecute url, "", "", "open", 1
