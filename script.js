var indent = "\t"; 
var carriageReturn = "\r\n";
    
$(document).ready(function() {
	$('button#builderize').click(function() {
		builderize();
	});
});

function builderize() {
	var match;
	var input = $('textarea#input').val();
	var pattern =/^((?:public|private|protected)? class (\w+)(?: extends \w+)?(?: implements \w+)? ?{)([\w\s;]+)(})$/;
	var output = [];
	if (match = input.match(pattern)) {
		output.push(match[1], match[3]);
		fields = parseFieldsFromClassBody(match[3]);
		constructor = createConstructor(match[2], fields);
		builderClass = createBuilderClass(match[2], fields);
		output.push(carriageReturn, constructor, carriageReturn, builderClass, match[4]);
		$('textarea#output').val(output.join(""));
	} else {
		alert('Invalid class.');
		$('textarea#output').val("Failed to parse class.");
	}
}

function parseFieldsFromClassBody(string) {
	var fields = [];
	string.split(/\r?\n/).forEach(function(line) {
		var match;
		if (match = line.match(/^\s*(\w+) (\w+);\s*$/)) {		
			field = {type: match[1], name: match[2]};
			fields.push(field);
		} 
	});
	return fields;
}

function createConstructor(className, fields) {
	var constructor = [];
	constructor.push(
		indent, "public ", className, "( ", className, "Builder builder", ")", "{\r\n");
	for (var i = 0; i < fields.length; i++) {
		var fieldName = fields[i].name;
		constructor.push(indent, indent, "this.", fieldName, " = builder.", fieldName, ";\r\n");
	}
	constructor.push(indent, "}\r\n");
	return constructor.join("");
}

function createBuilderClass(className, fields) {
	var builder = [];
	var builderName = className + "Builder";
	builder.push(indent, "public class ", builderName, "{\r\n");
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(indent, indent, "private ", field.type, " ", field.name, ";\r\n");
	}
	builder.push(indent, indent, "public ", builderName, "() {}\r\n");
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(indent, indent, 
			"public ", builderName, " set", field.name, "(", field.type, " ", field.name, ") { this.", field.name, " = ", field.name, "; return this; }\r\n")
	}
	builder.push(indent, indent, "public ", className, " build() { return new ", className, "(this); }\r\n");
	builder.push(indent, "}\r\n");
	return builder.join("");
}