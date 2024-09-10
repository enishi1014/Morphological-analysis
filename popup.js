document.getElementById("translateButton").addEventListener("click", function () {

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
  

      textNodes.forEach(textNode => {
        const originalText = textNode.nodeValue.trim();
        if (originalText.length > 0) {
          const tokens = tokenizer.tokenize(originalText);

          tokens.forEach(token => {
            console.log(token);  
          });

          
          const analyzedText = tokens.map(token => {
            
            if  (token.pos === '名詞'){
              console.log('名詞を発見しました'); 
              return `<span style="border: 1px solid #000; margin: 2px; padding: 2px;">
                        te
                        <small>(${token.pos})</small>
                      </span>`;
            } else {
              return `<span style="border: 1px solid #000; margin: 2px; padding: 2px;">
                        ${token.surface_form}
                        <small>(${token.pos})</small>
                      </span>`;
            }
          }).join('');

          
          const spanWrapper = document.createElement('span');
          spanWrapper.innerHTML = analyzedText;
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
  