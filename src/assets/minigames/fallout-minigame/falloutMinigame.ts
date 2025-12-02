import { MiniGame } from '../../../js/minigame.js';
import type { GameStatus, GameVariables } from '../../../types';
import type { Settings } from '../../../js/settings';
import type { SoundSystem } from '../../../js/soundsSystem';
import type { SpriteManager } from '../../../js/spriteManager';
import type { FontManager } from '../../../js/fontManager';

// jQuery is embedded in the original file, declare it globally
declare const $: any;

export class FalloutMinigame extends MiniGame {
  private columnHeight: number;
  private wordColumnWidth: number;
  private Count: number;
  private Difficulty: number;
  private DudLength: number;
  private InfoText: string;
  private Correct: string;
  private Words: string[];
  private OutputLines: string[];
  private AttemptsRemaining: number;
  private BracketSets: string[];
  private gchars: string[];
  private soundPath: string;
  private currentMusic: string;

  constructor(
    gameCanvas: HTMLCanvasElement,
    gameWidth: number,
    gameHeight: number,
    settings: Settings,
    soundSystem: SoundSystem,
    spriteManager: SpriteManager,
    fontManager: FontManager,
    mapManager: any,
    mouseManager: any,
    interactableManager: any,
    gameStatus: GameStatus,
    gameVariables: GameVariables
  ) {
    super(
      gameCanvas, gameWidth, gameHeight, settings, soundSystem,
      spriteManager, fontManager, mapManager, mouseManager, interactableManager,
      gameStatus, gameVariables
    );

    this.columnHeight = 17;
    this.wordColumnWidth = 12;
    this.Count = 12;
    this.Difficulty = 7;
    this.DudLength = 8;
    this.InfoText = "ROBCO INDUSTRIES (TM) TERMALINK PROTOCOL<br />ENTER PASSWORD NOW";
    this.Correct = "";
    this.Words = [];
    this.OutputLines = [];
    this.AttemptsRemaining = 6;
    this.BracketSets = ["<>", "[]", "{}", "()"];
    this.gchars = ["'", "|", "\"", "!", "@", "#", "$", "%", "^", "&", "*", "-", "_", "+", "=", ".", ";", ":", "?", ",", "/"];
    this.soundPath = 'assets/minigames/fallout-minigame/sound/';
    this.currentMusic = '';
  }

  async start(): Promise<void> {
    // Hide current canvas and stop current music
    this.currentMusic = this.gameVariables.currentMusic;
    this.soundSystem.stopBackgroundMusic();
    this.gameCanvas.parentElement!.style.display = "none";
    this.gameStatus.minigameWin = undefined;

    // Preload words and solution
    this.Words = await this.processWords(7, 12);
    console.log('', this.Words);

    // Avoid on select start
    document.onselectstart = function () { return false; };

    // Play start sound
    this.soundSystem.playSoundByPath(`${this.soundPath}poweron.ogg`);

    // Create game map
    this.PopulateScreen();
    this.WordColumnsWithDots();
    this.FillPointerColumns();
    this.SetupOutput();

    this.AttemptsRemaining = 6;

    this.JTypeFill("info", this.InfoText, 20, () => { this.UpdateAttempts(); }, "", "");
    this.WordCallback();
  }

  // Private methods
  private async processWords(length: number, count: number): Promise<string[]> {
    const l = length || 7;
    const c = count || 12;

    const wordsResponse = await fetch('assets/minigames/fallout-minigame/wordlist.txt');
    const words = await wordsResponse.text();
    const wordList = words.split(" ");

    const selectedWords = wordList.filter(w => w.length === l);
    return this.getRandom(selectedWords, c);
  }

  private getRandom(arr: string[], n: number): string[] {
    let len = arr.length;
    const result = new Array(n);
    const taken: any = new Array(len);

    if (n > len)
      throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
      let x = Math.floor(Math.random() * len);
      result[n] = arr[x in taken ? taken[x] : x];
      taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
  }

  private UpdateAttempts(): void {
    let AttemptString = `${this.AttemptsRemaining} ATTEMPT(S) LEFT: `;
    this.JTypeFill("attempts", AttemptString, 20, () => {
      let i = 0;
      while (i < this.AttemptsRemaining) { AttemptString += " &#9608;"; i++; }
      document.getElementById("attempts")!.innerHTML = AttemptString;
    }, "", "");
  }

  private PopulateScreen(): void {
    // Create the new graphics layout for the minigame
    const layout = '<div id="terminal-interior">' +
      '<div id="info"></div><div id="attempts"></div>' +
      '<div id="column1" class="column pointers"></div>' +
      '<div id="column2" class="column words"></div>' +
      '<div id="column3" class="column pointers"></div>' +
      '<div id="column4" class="column words"></div>' +
      '<div id="output"></div><div id="console">></div>' +
      '</div>';

    // Create terminal
    const terminalBackground = document.createElement("DIV");
    terminalBackground.id = "terminal-background";
    terminalBackground.style.transform = `scale(${this.gameStatus.scale}, ${this.gameStatus.scale})`;

    const terminal = document.createElement("DIV");
    terminal.id = "terminal";
    terminal.innerHTML = layout;
    terminal.style.transform = `scale(${this.gameStatus.scale}, ${this.gameStatus.scale})`;

    document.body.appendChild(terminalBackground);
    document.body.appendChild(terminal);
  }

  private WordColumnsWithDots(): void {
    const column2 = document.getElementById("column2")!;
    const column4 = document.getElementById("column4")!;
    const dots = this.GenerateDotColumn();

    column2.innerHTML = dots;
    column4.innerHTML = dots;
  }

  private getSoundNumber(): number {
    let number = Math.floor(Math.random() * 10 - 1);
    if (number <= 0) { number = 1; }
    if (number > 10) { number = 10; }
    return number;
  }

  private JTypeFill(containerID: string, text: string, TypeSpeed: number, callback: () => void, TypeCharacter: string, Prefix: string): void {
    const cont = document.getElementById(containerID)!;
    TypeCharacter = TypeCharacter || "&#9608;";
    Prefix = Prefix || ">";

    cont.innerHTML = '';
    $(cont).stop();
    $(cont).css("fake-property", 0).animate(
      { "fake-property": text.length },
      {
        duration: TypeSpeed * text.length,
        step: (i: number) => {
          let insert = Prefix + text.substr(0, i);

          if ($(cont).text().substr(0, $(cont).text().length - 1) !== insert) {
            this.soundSystem.playSoundByPath(`${this.soundPath}k${this.getSoundNumber()}.ogg`);
          }
          cont.innerHTML = insert + TypeCharacter;
        },
        complete: callback
      }
    );
  }

  private WordCallback(): void {
    this.Correct = this.Words[0];
    this.Words = this.Shuffle(this.Words);
    this.FillWordColumns();
  }

  private RandomPointer(): string {
    return "0x" + (("0000" + Math.floor(Math.random() * 35535).toString(16).toUpperCase()).substr(-4));
  }

  private GenerateGarbageCharacters(): string {
    let garbage = "";
    let x = 0;
    let y = 0;
    while (y < this.columnHeight) {
      while (x < this.wordColumnWidth) {
        garbage += "<span class='character'>" + this.gchars[Math.floor(Math.random() * this.gchars.length)] + "</span>";
        x++;
      }
      x = 0;
      y++;
    }
    return garbage;
  }

  private GenerateDotColumn(): string {
    let dots = "";
    let x = 0;
    let y = 0;
    while (y < this.columnHeight) {
      while (x < this.wordColumnWidth) {
        dots += "<span class='character'>.</span>";
        x++;
      }
      dots += "<br />";
      x = 0;
      y++;
    }
    return dots;
  }

  private Shuffle(array: string[]): string[] {
    let tmp, current, top = array.length;
    if (top) while (--top) {
      current = Math.floor(Math.random() * (top + 1));
      tmp = array[current];
      array[current] = array[top];
      array[top] = tmp;
    }
    return array;
  }

  private PrintWordsAndShit(container: HTMLElement, words: any[]): void {
    console.log('', container);
    let Nodes = $(container).find(".character");
    Nodes.each((index: number, elem: any) => {
      $(elem).delay(5 * index).queue(() => {
        $(elem).replaceWith(words[index]);
        if (index === Nodes.length - 1) {
          this.SetupInteractions(container);
        }
      });
    });
  }

  private GetContinuousBlanks(Nodes: any): number[][] {
    let AllNodes = $(Nodes);
    let ContinuousBlanks: number[][] = [[]];
    let cur = 0;
    $.each(AllNodes, (index: number, elem: any) => {
      if (!$(elem).hasClass("word")) {
        ContinuousBlanks[cur].push(index);
        if (index + 1 != AllNodes.length) {
          if ($(AllNodes[index + 1]).hasClass("word")) {
            ContinuousBlanks.push([]);
            cur++;
          }
        }
      }
    });
    return ContinuousBlanks;
  }

  private AddDudBrackets(Nodes: any): any {
    const AllBlankIndices = this.GetContinuousBlanks(Nodes);
    let i = 1;
    while (i < AllBlankIndices.length) {
      if (Math.round(Math.random() + .25)) {
        const Brackets = this.BracketSets[Math.floor(Math.random() * this.BracketSets.length)];
        const ChunkCenter = Math.floor(AllBlankIndices[i].length / 2);
        let j = ChunkCenter - this.DudLength / 2;
        while (j < ChunkCenter + this.DudLength / 2) {
          if (j == ChunkCenter - this.DudLength / 2)
            $(Nodes[AllBlankIndices[i][j]]).text(Brackets[0]).addClass("dudcap");
          else if (j == ChunkCenter + this.DudLength / 2 - 1)
            $(Nodes[AllBlankIndices[i][j]]).text(Brackets[1]).addClass("dudcap");
          $(Nodes[AllBlankIndices[i][j]]).addClass("dud");
          j++;
        }
      }
      i++;
    }
    return Nodes;
  }

  private FillWordColumns(): void {
    const column2 = document.getElementById("column2")!;
    const column4 = document.getElementById("column4")!;
    const column2Content = $(this.GenerateGarbageCharacters());
    const column4Content = $(this.GenerateGarbageCharacters());

    // Fill the first column
    let AllChars = column2Content;
    let start = Math.floor(Math.random() * this.wordColumnWidth);
    let i = 0;

    while (i < this.Words.length / 2) {
      let pos = start + i * Math.floor(AllChars.length / (this.Words.length / 2));
      for (let s = 0; s < this.Difficulty; s++) {
        const word = this.Words[i].toUpperCase();
        $(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
      }
      i++;
    }

    AllChars = this.AddDudBrackets(AllChars);
    this.PrintWordsAndShit(column2, AllChars);

    AllChars = column4Content;
    start = Math.floor(Math.random() * this.wordColumnWidth);
    i = 0;
    while (i < this.Words.length / 2) {
      const pos = start + i * Math.floor(AllChars.length / (this.Words.length / 2));
      for (let s = 0; s < this.Difficulty; s++) {
        const word = this.Words[i + this.Words.length / 2].toUpperCase();
        $(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
      }
      i++;
    }
    AllChars = this.AddDudBrackets(AllChars);
    this.PrintWordsAndShit(column4, AllChars);
  }

  private FillPointerColumns(): void {
    const column1 = document.getElementById("column1")!;
    const column3 = document.getElementById("column3")!;
    let pointers = "";
    let i = 0;

    while (i < this.columnHeight) { pointers += this.RandomPointer() + "<br />"; i++; }
    column1.innerHTML = pointers;

    pointers = "";
    i = 0;

    while (i < this.columnHeight) { pointers += this.RandomPointer() + "<br />"; i++; }
    column3.innerHTML = pointers;
  }

  private SetupOutput(): void {
    let i = 0;
    while (i < this.columnHeight) { this.OutputLines.push(""); i++; }
  }

  private UpdateOutput(text: string): void {
    this.OutputLines.push(">" + text);

    let output = "";
    let i = this.columnHeight - 2;

    while (i > 0) {
      output += this.OutputLines[this.OutputLines.length - i] + "<br />";
      i--;
    }
    $("#output").html(output);
  }

  private CompareWords(first: string, second: string): number {
    if (first.length !== second.length) {
      return 0;
    }

    first = first.toLowerCase();
    second = second.toLowerCase();

    let correct = 0;
    let i = 0;

    while (i < first.length) {
      if (first[i] == second[i])
        correct++;
      i++;
    }
    return correct;
  }

  private UpdateConsole(word: string): void {
    const cont = $("#console");
    const TypeSpeed = 80;
    cont.html("").stop().css("fake-property", 0).animate(
      { "fake-property": word.length },
      {
        duration: TypeSpeed * word.length,
        step: (i: number) => {
          const insert = ">" + word.substr(0, i);
          if (cont.text().substr(0, cont.text().length - 1) !== insert) {
            this.soundSystem.playSoundByPath(`${this.soundPath}k${this.getSoundNumber()}.ogg`);
          }
          cont.html(insert + "&#9608;");
        }
      }
    );
  }

  private HandleBraces(DudCap: any): void {
    if (Math.round(Math.random() - 0.3)) {
      this.AttemptsRemaining = 6;
      this.UpdateOutput("");
      this.UpdateOutput("Allowance");
      this.UpdateOutput("replenished.");
      this.UpdateAttempts();
    } else {
      this.UpdateOutput("");
      this.UpdateOutput("Dud removed.");
      this.RemoveDud();
    }

    $(DudCap).text(".").unbind("click");
    let cur = $(DudCap).next();
    if (cur.is("br"))
      cur = cur.next();
    while (cur.hasClass("dud")) {
      if (cur.hasClass("dudcap")) {
        cur.text(".").removeClass("dudcap").unbind("click");
      } else {
        cur.text(".").unbind("click");
      }
      cur = cur.next();
      if (cur.is("br"))
        cur = cur.next();
    }

    cur = $(DudCap).prev();
    if (cur.is("br"))
      cur = cur.prev();
    while (cur.hasClass("dud")) {
      if (cur.hasClass("dudcap")) {
        cur.text(".").removeClass("dudcap").unbind("click");
      } else {
        cur.text(".").unbind("click");
      }
      cur = cur.prev();
      if (cur.is("br"))
        cur = cur.prev();
    }
  }

  private RemoveDud(): void {
    const LiveWords = $(".word").not("[data-word='" + this.Correct.toUpperCase() + "']");
    const WordToRemove = $(LiveWords[Math.floor(Math.random() * LiveWords.length)]).attr("data-word");
    $("[data-word='" + WordToRemove + "']").each(function (this: any) {
      $(this).text(".").removeClass("word").removeAttr("data-word");
    });
  }

  private SetupInteractions(column: HTMLElement): void {
    const _this = this;
    const $column = $(column);

    $column.find(".character").hover(function (this: any) {
      if (_this.AttemptsRemaining === 0)
        return false;

      $(this).addClass("character-hover");
      if (!$(this).hasClass("word") && !$(this).hasClass("dudcap")) {
        _this.UpdateConsole($(this).text());
        return true;
      }

      if ($(this).hasClass("word"))
        _this.UpdateConsole($(this).attr("data-word"));
      else if ($(this).hasClass("dudcap"))
        _this.UpdateConsole($(this).text());

      let cur = $(this).prev();
      if (cur.is("br"))
        cur = cur.prev();
      while (cur.hasClass("word") || cur.hasClass("dud")) {
        cur.addClass("character-hover");
        cur = cur.prev();
        if (cur.is("br"))
          cur = cur.prev();
      }

      cur = $(this).next();
      if (cur.is("br"))
        cur = cur.next();
      while (cur.hasClass("word") || cur.hasClass("dud")) {
        cur.addClass("character-hover");
        cur = cur.next();
        if (cur.is("br"))
          cur = cur.next();
      }
    },
      function (this: any) {
        $(this).removeClass("character-hover");
        if (!$(this).hasClass("word") && !$(this).hasClass("dudcap"))
          return true;

        let cur = $(this).prev();
        if (cur.is("br"))
          cur = cur.prev();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
          cur.removeClass("character-hover");
          cur = cur.prev();
          if (cur.is("br"))
            cur = cur.prev();
        }

        cur = $(this).next();
        if (cur.is("br"))
          cur = cur.next();
        while (cur.hasClass("word") || cur.hasClass("dud")) {
          cur.removeClass("character-hover");
          cur = cur.next();
          if (cur.is("br"))
            cur = cur.next();
        }
      });

    $column.find(".character").click(function (this: any) {
      if (_this.AttemptsRemaining == 0)
        return false;

      let word: string;
      if ($(this).hasClass("word")) {
        _this.soundSystem.playSoundByPath(`${_this.soundPath}kenter.ogg`);

        word = $(this).attr("data-word");
        _this.UpdateOutput(word);

        if (word.toLowerCase() === _this.Correct.toLowerCase()) {
          _this.soundSystem.playSoundByPath(`${_this.soundPath}passgood.ogg`);
          _this.AttemptsRemaining = 0;

          _this.UpdateOutput("");
          _this.UpdateOutput("Exact match!");
          _this.UpdateOutput("Please wait");
          _this.UpdateOutput("while system");
          _this.UpdateOutput("is accessed.");
          _this.Success();
        } else {
          _this.soundSystem.playSoundByPath(`${_this.soundPath}passbad.ogg`);
          _this.AttemptsRemaining--;

          _this.UpdateOutput("Access denied");
          _this.UpdateOutput(_this.CompareWords(word, _this.Correct) + "/" + _this.Correct.length + " correct.");
          _this.UpdateAttempts();

          if (_this.AttemptsRemaining === 0)
            _this.Failure();
        }
      } else if ($(this).hasClass("dudcap")) {
        _this.soundSystem.playSoundByPath(`${_this.soundPath}kenter.ogg`);
        _this.HandleBraces($(this));
      } else {
        return false;
      }
    });
  }

  private Success(): void {
    this.UpdateOutput("Access granted.");
    // Do success here
    this.gameStatus.minigameWin = true;
    this.gameVariables.currentMusic = this.currentMusic;
    this.soundSystem.playBackgroundMusic(this.currentMusic);
    this.gameCanvas.parentElement!.style.display = "block";
    this.destroyGame();
  }

  private Failure(): void {
    this.UpdateOutput("Access denied.");
    this.UpdateOutput("Lockout in");
    this.UpdateOutput("progress.");
    // Do failure here
    this.gameStatus.minigameWin = false;
    this.gameVariables.currentMusic = this.currentMusic;
    this.soundSystem.playBackgroundMusic(this.currentMusic);
    this.gameCanvas.parentElement!.style.display = "block";
    this.destroyGame();
  }

  private destroyGame(): void {
    $("#terminal").remove();
    $("#terminal-background").remove();
  }
}
