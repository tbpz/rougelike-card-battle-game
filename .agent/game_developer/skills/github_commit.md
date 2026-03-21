---
name: GitHub PowerShell Commit
description: How to safely commit code to GitHub using PowerShell without triggering the '&&' error.
---

# Committing Code to GitHub on Windows PowerShell

When committing code to GitHub, avoid using `&&` to chain commands, as it is not supported by default in older versions of Windows PowerShell (like PowerShell 5.1).

**Instructions for the AI Agent:**
To commit code on this system, you must run your commands sequentially or use `;` to separate them. 

Run the following commands using the `run_command` tool (you can execute them sequentially by running them one by one, or separated by semicolons):

1. Stage all changes:
```powershell
git add .
```

2. Commit the changes:
```powershell
git commit -m "feat: your descriptive commit message here"
```

3. Push to the remote repository:
```powershell
git push
```

Alternatively, you can chain them safely in PowerShell:
```powershell
git add . ; if ($?) { git commit -m "feat: your message" ; if ($?) { git push } }
```
