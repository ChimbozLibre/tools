// ==UserScript==
// @name         Chimboz Notifications
// @namespace    https://chimboz.fr/tchat
// @version      0.0.3
// @description  Add notifications for mentions and custom words
// @author       Tigriz
// @license      CeCILL v2.1
// @match        https://chimboz.fr/tchat
// @icon         https://chimboz.fr/favicon-194x194.png?v=1.1
// @run-at       document-start
// @grant        none
// ==/UserScript==

const html = (html) => Object.assign(document.createElement('template'), { innerHTML: html.trim() }).content.firstChild;

(function () {
  'use strict';

  // Chimboz instance
  const Chimboz = {
    notifications: 0,
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
          Chimboz.you = { id: packet.data.split(',')[0], name: packet.data.split(',')[1] };
          break;
        case 6:
          for (const user of packet.data.split('|')) if (user) Chimboz.users.push({ id: user.split(',')[0], name: user.split(',')[1] });
          break;
        case 10:
          Chimboz.users.splice(
            Chimboz.users.findIndex((user) => user.id === packet.data),
            1
          );
          break;
        case 7:
          Chimboz.users.push({ id: packet.data.split(',')[0], name: packet.data.split(',')[1] });
          break;
        case 11:
          const message = Chimboz.fromBinary(packet.data.split(',')[1]);
          const user = Chimboz.users.find((user) => user.id === packet.data.split(',')[0]);
          let highlight = false;
          if (
            RegExp(Chimboz.you.name + Chimboz.keywords.reduce((word, acc) => word + '|' + acc, ''), 'gi').test(message) &&
            (!Chimboz.active || Chimboz.always)
          ) {
            console.log(document.hidden);
            document.title = `🔔${(++Chimboz.notifications).toString().replace(/[0-9]/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'.charAt(+c))} Chimboz`;
            new Notification(`${user.name}`, { body: message, icon: 'https://chimboz.fr/favicon-194x194.png?v=1.1' });
          }
          break;
      }
    },
    bind: (ws) => {
      ws.addEventListener('message', (event) => {
        Chimboz.packetHandler(Chimboz.parse(event.data));
      });
    },
    users: [],
    keywords: [],
    always: false,
  };

  // Bind WebSocket send
  const nativeWebSocket = window.WebSocket;
  window.WebSocket = function (...args) {
    const socket = new nativeWebSocket(...args);
    Chimboz.bind(socket);
    return socket;
  };

  window.onblur = () => {
    Chimboz.active = false;
  };

  window.onfocus = () => {
    Chimboz.active = true;
    document.title = 'Chimboz';
    Chimboz.notifications = 0;
  };

  if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }

  // Get local preferences
  Chimboz.keywords = JSON.parse(localStorage.getItem('notifications')) || [];
  Chimboz.always = !!JSON.parse(localStorage.getItem('notifications_always'));

  // HTML elements
  const button = html('<button id="notifications">🔔</button>');
  const dialog = html(`<dialog>
    <form method="dialog">
      <div class="title">
        Votre pseudo est déjà notifié.<br />
        Les mots-clés additionnels sont sauvegardés localement.<br />
        Les notifications ne sont pas sensibles à la casse.
      </div>
      <div style="margin: 8px 0 0 0"><input type="checkbox" id="always" name="always" class="pointer"></input><label for="always" class="pointer">Afficher les notifications même quand la fenêtre est active</label></div>
      <textarea rows="3" placeholder="chimboz, pépettes"></textarea><br/>
      <div style="text-align: right">
        <button id="validate">✔️</button>
      <div>
    </form>
  </dialog>`);
  const style = html(`<style>
  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    font-family: system-ui, sans-serif;
    font-size: 14px;
  }
  button {
    background: #f0009c;
    color: #fff;
    border-radius: 12px;
    border: 0;
    cursor: pointer;
    font-weight: bold;
    height: 32px;
    width: 32px;
    color: transparent;
    text-shadow: 0 0 #fff;
  }
  button.active {
    background: #f80;
  }
  #notifications {
    z-index: 2;
    position: absolute;
    bottom: 4px;
    right: 4px;
  }
  #notifications:hover {
    background: #c10276;
  }
  #validate {
    width: 24px;
    height: 24px;
    border-radius: 99px;
    border: 2px solid;
    font-size: 10px;
    border-color: #f9c #c06 #c06 #f9c;
    display: flex;
    justify-content: center;
    align-items: center;
    float: right;
  }
  #validate:active {
    border-color: #c06 #f9c #f9c #c06;
  }
  .pointer {
    cursor: pointer;
  }
  textarea {
    box-sizing: border-box;
    resize: none;
    width: 100%;
    border: none;
    background: #fff3;
    outline: none;
    border-radius: 4px;
    margin: 8px 0;
    padding: 8px;
    color: #fff;
  }
  textarea::placeholder {
    color: #fff9;
  }
  dialog {
    z-index: 2;
    position: absolute;
    background-color: #69c;
    padding: 20px;
    color: #fff;
    border: 2px solid;
    border-color: #7fbcff #184672 #184672 #7fbcff;
    border-radius: 4px;
    width: 33%;
  }
  dialog[open] {
    animation: fade-in .2s ease normal;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>`);

  dialog.querySelector('#validate').onclick = () => {
    Chimboz.keywords = dialog
      .querySelector('textarea')
      .value.split(',')
      .map((word) => word.trim());
    localStorage.setItem('notifications', JSON.stringify(Chimboz.keywords));
  };

  dialog.querySelector('#always').onchange = () => {
    Chimboz.always = dialog.querySelector('#always').checked;
    localStorage.setItem('notifications_always', JSON.stringify(dialog.querySelector('#always').checked));
  };

  // Sync values with preferences
  dialog.querySelector('#always').checked = Chimboz.always;
  dialog.querySelector('textarea').value = Chimboz.keywords.join(', ');

  button.onclick = () => {
    dialog.showModal();
  };

  document.body.append(button, style, dialog);
})();
