let instance = null;
class VoiceCommandService {
  constructor() {
    if (!instance)
      instance = this;
    else
      return instance;
    //initialize some member variables
    // for speech recognition
    this.term = "";
    this.intermediateTerm = "";
    //for function calling
    this.fnListOnStart = [];
    this.fnListOnResult = [];
    this.fnListOnEnd = [];
    //for activation
    this.keyList = [];
    this.keyEventFunction;
    //for command handling
    this.commandManager = new CommandManager();
    this.commandResult = "";
    this.registerOnEndFunction((str)=>this.handleCommand(str));

    //initialize webkitSpeechRecognition
    if ('webkitSpeechRecognition'in window) {
      this.speechRecognition = new webkitSpeechRecognition();
      this.speechRecognition.continuous = true;
      this.speechRecognition.lang = 'en-us';
      this.speechRecognition.maxAlternatives = 1;
      this.speechRecognition.interimResults = true;
    } else {
      alert("This Browser doesn't supoort SpeechRecognition")
    }

    //set on result
    this.speechRecognition.onresult = speech=>{
      if (speech.results) {
        this.intermediateTerm = ""
        var result = speech.results[speech.resultIndex];
        var transcript = result[0].transcript;
        //final result
        if (result.isFinal) {
          if (result[0].confidence < 0.5)
            console.log("Unrecognized Speech");
          else {
            this.term += transcript;
            console.log("Heard: " + this.term);
          }
          for (let i = 0; i < this.fnListOnResult.length; i++) {
            this.fnListOnResult[i](this.term);
          }
        }//intermediate result
        else {
          this.intermediateTerm += transcript;
          for (let i = 0; i < this.fnListOnResult.length; i++) {
            this.fnListOnResult[i](this.intermediateTerm);
          }
        }
      }
    }
    ;
    //set on start
    this.speechRecognition.onstart = ()=>{
      for (let i = 0; i < this.fnListOnStart.length; i++) {
        this.fnListOnStart[i]();
      }
    }
    //set onEnd
    this.speechRecognition.onend = ()=>{
      for (let i = 0; i < this.fnListOnEnd.length; i++) {
        this.fnListOnEnd[i](this.term);
      }
      this.term = "";
    }

    //add key Event Listener
    window.addEventListener("keydown", (e)=>{
      if (this.keyList.find((key)=>{
        return key === e.keyCode
      }
      ) !== undefined) {
        this.startRecord();
      }
    }
    )
    window.addEventListener("keyup", (e)=>{
      if (this.keyList.find((key)=>{
        return key === e.keyCode
      }
      ) !== undefined) {
        this.stopRecord();
      }
    }
    )
  }

  //register function which will be called when webkit speech recog starts
  //example usage: registerOnStartFunction((speech)=>{...})
  registerOnStartFunction(fn) {
    if (typeof fn === "function")
      this.fnListOnStart.push(fn)
    else
      console.log("Not a valid function")
  }
  //register function which will be called when there is result(either intermediate/final)
  //example usage: registerOnResultFunction((speech)=>{...})
  registerOnResultFunction(fn) {
    if (typeof fn === "function")
      this.fnListOnResult.push(fn)
    else
      console.log("Not a valid function")
  }

  //register function which will be called when speech ends
  //example usage: registerOnEndFunction((speech)=>{...})
  registerOnEndFunction(fn) {
    if (typeof fn === "function")
      this.fnListOnEnd.push(fn)
    else
      console.log("Not a valid function")
  }

  //update Element content when stop recording
  //example usage: bindElement(document.getElementById("example"))
  bindElement(element) {
    if (element) {
      this.registerOnResultFunction((speech)=>{
        element.innerHTML = speech
      }
      );
    }
  }

  //bind one key with Start and Stop of the speech recognizer (add to the key list)
  bindActivationKey(keyCode) {
    this.keyList.push(keyCode);
  }
  bindActivationElement(element) {
    element.addEventListener("mousedown",(event)=>{
        this.startRecord();
    })
    element.addEventListener("mouseup",(event)=>{
        this.stopRecord();
    })
  }

  startRecord() {
    console.log("Start Recording")
    this.term = "";
    this.speechRecognition.start();
  }

  stopRecord() {
    this.speechRecognition.stop();
    console.log("Stop Recording")
  }
  ;//command service
  addCommand(cmdObj) {
    this.commandManager.addCommand(cmdObj);
  }

  handleCommand(sentence) {
    this.commandResult = this.commandManager.handleCommand(sentence);
  }

}

//define command class
class Command {
  constructor(commandStr, fn, args) {
    this.commandStr = commandStr;
    this.fn = fn;
    this.args = args;
  }
}

//command manager
class CommandManager {
  constructor() {
    this.mappingList = {};
    this.defauntFn = null;
  }
  addCommand(cmdObj) {
    let str = cmdObj.commandStr;
    let fn = cmdObj.fn;
    let args = cmdObj.args || [];

    let words = str.replace(/[^\w|@|\s]/g, "").split(" ").filter((s)=>s !== "")
    let function_part = [fn];
    for (let i = 0; i < args.length; i++) {
      function_part.push(args[i])
    }
    this.mappingList[words.join(" ")] = function_part;
  }
  //currently implemented by regex
  handleCommand(sentence) {
    let processMappingStr = function(mappingStr) {
      let words = mappingStr.split(" ");
      let params = []
      for (let i = 0; i < words.length; i++) {
        if (words[i][0] === '@') {
          params.push(words[i])
          words[i] = '(\\w+)'
        }
      }
      let reg = "^" + words.join(" ") + "$";
      let match_res = (new RegExp(reg)).exec(sentence)
      // console.log(match_res)
      if (match_res === null)
        return null;
      else {
        var res = {};
        let len = params.length;
        for (let i = 0; i < len; i++)
          res[params.shift()] = match_res[1 + i]
        return res;
      }
    }
    for (var key in this.mappingList) {
      var mapRes = processMappingStr(key)
      if (mapRes !== null) {
        var args = []
        let len = this.mappingList[key].length
        for (let i = 1; i < len; i++) {
          let x = this.mappingList[key][i][0];
          if (typeof x === 'string' && x[0] === '@')
            args.push(mapRes[this.mappingList[key][i]])
          else
            args.push(this.mappingList[key][i])
        }
        console.log(this.mappingList[key])
        return this.mappingList[key][0](...args);
      }
    }
    if (this.defauntFn !== null)
      return this.defauntFn(sentence);
  }
  //if no matching command, set a default function
  //e.g. write to the editor if speech is not matched to any commands 
  setDefaultFn(fn) {
    return this.defaultFn = fn;
  }
}
//some example how to use
window.addEventListener("load", ()=>{
  var vcs = new VoiceCommandService()
  
 }
)
