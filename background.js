// background.js

let isRunning = false;
let isWorkPeriod = true;
let workDuration = 25; // 分
let breakDuration = 5; // 分

// メッセージリスナーの登録
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "startTimer") {
    isRunning = true;
    isWorkPeriod = true;
    workDuration = request.workDuration;
    breakDuration = request.breakDuration;
    startWorkPeriod();
    sendResponse({ status: "タイマーを開始しました。" });
    return false; // 同期的に sendResponse を呼び出すので false を返す
  } else if (request.command === "stopTimer") {
    isRunning = false;
    chrome.alarms.clearAll();
    sendResponse({ status: "タイマーを停止しました。" });
    return false;
  } else if (request.command === "getTimerStatus") {
    sendResponse({ isRunning, isWorkPeriod });
    return false;
  } else if (request.command === "getAlarmInfo") {
    chrome.alarms.get("pomodoroTimer", (alarm) => {
      if (alarm) {
        sendResponse({ scheduledTime: alarm.scheduledTime });
      } else {
        sendResponse({ scheduledTime: null });
      }
    });
    return true; // 非同期レスポンスを示すために true を返す
  } else if (request.command === 'getResourceURL') {
    const url = chrome.runtime.getURL(request.path);
    sendResponse({ url: url });
    return false;
  } else {
    sendResponse({ error: 'Unknown command' });
    return false;
  }
});

// アラームリスナーの登録
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pomodoroTimer") {
    if (isWorkPeriod) {
      isWorkPeriod = false;
      notifyUser("作業時間が終了しました。休憩を始めましょう！");
      startBreakPeriod();

      // 休憩開始をコンテンツスクリプトに通知
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { command: "startBreak" });
        }
      });
    } else {
      isWorkPeriod = true;
      notifyUser("休憩が終了しました。作業を再開しましょう！");
      startWorkPeriod();

      // 作業開始をコンテンツスクリプトに通知
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { command: "startWork" });
        }
      });
    }
  }
});

function startWorkPeriod() {
  if (isRunning) {
    chrome.alarms.create("pomodoroTimer", { delayInMinutes: workDuration });
  }
}

function startBreakPeriod() {
  if (isRunning) {
    chrome.alarms.create("pomodoroTimer", { delayInMinutes: breakDuration });
  }
}

function notifyUser(message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "img/icon.png",
    title: "ポモドーロタイマー",
    message: message
  });
}

// お祭り変換用のコンテキストメニューを作成
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'matsuri',
    title: 'お祭り変換！',
    contexts: ['all']
  });
});

// コンテキストメニューがクリックされたときの処理
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'matsuri') {
    // kuromoji.js と matsuri.js をインジェクト
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['kuromoji.js', 'matsuri.js']
    }, () => {
      // お祭り変換の関数を実行
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          replaceAuxiliaryVerbsWithUho(true);
        }
      });
    });
  }
});
