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
        $("div#stacks").append("<div id='stack" + i + "'><h3>Stack [" + i + "]</h3><hr /></div>");
        stacks.push($("div#stack" + i));
        $("#debug").append("<p>creating stack " + i + "</p>");
    }

    return stacks[which-1];
}


function add_target_word(label) {
    var values = id2word(label);
    word = values[0];
    i = values[1];
    j = values[2];
                              
    get_stack(1).append("<span>" + word + "</span><br/>");
}

function translation_options() {
    // for (i = 1; i < words[index].length; i++) {
    // $("div#debug").append("<p>" + i + "/" + j + "</p>");
    ensure_stack_exists(2);
    $("div#debug").append("<p>MATT</p>");
    // }
}

// Converts an ID to the word it represents.
function id2word(id) {
    var matches = id.match(/(\d+)-(\d+)/);
    var i = matches[1];
    var j = matches[2];
    return [words[i][j],i,j];
}

// function initialize_chart(i) {

// }

