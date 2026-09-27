# 🚀 Telegram Drive (v1.0.0)

<p align="center">
  <img src="https://raw.githubusercontent.com/eveyka/Telegram-Drive/main/app/src-tauri/icons/128x128.png" width="96" height="96" alt="Telegram Drive Logo" />
</p>

<p align="center">
  <b>High-Performance Unlimited Cloud Storage Powered by Telegram Cloud Infrastructure</b>
</p>

<p align="center">
  <a href="https://github.com/eveyka/Telegram-Drive-Public/releases/tag/v1.0.0"><img src="https://img.shields.io/badge/Release-v1.0.0-blue.svg?style=for-the-badge" alt="Release v1.0.0" /></a>
  <a href="https://github.com/eveyka/Telegram-Drive-Public/releases"><img src="https://img.shields.io/badge/Platforms-Windows%20%7C%20Android%20%7C%20macOS%20%7C%20Linux%20%7C%20iOS-green.svg?style=for-the-badge" alt="Platforms" /></a>
  <a href="https://github.com/eveyka/Telegram-Drive-Public"><img src="https://img.shields.io/badge/License-Eveyka-purple.svg?style=for-the-badge" alt="License" /></a>
</p>

---

## 📥 Official Download Matrix (v1.0.0)

Download the optimized build for your operating system:

| Platform | Format / Type | Architecture | File Name | Direct Download |
| :--- | :--- | :--- | :--- | :--- |
| **🪟 Windows** | NSIS Installer (`.exe`) | x64 (64-bit) | `TG-Drive-v1.0.0-Windows-x64-Setup.exe` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-Windows-x64-Setup.exe) |
| **🪟 Windows** | Standalone Portable (`.exe`) | x64 (64-bit) | `TG-Drive-v1.0.0-Windows-x64-Portable.exe` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-Windows-x64-Portable.exe) |
| **🤖 Android** | Universal APK (`.apk`) | ARM64 / ARMv7 / x86_64 | `TG-Drive-v1.0.0-Android-Universal.apk` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-Android-Universal.apk) |
| **🍏 macOS** | Apple Silicon (`.dmg`) | M1 / M2 / M3 / M4 (ARM64) | `TG-Drive-v1.0.0-macOS-Apple-Silicon-ARM64.dmg` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-macOS-Apple-Silicon-ARM64.dmg) |
| **🍏 macOS** | Intel (`.dmg`) | Intel 64-bit (x86_64) | `TG-Drive-v1.0.0-macOS-Intel-x64.dmg` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-macOS-Intel-x64.dmg) |
| **🐧 Linux** | AppImage (`.AppImage`) | x86_64 | `TG-Drive-v1.0.0-Linux-x64.AppImage` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-Linux-x64.AppImage) |
| **🐧 Linux** | Debian Package (`.deb`) | x86_64 (Ubuntu/Debian) | `TG-Drive-v1.0.0-Linux-x64.deb` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-Linux-x64.deb) |
| **📱 iOS** | Direct Sideload IPA (`.ipa`) | ARM64 (iOS 15.0+) | `TG-Drive-v1.0.0-iOS-Direct-Install.ipa` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-iOS-Direct-Install.ipa) |
| **📱 iOS** | Simulator Bundle (`.zip`) | Apple Silicon Sim | `TG-Drive-v1.0.0-iOS-Simulator-App.zip` | [Download](https://github.com/eveyka/Telegram-Drive-Public/releases/download/v1.0.0/TG-Drive-v1.0.0-iOS-Simulator-App.zip) |

---

## ✨ Features

- ⚡ **Unlimited Cloud Storage:** Leverage Telegram's secure distributed cloud infrastructure to store and stream files without storage boundaries.
- 🔒 **End-to-End Encryption:** Client-side encryption ensures only you have access to your data.
- 🚀 **High-Speed Chunked Transfers:** Multi-stream concurrent uploading and downloading with automatic resumption on disconnects.
- 📱 **Native Mobile Experience:** Android background foreground service with live persistent notifications and MediaStore integration.
- 💻 **Cross-Platform:** Unified desktop and mobile apps built with lightweight native Rust cores and modern responsive interfaces.
- 📂 **Virtual Folder Hierarchy:** Organize files with nested folders, tags, search, and instant previews.

---

## 🛠️ Installation & Setup Instructions

### 🪟 Windows
1. Download `TG-Drive-v1.0.0-Windows-x64-Setup.exe` (Installer) or `TG-Drive-v1.0.0-Windows-x64-Portable.exe` (Standalone).
2. Double-click the file to launch.
3. If Windows SmartScreen displays a warning, click **More info** ➔ **Run anyway**.

---

### 🤖 Android
1. Download `TG-Drive-v1.0.0-Android-Universal.apk`.
2. Open the downloaded `.apk` file on your Android device.
3. If prompted, enable **"Install Unknown Apps"** from your browser or file manager settings.
4. Tap **Install** and open Telegram Drive.

---

### 🍏 macOS (Apple Silicon & Intel)
1. Download `TG-Drive-v1.0.0-macOS-Apple-Silicon-ARM64.dmg` (for M1/M2/M3/M4 Macs) or `TG-Drive-v1.0.0-macOS-Intel-x64.dmg` (for Intel Macs).
2. Open the `.dmg` file and drag **TG Drive** into your `Applications` folder.
3. If macOS blocks opening because the app is from an unverified developer:
   - Right-click the app in **Applications** and select **Open**.
   - Or run the following command in Terminal:
     ```bash
     xattr -cr /Applications/TG\ Drive.app
     ```

---

### 🐧 Linux (AppImage & Debian)
- **AppImage:**
  ```bash
  chmod +x TG-Drive-v1.0.0-Linux-x64.AppImage
  ./TG-Drive-v1.0.0-Linux-x64.AppImage
  ```
- **Debian / Ubuntu (.deb):**
  ```bash
  sudo dpkg -i TG-Drive-v1.0.0-Linux-x64.deb
  sudo apt-get install -f # If any dependencies are missing
  ```

---

### 📱 iOS Sideloading
1. Download `TG-Drive-v1.0.0-iOS-Direct-Install.ipa`.
2. Sideload using your preferred tool:
   - **AltStore / SideStore**
   - **TrollStore**
   - **Sideloadly**
   - **Scarlet / Feather**

---

## 🔐 Checksums & Verification (SHA-256)

Verify the integrity of your downloaded files using SHA-256:

```
TG-Drive-v1.0.0-Windows-x64-Setup.exe
SHA-256: C76F62C3EE3A216AC6BED6374A9F5898F32FD5314D3C6615C5A87CC9CE4340FF

TG-Drive-v1.0.0-Windows-x64-Portable.exe
SHA-256: E37707B92742F77735848D0948ADFA695DDDA41EC1A7EFA916D6CF374B0FA81A

TG-Drive-v1.0.0-Android-Universal.apk
SHA-256: B16921C8BB71936023BE47245BED68EA1C18972E8E6221E788FD74D9081822EC

TG-Drive-v1.0.0-macOS-Apple-Silicon-ARM64.dmg
SHA-256: B6A0428E3CF0E9E49D3A31F8C442BD9D3E2E9AEBD9861619FFDBB33C3BEE3B95

TG-Drive-v1.0.0-macOS-Intel-x64.dmg
SHA-256: 16B39110BA2C46289328B81055338B794065D3905BD7D87E6FA0AC731BC9B1BE

TG-Drive-v1.0.0-Linux-x64.AppImage
SHA-256: 8805EE8B82D149E3C825A748A719B9146DCE413EE5A0C9E5DE7EB7F523EDF2CA

TG-Drive-v1.0.0-Linux-x64.deb
SHA-256: FDEC95D1761EA37F442C975E250CC9E8C01B4B6809E1825B3CF4D0070FF7E154
```

---

<p align="center">
  <b>Telegram Drive</b> is published and maintained by <b>Eveyka</b>.<br/>
  For support, updates, and releases, visit the <a href="https://github.com/eveyka/Telegram-Drive-Public">official public repository</a>.
</p>
