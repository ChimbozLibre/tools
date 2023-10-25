// ==UserScript==
// @name         Kali
// @namespace    https://chapatiz.fr/tchat
// @version      0.0.1
// @description  Scripting tool for Chapatiz
// @author       Tigriz
// @match        https://www.chapatiz.com/tchat/
// @match        https://*.chapatiz.com/tchat*
// @icon         https://i.aveshack.com/253fe437d2464622.png
// @run-at       document-start
// @grant        none
// ==/UserScript==

const html = (html) => Object.assign(document.createElement('template'), { innerHTML: html.trim() }).content.firstChild;

(function () {
  'use strict';

  // Chapatiz instance
  const Chapatiz = {
    ws: null,
    settings: {
      logs: {
        in: false,
        out: true,
      },
    },
    ROOMS: {
      'central.animation': 'central.animation',
      'central.bacarena': 'central.bacarena',
      'central.bridgea': 'central.bridgea',
      'central.bridgeb': 'central.bridgeb',
      'central.bridgec': 'central.bridgec',
      'central.bridged': 'central.bridged',
      'central.cafe': 'central.cafe',
      'central.cinema': 'central.cinema',
      'central.cinemaplac': 'central.cinemaplac',
      'central.clouds': 'central.clouds',
      'central.divorce': 'central.divorce',
      'central.islands': 'central.islands',
      'central.hall': 'central.hall',
      'central.halldivorc': 'central.halldivorc',
      'central.hallentry': 'central.hallentry',
      'central.halloffic': 'central.halloffic',
      'central.friends': 'central.friends',
      'central.gotowdgard': 'central.gotowdgard',
      'central.gotoskies': 'central.gotoskies',
      'central.group_modo': 'central.group_modo',
      'central.group_cfc': 'central.group_cfc',
      'central.group_rt': 'central.group_rt',
      'central.grouphlp': 'central.grouphlp',
      'central.group_anim': 'central.group_anim',
      'central.group': 'central.group',
      'central.king': 'central.king',
      'central.ship': 'central.ship',
      'central.sushibar': 'central.sushibar',
      'central.light': 'central.light',
      'central.place': 'central.place',
      'central.wedding': 'central.wedding',
      'central.wedgarden': 'central.wedgarden',
      'central.welcome': 'central.welcome',
      'classics.amdo': 'classics.amdo',
      'classics.bacdeb': 'classics.bacdeb',
      'classics.bacpro': 'classics.bacpro',
      'classics.canyon': 'classics.canyon',
      'classics.embarcadrz': 'classics.embarcadrz',
      'classics.gatetopatojdur': 'classics.gatetopatojdur',
      'classics.gatetodeb': 'classics.gatetodeb',
      'classics.gatetopro': 'classics.gatetopro',
      'classics.gotowed': 'classics.gotowed',
      'classics.gotoswamp': 'classics.gotoswamp',
      'classics.home': 'classics.home',
      'classics.kchoa': 'classics.kchoa',
      'classics.kchob': 'classics.kchob',
      'classics.kchoc': 'classics.kchoc',
      'classics.kchod': 'classics.kchod',
      'classics.kchokorid': 'classics.kchokorid',
      'classics.kchosalon': 'classics.kchosalon',
      'classics.kopakabana': 'classics.kopakabana',
      'classics.market': 'classics.market',
      'classics.pvforest': 'classics.pvforest',
      'classics.plankafee': 'classics.plankafee',
      'classics.plankatrol': 'classics.plankatrol',
      'classics.submarine': 'classics.submarine',
      'classics.tajgarden': 'classics.tajgarden',
      'classics.teleferik': 'classics.teleferik',
      'classics.throne': 'classics.throne',
      'classics.toballad': 'classics.toballad',
      'classics.oldwedding': 'classics.oldwedding',
      'collections.collection': 'collections.collection',
      'gothic.cemetery': 'gothic.cemetery',
      'gothic.gothicbed': 'gothic.gothicbed',
      'gothic.dark': 'gothic.dark',
      'hiphop.clash': 'hiphop.clash',
      'hiphop.hiphoppool': 'hiphop.hiphoppool',
      'hiphop.subway': 'hiphop.subway',
      'hiphop.subwentr': 'hiphop.subwentr',
      'jetset.alchmzentr': 'jetset.alchmzentr',
      'jetset.gotoalchmz': 'jetset.gotoalchmz',
      'jetset.vip': 'jetset.vip',
      'jetset.mangaidol': 'jetset.mangaidol',
      'jetset.turtle': 'jetset.turtle',
      'jetset.jetsalchmz': 'jetset.jetsalchmz',
      'souleater.town': 'souleater.town',
      bacteria_game: 'bacteria_game',
      'snow.playa': 'snow.playa',
      'snow.south': 'snow.south',
      'snow.swest': 'snow.swest',
      'snow.seast': 'snow.seast',
      'snow.west': 'snow.west',
      'snow.east': 'snow.east',
      'snow.tree': 'snow.tree',
      'snow.nwest': 'snow.nwest',
      'snow.north': 'snow.north',
      'snow.neast': 'snow.neast',
      'bizness.bizness': 'bizness.bizness',
      'underground.mushlight': 'underground.mushlight',
      'central.rebootz': 'central.rebootz',
    },
    parse: (data) => {
      const fields = data.split('y');
      return {
        type: fields[1].split(':')[1],
        action: fields[2].split(/:(.*)/s)[1],
        data: fields[3]?.split(':')[1],
        raw: data,
      };
    },
    encode: (action, data = '') => {
      return false;
    },
    packetHandler: (packet) => {
      const parsed = Chapatiz.parse(packet.data);
      if (Chapatiz.settings.logs.in) console.log('📥 ', Chapatiz.parse(packet.data));
      switch (parsed.action) {
        case 'MAZO_SHOT_RESULT':
          Chapatiz.UI.messages.add(`Auto-MaZo: ${parsed.data.split('i')[1]} point, position: ${parsed.data.split('i')[2]}`);
          break;
        case 'MAZO_FAILED':
          Chapatiz.UI.messages.add(`Auto-MaZo: Perdu !`);
      }
    },
    bind: (ws) => {
      ws.addEventListener('message', (event) => {
        Chapatiz.packetHandler(event);
      });
      Chapatiz.ws = ws;
    },
    teleport: (room) => Chapatiz.ws.send(`wy13:ClientMessagey11:CHANGE_ROOM:2y${room.length}:${room}n`),
    mazo: (rank = 1, delay = 5050) => {
      Chapatiz.tasks.mazo.queue.push(
        setInterval(() => {
          Chapatiz.ws.send('wy13:ClientMessagey8:MAZOSHOT:0');
        }, delay)
      );
      Chapatiz.ws.addEventListener(
        'message',
        (event) => {
          const data = Chapatiz.parse(event.data);
          const res = data.data.split('i');
          if (data.action === 'MAZO_SHOT_RESULT' && +res[2] <= rank) {
            console.log(`✨ %cYou reached target rank ${rank} at rank ${res[2]}!`, 'color:orange');
            Chapatiz.UI.messages.add(`✨ Auto-MaZo: Tu as atteint le rang ${rank} (rang ${res[2]}) !`);
            Chapatiz.tasks.clearAll('mazo');
          }
        },
        { signal: Chapatiz.tasks.mazo.controller.signal }
      );
    },
    tasks: {
      clear: (type) => {
        clearInterval(Chapatiz.tasks[type].queue.pop());
        Chapatiz.tasks[type].controller?.abort();
        Chapatiz.tasks[type].controller = new AbortController();
      },
      clearAll: (type = 'all') => {
        if (type === 'all') {
          Chapatiz.tasks.clearAll('mazo');
        }
        for (let task of Chapatiz.tasks[type].queue) Chapatiz.tasks.clear(type);
      },
      mazo: {
        queue: [],
        controller: new AbortController(),
      },
    },
    UI: {
      messages: {
        el: null,
        add: (content) =>
          Chapatiz.UI.messages.el.append(
            html(
              `<p><span class="time">[${new Date().toLocaleTimeString(
                'fr'
              )}]</span><span class="text system-message"><img class="kali-icon" src="https://i.aveshack.com/253fe437d2464622.png" alt="Kali icon" /> ${content}</span></p>`
            )
          ),
      },
      buttons: {
        el: null,
        add: (name, icon, action) => {
          const tool = html(`<a class="kali button" title="${name}"><i>${icon}</i></a>`);
          tool.onclick = () => {
            tool.classList.toggle('active');
            action();
          };
          Chapatiz.UI.buttons.el.append(tool);
        },
      },
    },
  };

  // Bind WebSocket send
  const nativeWebSocket = window.WebSocket;
  window.WebSocket = function (...args) {
    const socket = new nativeWebSocket(...args);
    socket._send = socket.send;
    socket.send = (...data) => {
      if (Chapatiz.settings.logs.out) console.log('📤 ', Chapatiz.parse(data[0]));
      socket._send(...data);
    };
    Chapatiz.bind(socket);
    return socket;
  };

  document.addEventListener('DOMContentLoaded', (event) => {
    Chapatiz.UI.messages.el = document.querySelector('#tab-0 div');
    Chapatiz.UI.buttons.el = document.querySelector('#room .buttons');
    Chapatiz.UI.buttons.add('Auto-mazo to #1', '🎰', () => (Chapatiz.tasks.mazo.queue.length ? Chapatiz.tasks.clearAll('mazo') : Chapatiz.mazo()));
    Chapatiz.UI.teleport = { el: html('<div class="kali tab-contents teleport"></div>') };
    document.querySelector('#chatbox').append(Chapatiz.UI.teleport.el)

    for (const room of Object.values(Chapatiz.ROOMS).sort((a, b) => a.localeCompare(b))) {
      const teleport = html(`<strong><a class="text" href="#">${room}</a></strong>`);
      teleport.onclick = () => Chapatiz.teleport(room);
      if (room.parameter) teleport.onclick = () => Chapatiz.teleport(room);
      Chapatiz.UI.teleport.el.append(teleport);
    }

    // Style
    document.body.append(
      html(`<style>
.kali-icon {
  width: 16px;
  vertical-align: top;
}

.kali.tab-contents {
  max-height: 25%;
  margin-top: 8px;
  flex: unset !important;
  display: flex;
  border-top: 0;
  font-size: 14px;
  height: 100%;
  box-sizing: border-box;
  padding: 16px;
  flex-direction: column;
  resize: vertical;
}

.kali.teleport a {
  color: #00609d;
  text-decoration: unset;
}

.kali.button {
  background-image: url(https://i.aveshack.com/4316a5123e56b031.png);
  filter: hue-rotate(190deg);
  text-indent: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kali.button.active {
    background-position: 0 -48px !important;
}

.kali.button i {
  font-style: unset;
  font-size: 24px;
  filter: grayscale(1);
}
</style>`)
    );

    setTimeout(() => {
      Chapatiz.UI.messages.add(`Kali chargé et prêt à être utilisé !`);
    }, 1000)
  });

  window.Chapatiz = Chapatiz;
})();
