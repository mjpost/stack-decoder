/****************************************************************
 * VARIABLES
 ****************************************************************/

// the chart containing hypotheses
var CHART = new Object();
CHART.size = function() {
    var size = -1;
    for (var key in this)
        size++;
    return size;
};

// start- and end-of-sentence
var SOS = "&lt;s&gt";
var EOS = "&lt;/s&gt";

// the stacks that hypotheses are placed in
var STACKS = Array();


/****************************************************************
 * INITIALIZATION CODE
 ****************************************************************/

/*
 * Build lists of source- and target-language words.
 */
var row = $("<div></div>").css({"height": "200px"});
for (i = 0; i < words.length; i++) {
    
    var word = words[i][0];

    // This function creates the list of translations when a source
    // word is clicked.  It has to be a separate function like this
    // due to Javascripts lexical binding.
    var clickfunc = function(index) {
        return function() {
            // make sure the list is created
            var list = create_translations_list(index);

            // animate it
            if (list.is(":visible")) {
                list.slideUp();
                $("#source" + index).find('p').css({border: "1px solid white"});
            } else {
                list.slideDown();
                $("#source" + index).find('p').css({border: "1px solid black"});
            }
        }
    };

    var label = "source" + i;
    var td = $("<div></div>")
        .addClass("source")
        .attr("id",label)
        .append($("<p></p>")
                .append(word)
                .click(clickfunc(i)));
    row.append(td);
    // document.write("<td><p class='source' id='" + label + "'>" + word + "</p></td>");
    // $("td#" + label).click(function() { translation_options(i); });
}

$("div#content")
    .append(row)
    .append($("<div></div>").css({"clear":"both"}))
    .append($("<div></div>").
            attr("id","stacks"));
// document.writeln("</tr></table></p>");

/*
 * Builds the list of target-language translations of a given source
 * word, creating it if necessary, and inserts it into the source word div.
 */
function create_translations_list(i) {
    var id = "targetlist" + i;

    var list = $("#" + id);
    if (list.size() == 0) {
        list = $("<ul></ul>")
            .attr("id", "targetlist" + i)
            .addClass("translation")
            .hide();

        var num_candidates = min($("#numcandidates").val(), words[i].length - 1);
        for (j = 1; j <= num_candidates; j++) {
            var word = words[i][j];
            var label = "target" + i + "-" + j;

            var item = $("<li></li>")
                .attr("id", label)
                .addClass("translation nohilite")
                .text(word)
                .data('word', word)
                .data('pos', i)
                .click(function() { 
                    /* Use the word to extend a hypothesis if one is
                     * selected.
                     */
                    if (count_selected() == 1) {
                        var hypothesis = $(".selected").data('item');
                        if (is_legal($(".selected"), $(this))) {
                            var word = $(this).data('word');
                            var pos = $(this).data('pos');
                            if (hypothesis.pos[pos] != 1) {
                                var item = extend_item(hypothesis, word, pos);
                                get_stack(item.stack).append(item.$.fadeIn());
                            }
                        }
                    }
                })
                .hover(function(e) {
                    /* On hovering, we highlight the word if one other
                     * item is selected and this word is a valid
                     * extension of that hypothesis (according to
                     * various constraints). 
                     */
                    var num_selected = count_selected();
                    switch(num_selected) {
                    case 0:
                        // nothing can be done if nothing is selected
                        $(this).removeClass('nohilite').addClass('illegal');
                        debug("Select a hypothesis to extend.");
                        break;
                    case 1:
                        if (is_legal($(".selected"),$(this))) {
                            $(this).removeClass('nohilite').addClass('hilite');
                        } else {
                            $(this).removeClass('nohilite').addClass('illegal');
                        }

                    }
                },function(e) {
                    $(this).removeClass("hilite illegal").addClass('nohilite');
                });
            // .draggable({
            //     cancel: "a.ui-icon",
            //     revert: function(dropped) {
            //         return true;
            //     },
            //     cursor: "move",
            // });
            list.append(item);
            // document.writeln("<p class='target' id='" + label + "'>" + word + "</p>");
            // document.write(p.html());
        }
        list.append($("<br></br>").css({"clear":"both"}));

        $("#source" + i).append(list);
    }

    return list;
}

/*
 * Takes two JQuery objects representing a hypothesis and a word, and
 * return true if the extension is legal under the current set of
 * constraints.
 */

function is_legal(hypothesis, word) {
    // only highlight if this is a valid extension of that hyp.
    // a word is illegal if it is already covered
    if (hypothesis.data('item').pos[word.data('pos')])
        return false;
    else {
        var permitted_distance = $("#constraints").val();
        var lastpos = hypothesis.data('item').lastpos;
        var curpos = word.data('pos');
        // permitted
        if (permitted_distance == "0")
            return true;
        else if (permitted_distance == "+1") {
            if (curpos == lastpos + 1)
                return true;
            else 
                return false;
        } else {
            // if we're extending the empty hypothesis, or the
            // distance is within the permitted distance, we can
            // extend
            if (lastpos == -1 || (abs(curpos - lastpos) <= permitted_distance) ){
                return true;
            } else {
                return false;
            }
        }
    }
}


/*
 * Returns the requested stack, adding it if it doesn't already exist.
 * Handles different stack scenarios (single, word-based,
 * coverage-based).
 */
function get_stack(which) {
    // If we're doing just one stack, make sure it exists and return it
    if ($("#numstacks").val() == "one") {
        // create the stack if it doesn't exist
        if (STACKS.length == 0) {
            var stackdiv = $("<div></div>")
                .attr("id", "stack" + i)
                .addClass('stack-header')
                .append($("<h3></h3>")
                        .text("Stack"))
            $("div#stacks").append(stackdiv);
            STACKS.push(stackdiv);
        }

        return STACKS[0];
    } else {
        for (i = STACKS.length; i <= which; i++) {
            var stackdiv = $("<div></div>")
                .attr("id", "stack" + i)
                .addClass('stack-header')
                .append($("<h3></h3>")
                        .text("Stack (" + i + " word" + ((i >= 1 || i == 0) ? "s" : "") + " translated)"));
            $("div#stacks").append(stackdiv);
            STACKS.push(stackdiv);
            // $("#debug").append("<p>creating stack " + i + "</p>");
            debug("creating stack " + i)
        }
        return STACKS[which];
    }
}

var dpmap = {
    'off':    0,
    'none':    0,
    'bigram':  1,
    'trigram': 2,
};

$(".source")
    .click(function() {
        var item = make_start_item();
        if (item.displayed == 0) {
            item.displayed = 1;
            get_stack(item.stack).append(item.$.fadeIn());
        }
    });

function compute_dpstate(phrase) {
    var histsize = dpmap[$("#dp").val()];

    // debug("shortening " + phrase);

    if (histsize) {
        var words = phrase.split(' ');
        if (words.length > histsize) {
            phrase = "...";
            for (i = words.length - histsize; i < words.length; i++)
                phrase += " " + words[i];
        }
    }
    
    // debug("returning " + phrase);

    return phrase;
}

function make_item(word,pos) {
    var item = new Object();
    // the words
    item.words = compute_dpstate(SOS + " " + word);
    // the source-language index
    item.pos = new Array();
    // coverage array
    item.pos[pos] = 1;          
    // which stack this item will be in
    item.stack = 1;

    item.backpointer = null;

    // coverage display
    item.covered = create_coverage_display(item.pos);    

    item.signature = item.words + "-" + item.covered;

    // generate the DOM objects that display the item
    item.$ = create_item_dom(item);
    item.displayed = 0;

    var key = item.words + " ||| " + item.covered;
    if (! (key in CHART)) {
        CHART[key] = item;
        $("#chartsize").text(CHART.size());
    }

    return CHART[key];
}

function make_start_item() {
    var item = new Object();
    // the words
    item.words = compute_dpstate("&lt;s&gt;");
    // the source-language index
    item.pos = new Array();

    item.lastpos = -1;

    // which stack this item will be in
    item.stack = 0;

    item.backpointer = null;

    // coverage display
    item.covered = create_coverage_display(item.pos);    

    item.signature = item.words + "-" + item.covered;

    // generate the DOM objects that display the item
    item.$ = create_item_dom(item);
    item.displayed = 0;

    var key = item.words + " ||| " + item.covered;
    if (! (key in CHART)) {
        CHART[key] = item;
        $("#chartsize").text(CHART.size());
    }

    return CHART[key];
}


function create_item_dom(item) {
    var obj = $("<div></div>")
        .addClass("stack")
        .append($("<p></p>")
                .append(item.words))
        .append(item.covered)
        .hide()
        .click(function () { 
            var obj = this; toggle_selection(obj); 
        })
        .droppable({
            accept: ".translation",
            hoverClass: "highlight",
            tolerance: 'intersect',
            drop: function(event, ui) {
                var word = ui.draggable.data('word');
                var pos  = ui.draggable.data('pos');
                var item = extend_item($(this).data('item'), word, pos)
                get_stack(item.stack).append(item.$.fadeIn());
            },
        })
        .data('item', item)
        .hover(function () { 
            $(this).removeClass("stacknohilite").addClass("stackhilite");
            // $('["' + item.signature + '"]').addClass("stackdphilite");
            // debug(item.signature + " on: " + $('[signature="' + item.signature + '"]').size());
        }, function () { 
            if (! ($(this).hasClass("selected")))
                $(this).removeClass("stackhilite").addClass("stacknohilite");
            // $('["' + item.signature + '"]').removeClass("stacknohilite");
            // debug(item.signature + " off: " + $('[signature="' + item.signature + '"]').size());
        });

    if (item.complete) {
        obj.addClass("stackcomplete");
    } else {
        obj.addClass("stacknohilite")
    }

    // if (item.backpointer) {
    //     item.backpointer.$.attr(item.signature, 1);
    // }

    return obj;

        // over: function(event, ui) {
        //     var item = ui.draggable.data('item');
        //     var word = item.words;
        //     var pos  = item.pos;
        //     if (item.pos[pos] == 1)
        // }
}


/**
 * Takes an existing item and a new word and creates a new item that
 * also covers that word.
 */
function extend_item(olditem,word,pos) {
    var item = new Object();

    item.backpointer = olditem;

    // extend the hypothesis
    item.words = compute_dpstate(olditem.words + " " + word);


    // is it complete?
    if (olditem.stack + 1 == words.length) {
        item.words += compute_dpstate(" " + EOS);
        item.complete = true;
    } else {
        item.complete = false;
    }

    // copy the coverage array and extend it
    item.pos = olditem.pos.slice(0);
    item.pos[pos] = 1;
    item.stack = olditem.stack + 1;
    item.lastpos = pos;

    item.covered = create_coverage_display(item.pos);

    item.signature = item.words + "-" + item.covered;

    // generate the DOM objects
    item.$ = create_item_dom(item);
    item.displayed = 0;

    var key = item.words + " ||| " + item.covered;
    if (! (key in CHART)) {
        CHART[key] = item;
        $("#chartsize").text(CHART.size());
    }

    olditem.$.addClass(item.words + "-" + item.covered);

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
    // deselect this item
    $(div).removeClass("selected stackhilite").addClass("stacknohilite");
    // debug("DESELECT: num=" + count_selected());
}

function select_item(div) {
    // deselect all other items
    $(".selected").removeClass("selected stackhilite").addClass("stacknohilite");

    // select this item
    $(div).addClass("stackhilite selected");
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

function min(a,b) {
    if (a < b)
        return a;
    else
        return b;
}

function abs(a) {
    if (a < 0)
        return -a;
    return a;
}
