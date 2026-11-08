# VS Code Extension: Build to Publish Cheat Sheet

Ek baar ka account setup (Part 1) ke baad, har naye extension ke liye sirf Part 2 se 6 karna hai.

---

## PART 1: One-time Account Setup (sirf pehli baar)

1. **Publisher banao:** marketplace.visualstudio.com/manage -> Microsoft account se login -> Create publisher
   - Name: kuch bhi. **ID: lowercase, no space, baad me change nahi hoti**
   - Baaki fields optional
2. **Token (PAT):** dev.azure.com -> User settings -> Personal access tokens (sirf `vsce publish` ke liye chahiye)
   - Organization: All accessible organizations, Scope: Marketplace -> Manage
   - **Agar dev.azure.com Azure Portal pe redirect kare:** skip karo, Part 5 me manual `.vsix` upload use karo (token ki zarurat nahi)
3. **Dhyan:** Azure Portal me Free Trial / Pay-As-You-Go **kabhi sign up mat karna** (card maangta hai, zarurat nahi)
4. **Microsoft "account creation blocked" aaye:** incognito, VPN off, ya kal try karo

---

## PART 2: Setup (har naye extension ke liye)

```bash
node -v && git --version
npm install -g yo generator-code @vscode/vsce
npx yo code
```

`yo code` me: **New Extension (TypeScript)**, name (lowercase, hyphen), unbundled, npm.

- `yo` not recognized aaye -> `npx yo code` use karo
- `EBADENGINE` warnings sirf warnings hain, ignore karo

**Important files:**
- `package.json`: naam, commands, settings, version, publisher
- `src/extension.ts`: `activate()` yahin se start hota hai

---

## PART 3: Build + Test

```bash
npm run compile
```

**Test karne ka sahi tareeka (F5 pe bharosa mat karo):**

```bash
code --extensionDevelopmentPath="C:\path\to\project"
```

- F5 ka debugger (`--inspect-brk`) kabhi extension host ko atka deta hai -> `command not found` error aata hai
- Is command se khulne wale window me hi test karo (original window me extension load nahi hota)
- Dev window ki **Output panel** me logs dekho, guess mat karo
- Terminal ka shell integration **naye terminal** me hi activate hota hai

**Debug rule:** pehle log lagao (`console.log` ya Output Channel), phir fix karo. Andaze se fix mat karo.

---

## PART 4: package.json Checklist (publish se pehle)

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "description": "Ek line me kya karta hai",
  "version": "0.0.1",
  "publisher": "<id>",
  "license": "MIT",
  "icon": "images/icon.png",
  "repository": { "type": "git", "url": "https://github.com/USER/REPO" },
  "categories": ["Other"],
  "engines": { "vscode": "^1.93.0" },
  "devDependencies": { "@types/vscode": "1.93.0" }
}
```

| Rule | Kyu |
|---|---|
| `engines.vscode` aur `@types/vscode` **same version** | Warna `vsce package` error deta hai |
| `engines.vscode` chhota rakho (`^1.93.0`) | Purane VS Code wale bhi install kar sakein |
| `publisher` = Marketplace wali ID | Warna upload reject |
| `icon`: **PNG, 128x128 ya 256x256**, SVG nahi | Nahi diya toh default placeholder dikhega |
| `LICENSE` file banao | Nahi toh warning aata hai |
| `.vscodeignore` me `images/**` aur `media/**` **na** ho | Warna icon/sound `.vsix` me nahi jaata |
| `displayName` badal sakte ho, `name` mat badlo | `name` badla toh extension ID badal jaati hai |

---

## PART 5: Package + Publish

```bash
npm run compile
npx @vscode/vsce package
```

Ye `name-version.vsix` banata hai. (File zip hoti hai, double-click pe khali dikhegi, ye normal hai. Size check karo.)

**Pehle local test (1 min):**

```bash
code --install-extension name-0.0.1.vsix
```

Restart VS Code, test karo.

**Publish karne ke 2 raaste:**

**A) Manual upload (token nahi chahiye, easy):**
1. marketplace.visualstudio.com/manage -> apna publisher
2. **+ New extension -> Visual Studio Code** -> `.vsix` drag-drop
3. Naya version: extension ke aage **... -> Update**

**B) CLI (token chahiye):**
```bash
npx @vscode/vsce login <publisher-id>   # PAT paste karo
npx @vscode/vsce publish
```

---

## PART 6: Update karna

1. Code fix karo
2. **`package.json` me version badhao** (`0.0.1` -> `0.0.2`). Same version dobara upload nahi hota
3. File rename **mat** karo, version `package.json` ke andar se padha jaata hai
4. `npx @vscode/vsce package` -> Update upload
5. Marketplace pe icon/changes dikhne me 5-15 min lagte hain, `Ctrl+F5` se refresh

---

## Common Errors Quick Table

| Error | Fix |
|---|---|
| `command 'x' not found` | Extension activate nahi hua. `code --extensionDevelopmentPath=...` se chalao, Output me log dekho |
| `@types/vscode greater than engines.vscode` | Dono same version karo: `npm i -D @types/vscode@1.93.0` |
| `LICENSE not found` warning | `LICENSE` file banao ya `y` dabao |
| Version already exists | `package.json` me version badhao |
| Icon nahi dikha | `icon` field + PNG + `.vscodeignore` check, version badhao, dobara upload |
| Terminal command detect nahi hua | Naya terminal kholo, shell PowerShell/pwsh ho, `commandLine.confidence` 0 ho sakta hai (regex se `^` hata do) |
| Search me extension nahi dikha | 5-15 min wait, ya direct link: `marketplace.visualstudio.com/items?itemName=<publisher>.<name>` |

---

## Extra (optional)

- **Open VSX** (Antigravity/VSCodium users ke liye): open-vsx.org pe GitHub login, token banao, `npx ovsx publish file.vsix -p <token>`
- **Copyright:** film ke sounds, characters, images public extension me risky hain (takedown). Original ya royalty-free use karo
- **Token kabhi GitHub pe push mat karo, kisi ko mat do**
- README me demo GIF aur settings table daalo, extension professional lagta hai

---

## Short Flow (yaad rakhne ke liye)

```
yo code -> code likho -> npm run compile
-> code --extensionDevelopmentPath=. se test
-> package.json checklist (publisher, icon, engines = types, license)
-> npx @vscode/vsce package
-> code --install-extension x.vsix (local test)
-> Marketplace manage page pe upload
-> update ke liye version badhao
```
