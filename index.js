var curNumberText = document.getElementById("text_curNumber");
var curAnswer = document.getElementById("text_curAnswer");


function nextNumber() {
    currentNumber = clamp(currentNumber + 1, 0, 10000);
  }
  
  function prevNumber() {
    currentNumber = clamp(currentNumber - 1, 0, 10000);
  }
  
  function updateDisplay(){
    curNumberText.innerHTML = currentNumber;
    curAnswer.innerHTML = answers[currentNumber];
  }

  function button_Next(){
    nextNumber();
    updateDisplay();
  }

  function button_Prev(){
    prevNumber();
    updateDisplay();
  }

  function pickAnswer(ans){
    setAnswer(currentNumber, ans);
    button_Next();
  }

  function pickCorrect(correct){
    setCorrect(currentNumber, correct);
    button_Next();
  }

