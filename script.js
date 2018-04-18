var indent = "    "; //4 spaces
var carriageReturn = "\n";
    
jQuery(document).ready(function() {
	jQuery('button#builderize').click(function() {
		builderize();
	});
	jQuery('button#copy').click(function() {
		copyToClipboard(jQuery('textarea#output').val());
	});
});

//attempt to copy to clipboard.  not universally supported.
function copyToClipboard(text) {
	jQuery('textarea#output').select();
	if (document.execCommand('copy')) {
		displayToast("Copied to clipboard.");
	} else {
		displayToast("Unable to copy.");
	}
}

function displayToast(message) {
	var toast = jQuery('#toast');
	toast.text(message);
	toast.fadeIn();
	setTimeout(function() {
		toast.fadeOut();
	}, 1500);
}

function builderize() {
	var match;
	var input = jQuery('textarea#input').val();
	var pattern =/^([\S\s]*)((?:public |private |protected )?class\s*(\w+)(?: extends [a-zA-Z0-9<>]+)?(?: implements [a-zA-Z0-9<>]+)?\s*{)([\S\s]+)(})\s*$/;
	var output = [];
	if (match = input.match(pattern)) {
		output.push(match[1], match[2], match[4]);
		fields = parseFieldsFromClassBody(match[4]);
		if (fields.length == 0) {
			jQuery('textarea#output').val("No fields to builderize found.  :(")
			return;
		}
		constructor = createConstructor(match[3], fields);
		builderClass = createBuilderClass(match[3], fields);
		output.push(carriageReturn, constructor, carriageReturn, builderClass, match[5]);
		jQuery('textarea#output').val(output.join(""));
	} else {
		jQuery('textarea#output').val("Failed to parse class.");
	}
}

function parseFieldsFromClassBody(string) {
	var fields = [];
	string.split(/\r?\n/).forEach(function(line) {
		var match;
		if (match = line.match(/^(\s*)(?:\w+\s)*([A-Z]\w+|int|long|char|boolean|float|byte|short|double)\s(\w+);\s*$/)) {
			indent = match[1];
			field = {type: match[2], name: match[3]};
			fields.push(field);
		} 
	});
	return fields;
}

function createConstructor(className, fields) {
	var constructor = [];
	constructor.push(
		indent, "private ", className, "(", className, "Builder builder", ") ", "{", carriageReturn);
	for (var i = 0; i < fields.length; i++) {
		var fieldName = fields[i].name;
		constructor.push(indent, indent, "this.", fieldName, " = builder.", fieldName, ";", carriageReturn);
	}
	constructor.push(indent, "}", carriageReturn);
	return constructor.join("");
}

function createBuilderClass(className, fields) {
	var builder = [];
	var builderName = className + "Builder";
	builder.push(indent, "public static final class ", builderName, "{", carriageReturn);
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(indent, indent, "private ", field.type, " ", field.name, ";", carriageReturn);
	}
	builder.push(carriageReturn);
	builder.push(indent, indent, "public ", builderName, "() {}", carriageReturn, carriageReturn);
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(
			indent, indent, "public ", builderName, " ", field.name, "(", field.type, " ", field.name, ") {", carriageReturn, 
			indent, indent, indent, "this.", field.name, " = ", field.name, ";", carriageReturn, 
			indent, indent, indent, "return this;", carriageReturn,  
			indent, indent, "}", carriageReturn, carriageReturn);
	}
	builder.push(indent, indent, "public ", className, " build() {", carriageReturn,
		indent, indent, indent, "return new ", className, "(this);", carriageReturn,
		indent, indent, "}", carriageReturn);
	builder.push(indent, "}", carriageReturn);
	return builder.join("");
}
