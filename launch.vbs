Dim WshShell, projectDir
Set WshShell = CreateObject("WScript.Shell")
projectDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\") - 1)
WshShell.CurrentDirectory = projectDir
WshShell.Run "npm start", 0, False
Set WshShell = Nothing
