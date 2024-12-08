// popup.js

document.addEventListener('DOMContentLoaded', () => {
  // タブ要素の取得
  const tabMatsuri = document.getElementById('tab_matsuri');
  const tabPomodoro = document.getElementById('tab_pomodoro');
  const switchButton = document.getElementById('switch-button');

  // 現在のタブを追跡
  let currentTab = 'matsuri';

  // タブ切り替えボタンのイベントリスナー
  switchButton.addEventListener('click', () => {
    if (currentTab === 'matsuri') {
      tabMatsuri.style.display = 'none';
      tabPomodoro.style.display = 'block';
      currentTab = 'pomodoro';
    } else {
      tabPomodoro.style.display = 'none';
      tabMatsuri.style.display = 'block';
      currentTab = 'matsuri';
    }
  });

  // お祭り変換関連の要素
  const syrup = document.getElementById('syrup');
  const kakigorikun = document.getElementById('kakigorikun');
  const sounds = document.getElementById('sounds');

  // お祭り変換のスイッチの状態を保持
  let isMatsuriActive = false;

  // お祭り変換のイベントリスナー
  syrup.addEventListener('click', () => {
    isMatsuriActive = !isMatsuriActive;

    if (isMatsuriActive) {
      // スイッチをオンの画像に変更
      syrup.src = 'img/ICE-v3-onoff.gif';

      // サウンドを再生
      sounds.currentTime = 0;
      sounds.play();

      // かきごおりくんの画像を変更
      kakigorikun.src = 'img/new-kakigori-kun_long.gif';

      // 現在のタブにお祭り変換を実行（神輿あり）
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['kuromoji.js', 'matsuri.js']
        }, () => {
          chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              replaceAuxiliaryVerbsWithUho(true);
            }
          });
        });
      });
    } else {
      // スイッチをオフの画像に変更
      syrup.src = 'img/ICE-v3-onoff-first.webp';

      // サウンドを停止
      sounds.pause();
      sounds.currentTime = 0;

      // かきごおりくんの画像を元に戻す
      kakigorikun.src = 'img/new-kakigori-kun-128.png';

      // ページをリロードして元に戻す
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    }
  });

  // --- ポモドーロタイマーのコード ---

  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const sagyouTimeInput = document.getElementById('sagyouTimeInput');
  const kyukeiTimeInput = document.getElementById('kyukeiTimeInput');
  const periodLabel = document.getElementById('periodLabel');

  let timerInterval;

  startButton.addEventListener('click', () => {
    console.log('開始ボタンがクリックされました');

    const workDuration = parseInt(sagyouTimeInput.value);
    const breakDuration = parseInt(kyukeiTimeInput.value);

    console.log('作業時間:', workDuration, '分');
    console.log('休憩時間:', breakDuration, '分');

    chrome.runtime.sendMessage({
      command: "startTimer",
      workDuration: workDuration,
      breakDuration: breakDuration
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      console.log('バックグラウンドからの応答:', response.status);

      // タイマー表示を更新
      updateTimerDisplay();
    });

    // お祭り変換を実行（神輿なし）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0].id;
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['kuromoji.js', 'matsuri.js']
      }, () => {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            replaceAuxiliaryVerbsWithUho(false);
          }
        });
      });
    });

    startButton.disabled = true;
    stopButton.disabled = false;
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: "stopTimer" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      console.log('バックグラウンドからの応答:', response.status);

      // タイマー表示を更新
      updateTimerDisplay();

      // 作業終了時にページをリロードして元に戻す
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
      });
    });

    startButton.disabled = false;
    stopButton.disabled = true;
  });

  // タイマーの状態を取得してボタンの状態を更新
  chrome.runtime.sendMessage({ command: "getTimerStatus" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }
    if (response && response.isRunning) {
      startButton.disabled = true;
      stopButton.disabled = false;
      updateTimerDisplay(); // タイマー表示を更新
    } else {
      startButton.disabled = false;
      stopButton.disabled = true;
      document.querySelector('.timer').textContent = "00:00";
    }
  });

  // タイマー表示を更新する関数
  function updateTimerDisplay() {
    chrome.runtime.sendMessage({ command: "getTimerStatus" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
  
      if (response && response.isRunning) {
        chrome.runtime.sendMessage({ command: "getAlarmInfo" }, (alarmResponse) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            return;
          }
  
          if (alarmResponse && alarmResponse.scheduledTime) {
            if (timerInterval) {
              clearInterval(timerInterval);
            }
  
            timerInterval = setInterval(() => {
              chrome.runtime.sendMessage({ command: "getTimerStatus" }, (newResponse) => {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError.message);
                  return;
                }
  
                chrome.runtime.sendMessage({ command: "getAlarmInfo" }, (newAlarmResponse) => {
                  if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                  }
  
                  if (newAlarmResponse && newAlarmResponse.scheduledTime) {
                    const timeLeft = newAlarmResponse.scheduledTime - Date.now();
                    if (timeLeft >= 0) {
                      displayTime(timeLeft, newResponse.isWorkPeriod);
                    } else {
                      clearInterval(timerInterval);
                      updateTimerDisplay();
                    }
                  } else {
                    document.querySelector('.timer').textContent = "00:00";
                  }
                });
              });
            }, 1000);
          } else {
            document.querySelector('.timer').textContent = "00:00";
          }
        });
      } else {
        if (timerInterval) {
          clearInterval(timerInterval);
        }
        document.querySelector('.timer').textContent = "00:00";
      }
    });
  }

  function displayTime(milliseconds, isWorkPeriod) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const timerElement = document.querySelector('.timer');
    timerElement.textContent = `${padZero(minutes)}:${padZero(seconds)}`;

    // 現在の期間に応じてラベルを変更
    periodLabel.textContent = isWorkPeriod ? "💻作業" : "🏮休憩";
  }

  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  // バックグラウンドからのメッセージを受信してタイマー表示を更新
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "updateTimer") {
      updateTimerDisplay();
    }
  });
});
