// 2つのタブを切り替える部分

switchButton = document.getElementById("switch-button");
tabNormal = document.getElementById("tab_normal");
tabPomodoro = document.getElementById("tab_pomodoro");

var isPomodoroTab = false;

tabPomodoro.style.display = "none";

function switchTab(){

    isPomodoroTab = !isPomodoroTab;

    if (isPomodoroTab === true){
        tabNormal.style.display = "none";
        tabPomodoro.style.display = "block";
    } else {
        tabNormal.style.display = "block";
        tabPomodoro.style.display = "none";
    }
}

switchButton.onclick = switchTab;

// タイマーの開始とストップ

startButton = document.getElementById("startButton");
stopButton = document.getElementById("stopButton");

timeFormContainer = document.getElementById("timeFormContainer");
showTimer = document.getElementById("showTimer");

sagyouTimeInput = document.getElementById("sagyouTimeInput");
kyukeiTimeInput = document.getElementById("kyukeiTimeInput");

// 初期状態ではストップボタンは無効にする

stopButton.disabled = "disabled";
stopButton.classList.add("disabledButtonStyle");
showTimer.style.display = "none";

function startPomodoro(){
    sagyouTime = sagyouTimeInput.value;
    kyukeiTime = kyukeiTimeInput.value;
    alert(`Pomodoro Started. ${sagyouTime} 分の作業と, ${kyukeiTime}分の休憩を繰り返します`)

    // スタートボタンを無効にする

    startButton.disabled = "disabled";
    startButton.classList.add("disabledButtonStyle");

    // ストップボタンを有効にする

    stopButton.disabled = null;
    stopButton.classList.remove("disabledButtonStyle");
    
    // いろいろ表示したり隠したりする

    timeFormContainer.style.display = "none";
    showTimer.style.display = "block";

    switchButton.style.visibility = "hidden";
}

function stopPomodoro(){
    alert("Pomodoro Stopped.")

    // スタートボタンを有効にする

    startButton.disabled = null;
    startButton.classList.remove("disabledButtonStyle");

    // ストップボタンを無効にする

    stopButton.disabled = "disabled";
    stopButton.classList.add("disabledButtonStyle");

    // いろいろ表示したり隠したりする

    timeFormContainer.style.display = "block";
    showTimer.style.display = "none";

    switchButton.style.visibility = "visible";

}

startButton.onclick = startPomodoro;
stopButton.onclick = stopPomodoro;