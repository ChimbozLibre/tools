// ==UserScript==
// @name         Guruji
// @namespace    https://chimboz.fr/tchat
// @version      0.9.3
// @description  Full interface redesign
// @author       Tigriz
// @license      CeCILL v2.1
// @match        https://chimboz.fr/tchat
// @icon         https://chimboz.fr/chat/index.apple-touch-icon.png
// @run-at       document-start
// @grant        none
// ==/UserScript==

const html = (html) => Object.assign(document.createElement('template'), { innerHTML: html.trim() }).content.firstChild;

(function () {
  'use strict';

  // Chimboz instance
  const Chimboz = {
    ws: null,
    fromBinary: (str) => {
      return decodeURIComponent(
        atob(str)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
    },
    toBinary: (str) => {
      return btoa(
        encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
        })
      );
    },
    parse: (data) => {
      const parsed = [...new Uint8Array(data)];
      return {
        type: parsed[0],
        data: new TextDecoder().decode(new Uint8Array(parsed).slice(6)),
      };
    },
    packetHandler: (packet) => {
      switch (packet.type) {
        case 2:
        case 4:
          Chimboz.you = { id: packet.data.split(',')[0], name: packet.data.split(',')[1], power: packet.data.split(',')[4] };
          break;
        case 5:
          Chimboz.users = [];
          Guruji.online.innerHTML = '';
          break;
        case 6:
          for (const user of packet.data.split('|'))
            if (user) Chimboz.users.push({ id: user.split(',')[0], name: user.split(',')[1], power: user.split(',')[2] });
          Guruji.refreshOnline();
          break;
        case 10:
          Chimboz.users.splice(
            Chimboz.users.findIndex((user) => user.id === packet.data),
            1
          );
          Guruji.refreshOnline();
          break;
        case 7:
          Chimboz.users.push({ id: packet.data.split(',')[0], name: packet.data.split(',')[1], power: packet.data.split(',')[2] });
          Guruji.refreshOnline();
          break;
        case 11:
          const message = Chimboz.fromBinary(packet.data.split(',')[1]);
          const user = Chimboz.users.find((user) => user.id === packet.data.split(',')[0]);
          let highlight = false;
          if (RegExp(Chimboz.you.name, 'gi').test(message)) {
            document.title = `🔔 Chimboz`;
            new Notification(`${user.name} tagged you!`, { body: message, icon: 'https://chimboz.fr/chat/index.apple-touch-icon.png' });
            highlight = true;
          }
          Guruji.message(user, message, highlight);
          break;
      }
    },
    bind: (ws) => {
      ws.addEventListener('message', (event) => {
        Chimboz.packetHandler(Chimboz.parse(event.data));
      });
      Chimboz.ws = ws;
    },
    users: [],
  };

  // Bind WebSocket send
  const nativeWebSocket = window.WebSocket;
  window.WebSocket = function (...args) {
    const socket = new nativeWebSocket(...args);
    socket._send = socket.send;
    socket.send = (...data) => {
      const res = Chimboz.parse(data[0]);
      if (res.type === 8) Guruji.message(Chimboz.you, Chimboz.fromBinary(res.data));
      socket._send(...data);
    };
    Chimboz.bind(socket);
    return socket;
  };

  // Automatically hide boxes
  const CHAT_CONFIG = JSON.parse(localStorage.chimboz_config ?? '{}');
  CHAT_CONFIG.noChatBox = true;
  CHAT_CONFIG.noLateralGUI = true;
  CHAT_CONFIG.panelChatMarginBottom = 0;
  CHAT_CONFIG.panelChatMarginLeft = -272;
  CHAT_CONFIG.panelChatMarginRight = 0;
  CHAT_CONFIG.panelChatMarginTop = -50;
  CHAT_CONFIG['panelChatPosition.x'] = 752;
  CHAT_CONFIG['panelChatPosition.y'] = 651;
  CHAT_CONFIG['panelChatSize.x'] = 272;
  CHAT_CONFIG['panelChatSize.y'] = 50;
  CHAT_CONFIG.panelConnectedMarginBottom = 10050;
  CHAT_CONFIG.panelConnectedMarginLeft = -272;
  CHAT_CONFIG.panelConnectedMarginRight = 0;
  CHAT_CONFIG.panelConnectedMarginTop = 10000;
  CHAT_CONFIG['panelConnectedPosition.x'] = 752;
  CHAT_CONFIG['panelConnectedPosition.y'] = 10000;
  CHAT_CONFIG['panelConnectedSize.x'] = 272;
  CHAT_CONFIG['panelConnectedSize.y'] = 50;
  localStorage.chimboz_config = JSON.stringify(CHAT_CONFIG);

  // Guruji interface
  const Guruji = html('<div id="guruji" style="width: 300px"></div>');
  Guruji.online = html('<div class="window" id="online"></div>');
  Guruji.messages = html('<div class="window" id="messages"></div>');
  Guruji.append(Guruji.online, Guruji.messages);
  Guruji.refreshOnline = () => {
    Guruji.online.innerHTML = '';
    for (const user of Chimboz.users.sort((a, b) => a.name.localeCompare(b.name)))
      Guruji.online.append(html(`<a class="user level_${user.power}" href="/book/${user.id}" target="_blank">${user.name}</a>`));
  };
  Guruji.message = (user, message, highlight = false) => {
    function isValidUrl(url) {
      try {
        return Boolean(new URL(url));
      } catch (e) {
        return false;
      }
    }
    let span = html('<span></span>');
    if (isValidUrl(message)) span = html(`<a class="link" target="_blank" href="${message}"></a>`);
    span.innerText = message;
    const div = html(
      `<div class="message ${highlight ? 'hl' : ''}"><span class="time">${new Date().toLocaleTimeString('fr')}</span><a href="/book/${
        user.id
      }" target="_blank" class="level_${user.power}">${user.name}</a>: </div>`
    );
    div.onclick = () => navigator.clipboard.writeText(message);
    div.append(span);
    Guruji.messages.append(div);
    Guruji.messages.scrollTop += div.clientHeight;
  };

  // Style
  const style = document.createElement('style');
  style.innerHTML = `
html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  color: #284555;
  display: flex;
  height: 100vh;
  font-size: 12px;
}

/* Custom scrollbar (chromium based browsers) */
::-webkit-scrollbar {
  width: 16px;
}

::-webkit-scrollbar-thumb {
  border-radius: 12px;
  border: 4px solid transparent;
  background-clip: content-box;
  background-color: #5282b3;
}

::-webkit-scrollbar-corner {
  background: transparent;
}

* {
  box-sizing: border-box;
}

#turn {
  display: none;
}

#content {
  flex: 1;
  display: block !important;
}

#canvas {
  position: unset !important;
  border-radius: 12px;
}

#guruji {
  text-align: left;
  font-family: system-ui;
  padding-left: 4px;
  display: flex;
  flex-direction: column;
  resize: horizontal;
  overflow: auto;
}

.window {
  overflow: auto;
  background: linear-gradient(#77a3ce, #5282b3 30px, #fff8 30px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  resize: vertical;
  min-height: 30px;
  margin-bottom: 4px;
}

.window::before {
  background: linear-gradient(#77a3ce, #5282b3);
  line-height: 0;
  font-size: 14px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  color: transparent;
  text-shadow: 0 0 0 #fff;
  font-weight: bold;
  position: sticky;
  top: 0;
  min-height: 30px;
}

#online::before {
  content: "👤 Online";
}

#messages::before {
  content: "🗨 Chat";
}

#messages {
  flex: 1;
  resize: none;
}

a {
  text-decoration: none;
  font-weight: bold;
  color: inherit;
}

.window > *:hover {
  background: #f80 !important;
  color: #fff;
}

.window > * {
  padding: 4px 8px;
  color: #036;
  word-break: break-word;
  cursor: pointer;
}

.window > *:nth-child(2n) {
  background: #fff3;
}

.message .link {
  color: #f0009c;
}

.message .time {
  font-family: monospace;
  font-size: 10px;
  margin-right: 4px;
}

.message.hl {
  background: #f0009c;
  color: #fff;
}

.level_1 {
  color: #900
}

.level_2 {
  color: #090
}

.level_3 {
  color: #009
}

.level_4 {
  color: #990
}

.level_5 {
  color: #6a6a6a
}

.level_6 {
  color: #f30
}
`;

  // Setup
  document.body.append(style);
  document.body.append(Guruji);

  window.onfocus = () => {
    document.title = 'Chimboz';
  };

  window.onresize = () => {
    window.innerWidth = document.body.clientWidth - Guruji.style.width.slice(0, -2);
  };
  const observer = new MutationObserver(function (mutations) {
    if (mutations[0].attributeName === 'style') window.onresize();
  });
  observer.observe(Guruji, { attributes: true });
  const controller = new AbortController();
  document.body.addEventListener(
    'mousemove',
    (event) => {
      window.onresize();
      controller.abort();
    },
    { signal: controller.signal }
  );
  window.onresize();

  if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
})();
