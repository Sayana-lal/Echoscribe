class Editor {
  constructor() {
    this.editor = new Quill('#editor',{
      modules: {
        toolbar: toolbarOptions
      },
      theme: 'snow'
    });
    this.speechData = "";
    this.vcs = new VoiceCommandService()
    this.vcs.bindActivationKey(17);
    this.vcs.bindActivationElement(document.getElementById("mic"));
    this.setUpEditor();
  }
  setUpEditor() {
    this.default_format = this.editor.getFormat();
    this.vcs.addCommand(new Command("copy",()=>{
      var range = this.editor.getSelection();
      this.copyBuffer = this.editor.getText(range.index, range.length);
      console.log(this.copyBuffer)
      return "Copied"
    }));
    this.vcs.addCommand(new Command("paste",()=>{
      var {index, length} = this.editor.getSelection();
      this.delete_text();
      this.editor.insertText(index, this.copyBuffer + " ", this.editor.getFormat(), "api")
      return "Pasted"
    }))
    this.vcs.addCommand(new Command("make text @format",(style)=>{
      this.editor.format(style, true, "api")
      return "Make Text " + style
    },["@format"]));

    this.vcs.addCommand(new Command("make size @size",(size)=>{
      this.editor.format("size", size, "api")
      return "Make Size " + size
    },["@size"]));

    this.vcs.addCommand(new Command("make heading @size",(size)=>{
      this.editor.format("header", size, "api")
      return "Make Heading Size " + size
    },["@size"]));

    this.vcs.addCommand(new Command("align to the @pos",(pos)=>{
      this.editor.format("align", pos, "api")
      return "Align to " + pos
    } ,["@pos"]))

    this.vcs.addCommand(new Command("align to @pos",(pos)=>{
      this.editor.format("align", pos, "api")
      return "Align to " + pos
    },["@pos"]))

    this.vcs.addCommand(new Command("remove format",()=>{
      this.editor.removeFormat(this.editor.getLength() - 2, 1)
      return "Remove Format"
    }))

    this.vcs.addCommand(new Command("next line",()=>{
      this.remove_selection();
      this.setCursorNextLine()
    }))

    this.vcs.addCommand(new Command("next @num lines",(num)=>{
      if (num in WordToInt)
        num = WordToInt[num]
      this.remove_selection();
      for (let i = 0; i < num; i++)
        this.setCursorNextLine()
      return "Next " + num + " Lines"
    },["@num"]))

    this.vcs.addCommand(new Command("delete text",()=>{
      this.delete_text()
      return "Text Deleted"
    }))

    this.vcs.addCommand(new Command("previous paragraph",()=>{
      this.remove_selection();
      this.previous_paragraph(1, false)
      return "Cursor Moved to Previous Paragraph"
    }))

    this.vcs.addCommand(new Command("previous @num paragraphs",(num)=>{
      num = WordToInt[num]
      this.remove_selection();
      this.previous_paragraph(num, false)
      return "Cursor Moved to Previous " + num + " Paragraphs"
    },["@num"]))

    this.vcs.addCommand(new Command("select previous paragraph",()=>{
      this.previous_paragraph(1, true)
      return "Previous Paragraph Selected"
    }))
    this.vcs.addCommand(new Command("select previous @num paragraphs",(num)=>{
      num = WordToInt[num]
      this.previous_paragraph(num, true)
      return "Previous " + num + " Paragraphs Selected"
    },["@num"]))

    this.vcs.addCommand(new Command("select last paragraph",()=>{
      this.previous_paragraph(1, true)
      return "Previous Paragraph Selected"
    }))
    this.vcs.addCommand(new Command("select last @num paragraphs",(num)=>{
      num = WordToInt[num]
      this.previous_paragraph(num, true)
      return "Previous " + num + " Paragraphs Selected"
    },["@num"]))

    this.vcs.addCommand(new Command("select next paragraph",()=>{
      this.next_paragraph(1, true)
      return "Next Paragraphs Selected"
    }))
    this.vcs.addCommand(new Command("select next @num paragraphs",(num)=>{
      num = WordToInt[num]
      this.next_paragraph(num, true)
      return "Next " + num + " Paragraphs Selected"
    },["@num"]))

    this.vcs.addCommand(new Command("next paragraph",()=>{
      this.remove_selection();
      this.next_paragraph(1, false)
      return "Cursor Moved to Next Paragraph"
    }))
    this.vcs.addCommand(new Command("next @num paragraphs",(num)=>{
      num = WordToInt[num]
      this.remove_selection();
      this.next_paragraph(num, false)
      return "Cursor Moved to Next " + num + " Paragraphs"
    },["@num"]))
  }

  delete_text() {
    var e = this.editor;
    var sel = e.getSelection();
    e.deleteText(sel.index, sel.length, "api")
  }

  remove_selection() {
    let range = this.editor.getSelection()
    if (range.length !== 0) {
      this.editor.setSelection(range.index + range.length, 0, "api");
    }
  }

  next_paragraph(num, selection) {
    var content = this.editor.getText(0);
    var range = this.editor.getSelection();
    var start = range.index;
    let next_return = function(current_index) {
      for (var i = current_index; i < content.length; i++) {
        if (content[i] === '\n')
          return i;
      }
      return i;
    }
    let next_non_return = function(current_index) {
      for (var i = current_index; i < content.length; i++) {
        if (content[i] !== '\n')
          return i;
      }
      return i;
    }
    if (start == 0 || content[start - 1] === '\n') {} 
    else {
      start = next_return(start);
      start = next_non_return(start);
    }

    let end = start
      , inter_end = start;
    for (let i = 0; i < num; i++) {
      inter_end = next_return(inter_end);
      if (i === num - 1)
        break;
      inter_end = next_non_return(inter_end);
    }
    end = inter_end;
    let len = 0;
    if (selection === true)
      len = end - start
    this.editor.setSelection(start, len, 'api')
  }

  previous_paragraph(num, selection) {
    var content = this.editor.getText(0);
    var range = this.editor.getSelection();
    var end = range.index;
    var start = 0;
    let last_return = function(current_index) {
      if (current_index === -1)
        return -1
      for (let i = current_index; i >= 0; i--) {
        if (content[i] === '\n')
          return i;
        if (i === 0)
          return -1;
      }
    }
    let last_non_return = function(current_index) {
      if (current_index === -1)
        return -1
      for (let i = current_index; i >= 0; i--) {
        if (content[i] !== '\n')
          return i;
        if (i === 0)
          return -1;
      }
    }
    let x = last_non_return(end);
    if (x === end) {
      end = last_return(x);
      end = last_non_return(end);
    } else
      end = x;

    let inter_end = end
    for (let i = 0; i < num; i++) {
      inter_end = last_non_return(inter_end);
      inter_end = last_return(inter_end);
    }
    start = inter_end

    let len = end - start + 1;
    if ((end == -1 && start == -1) || (selection === false))
      len = 0
    this.editor.setSelection(start + 1, len, 'api')
  }

  setCursorNextLine() {
    var e = this.editor;
    var {index, length} = this.editor.getSelection(true);
    if (length === 0) {
      let remain_content = this.editor.getText(index);
      var count = 0;
      for (let i = 0; i < remain_content.length - 1; i++) {
        if (remain_content[i] == '\n')
          break;
        count++;
      }
      if (index + count + 1 >= e.getLength()) {
        e.insertText(this.editor.getLength() - 1, "\n", e.getFormat(), "api")
        e.setSelection(this.editor.getLength() - 1, 0, "api");
      } else
        e.setSelection(index + count + 1, 0, "api");
    }
  }

  setCursorPreviousLine() {
    var e = this.editor;
    var {index, length} = this.editor.getSelection(true);
    if (length === 0) {
      let prev_content = this.editor.getText(0, index);
      var count = 0;
      for (let i = prev_content.length - 1; i >= 0; i--) {
        if (prev_content[i] == '\n') {
          count++;
          break;
        }
        count++;
      }
      e.setSelection(index - count, 0, "api");
    }
  }

}

window.addEventListener("load", function() {
  var editor = new Editor();
})

var toolbarOptions = [['bold', 'italic', 'underline', 'strike'], // toggled buttons
['blockquote', 'code-block'], [{
  'header': 1
}, {
  'header': 2
}], // custom button values
[{
  'list': 'ordered'
}, {
  'list': 'bullet'
}], [{
  'script': 'sub'
}, {
  'script': 'super'
}], // superscript/subscript
[{
  'indent': '-1'
}, {
  'indent': '+1'
}], // outdent/indent
[{
  'direction': 'rtl'
}], // text direction

[{
  'size': ['small', false, 'large', 'huge']
}], // custom dropdown
[{
  'header': [1, 2, 3, 4, 5, 6, false]
}], [{
  'color': []
}, {
  'background': []
}], // dropdown with defaults from theme
[{
  'font': []
}], [{
  'align': []
}], ['clean']// remove formatting button
];

WordToInt={
  "two":2,
  "three":3,
  "four":4,
  "five":5,
  "six":6,
  "seven":7,
  "eight":8,
  "nine":9
}
