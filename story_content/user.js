function ExecuteScript(strId)
{
  switch (strId)
  {
      case "5X8OsVSga4l":
        Script1();
        break;
      case "5ZaOQzOQiQn":
        Script2();
        break;
      case "68aPdDYMCIC":
        Script3();
        break;
      case "6dSc1zqkEol":
        Script4();
        break;
      case "6HpQt5ab3vc":
        Script5();
        break;
      case "6eS4Y7Eu842":
        Script6();
        break;
      case "5mOT5nrXHBL":
        Script7();
        break;
  }
}

function Script1()
{
  var player = GetPlayer();

// Generate a random ID if not already set
var uid = player.GetVar("UserID");
if (!uid) {
    uid = 'ID-' + Math.random().toString(36).substr(2, 9);
    player.SetVar("UserID", uid);
}
}

function Script2()
{
  var player = GetPlayer();
var emailInput = player.GetVar("email");

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

var isValid = validateEmail(emailInput);
player.SetVar("EmailIsValid", isValid);
}

function Script3()
{
  const url = "https://script.google.com/macros/s/AKfycby2O_BHtLNCbzvvHlIZ08HTUf0TBSOnGRT10o_rkAlFuV7WxFnHtgPGzMk6c5mKuo_X/exec";

const player = GetPlayer();

let userID  = player.GetVar("UserID");
let userName = player.GetVar("uName"); 
let gender = player.GetVar("gender");
let email = player.GetVar("email");

fetch(url,{
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
      id: userID,
      userName: userName,
      gender: gender,
      email: email
  })
});
}

function Script4()
{
  console.log("Listener started. Lvl1");

window.addEventListener("message", function(event) {
  console.log("Message received:", event.data);

  // Combined format
  if (event.data && event.data.action === "setVariables") {
    var player = GetPlayer();
    if (typeof event.data.lvl1Score !== 'undefined') player.SetVar("lvl1Score", event.data.lvl1Score);
    if (typeof event.data.lvl1Complete !== 'undefined') player.SetVar("lvl1Complete", event.data.lvl1Complete);
    return;
  }

  // Individual format (compatibility)
  if (event.data && event.data.action === "setVariable") {
    var player = GetPlayer();
    if (event.data.name === "FinalScore") player.SetVar("lvl1Score", event.data.value);
    if (event.data.name === "GameCompleteStatus") player.SetVar("lvl1Complete", event.data.value);
    return;
  }

  // Optional: detect gameCompleteNotif or test messages
  if (event.data && event.data.action === "gameCompleteNotif") {
    console.log('gameCompleteNotif received, score:', event.data.score);
  }

});

}

function Script5()
{
  // Robust iframe reload by filename
(function(){
  try {
    var iframes = parent.document.getElementsByTagName('iframe');
    for(var i=0;i<iframes.length;i++){
      var src = iframes[i].getAttribute('src') || '';
      // adjust the filename if you used a different html name
      if(src.indexOf('index.html') !== -1 || src.indexOf('index') !== -1){
        // force reload with cache-buster
        var base = src.split('?')[0];
        iframes[i].setAttribute('src', base + '?_reload=' + Date.now());
        break;
      }
    }
  } catch(e){
    console.log('iframe reload error', e);
  }
})();

}

function Script6()
{
  const url = "https://script.google.com/macros/s/AKfycby2O_BHtLNCbzvvHlIZ08HTUf0TBSOnGRT10o_rkAlFuV7WxFnHtgPGzMk6c5mKuo_X/exec";

const player = GetPlayer();

let userID  = player.GetVar("UserID");
let lvl1_score = player.GetVar("lvl1FinalScore");
let finalGameScore = player.GetVar("finalGameScore");

fetch(url,{
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
      id: userID,
      lvl1_score: lvl1_score,
      finalGame_score: finalGameScore
      })
});
}

function Script7()
{
  const url = "https://script.google.com/macros/s/AKfycby2O_BHtLNCbzvvHlIZ08HTUf0TBSOnGRT10o_rkAlFuV7WxFnHtgPGzMk6c5mKuo_X/exec";

const player = GetPlayer();

let userID  = player.GetVar("UserID");
let feedback = player.GetVar("feedback");

fetch(url,{
  method: 'POST',
  mode: 'no-cors',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
      id: userID,
      feedback: feedback
  })
});
}

