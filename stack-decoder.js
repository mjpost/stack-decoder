var CHART = new Object();

document.writeln("<p><table><tr>");

// write out the words
for (i = 0; i < words.length; i++) {
    var word = words[i][0];
    var label = word + i;
    document.write("<td class='source' id='" + label + "'>" + word + "</td>");
    // $("td#" + label).click(function() { translation_options(i); });
}
document.writeln("</tr><tr>");
// write out the translation options for each word
for (i = 0; i < words.length; i++) {
    document.write("<td class='target' id='target" + i + "'><ul>");
    for (j = 1; j < words[i].length; j++) {
        var word = words[i][j];
        var label = "target" + i + "-" + j;
        document.writeln("<li class='target' id='" + label + "'><span class='target' id='" + label + "'>" + word + "</span></li>");
        $("li#" + label).click(function() { obj = this; add_target_word(obj.id); });
    }
    document.write("</ul></td>");
}
document.writeln("</tr></table></p>");

$("div#course").after("<div id='stacks'></div>")

var stacks = Array();

function get_stack(which) {
    // make sure the stack exists
    for (i = stacks.length; i < which; i++) {
        $("div#stacks").append("<div id='stack" + i + "' class='stack-header'><h3>Stack [" + i + "]</h3><hr /><p></p></div>");
        stacks.push($("div#stack" + i + " > p"));
        $("#debug").append("<p>creating stack " + i + "</p>");
    }

    return stacks[which-1];
}


/* Here we add a target word based on the div element label, which has
 * the format "targetI-J", where I is the source language index and J
 * is the index into I's translations (and is ignored).
 */
function add_target_word(label) {
    var word = id2word(label);
    var pos  = id2index(label);
    
    var item;
    var selected = count_selected();
    switch(selected) {
    case 0:
        item = make_item(word, pos);
        break;
    case 1:
        var olditem = $(".selected").data('item');
        debug("olditem (selected) is " + olditem.$.html());
        if (olditem.pos[pos] != 1)
            item = extend_item(olditem, word, pos);
        else
            debug("word already covered");
        break;
    default:
        break;
    }

    if (item.displayed == 0) {
        item.displayed = 1;
        get_stack(item.stack).append(item.$.fadeIn());
    }
}

function make_item(word,pos) {
    var item = new Object();
    // the words
    item.words = "&lt;s&gt; " + word;
    // the source-language index
    item.pos = new Array();
    // coverage array
    item.pos[pos] = 1;          
    // which stack this item will be in
    item.stack = 1;

    // coverage display
    item.covered = create_coverage_display(item.pos);    

    // generate the DOM objects that display the item
    item.$ = create_item_dom(item);

    item.displayed = 0;

    var key = item.words + " ||| " + item.covered;
    if (! (key in CHART)) {
        CHART[key] = item;
    } else {
        $("#debug").append("<p>item already exists</p>");
    }

    return CHART[key];
}


function create_item_dom(item) {
    var obj = $("<div></div>").addClass("stack").append($("<p></p>").append(item.words)).append(item.covered).hide();
    obj.click(function () { var obj = this; toggle_selection(obj); });
    obj.hover(function () { $(this).removeClass("stack").addClass("highlight"); },
              function () { if (! ($(this).hasClass("selected")))
                  $(this).removeClass("highlight").addClass("stack"); }
             );
    obj.data('item', item);
    return obj;
}


/**
 * Takes an existing item and a new word and creates a new item that
 * also covers that word.
 */
function extend_item(olditem,word,pos) {
    var item = new Object();

    item.backpointer = [olditem, pos];

    // extend the hypothesis
    item.words = olditem.words + " " + word;

    // copy the coverage array and extend it
    item.pos = olditem.pos.slice(0);
    item.pos[pos] = 1;
    item.stack = olditem.stack + 1;

    item.covered = create_coverage_display(item.pos);

    // generate the DOM objects
    item.$ = create_item_dom(item);
    item.displayed = 0;

    var key = item.words + " ||| " + item.covered;
    if (! (key in CHART))
        CHART[key] = item;

    return CHART[key];
}


// This function takes an array with 1s denoting source-language words
// that have been consumed.  It returns a nice HTML display of it.  It
// assumes access to the global "words" array (to determine sentence
// length only).
function create_coverage_display(array) {
    var covered = "";
    for (i = 0; i < words.length; i++) {
        if (array[i] == 1) {
            covered += "◉";
        } else {
            covered += "◎";
        }
    }
    return covered;
}


function translation_options() {
    // for (i = 1; i < words[index].length; i++) {
    // $("div#debug").append("<p>" + i + "/" + j + "</p>");
    ensure_stack_exists(2);
    $("div#debug").append("<p>MATT</p>");
    // }
}

// Converts an ID to the word it represents.
function id2word(label) {
    var matches = label.match(/(\d+)-(\d+)/);
    var i = matches[1];
    var j = matches[2];
    return words[i][j];
}

function id2index(label) {
    var matches = label.match(/(\d+)-(\d+)/);
    var i = matches[1];
    return i;
}

function deselect_item(div) {
    $(div).removeClass("selected highlight").addClass("stack");
    // debug("DESELECT: num=" + count_selected());
}

function select_item(div) {
    $(div).removeClass("stack").addClass("highlight selected");
    // debug("SELECT: num=" + count_selected());
}

function toggle_selection(div) {
    if (! ($(div).hasClass("selected"))) 
        select_item(div);
    else 
        deselect_item(div);
}

function highlight(o) {
    $(o).addClass('highlight');
    debug("highlighting DIV:'" + $(o).id + "'");
}


// returns the number of current selected objects
function count_selected() {
    var num = $(".selected").size();
    return num;
}

function debug(message) {
    $("#debug > div").prepend("<p>" + message + "</p>");
}
