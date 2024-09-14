const syrup = document.getElementById("syrup");
const kakigorikun = document.getElementById("kakigorikun");

syrup.addEventListener("click", function () {

  syrup.src = 'img/ICE-v3-onoff.gif';
  kakigorikun.src = 'img/new-kakigori-kun_long.gif';

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) {
      console.error('アクティブなタブが見つかりません');
      return;
    }
      
    const tabId = tabs[0].id;
  
    injectScript(tabId, 'kuromoji.js').then(() => {

      return chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: replaceAuxiliaryVerbsWithUho
      });
    }).catch(err => {
      console.error('スクリプトのインジェクト中にエラーが発生しました:', err);
    });
  });
});

function replaceAuxiliaryVerbsWithUho() {
  if (typeof kuromoji === 'undefined') {
    console.error('kuromoji.js が正しく読み込まれていません');
    return;
  }

  kuromoji.builder({ dicPath: chrome.runtime.getURL('dict/') }).build(function (err, tokenizer) {
    if (err) {
      console.error('形態素解析の初期化に失敗しました:', err);
      return;
    }

    function getTextNodesIn(elem) {
      let textNodes = [];
      const walker = document.createTreeWalker(elem, NodeFilter.SHOW_TEXT, null, false);
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      return textNodes;
    }

    const textNodes = getTextNodesIn(document.body);

    const fontUrl = chrome.runtime.getURL("fonts/KouzanBrushFont.ttf");

    const fontFace = `
    @font-face {
      font-family: '衡山毛筆フォント';
      src: url('${fontUrl}') format('truetype');
    }
    `;

    const styleContent = `
    ${fontFace}
    body, body * {
      font-family: '衡山毛筆フォント' !important;
      text-shadow:
        0.2px 0 0 black,
        -0.2px 0 0 black,
        0 0.2px 0 black,
        0 -0.2px 0 black;
    }
    }
    `;

  const styleElement = document.createElement('style');
  styleElement.textContent = styleContent;
  document.head.appendChild(styleElement);

  const backgroundUrl = chrome.runtime.getURL("img/matsuri-background.png");

  // 背景を変更するスタイルを作成
  const backgroundStyleContent = `
  body {
    background-image: url('${backgroundUrl}') !important;
    background-size: cover !important;
    background-repeat: no-repeat !important;
    background-attachment: fixed !important;
    background-size: 100% auto;
    background-color:rgba(255,255,255,0.84);
    background-blend-mode:lighten;
  }
  `;

  // 背景用のスタイル要素を作成してページに追加
  const backgroundStyleElement = document.createElement('style');
  backgroundStyleElement.textContent = backgroundStyleContent;
  document.head.appendChild(backgroundStyleElement);

    // 辞書
    // 一人称→あっし

    function norn_first_asshi(surface_form){
      const norn_first = [
        '私', 'わたし', 'ワタシ', 'わたくし', 'ワタクシ', 'あたし', 'アタシ',
        '俺', 'おれ', 'オレ', '僕', 'ぼく', 'ボク', 
        'おら', 'オラ', 'おいら', 'オイラ',
        'わい', 'ワイ', 'わし', 'ワシ',
      ];

      if (norn_first.includes(surface_form)) {
        return 1;
      }
    }
    // 二人称→おめえ、おめえさん、てめえ

    function norn_second_omee(surface_form){
      const norn_second = [
        'あなた', 'アナタ',
        '君', 'きみ', 'キミ', 
        'お前', 'おまえ', 'オマエ',
      ];

      if (norn_second.includes(surface_form)) {
        return 1;
      }
    }
    // 五段活用の連用形
    function verb_whitch(basic_form){
      const verb_godan_basic = ["く", "ぐ", "す", "つ", "ぬ", "ぶ", "む", "る", "う"];
      const verb_godan_renyou = ["き", "ぎ", "し", "ち", "に", "び", "み", "り", "い"];
      return verb_godan_renyou[verb_godan_basic.indexOf(basic_form.slice(-1))]
    }

    textNodes.forEach(textNode => {
      const originalText = textNode.nodeValue.trim();
      if (originalText.length > 0) {
        const tokens = tokenizer.tokenize(originalText);

        tokens.push({ surface_form: '' });
        var newtokens = [];
        for (let i = 0; i < tokens.length; i++) {

          console.log(tokens[i]);
          if (tokens[i] === undefined || tokens[i].surface_form === ''){
            break;
          // }else if (tokens[i] === undefined || tokens[i+1] === undefined || tokens[i+2] === undefined){
          }else if (!tokens[i+1] || tokens[i+1] === undefined){
            tokens.push({surface_form: ''});
          }else if (!tokens[i+2] ||tokens[i+2] === undefined){
            tokens.push({surface_form: ''});
          }
          if (tokens[i].word_type !== "KNOWN"){
            newtokens.push(tokens[i].surface_form);
          }else if (norn_first_asshi(tokens[i].surface_form)){

            // 一人称→あっし
            newtokens.push('あっし');
          } else if (norn_second_omee(tokens[i].surface_form)) {
            // 二人称→おめえ
            newtokens.push('おめえ');
          } else if (tokens[i].pos_detail_3 === "姓" && tokens[i + 1].pos_detail_1 === "接尾") {
            // 三人称→◯◯の旦那
            newtokens.push(tokens[i].surface_form);
            newtokens.push('の');
            newtokens.push('旦那');
            i += 1;
          } else if (tokens[i].surface_form === 'て' && tokens[i].pos_detail_1 === '接続助詞') {
            // 〜ています→〜とります
            if (tokens[i + 1].basic_form === 'ます' && tokens[i + 1].pos === '助動詞') {
              newtokens.push('と');
              newtokens.push('り');
              if (tokens[i + 1].surface_form === 'ます' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やす');
              } else if (tokens[i + 1].surface_form === 'まし' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やし');
              } else if (tokens[i + 1].surface_form === 'ませ' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やせ');
              } else {
                newtokens.push(tokens[i + 1].surface_form);
              }
              i += 1;
            } else if (tokens[i + 1].surface_form === 'い' && tokens[i + 1].pos === '動詞') {
              if (tokens[i + 2].basic_form === 'ます' && tokens[i + 2].pos === '助動詞') {
                newtokens.push('と');
                newtokens.push('り');
                if (tokens[i + 2].surface_form === 'ます' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やす');
                } else if (tokens[i + 2].surface_form === 'まし' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やし');
                } else if (tokens[i + 2].surface_form === 'ませ' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やせ');
                } else {
                  newtokens.push(tokens[i + 2].surface_form);
                }
                i += 2;
              } else {
                newtokens.push(tokens[i].surface_form);
                newtokens.push(tokens[i + 1].surface_form);
                i += 1;
              }
            } else if (tokens[i + 1].surface_form === 'しまう' && tokens[i + 1].pos === '動詞') {
              // 〜てしまう→〜ちまう
              newtokens.push('ちまう');
              i += 1;
            } else if (tokens[i + 1].surface_form === 'しま' && tokens[i + 1].pos === '動詞') {
              newtokens.push("ちま");
              i += 1;
            } else if (tokens[i + 1].surface_form === 'しまっ' && tokens[i + 1].pos === '動詞') {
              newtokens.push("ちまっ");
              i += 1;
            } else if (tokens[i + 1].surface_form === 'しまい' && tokens[i + 1].pos === '動詞') {
              newtokens.push("ちまい");
              i += 1;
            } else {
              newtokens.push(tokens[i].surface_form);
            }
          } else if (tokens[i].pos === '動詞' && tokens[i + 1].surface_form === 'ちゃっ' && tokens[i + 1].pos === '動詞') {
            newtokens.push(tokens[i].surface_form);
            newtokens.push("ちまっ");
            i += 1;
          } else if (tokens[i].pos === '動詞' && tokens[i + 1].surface_form === 'ちゃ' && tokens[i + 1].pos === '動詞') {
            newtokens.push(tokens[i].surface_form);
            newtokens.push("ちま");
            i += 1;
          } else if (tokens[i].pos === '動詞' && tokens[i + 1].surface_form === 'ちゃい' && tokens[i + 1].pos === '動詞') {
            newtokens.push(tokens[i].surface_form);
            newtokens.push("ちまい");
            i += 1;
          } else if (tokens[i].surface_form === 'で' && tokens[i].pos_detail_1 === '接続助詞') {
            // 〜でいます→〜どります
            if (tokens[i + 1].basic_form === 'ます' && tokens[i + 1].pos === '助動詞') {
              newtokens.push('ど');
              newtokens.push('り');
              if (tokens[i + 1].surface_form === 'ます' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やす');
              } else if (tokens[i + 1].surface_form === 'まし' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やし');
              } else if (tokens[i + 1].surface_form === 'ませ' && tokens[i + 1].pos === '助動詞') {
                newtokens.push('やせ');
              } else {
                newtokens.push(tokens[i + 1].surface_form);
              }
              i += 1;
            } else if (tokens[i + 1].surface_form === 'い' && tokens[i + 1].pos === '動詞') {
              if (tokens[i + 2].basic_form === 'ます' && tokens[i + 2].pos === '助動詞') {
                newtokens.push('ど');
                newtokens.push('り');
                if (tokens[i + 2].surface_form === 'ます' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やす');
                } else if (tokens[i + 2].surface_form === 'まし' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やし');
                } else if (tokens[i + 2].surface_form === 'ませ' && tokens[i + 2].pos === '助動詞') {
                  newtokens.push('やせ');
                } else {
                  newtokens.push(tokens[i + 2].surface_form);
                }
                i += 2;
              } else {
                newtokens.push(tokens[i].surface_form);
                newtokens.push(tokens[i + 1].surface_form);
                i += 1;
              }
            } else {
              newtokens.push(tokens[i].surface_form);
            }
          } else if (tokens[i].surface_form === 'ます' && tokens[i].pos === '助動詞') {
            // 〜ます→〜やす
            newtokens.push('やす');
          } else if (tokens[i].surface_form === 'まし' && tokens[i].pos === '助動詞') {
            // 〜ました→〜やした
            newtokens.push('やし');
          } else if (tokens[i].surface_form === 'ませ' && tokens[i].pos === '助動詞') {
            // 〜ません→〜やせん
            newtokens.push('やせ');
          } else if ((tokens[i].surface_form === 'ない' || tokens[i].reading === 'ナイ') && (tokens[i].pos === '助動詞' || tokens[i].pos === '形容詞')) {
            // 〜ない→〜ねぇ
            newtokens.push('ねぇ');
          } else if (tokens[i].surface_form === 'ください' || tokens[i].reading === 'クダサイ') {
            // 〜ください→〜くだせぇ
            newtokens.push('くだせぇ');
          } else if (tokens[i].surface_form === 'という' && tokens[i].pos === '助詞') {
            // 助詞「という」→「ってぇ」
            newtokens.push('ってぇ');
          } else if (tokens[i].surface_form === 'と' && tokens[i].pos === '助詞' && tokens[i + 1].surface_form === 'の' && tokens[i + 1].pos === '助詞') {
            // 引用の助詞「と」＋助詞「の」→「ってぇ」
            newtokens.push('っ');
            newtokens.push('てぇ');
            i += 1;
          } else if (tokens[i].surface_form === 'を' && tokens[i].pos === '助詞' && tokens[i + 1].surface_form === '、' && tokens[i + 1].pos === '記号') {
            // 助詞「を」＋記号「、」→「をだな、」
            newtokens.push('をだな');
            newtokens.push('、');
            i += 1;
          } else if (tokens[i].pos === '動詞' && tokens[i + 1].surface_form === 'たい' && tokens[i + 1].pos === '助動詞') {
            // 動詞＋助動詞「たい」→動詞＋「てぇ」
            newtokens.push(tokens[i].surface_form);
            newtokens.push('てぇ');
            i += 1;
          } else if (tokens[i].surface_form === 'ござい' && tokens[i].pos === '助動詞') {
            // 助動詞「ござい」→「ごぜぇ」
            newtokens.push('ごぜぇ');
          } else if (tokens[i].surface_form === 'たく' && tokens[i].pos === '助動詞' && tokens[i + 1].surface_form === 'ない' && tokens[i + 1].pos === '助動詞') {
            // 助動詞「たく」＋助動詞「ない」→「たかぁねぇ」
            newtokens.push('たかぁ');
            newtokens.push('ねぇ');
            i += 1;
          } else if (tokens[i].pos === '名詞' &&
            (tokens[i + 1].surface_form === 'だ' || tokens[i + 1].surface_form === 'です') &&
            tokens[i + 1].pos === '助動詞'
          ) {
            // 名詞 + 助動詞「だ」「です」→ 名詞 + 「でい」

            // if (tokens[i + 2] && (tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n' || tokens[i + 2].surface_form === '')) {
            if (tokens[i + 2] && (tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n')) {
              newtokens.push(tokens[i].surface_form); 

              newtokens.push('でい');
              i += 1;
            } else if (tokens[i + 2] && tokens[i + 2].pos === '終助詞') {
              newtokens.push(tokens[i].surface_form);
              newtokens.push('でい');
              i += 2;
            } else {
              newtokens.push(tokens[i].surface_form);
              newtokens.push(tokens[i + 1].surface_form);
              i += 1;
            }
          } else if (tokens[i].pos === "名詞" && (tokens[i + 1].surface_form === '！' || tokens[i + 1].surface_form === '。' || tokens[i + 1].surface_form === '\n' || tokens[i + 1].surface_form === '')) {
            // 文末かつ（名詞）→（名詞）でい
            newtokens.push(tokens[i].surface_form);
            newtokens.push('でい');
          } else if (tokens[i].pos === "助動詞" && tokens[i].basic_form === "です" &&
            (!(tokens[i + 1].surface_form === '！' || tokens[i + 1].surface_form === '。' || tokens[i + 1].surface_form === '\n' || tokens[i + 1].surface_form === '') ||
              !(tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n' || tokens[i + 2].surface_form === '') ||
              (tokens[i + 3] && !(tokens[i + 3].surface_form === '！' || tokens[i + 3].surface_form === '。' || tokens[i + 3].surface_form === '\n' || tokens[i + 3].surface_form === '')))
          ) {
            // （文末ではない）かつ　助動詞　かつ　基本形＝「です」→「でごぜぇやす」に置き換え
            if (tokens[i].surface_form === 'です') {
              newtokens.push('でごぜぇやす');
            } else if (tokens[i].surface_form === 'でし') {
              newtokens.push('でごぜぇやし');
            } else if (tokens[i].surface_form === 'でしょ') {
              newtokens.push('でごぜぇやしょ');
            } else {
              newtokens.push(tokens[i].surface_form);
            }

          }else if (
            tokens[i].pos === "動詞" && (tokens[i].conjugated_type === "一段" || tokens[i].conjugated_type === "サ変・スル") &&
            tokens[i + 1].basic_form === "た" && tokens[i + 1].pos === "助動詞" && 

            (tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n' || tokens[i + 2].surface_form === '')
          ) {
            // 文末　かつ　（動詞　かつ　一段活用）＋（助動詞「た」）→「た」を「やし」に置き換え
            newtokens.push(tokens[i].surface_form);
            newtokens.push('やし');

          }else if (
            tokens[i].pos === "動詞" && tokens[i].conjugated_type.slice(0, 2) === "五段" &&
            tokens[i + 1].basic_form === "た" && tokens[i + 1].pos === "助動詞" && 
            (tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n' || tokens[i + 2].surface_form === '')
          ){
            // 文末 かつ（動詞　かつ　五段活用◯行）＋（助動詞「た」）→ 動詞の最後の１文字を（◯行のイ段の１文字）で置き換える ＋「た」を「やした」に置き換る
            newtokens.push(tokens[i].surface_form.slice(0, -1));
            newtokens.push(verb_whitch(tokens[i].basic_form));
            newtokens.push('やし');
          }else if (
            tokens[i].pos === "動詞" && tokens[i].conjugated_type === "一段" && (tokens[i].basic_form === tokens[i].surface_form) &&
            ((tokens[i + 1].surface_form === '！' || tokens[i + 1].surface_form === '。' || tokens[i + 1].surface_form === '\n' || tokens[i + 1].surface_form === ''))
          ){
            // 文末　かつ　（一段活用の動詞）→ 動詞の最後の１文字を「やす」で置き換え
            newtokens.push(tokens[i].surface_form.slice(0, -1));
            newtokens.push('やす');
          }else if (
            tokens[i].pos === "動詞" && tokens[i].conjugated_type.slice(0, 2) === "五段" && (tokens[i].basic_form === tokens[i].surface_form) &&
            (tokens[i + 1].surface_form === '！' || tokens[i + 1].surface_form === '。' || tokens[i + 1].surface_form === '\n' || tokens[i + 1].surface_form === '')
          ){
            // 文末　かつ　（動詞　かつ　一段活用）→（動詞）を（動詞）やすに置き換え
            newtokens.push(tokens[i].surface_form.slice(0, -1));
            newtokens.push(verb_whitch(tokens[i].basic_form));
            newtokens.push('やす');
          }else if (tokens[i].pos === "形容詞" && 
            (tokens[i + 1].surface_form === '！' || tokens[i + 1].surface_form === '。' || tokens[i + 1].surface_form === '\n' || tokens[i + 1].surface_form === '')
          ){
            // 文末の（形容詞）→（形容詞）でごぜぇやす
            newtokens.push(tokens[i].surface_form);
            newtokens.push('でごぜぇやす');
          }else if (tokens[i].pos === "形容詞" &&
            ((tokens[i + 1].surface_form === "です" && tokens[i + 1].pos === "助動詞") || tokens[i + 1].pos_detail_1 === "終助詞") &&
            (tokens[i + 2].surface_form === '！' || tokens[i + 2].surface_form === '。' || tokens[i + 2].surface_form === '\n' || tokens[i + 2].surface_form === '')
          ){
            // 文末の（形容詞）＋助動詞「です」→（形容詞）でごぜぇやす
            newtokens.push(tokens[i].surface_form);
            newtokens.push('でごぜぇやす');
            // 文末の（形容詞）＋（任意の終助詞１つ）→（形容詞）を（形容詞）でごぜぇやすに置き換え
            // 文末の（形容詞）＋助動詞「です」＋（任意の終助詞１つ）→（形容詞）を（形容詞）でごぜぇやすに置き換え
            if (tokens[i + 1].pos_detail_1 === "終助詞"){
              newtokens.push(tokens[i + 1].surface_form);
            }
            i += 1;
          }else {

            newtokens.push(tokens[i].surface_form);
          }
        }

        // ここから追加したコード
        // 文末にお祭りっぽい絵文字を追加
        const festivalEmojis = ['👘', '🎆', '🏮'];
        const sentenceEndingPunctuation = ['。', '！', '？', '!', '?'];

        for (let i = 0; i < newtokens.length; i++) {
          if (sentenceEndingPunctuation.includes(newtokens[i])) {
            const randomEmoji = festivalEmojis[Math.floor(Math.random() * festivalEmojis.length)];
            newtokens.splice(i + 1, 0, randomEmoji);
            i++; // 絵文字を追加したのでインデックスを進める
          }
        }
        // 追加部分ここまで

        const spanWrapper = document.createElement('span');
        spanWrapper.innerHTML = newtokens.join('');
        textNode.parentNode.replaceChild(spanWrapper, textNode);
      }
    });
  });
}
  
  
  function injectScript(tabId, file) {
    return new Promise((resolve, reject) => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: [file]
      }, (results) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(results);
        }
      });
    });
  }
  