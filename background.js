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

    // 辞書
    // 一人称→あっし
    function norn_first_asshi(surface_form){
      const norn_first = ['私', '俺', '僕', 'わたし',  'わたくし', 'おれ', 'ぼく', 'ワタシ', 'オレ', 'ボク', 'オラ'];
      if (norn_first.includes(surface_form)) {
        return 1;
      }
    }
    // 二人称→おめえ、おめえさん、てめえ
    function norn_second_omee(surface_form){
      const norn_second = ['君', 'あなた', 'きみ', 'おまえ', 'アナタ', 'キミ', 'オマエ'];
      if (norn_second.includes(surface_form)) {
        return 1;
      }
    }
    // 三人称→◯◯の旦那(済)

    // 〜ています→〜とります(済)
    // // 接続助詞「て」＋（助動詞かつ基本形が「ます」→「て」を「とり」に置き換え
    // // 接続助詞「て」＋動詞「い」＋（助動詞かつ基本形が「ます」）→（「て」＋「い」）を「とり」に置き換え

    // 〜でいます→〜どります
    // // 接続助詞「で」＋（助動詞かつ基本形が「ます」）→「で」を「どり」に置き換え
    // // 接続助詞「で」＋動詞「い」＋（助動詞かつ基本形が「ます」）→（「で」＋「い」）を「どり」に置き換え

    // 〜ます→〜やす
    // // 助動詞かつ（基本形が「ます」）→「ま」を「や」に置き換え

    // 〜ない→〜ねぇ
    // //（助動詞or形容詞）かつ（読み方が「ナイ」）→「ねぇ」に置き換え

    // 〜ください→〜くだせぇ
    // // 動詞かつ読み方が「クダサイ」→「くだせぇ」に置き換え

    // 〜てしまう、〜ちゃう→〜ちまう、〜やがる
    // // 動詞かつ　基本形が「ちゃう」→「ちゃ」を「ちま」に置き換え
    // // 助詞「て」＋（動詞かつ　基本形が「しまう」）→「しま」を「ちま」に置き換え

    // --------------------------------------------------------------------------------------------

    // （名詞）だ、（名詞）です→（名詞）でい、（名詞）よ
    // // 文末かつ　（名詞）＋（助動詞「だ」）→（名詞）＋「でい」
    // // 文末かつ　（名詞）＋（助動詞「です」）→（名詞）＋「でい」
    // // 文末かつ　（名詞）＋（助動詞「だ」+ 任意の終助詞１つ）→（名詞）＋「でい」
    // // 文末かつ　（名詞）＋（助動詞「です」+ 任意の終助詞１つ）→（名詞）＋「でい」
    // ※（感嘆符 or 「。」 or 改行）が次に来ていたら、とりあえず文末と判断するイメージ...？
    // ※終助詞は「ぜ」「よ」みたいなやつです

    // 〜という、〜との→〜ってぇ
    // // 助詞「という」→「ってぇ」
    // // 引用の助詞「と」＋助詞「の」→「ってぇ」

    // （目的語の名詞）を、→（目的語の名詞）をだな、
    // // 助詞「を」＋記号「、」→「をだな、」に置き換え

    // （※願望の意味あいで）〜たい→〜てぇ
    // // 動詞＋助動詞「たい」→動詞＋「てぇ」

    // ござい→ごぜぇ
    // // 助動詞「ござい」→「ごぜぇ」

    // 〜たくない→〜たかぁねぇ
    // // 助動詞「たく」＋助動詞「ない」→「たかぁねぇ」

    textNodes.forEach(textNode => {
      const originalText = textNode.nodeValue.trim();
      if (originalText.length > 0) {
        const tokens = tokenizer.tokenize(originalText);

        tokens.forEach(token => {
          console.log(token);  
        });

        var newtokens = [];
        for (let i = 0; i < tokens.length; i++) {
          if (norn_first_asshi(tokens[i].surface_form)){
            // 一人称→あっし
            newtokens.push('あっし');
          }else if (norn_second_omee(tokens[i].surface_form)){
            // 二人称→おめえ、おめえさん、てめえ
            newtokens.push('おめえ');
          }else if (tokens[i].pos_detail_3 === "姓" && tokens[i+1].pos_detail_1 === "接尾"){
            // 三人称→◯◯の旦那
            newtokens.push(tokens[i].surface_form);
            newtokens.push('の');
            newtokens.push('旦那');
            i += 1;
          }else if (tokens[i].surface_form === 'て' && tokens[i].pos_detail_1 === '接続助詞'){
            // 〜ています→〜とります(済)
            if (tokens[i+1].surface_form === 'い' && tokens[i+1].pos === '動詞'){
              if (tokens[i+2].surface_form === 'ます' && tokens[i+2].pos === '助動詞'){
                newtokens.push('と');
                newtokens.push('り');
                newtokens.push('ます');
                i += 2;
              } else {
                newtokens.push(tokens[i].surface_form);
                newtokens.push(tokens[i+1].surface_form);
                i += 1;
              }
            }else{
              newtokens.push(tokens[i].surface_form);
            }
          // }else if (tokens[i].surface_form === 'で' && tokens[i].pos_detail_1 === '接続助詞'){
          //   // 〜でいます→〜どります
          //   // // 接続助詞「で」＋（助動詞かつ基本形が「ます」）→「で」を「どり」に置き換え
          //   // // 接続助詞「で」＋動詞「い」＋（助動詞かつ基本形が「ます」）→（「で」＋「い」）を「どり」に置き換え
          //   if (tokens[i+1].surface_form === 'い' && tokens[i+1].pos === '動詞'){
          //     if (tokens[i+2].surface_form === 'ます' && tokens[i+2].pos === '助動詞'){
          //       newtokens.push('ど');
          //       newtokens.push('り');
          //       newtokens.push('ます');
          //       i += 2;
          //     } else {
          //       newtokens.push(tokens[i].surface_form);
          //       newtokens.push(tokens[i+1].surface_form);
          //       i += 1;
          //     }
          //   }else{
          //     newtokens.push(tokens[i].surface_form);
          //   }
          // }else if (1) {
          // 〜ます→〜やす
          // // 助動詞かつ（基本形が「ます」）→「ま」を「や」に置き換え
          // }else if (1) {
          // 〜ない→〜ねぇ
          // //（助動詞or形容詞）かつ（読み方が「ナイ」）→「ねぇ」に置き換え
          // }else if (1) {
          // 〜ください→〜くだせぇ
          // // 動詞かつ読み方が「クダサイ」→「くだせぇ」に置き換え
          // }else if (1) {
          // 〜てしまう、〜ちゃう→〜ちまう、〜やがる
          // // 動詞かつ　基本形が「ちゃう」→「ちゃ」を「ちま」に置き換え
          // // 助詞「て」＋（動詞かつ　基本形が「しまう」）→「しま」を「ちま」に置き換え
          }else{
            newtokens.push(tokens[i].surface_form);
          }
        }

        // const analyzedText = tokens.map(token => {
        //   if  (token.pos === '名詞'){
        //     console.log('名詞を発見しました');
        //     // return `<span style="border: 1px solid #000; margin: 2px; padding: 2px;">
        //     //           te
        //     //           <small>(${token.pos})</small>
        //     //         </span>`;
        //     if (omatsuri_dec(token.surface_form)){
        //       return `あっし`;
        //     }else{
        //       // return `${token.surface_form}`;
        //       return `te`;
        //     }
        //   } else {
        //     // return `<span style="border: 1px solid #000; margin: 2px; padding: 2px;">
        //     //           ${token.surface_form}
        //     //           <small>(${token.pos})</small>
        //     //         </span>`;
        //     return `${token.surface_form}`;
        //   }
        // }).join('');
        
        const spanWrapper = document.createElement('span');
        // spanWrapper.innerHTML = analyzedText;
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'matsuri',
    title: 'お祭り変換！',
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'matsuri') {
    // chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   func: replaceAuxiliaryVerbsWithUho,
    // });

    const tabId = tab.id;
    injectScript(tabId, 'kuromoji.js').then(() => {

      return chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: replaceAuxiliaryVerbsWithUho
      });
    }).catch(err => {
      console.error('スクリプトのインジェクト中にエラーが発生しました:', err);
    });
  }
});