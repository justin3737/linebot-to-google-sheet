/* 程式碼開始 */

var CHANNEL_ACCESS_TOKEN = ""; //Your Line Bot's channel token
var shareTags = ['#好經驗','#好工具','#好趨勢','#好資源','#好活動']; //Your #Tags witch you defined.
var botName = '';  //Your Bot's name.
var Wellcome = '你好，你可以輸入:\n ex: '+ botName +';#tags;網址\n\n告訴我你想分享的好東西！\n想知道更多功能請輸入：\n ex:'+ botName +';help';
var ErrNotify = '我智商不足，可以再說一次嗎？ex: '+ botName +';#tags;網址 ';
var HelpWording = '說明：\n'+
'1.簡易輸入，我幫你找標題:\n ex: '+ botName +';網址 \n\n'+
'2.簡易輸入，我幫你找標題，再告訴我你的標籤吧：\n ex: '+ botName +';#tags;網址 \n\n'+
'3.標籤可以輸入：' + shareTags.join(" ");

function doPost(e) {
    var userData = JSON.parse(e.postData.contents);
    var replyToken = userData.events[0].replyToken;
    var userMessage = userData.events[0].message.text;
    var clientID = userData.events[0].source.userId;
    var replyMsg = getUserResponse(clientID, userMessage);

    if (replyMsg === false) return;
  
    sendReplyMessage(CHANNEL_ACCESS_TOKEN, replyToken, replyMsg);
}

//troubleshooting用
function deBug() {
   var userId = 'User1';
   var userMsg = 'uedbaby;https://tw.yahoo.com;#好資源';
   var userRes = getUserResponse(userId, userMsg);
   Logger.log(userRes);
}

//傳送訊息給使用者
function sendReplyMessage(CHANNEL_ACCESS_TOKEN, replyToken, replyMessage) {
    UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", {
    "headers": {
        "Content-Type": "application/json; charset=UTF-8",
        "Authorization": "Bearer " + CHANNEL_ACCESS_TOKEN,
    },
    "method": "post",
    "payload": JSON.stringify({
        "replyToken": replyToken,
        "messages": [{
        "type": "text",
        "text":replyMessage,
        }],
    }),
    });
}

function getUserResponse (clientID, usermessage) {
    //比對是否有呼叫關鍵字 botName, 沒找到關鍵字，就回應使用者說的話
    if (!compareKeywords(usermessage, botName)) return false;
    var hiBot = new myBot(clientID, usermessage);
    //紀錄分析User說的內容
    hiBot.init();

    return hiBot.getContent();
}

// 比對是否符合關鍵字
function compareKeywords(str, keywords) { 
    var clerWords = str.toLowerCase().replace(/-/g,"").replace(/\s+/g, "");
    return (clerWords.indexOf(keywords.toLowerCase()) !== -1 )?true: false;
}

function myBot(clientID, usermessage) {
    this.clientID = clientID;
    this.usermessage = usermessage;
    this.tags = '';
    this.content = '';
    this.urlLink = '';
    this.title = ''; //從網址獲取得標題
    this.userSetTitle = '';
    this.isShowWelcome = false;
    this.isShowHelp = false;
    this.hasTags = false;
    this.hasUserTitle = false;
    this.hasTitle = false;
    this.hasLink = false;
  
    this.getContent = function() {
        //少了分號;回傳歡迎文字
        if(this.isShowWelcome) return Wellcome;
        //回傳help
        if(this.isShowHelp) return HelpWording;
        //連網址都沒有的話就回傳錯誤訊息...
        if(!this.hasLink) return ErrNotify;

        //處理要回覆的答案
        var responseText = '收到！\n';
        responseText += '標題: ' + this.title + '\n';
        if(this.hasTags)
            responseText += '標籤: ' + this.tags + '\n';
        
        responseText += '連結: ' + this.urlLink + '\n';
        //存入google sheet
        this.setToXSL(this.handleSave());

        return responseText; 
    }
    
    //處理要儲存的資料
    this.handleSave = function()  {
        var dataArr = [];
        dataArr.push(this.title);
        dataArr.push(this.urlLink);
        if(this.hasTags)
            dataArr.push(this.tags);
        return dataArr;
    }
    
    //從網址裡找到標題
    this.fetchLinkTitle = function(urlLink) {
        var _title = '';
        var _result = '';
        _result = UrlFetchApp.fetch(urlLink).getContentText();
        _title = _result.match(/<title.*?>(.*?)<\/title>/);
        return _title[1];
    }

    this.init = function() {
        var arr = this.usermessage.split(';');
       
        if(arr.length === 1) this.isShowWelcome = true;
        if(arr.length === 2 && arr[1].toLowerCase() === 'help') this.isShowHelp = true;
      
        for(var i=0; i<arr.length;i++) { 
            if(arr[i].indexOf('#') !== -1) {
                this.tags = arr[i].trim();
                this.hasTags = true;
            }
            if(arr[i].indexOf('http') !== -1) {
                this.urlLink = arr[i].trim();
                this.title = this.fetchLinkTitle(this.urlLink);
                this.hasLink = true;
            }
        }
    }
    
    //寫入google sheet
    this.setToXSL = function(data) {
        var spreadSheet = SpreadsheetApp.openById(spreadSheetID);
        var sheet = spreadSheet.getActiveSheet();
        var lastRow = sheet.getLastRow();

        //在最後一行寫入資料
        data.forEach(function(e,i){
            sheet.getRange(lastRow+1, i+1).setValue(e);
        });

        return ContentService.createTextOutput(true);
    }
}

// 程式碼結束
