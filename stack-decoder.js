var CHART = new Object();
var STACKS = Array();

var table = $("<table></table>");
/*
 * SOURCE LANGUAGE WORDS
 */
var row = $("<tr></tr>");
for (i = 0; i < words.length; i++) {
    var word = words[i][0];
    var label = "source" + i;
    func = function(index) {
        return function() {
            var element = $("#targetlist" + index);
            if (element.is(":visible")) {
                $("#targetlist" + index).slideUp();
                $("#source" + index).parent().find("p").css({border: "none"});
            } else {
                $("#targetlist" + index).slideDown();
                $("#source" + index).parent().find("p").css({border: "1px solid black"});
            }
        }
    }
    var td = $("<td></td>")
        .addClass("source")
        .append($("<p></p>")
                .attr("id",label)
                .append(word)
                .click(func(i)));
    row.append(td);
    // document.write("<td><p class='source' id='" + label + "'>" + word + "</p></td>");
    // $("td#" + label).click(function() { translation_options(i); });
}
table.append(row);

/*
 * TARGET LANGUAGE TRANSLATIONS
 */
row = $("<tr></tr>").attr("id", "targetwords");
for (i = 0; i < words.length; i++) {
    // document.write("<td>");
    var list = $("<ul></ul>").attr("id", "targetlist" + i).addClass("translation").hide();
    for (j = 1; j < words[i].length; j++) {
        var word = words[i][j];
        var label = "target" + i + "-" + j;

        var item = $("<li></li>")
            .attr("id", label)
            .addClass("translation nohilite")
            .text(word)
            .data('pos', i)
            .click(function() { 
                /* If the user clicks on the word and no other
                 * hypotheses are selected, then we add the word to
                 * the chart.
                 */
                // var num_selected = count_selected();
                // if (num_selected == 0) {
                    var obj = this; 
                    add_target_word(obj.id); 
                // }
            })
            .hover(function(e) {
                /* On hovering, we highlight the word if (a) nothing
                 * else is selected and this item is a vlid candidate
                 * for adding to the chart or (b) one other item is
                 * selected and this is a valid extension of that
                 * item. */
                var num_selected = count_selected();
                switch(num_selected) {
                case 0:
                    // TODO: make sure it hasn't already been added
                    // (or if it has, highlight that item)
                    $(this).removeClass('nohilite').addClass('hilite');
                    break;
                case 1:
                    /* only highlight if this is a valid extension of the state
                     */
                    var selected = $(".selected");
                    if (selected.data('item').pos[$(this).data('pos')])
                        $(this).removeClass('nohilite').addClass('illegal');
                    else
                        $(this).removeClass('nohilite').addClass('hilite');

                    break;
                }
            },function(e) {
                $(this).removeClass("hilite illegal").addClass('nohilite');
            })
            .draggable({
                cancel: "a.ui-icon",
                revert: "invalid",
                cursor: "move",
            });
        list.append(item);
        // document.writeln("<p class='target' id='" + label + "'>" + word + "</p>");
        // document.write(p.html());
    }
    row.append($("<td></td>").append(list));
    // document.write("</td>");
}
table.append(row);
$("div.content").append($("<h1></h1>").val("Stack decoder"));
$("div.content").append(table);
$("div.content").append($("<div></div>").attr("id","stacks"));
// document.writeln("</tr></table></p>");

function get_stack(which) {
    // make sure the stack exists
    for (i = STACKS.length; i < which; i++) {
        var stackdiv = $("<div></div>")
            .attr("id", "stack" + i)
            .addClass('stack-header')
            .append($("<h3></h3>")
                    .text("Stack [" + (i+1) + "]"));
        $("div#stacks").append(stackdiv);
        STACKS.push(stackdiv);
        // $("div#stacks").append("<div id='stack" + i + "' class='stack-header'><h3>Stack [" + (i+1) + "]</h3><hr /><p></p></div>");
        // STACKS.push($("div#stack" + i + " > p"));
        // $("#debug").append("<p>creating stack " + i + "</p>");
        debug("creating stack " + i)
    }

    return STACKS[which-1];
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
        // debug("olditem (selected) is " + olditem.$.html());
        if (olditem.pos[pos] != 1)
            item = extend_item(olditem, word, pos);
        // else
        //     debug("word already covered");
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
    if (! (key in CHART))
        CHART[key] = item;

    return CHART[key];
}


function create_item_dom(item) {
    var obj = $("<div></div>")
        .addClass("stack")
        .append($("<p></p>")
                .append(item.words))
        .append(item.covered).hide();
    obj.click(function () { var obj = this; toggle_selection(obj); });

    obj.hover(function () { $(this).removeClass("stack").addClass("highlight"); },
              function () { if (! ($(this).hasClass("selected")))
                  $(this).removeClass("highlight").addClass("stack"); }
             );

    obj.droppable({
        accept: ".source",
        activeClass: "highlight",
        toleranace: 'pointer',
        drop: function(event, ui) {
            var item = ui.draggable.data('item');
            var word = item.words;
            var pos  = item.pos;
            extend_item($(this).data('item'), word, pos)
        },
        // over: function(event, ui) {
        //     var item = ui.draggable.data('item');
        //     var word = item.words;
        //     var pos  = item.pos;
        //     if (item.pos[pos] == 1)
        // }
    });

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
    $(".selected").removeClass("selected highlight").addClass("stack");
    $(div).addClass("highlight selected");
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
