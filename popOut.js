MAX_HISTORY=3;
class PopOut {
  constructor() {
    this.hideDelay = 1000;
    this.historyMessages=[];
    

    //set up elements
    this.setupElements();

    this.speechService = new VoiceCommandService();
    this.speechService.registerOnStartFunction(()=>{
      this.setBorderColor("#ee9090");
      this.showPopOut();
      this.toggleMicAnimation();
    });
    this.speechService.registerOnEndFunction((str)=>{
      this.handleResult(str);
    });
    this.speechService.registerOnResultFunction((str)=>{
      this.updateDisplay(str);
      this.setBorderColor("#90bfee");
    })
  }

  handleResult(str){
    this.toggleMicAnimation();
      if (str !== "") {
        let commandResult = this.speechService.commandResult
        if (commandResult === undefined || commandResult === "")
          this.hidePopOut(this.hideDelay);
        else {
          this.setBorderColor("#90eebf");
          setTimeout(()=>{
            this.updateDisplay("<b style=\"font-size:20px\">" + commandResult + "</b>")
            this.micIcon.src = "2.png"
            this.updataHistory(commandResult)
          }, this.hideDelay);
          this.hidePopOut(this.hideDelay * 2);
        }
      } else
        this.hidePopOut(1)
  }

  updataHistory(msg) {
    if(this.historyMessages.length<MAX_HISTORY+1)
      this.historyMessages.push(msg)
    else{
      this.historyMessages.push(msg)
      this.historyMessages.shift()
    }
    this.historyDiv.innerHTML=""
    for(let i = 0; i< this.historyMessages.length-1;i++){
      let entry=document.createElement("div")
      entry.innerHTML=this.historyMessages[i];
      entry.id="geno-history-entry"
      this.historyDiv.appendChild(entry);
    }
  }

  setupElements() {
    this.popDiv = document.createElement("div")
    this.popDiv.id = "geno-pop"
    this.popDiv.style.visible = "hidden";

    this.notificationDiv =  document.createElement("div")
    this.notificationDiv.id = "geno-notification"

    this.historyDiv= document.createElement("div")
    this.historyDiv.id="geno-history"   

    this.iconDiv = document.createElement("div")
    this.iconDiv.id = "geno-pop-icon-div"
    this.micIcon = document.createElement("img")
    this.micIcon.id = "geno-pop-icon"
    this.micIcon.src = "1.png"
    this.redDot = document.createElement("div")
    this.redDot.id = "geno-red-dot"

    this.dispDiv = document.createElement("div")
    this.dispDiv.id = "geno-pop-display"
    this.mainDisplay = document.createElement("p")
    this.updateDisplay("Listening...")

    this.commadDiv = document.createElement("div")
    this.dispDiv.id = "geno-pop-display"

    document.body.appendChild(this.popDiv);
    this.popDiv.appendChild(this.historyDiv);
    this.popDiv.appendChild(this.notificationDiv);

    this.notificationDiv.appendChild(this.iconDiv);
    
    this.iconDiv.appendChild(this.redDot);
    this.iconDiv.appendChild(this.micIcon);
    
    this.notificationDiv.appendChild(this.dispDiv);
    this.dispDiv.appendChild(this.mainDisplay);
  }

  updateDisplay(str) {
    this.mainDisplay.innerHTML = str;
  }
  toggleMicAnimation() {
    if (this.redDot.style.display === "block")
      this.redDot.style.display = "none";
    else
      this.redDot.style.display = "block";
  }
  setBorderColor(color) {
    this.notificationDiv.style.borderColor = color;
  }
  showPopOut() {
    this.popDiv.classList.add("visible");
  }
  hidePopOut(timeout=0) {
    window.setTimeout(()=>{
      this.popDiv.classList.remove("visible");
      //reset element after animation disappear
      window.setTimeout(()=>{
        this.micIcon.src = "1.png"
        this.updateDisplay("Listening...");
      }, 1000);
    }, timeout)
  }
}

window.addEventListener("load", ()=>{
  var popOut = new PopOut();
})
