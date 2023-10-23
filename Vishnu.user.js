// ==UserScript==
// @name         Vishnu
// @namespace    https://chimboz.fr/tchat
// @version      0.9.11
// @description  Full interface redesign and various utils
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
    PACKET_OUT: {
      CHECK_VERSION: 0,
      PING: 1,
      LOGIN: 2,
      LOGIN_VISITOR: 3,
      REGISTER: 4,
      ASK_GO_ROOM: 5,
      START_MOVE: 6,
      END_MOVE: 7,
      SEND_MESSAGE: 8,
      AFK: 9,
      ROOM_READY: 10,
      GET_CONNECTEDS: 11,
      GET_ROOM_CONNECTEDS: 12,
      OPEN_PRIVATE_TAB: 13,
      SEND_PRIVATE_MESSAGE: 14,
      MAZO: 15,
      DROP_ITEM: 16,
      UPDATE_CLOTHES: 17,
      ADD_PLAYER_BACTERIA: 18,
      REMOVE_PLAYER_BACTERIA: 19,
      ACTION_MOVE: 20,
      PLAYER_READY_BACTERIA: 21,
      BACTERIA_SHOT: 22,
      END_BACTERIA_GAME: 23,
      ADD_PLAYER_WEDDING: 24,
      REMOVE_PLAYER_WEDDING: 25,
      CMD_ALERT_ALL: 26,
      USE_ITEM: 27,
      HANDLE_ANIMAL: 28,
      SAVE_SPAWN_LOCATION: 29,
      CLOSE_SERVER: 30,
      BUY_ITEM: 31,
      ASK_GO_HOUSE: 32,
      CMD_BYBY: 33,
      CMD_FERMLA: 34,
      DIVORCE: 35,
      END_PATOJDUR_GAME: 36,
      START_PATOJDUR_GAME: 37,
      CANCEL_PATOJDUR_GAME: 38,
      ADD_PLAYER_PATOJDUR: 39,
      CCK_KICK: 40,
      RENAME_PET: 41,
      CMD_KICK: 42,
      VOTE: 43,
      REGISTER_CCK_QUEUE: 44,
      CUT_TREE: 45,
      CRAFT_ITEM: 46,
      MANAGE_HOUSE: 47,
      SELL_HOUSE: 48,
      DESTRUCT_HOUSE: 49,
      PAY_HOUSING_TAX: 50,
      CANCEL_SELLING_HOUSE: 51,
      BUY_HOUSE: 52,
      PLACE_FURNITURE: 53,
      GET_FURNITURE_BACK: 54,
      HANDLE_FURNITURE: 55,
      HANDLE_TRADE_REQUEST: 56,
      HANDLE_TRADE: 57,
      IGNORE_PLAYER: 58,
      QUEST_DONE: 59,
    },
    PACKET_IN: {
      INFORMATION: 0,
      PING: 1,
      USER_DATA: 2,
      USER_ITEMS: 3,
      VISITOR_DATA: 4,
      ROOM_IS_READY: 5,
      USERS_DATA_ROOM: 6,
      NEW_PLAYER_DATA: 7,
      USER_MOVING: 8,
      USER_END_MOVE: 9,
      USER_LEFT_ROOM: 10,
      USER_TALKING: 11,
      USER_AFK: 12,
      ITEMS_DATA_ROOM: 13,
      CONNECTEDS_COUNT: 14,
      CONNECTEDS_ROOM_COUNT: 15,
      RECEIVE_PM: 16,
      MAZO: 17,
      NEW_PLAYER_REGISTERED: 18,
      PETS_DATA_ROOM: 19,
      DROPPED_ITEM_REMOVED: 20,
      DROPPED_ITEM_SPAWNED: 21,
      USER_GET_ITEM: 22,
      USER_UPDATE_STYLE: 23,
      USED_ITEMS_DATA_ROOM: 24,
      TELEPORT_BACTERIA_GAME: 25,
      USER_DO_ACTION: 26,
      BACTERIA_GAME_START: 27,
      BACTERIA_SHOT: 28,
      BACTERIA_INFORMATIONS: 29,
      BACTERIA_OVER: 30,
      SERVER_GIVE_ITEM: 31,
      SERVER_REMOVE_ITEM: 32,
      WEDDING_STEP_RUNNING: 33,
      ALERT: 34,
      USER_USE_ITEM: 35,
      PET_SPAWNED: 36,
      PET_MOVING: 37,
      USED_ITEM_REMOVED: 38,
      USER_EQUIP_PET: 39,
      USER_REMOVE_PET: 40,
      PET_END_MOVE: 41,
      PET_UPDATED: 42,
      ITEM_BOUGHT: 43,
      USER_MUTED: 44,
      USER_MONEY_CHANGE: 45,
      USER_UNMUTED: 46,
      USER_BEEN_BANNED: 47,
      USER_BEEN_MUTED: 48,
      SERVER_REMOVE_ALL_ITEM: 49,
      USER_START_DIVORCE: 50,
      PATOJDUR_INFORMATIONS: 51,
      USER_JOIN_PATOJDUR: 52,
      CCK_WARN_USERS: 53,
      CCK_PARTY: 54,
      PET_RENAME: 55,
      USER_KICKED: 56,
      USER_BEEN_KICKED: 57,
      TREE_STATE: 58,
      TREES_DATA_ROOM: 59,
      HOUSES_DATA_ROOM: 60,
      USER_MANAGE_HOUSE: 61,
      USER_SELL_HOUSE: 62,
      USER_DESTRUCT_HOUSE: 63,
      USER_CANCEL_HOUSE_SALE: 64,
      USER_BUY_HOUSE: 65,
      FURNITURES_DATA_ROOM: 66,
      USER_PLACE_FURNITURE: 67,
      USER_REMOVE_FURNITURE: 68,
      USER_HOUSE_ADMIN: 69,
      USER_MANAGE_FURNITURE: 70,
      BACTERIA_NEW_TURN: 71,
      TRADE_REQUEST: 72,
      TRADE: 73,
      NEW_NPC_DATA: 74,
      REMOVE_NPC_DATA: 75,
      QUEST_IS_DONE: 76,
      CUSTOM_ITEM_ADDED: 77,
      NPC_SHOP_DATA: 78,
    },
    ROOMS: {
      BAC_GAME: { name: 'bac_game' },
      BACTERIA_DEBUTANTS: { name: 'bacteria_debutants', hasItems: true },
      CHIMBO_GATE: { name: 'chimbo_gate', hasItems: true },
      CHIMBO_WEDDING: { name: 'chimbo_wedding', hasItems: true },
      DISPATCHER: { name: 'dispatcher' },
      DIVORCE: { name: 'divorce' },
      GATE_TO_DEB: { name: 'gate_to_deb', hasItems: true },
      GATE_TO_DIVORCE: { name: 'gate_to_divorce', hasItems: true },
      GATE_TO_KOPAKABANA: { name: 'gate_to_kopakabana', hasTree: true, hasItems: true },
      GATE_TO_PATOJDUR: { name: 'gate_to_patojdur' },
      GATE_TO_PRO: { name: 'gate_to_pro', hasItems: true },
      GATE_TO_SWAMPS: { name: 'gate_to_swamps', hasItems: true },
      GATE_TO_WEDDING: { name: 'gate_to_wedding', hasItems: true },
      NOOBZONE: { name: 'noobzone' },
      PATOJDUR: { name: 'patojdur' },
      RESIDENTIAL_DISTRICT: { name: 'residential_district', hasTree: true },
      TO_BALLADES: { name: 'to_ballades', hasTree: true, hasItems: true },
      TO_BALLADES_CCK: { name: 'to_ballades_cck' },
      HOUSE_: { name: 'house_', parameter: true },
      BGD: { name: 'bgd', parameter: true },
    },
    BLACKLIST: [
      'PACKET_OUT.PING',
      'PACKET_IN.PING',
      'PACKET_OUT.MAZO',
      'PACKET_IN.MAZO',
      'PACKET_IN.USER_MOVING',
      'PACKET_OUT.START_MOVE',
      'PACKET_OUT.END_MOVE',
      'PACKET_OUT.AFK',
    ],
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
    parse: (data, type = 'PACKET_IN') => {
      const parsed = [...new Uint8Array(data)];
      return {
        rawType: parsed[0],
        type: Object.keys(Chimboz[type]).find((key) => Chimboz[type][key] === parsed[0]),
        length: parsed[2],
        data: new TextDecoder().decode(new Uint8Array(parsed).slice(6)),
      };
    },
    encode: (action, data = '') => {
      switch (action) {
        case Chimboz.PACKET_OUT.SEND_MESSAGE:
          return new Uint8Array([action, 0, Chimboz.toBinary(data).length, 0, 0, 0, ...Array.from(new TextEncoder().encode(Chimboz.toBinary(data)))]);
        default:
          return new Uint8Array([action, 0, data.length, 0, 0, 0, ...Array.from(new TextEncoder().encode(data))]);
      }
    },
    packetHandler: (packet) => {
      switch (packet.rawType) {
        case Chimboz.PACKET_IN.USER_DATA:
        case Chimboz.PACKET_IN.VISITOR_DATA:
          Chimboz.you = { id: packet.data.split(',')[0], name: packet.data.split(',')[1], power: packet.data.split(',')[4] };
          break;
        case Chimboz.PACKET_IN.ROOM_IS_READY:
          Chimboz.users = [];
          Vishnu.online.innerHTML = '';
          break;
        case Chimboz.PACKET_IN.USERS_DATA_ROOM:
          for (const user of packet.data.split('|'))
            if (user) Chimboz.users.push({ id: user.split(',')[0], name: user.split(',')[1], power: user.split(',')[2] });
          Vishnu.refreshOnline();
          break;
        case Chimboz.PACKET_IN.USER_LEFT_ROOM:
          Chimboz.users.splice(
            Chimboz.users.findIndex((user) => user.id === packet.data),
            1
          );
          Vishnu.refreshOnline();
          break;
        case Chimboz.PACKET_IN.NEW_PLAYER_DATA:
          Chimboz.users.push({ id: packet.data.split(',')[0], name: packet.data.split(',')[1], power: packet.data.split(',')[2] });
          Vishnu.refreshOnline();
          break;
        case Chimboz.PACKET_IN.USER_TALKING:
          const message = Chimboz.fromBinary(packet.data.split(',')[1]);
          const user = Chimboz.users.find((user) => user.id === packet.data.split(',')[0]);
          let highlight = false;
          if (RegExp(Chimboz.you.name, 'gi').test(message)) {
            document.title = `🔔 Chimboz`;
            new Notification(`${user.name} tagged you!`, { body: message, icon: 'https://chimboz.fr/chat/index.apple-touch-icon.png' });
            highlight = true;
          }
          Vishnu.message(user, message, highlight);
          break;
        case Chimboz.PACKET_IN.USER_MOVING:
          const data = packet.data.split(',')[0];
        default:
        // console.debug('⚠️ %cUnhandled packet ', 'color:orange');
      }
    },
    bind: (ws) => {
      ws.addEventListener('message', (event) => {
        const packet = Chimboz.parse(event.data);
        if (!Chimboz.BLACKLIST.includes(`PACKET_IN.${packet.type}`)) {
          console.log('📥 ', packet);
          Chimboz.packetHandler(packet);
        }
      });
      Chimboz.ws = ws;
    },
    send: (action, data = '') => Chimboz.ws.send(Chimboz.encode(action, data)),
    walk: {
      moonwalk: { activated: false, DIRECTIONS: { l: 'wr,-2,0', r: 'wl,2,0', d: 'wu,0,2', u: 'wd,0,-2' } },
      crabwalk: { activated: false, DIRECTIONS: { l: 'wd,-1,-1', r: 'wd,1,-1', d: 'wd,0,1', u: 'wd,0,-2' } },
      lagwalk: { activated: false, DIRECTIONS: { l: 'wl,1,0', r: 'wr,-1,0', d: 'wd,0,-1', u: 'wu,0,1' } },
    },
    floodTrade: (id, delay = 100) => {
      Chimboz.tasks.floodTrade.queue.push(
        setInterval(() => {
          Chimboz.send(Chimboz.PACKET_OUT.HANDLE_TRADE_REQUEST, 'tradeRequestCanceled');
          Chimboz.send(Chimboz.PACKET_OUT.HANDLE_TRADE_REQUEST, 'tradeRequestSent,' + String(id));
        }, delay)
      );
    },
    floodMessage: (message, delay = 100) => {
      Chimboz.tasks.floodMessage.queue.push(setInterval(() => Chimboz.send(Chimboz.PACKET_OUT.SEND_MESSAGE, String(message)), delay));
    },
    craft: (wood = 10) => {
      return new Promise((resolve) => {
        let i;
        for (i = 0; i < Math.floor(wood / 10); i++) Chimboz.send(Chimboz.PACKET_OUT.CRAFT_ITEM, '1');
        resolve();
      });
    },
    duplicate: async (item, wood = 1000) => {
      if (wood <= 1000) return;
      await Chimboz.craft(wood);
      Chimboz.send(Chimboz.PACKET_OUT.DROP_ITEM, `${item},0,0,i`);
    },
    catchAll: () => Chimboz.ws._send(Chimboz.encode(Chimboz.PACKET_OUT.START_MOVE, 'zz,0,0')),
    chop: () => {
      let i = 0;
      for (const room of Object.values(Chimboz.ROOMS).filter((room) => room.hasTree)) {
        setTimeout(() => {
          Chimboz.teleport(room.name);
          for (let i = 0; i < 27; i++) Chimboz.send(Chimboz.PACKET_OUT.CUT_TREE, String(i));
        }, i++ * 500);
      }
      setTimeout(() => Chimboz.teleport(Chimboz.ROOMS.CHIMBO_GATE.name), i * 1000);
    },
    farm: (delay = 600000) => {
      Chimboz.farmRooms();
      Chimboz.tasks.farm.queue.push(setInterval(() => Chimboz.farmRooms(), delay));
    },
    farmRooms: () => {
      const list = Object.values(Chimboz.ROOMS).filter((room) => room.hasItems || room.hasTree);
      Chimboz.farmRoom(list.pop(), list);
    },
    farmRoom: (room, list) => {
      Chimboz.teleport(room.name);
      const controller = new AbortController();
      Chimboz.ws.addEventListener(
        'message',
        (event) => {
          const packet = Chimboz.parse(event.data);
          if (packet.rawType === Chimboz.PACKET_IN.ROOM_IS_READY) {
            setTimeout(() => {
              if (room.hasTree) for (let i = 0; i < 27; i++) Chimboz.send(Chimboz.PACKET_OUT.CUT_TREE, String(i));
              if (room.hasItems) {
                Chimboz.send(Chimboz.PACKET_OUT.END_MOVE, packet.data);
                Chimboz.catchAll();
              }
              console.log(`✨ %cYou farmed ${room.name}!`, 'color:orange');
            }, 500);
            setTimeout(() => {
              if (list.length) Chimboz.farmRoom(list.pop(), list);
              else Chimboz.teleport(Chimboz.ROOMS.CHIMBO_GATE.name);
              controller.abort();
            }, 1000);
          }
        },
        { signal: controller.signal }
      );
    },
    teleport: (room = Chimboz.ROOMS.CHIMBO_GATE) => {
      Chimboz.send(Chimboz.PACKET_OUT.ASK_GO_ROOM, room);
    },
    randomTeleport: (xmin = 360, xmax = 700, ymin = 100, ymax = 200, delay = 500) => {
      const randomInterval = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
      Chimboz.tasks.randomTeleport.queue.push(
        setInterval(() => {
          Chimboz.send(Chimboz.PACKET_OUT.END_MOVE, `${randomInterval(xmin, xmax)},${randomInterval(ymin, ymax)}`);
        }, delay)
      );
    },
    outOfBounds: () => {
      Chimboz.teleport(Chimboz.ROOMS.PATOJDUR.name);
      Chimboz.teleport(Chimboz.ROOMS.CHIMBO_GATE.name);
    },
    mazo: (rank = 1, delay = 2050) => {
      Chimboz.tasks.mazo.queue.push(
        setInterval(() => {
          Chimboz.send(Chimboz.PACKET_OUT.MAZO);
        }, delay)
      );
      Chimboz.ws.addEventListener(
        'message',
        (event) => {
          let parsed = Chimboz.parse(event.data);
          const res = parsed.data.split(',');
          if (parsed.rawType === Chimboz.PACKET_IN.MAZO && +res[2] <= rank) {
            console.log(`✨ %cYou reached target rank ${rank} at rank ${res[2]}!`, 'color:orange');
            Vishnu.message(Chimboz.you, `✨ You reached target rank ${rank} at rank ${res[2]}!`);
            Chimboz.tasks.clearAll('mazo');
          }
        },
        { signal: Chimboz.tasks.mazo.controller.signal }
      );
    },
    users: [],
    tasks: {
      clear: (type) => {
        clearInterval(Chimboz.tasks[type].queue.pop());
        Chimboz.tasks[type].controller?.abort();
        Chimboz.tasks[type].controller = new AbortController();
      },
      clearAll: (type = 'all') => {
        if (type === 'all') {
          Chimboz.tasks.clearAll('floodTrade');
          Chimboz.tasks.clearAll('floodMessage');
          Chimboz.tasks.clearAll('randomTeleport');
          Chimboz.tasks.clearAll('mazo');
        }
        for (let task of Chimboz.tasks[type].queue) Chimboz.tasks.clear(type);
      },
      floodTrade: { queue: [] },
      randomTeleport: { queue: [] },
      floodMessage: { queue: [] },
      farm: { queue: [] },
      mazo: {
        queue: [],
        controller: new AbortController(),
      },
    },
  };

  // Bind WebSocket send
  const nativeWebSocket = window.WebSocket;
  window.WebSocket = function (...args) {
    const socket = new nativeWebSocket(...args);
    socket._send = socket.send;
    socket.send = (...data) => {
      const res = Chimboz.parse(data[0], 'PACKET_OUT');
      if (!Chimboz.BLACKLIST.includes(`PACKET_OUT.${res.type}`)) console.log('📤 ', res);
      if (res.rawType === Chimboz.PACKET_OUT.SEND_MESSAGE) Vishnu.message(Chimboz.you, Chimboz.fromBinary(res.data));
      if (res.rawType === Chimboz.PACKET_OUT.START_MOVE && Object.keys(Chimboz.walk).find((walk) => Chimboz.walk[walk].activated))
        return Chimboz.ws._send(
          Chimboz.encode(
            Chimboz.PACKET_OUT.START_MOVE,
            Chimboz.walk[Object.keys(Chimboz.walk).find((walk) => Chimboz.walk[walk].activated)].DIRECTIONS[/[l|r|u|d]/.exec(res.data)[0]]
          )
        );
      socket._send(...data);
    };
    Chimboz.bind(socket);
    return socket;
  };

  // Automatically hide boxes
  const CHAT_CONFIG = JSON.parse(localStorage.chimboz_config ?? '{}');
  CHAT_CONFIG.highFPS = true;
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

  // Vishnu interface
  const Vishnu = html('<div id="vishnu" style="width: 300px"></div>');
  Vishnu.online = html('<div class="window" id="online"></div>');
  Vishnu.teleport = html('<div class="window" id="teleport"></div>');
  Vishnu.messages = html('<div class="window" id="messages"></div>');
  Vishnu.tools = html('<div id="tools"></div>');
  Vishnu.addTool = (name, icon, click) => {
    const tool = html(`<button title="${name}">${icon}</button>`);
    tool.onclick = () => {
      tool.classList.toggle('active');
      click();
    };
    Vishnu.tools.append(tool);
  };
  Vishnu.addTool('Auto-mazo to #1', '🎰', () => (Chimboz.tasks.mazo.queue.length ? Chimboz.tasks.clearAll('mazo') : Chimboz.mazo()));
  Vishnu.addTool('Toggle moonwalk', '🕺', () => (Chimboz.walk.moonwalk.activated = !Chimboz.walk.moonwalk.activated));
  Vishnu.addTool('Toggle crabwalk', '🦀', () => (Chimboz.walk.crabwalk.activated = !Chimboz.walk.crabwalk.activated));
  Vishnu.addTool('Toggle lagwalk', '🧊', () => (Chimboz.walk.lagwalk.activated = !Chimboz.walk.lagwalk.activated));
  Vishnu.addTool('Craft furniture', '✂️', () => Chimboz.craft(prompt('Wood quantity', 10)));
  Vishnu.addTool('Duplicate item', '🧪', () => Chimboz.duplicate(prompt('Item id', 0), prompt('Wood quantity', 1000)));
  Vishnu.addTool('Catch all items', '🕸️', () => Chimboz.catchAll());
  Vishnu.addTool('Chop all trees', '🪓', () => Chimboz.chop());
  Vishnu.addTool('Farm all rooms', '🚜', () => (Chimboz.tasks.farm.queue.length ? Chimboz.tasks.clearAll('farm') : Chimboz.farm()));
  Vishnu.addTool('Out of bounds', '👾', () => Chimboz.outOfBounds());
  Vishnu.addTool('Random teleport', '🌀', () =>
    Chimboz.tasks.randomTeleport.queue.length ? Chimboz.tasks.clearAll('randomTeleport') : Chimboz.randomTeleport()
  );
  Vishnu.addTool('Trade flood', '💱', () =>
    Chimboz.tasks.floodTrade.queue.length ? Chimboz.tasks.clearAll('floodTrade') : Chimboz.floodTrade(prompt('Target ID'))
  );
  Vishnu.addTool('Chat flood', '💬', () =>
    Chimboz.tasks.floodMessage.queue.length ? Chimboz.tasks.clearAll('floodMessage') : Chimboz.floodMessage(prompt('Message name'))
  );
  Vishnu.append(Vishnu.online, Vishnu.teleport, Vishnu.messages, Vishnu.tools);
  for (const room of Object.values(Chimboz.ROOMS).sort((a, b) => a.name.localeCompare(b.name))) {
    const teleport = html(`<div>${room.name}</div>`);
    teleport.onclick = () => Chimboz.teleport(room.name);
    if (room.parameter) teleport.onclick = () => Chimboz.teleport(`${room.name}${prompt('Target ID', '1')}`);
    Vishnu.teleport.append(teleport);
  }
  Vishnu.refreshOnline = () => {
    Vishnu.online.innerHTML = '';
    for (const user of Chimboz.users.sort((a, b) => a.name.localeCompare(b.name)))
      Vishnu.online.append(html(`<a class="user level_${user.power}" href="/book/${user.id}" target="_blank">${user.name}</a>`));
  };
  Vishnu.message = (user, message, highlight = false) => {
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
    Vishnu.messages.append(div);
    Vishnu.messages.scrollTop += div.clientHeight;
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
  overflow: hidden;
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
#vishnu {
  text-align: left;
  font-family: system-ui;
  padding-left: 4px;
  display: flex;
  flex-direction: column;
  resize: horizontal;
  overflow: auto;
  min-width: 100px;
}
.window {
  overflow: auto;
  background: linear-gradient(#77a3ce, #5282b3 30px, #fff8 30px);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  resize: vertical;
  min-height: 30px;
}
.window:not(:last-child) {
  margin-bottom: 4px;
}
.window::before {
  background: linear-gradient(#77a3ce, #5282b3);
  line-height: 0;
  font-size: 14px;
  padding: 0 16px;
  display: flex;
  font-family: system-ui;
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
#teleport::before {
  content: "🌀 Teleport";
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
#teleport {
  height: 20%;
  font-family: monospace;
}
#tools button {
  background: #f0009c;
  color: #fff;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  padding: 8px;
  margin: 0 4px 4px 0;
  font-weight: bold;
  height: 32px;
  width: 32px;
  text-shadow: 1px 0 0 #fff, -1px 0 0 #fff, 0 1px 0 #fff, 0 -1px 0 #fff;
}
#tools button:hover {
  background: #c10276;
}
#tools button.active {
  background: #f80;
}
body {
  display: flex;
  height: 100vh;
}
`;

  // Setup
  document.body.append(style);

  window.onfocus = () => {
    document.title = 'Chimboz';
  };

  if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  setTimeout(() => {
    window.onresize = () => {
      setTimeout(() => {
        window.innerWidth = document.body.clientWidth - Math.max(Vishnu.style.width.slice(0, -2), Vishnu.clientWidth);
      }, 0);
    };
    window.onresize();
    document.body.append(Vishnu);
    const observer = new MutationObserver(function (mutations) {
      if (mutations[0].attributeName === 'style') window.onresize();
    });
    observer.observe(document.querySelector('#canvas'), { attributes: true });
  }, 0);
  window.Chimboz = Chimboz;
  window.Vishnu = Vishnu;
})();
