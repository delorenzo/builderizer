var indent = "\t"; 
var carriageReturn = "\r\n";
    
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
	var pattern =/^([\S\s]*)((?:public |private |protected )?class\s*(\w+)(?: extends \w+)?(?: implements \w+)?\s*{)([\S\s]+)(})$/;
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
		if (match = line.match(/^\s*(\w+) (\w+)\s?(\w+)?\s?(\w+)?;\s*$/)) {
			if (match.length == 3) {		
				field = {type: match[1], name: match[2]};
			} else if (match.length == 4) {
				field = {type: match[2], name: match[3]};
			} else if (match.length == 5) {
				field = {type: match[3], name: match[4]};
			}
			fields.push(field);
		} 
	});
	return fields;
}

function createConstructor(className, fields) {
	var constructor = [];
	constructor.push(
		indent, "public ", className, "(", className, "Builder builder", ") ", "{", carriageReturn);
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
	builder.push(indent, "public class ", builderName, "{", carriageReturn);
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(indent, indent, "private ", field.type, " ", field.name, ";", carriageReturn);
	}
	builder.push(indent, indent, "public ", builderName, "() {}", carriageReturn);
	for (var i = 0; i < fields.length; i++) {
		var field = fields[i];
		builder.push(indent, indent, 
			"public ", builderName, " ", field.name, "(", field.type, " ", field.name, ") { this.", field.name, " = ", field.name, "; return this; }", carriageReturn)
	}
	builder.push(indent, indent, "public ", className, " build() { return new ", className, "(this); }", carriageReturn);
	builder.push(indent, "}", carriageReturn);
	return builder.join("");
}