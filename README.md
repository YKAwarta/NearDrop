# NearDrop

NearDrop is a cross-platform desktop app that allows users to share files over local WiFi. In other words, AirDrop, but for everyone :)

Features:

- Select any file on your device.
- Discover any and all nearby devices on your local network (LAN).
- Securely send the file over WiFI!
- Offline, peer-to-peer (P2P), and cross-platform :)

Stack:

- Frontend: React (inside Electron).
- Backend: Node.js
- Shell: Electron.js
- Device Discovery: mDNS (using Bonjour)
- File Transfer: TCP & WebRTC

Project Structure:

- NearDrop/
  - electron-app/ (primary desktop app)
    - main.js (Electron entry point)
    - preload.js (Frontend/Backend middleman)
    - renderer/ (Frontend AKA React UI)
  - core/ (File transfer & device discovery logic)
  - shared/ (Shared constants & utils)

Setup Instructions:

- git clone https://github.com/YKAwarta/NearDrop.git
- cd NearDrop/electron-app
- npm install
- npm run start
