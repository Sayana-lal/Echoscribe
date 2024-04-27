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
    this.vcs.addCommand(new Command("make text @format", (style) => {
      console.log("Received style:", style); // Debugging line
      if (style === "bold") {
        this.editor.format("bold", true, "api");
        return "Make Text Bold";
      } else if (style === "italic") {
        this.editor.format("italic", true, "api");
        return "Make Text Italic";
      } else {
        // Handle other formatting styles
        this.editor.format(style, true, "api");
        return "Make Text " + style;
      }
    }, ["@format"]));
    
  
    

    this.vcs.addCommand(new Command("make size @size",(size)=>{
      this.editor.format("size", size, "api")
      return "Make Size " + size
    },["@size"]));

    this.vcs.addCommand(new Command("make heading @size",(size)=>{
      this.editor.format("header", size, "api")
      return "Make Heading Size " + size
    },["@size"]));

    

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

    this.vcs.addCommand(new Command("change text colour to @color", (color) => {
      this.editor.format("color", color, "api");
      return "Text Color Changed to " + color;
    }, ["@color"]));


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

    this.vcs.addCommand(new Command("insert text @text", (text) => {
      let { index } = this.editor.getSelection();
      this.editor.insertText(index, text, "api");
      return "Inserted Text: " + text;
    }, ["@text"]));

    this.vcs.addCommand(new Command("select text @text", (text) => {
      let content = this.editor.getText();
      let index = content.indexOf(text);
      if (index !== -1) {
        this.editor.setSelection(index, text.length, "api");
        return "Selected Text: " + text;
      } else {
        return "Text not found: " + text;
      }
    }, ["@text"]));

    this.vcs.addCommand(new Command("replace @oldText with @newText", (oldText, newText) => {
      let content = this.editor.getText();
      let updatedContent = content.replace(new RegExp(oldText, 'g'), newText);
      this.editor.setText(updatedContent, "api");
      return "Replaced Text: " + oldText + " with " + newText;
    }, ["@oldText", "@newText"]));

    this.vcs.addCommand(new Command("undo", () => {
      this.editor.history.undo();
      return "Undo";
    }));
    
    this.vcs.addCommand(new Command("redo", () => {
      this.editor.history.redo();
      return "Redo";
    }));

    this.vcs.addCommand(new Command("change background colour to @color", (color) => {
      this.editor.format("background", color, "api");
      return "Background Color Changed to " + color;
    }, ["@color"]));
    
    this.vcs.addCommand(new Command("insert date", () => {
      let currentDate = new Date().toLocaleDateString();
      this.editor.insertText(this.editor.getSelection().index, currentDate, "api");
      return "Inserted Date: " + currentDate;
    }));
    
    this.vcs.addCommand(new Command("insert time", () => {
      let currentTime = new Date().toLocaleTimeString();
      this.editor.insertText(this.editor.getSelection().index, currentTime, "api");
      return "Inserted Time: " + currentTime;
    }));
    this.vcs.addCommand(new Command("indent", () => {
      this.editor.format('indent', '+1', 'api');
      return "Indented Text";
    }));
    
    this.vcs.addCommand(new Command("outdent", () => {
      this.editor.format('indent', '-1', 'api');
      return "Outdented Text";
    }));

    this.vcs.addCommand(new Command("align left", () => {
      this.editor.format('align', 'left', 'api');
      return "Aligned Left";
    }));
    
    this.vcs.addCommand(new Command("align centre", () => {
      this.editor.format('align', 'center', 'api');
      return "Aligned Center";
    }));
    
    this.vcs.addCommand(new Command("align right", () => {
      this.editor.format('align', 'right', 'api');
      return "Aligned Right";
    }));
    
    this.vcs.addCommand(new Command("align justify", () => {
      this.editor.format('align', 'justify', 'api');
      return "Aligned Justify";
    }));
    this.vcs.addCommand(new Command("make text bold", () => {
      this.editor.format('bold', true, 'api');
      return "Made Text Bold";
    }));
    
    this.vcs.addCommand(new Command("make text Italic", () => {
      this.editor.format('italic', true, 'api');
      return "Made Text Italic";
    }));
    
    this.vcs.addCommand(new Command("make text underline", () => {
      this.editor.format('underline', true, 'api');
      return "Made Text Underline";
    }));
    
    this.vcs.addCommand(new Command("make text Strike", () => {
      this.editor.format('strike', true, 'api');
      return "Made Text Strike";
    }));

   
    this.vcs.addCommand(new Command("toggle block", () => {
      const format = this.editor.getFormat();
      if (format['blockquote']) {
        this.editor.format('blockquote', false, 'api'); // Remove blockquote format
        return "Removed Blockquote";
      } else {
        this.editor.format('blockquote', true, 'api'); // Add blockquote format
        return "Added Blockquote";
      }
    }));
    
    this.vcs.addCommand(new Command("toggle code block", () => {
      const format = this.editor.getFormat();
      if (format['code-block']) {
        this.editor.format('code-block', false, 'api'); // Remove code block format
        return "Removed Code Block";
      } else {
        this.editor.format('code-block', true, 'api'); // Add code block format
        return "Added Code Block";
      }
    }));
    
    this.vcs.addCommand(new Command("toggle numbering list", () => {
      const format = this.editor.getFormat();
      if (format.list === 'ordered') {
        this.editor.format('list', false, 'api');
        return "Removed Numbering";
      } else {
        this.editor.format('list', 'ordered', 'api');
        return "Applied Numbering";
      }
    }));

    this.vcs.addCommand(new Command("toggle Bullet list", () => {
      const format = this.editor.getFormat();
      if (format.list === 'bullet') {
          this.editor.format('list', false, 'api'); // Remove bullet list format
          return "Removed Bullet List";
      } else {
          this.editor.format('list', 'bullet', 'api'); // Add bullet list format
          return "Changed to Bullet List";
      }
  }));
  
  
    
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
}], [{
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

