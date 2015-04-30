/* Development Notes:

 jQuery.slideDown() works if the element is not initially displayed (css => display: none)
 Reference: http://stackoverflow.com/questions/11755841/jquery-slidedown-not-working

 For the Noty API, do NOT name your variable noty
 Reference: http://stackoverflow.com/questions/11916261/javascript-plug-in-noty-gives-error
*/

// JSHINT CONFIGURATION
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

var main = function (toDoObjects) {
	"use strict";
	console.log("SANITY CHECK");
	var socket = io();
	// Array of strings. Only contains the ToDo descriptions, not their tags.
	var toDos = toDoObjects.map(function (toDo) {
		  // we'll just return the description
		  // of this toDoObject
		  return toDo.description;
	});

	// For each tab on the webpage (newest, oldest, tags, add)
	$(".tabs a span").toArray().forEach(function (element) {
		// Get DOM of the tag
		var $element = $(element);

		// create a click handler for this element
		$element.on("click", function () {
			var $content,
				$input,
				$button,
				i;

			// Remove "active" from all tabs and then add it to THIS tab
			$(".tabs a span").removeClass("active");
			$element.addClass("active");
			// Clear out the body contents in preparation for new stuff
			$("main .content").empty();


			// If NEWEST tab
			if ($element.parent().is(":nth-child(1)")) {
				$content = $("<ul>");
				for (i = toDos.length-1; i >= 0; i--) {
					$content.append($("<li>").text(toDos[i]));
				}


			// If OLDEST tab
			} else if ($element.parent().is(":nth-child(2)")) {
				$content = $("<ul>");
				toDos.forEach(function (todo) {
					$content.append($("<li>").text(todo));
				});


			// If TAGS tab
			} else if ($element.parent().is(":nth-child(3)")) {
				var tags = [];
				// Check all ToDo objects and their respective tags
				toDoObjects.forEach(function (toDo) {
					toDo.tags.forEach(function (tag) {
						// If this tag does NOT exist in the list of ALL EXISTING tags, add it
						if (tags.indexOf(tag) === -1) {
							tags.push(tag);
						}
					});
				});

				// Evaluate ALL EXISTING tags and create a new array of JSONs as a result
				var tagObjects = tags.map(function (tag) {
					var toDosWithTag = [];
					// Check all ToDO objects and check if it contains the tag. Add to list if so.
					toDoObjects.forEach(function (toDo) {
						if (toDo.tags.indexOf(tag) !== -1) {
							toDosWithTag.push(toDo.description);
						}
					});
					// tagObjects will be an array of JSON objects
					return { "name": tag, "toDos": toDosWithTag };
				});

				// Having populated our array, draw them to the page
				tagObjects.forEach(function (tag) {
					var $tagName = $("<h3>").text(tag.name),
						$content = $("<ul>");
					// Draw all ToDo objects that contain this tag
					tag.toDos.forEach(function (description) {
						var $li = $("<li>").text(description);
						$content.append($li);
					});
					// Append DOM elements
					$("main .content").append($tagName);
					$("main .content").append($content);
				});


			// If ADD tab
			} else if ($element.parent().is(":nth-child(4)")) {
				// Draw the input form
				var $inputLabel = $("<p>").text("Description: "),
					$tagInput = $("<input>").addClass("tags"),
					$tagLabel = $("<p>").text("Tags: ");
				$input = $("<input>").addClass("description");
				$button = $("<span>").text("+");
				// Give the submit button a click action
				$button.on("click", function () {
					var description = $input.val(),
						tags = $tagInput.val().split(","),
						newToDo = {"description":description, "tags":tags};
					// Send JSON object to the server
					//$.post("todos", newToDo, function (result) {
					socket.emit("todo", newToDo);
					$input.val("");
					$tagInput.val("");
					//});
				});
				// Appends the DOM elements
				$content = $("<div>").append($inputLabel)
									 .append($input)
									 .append($tagLabel)
									 .append($tagInput)
									 .append($button);
			}
			// Regardless of tab, append the page's finalized contents
			$("main .content").append($content);

			return false;
		});
	});


	// Received from server when another user has added a new todo
	socket.on("todos", function (result){
		// Create a notification at top of the screen that a new todo was added
		var n = noty({
			text: "A new task has been added!",
			layout: "topCenter",
			type: "success",
			theme: "relax",
			animation: {
				open: {height: "toggle"}, // jQuery animate function property object
				close: {height: "toggle"}, // jQuery animate function property object
				easing: "swing", // easing
				speed: 500 // opening & closing animation speed
			},
			timeout: 5000,
			killer: true
		});
		// Receive all ToDo objects in database and save them in memory
		toDoObjects = result;
		// update toDos
		toDos = toDoObjects.map(function (toDo) {
			return toDo.description;
		});
		// If not currently viewing the ADD tab (4th span object)
		var $activeTab = $("span.active");
		if (!$activeTab.parent().is(":nth-child(4)")){
			var $content;
			var newestTodo = toDoObjects[toDoObjects.length - 1];

			// If NEWEST tab
			if ($activeTab.parent().is(":nth-child(1)")){
				// Adding item to the top
				$content = $("<li>").text(newestTodo.description);
				$("main .content").prepend($content);
				$content.hide().slideDown(1000);


			// If OLDEST tab
			} else if ($activeTab.parent().is(":nth-child(2)")) {
				// Adding item to the bottom
				$content = $("<li>").text(newestTodo.description);
				$("main .content").append($content);
				$content.hide().slideDown(1000);


			// If TAGS tab
			} else if ($activeTab.parent().is(":nth-child(3)")) {
				// Repeat the process much the same as rendering the page for the first time
				var tags = [];
				// Check all ToDo objects and their respective tags
				toDoObjects.forEach(function (toDo) {
					toDo.tags.forEach(function (tag) {
						// If this tag does NOT exist in the list of ALL EXISTING tags, add it
						if (tags.indexOf(tag) === -1) {
							tags.push(tag);
						}
					});
				});

				// Evaluate ALL EXISTING tags and create a new array of JSONs as a result
				var tagObjects = tags.map(function (tag) {
					// Check if new ToDo has this tag. If so, add it to list.
					if (newestTodo.tags.indexOf(tag) !== -1) {
						return { "name": tag, "toDo": newestTodo.description };
					}
				});
				tagObjects = tagObjects.filter(function(e){return e;});

				// Having populated our array, draw the new ToDo to the page
				tagObjects.forEach(function (tag) {
					// Get all existing tags by getting the text from the various <h3>'s
					var existingTags = $("h3").toArray().map(function (t){
						return $(t).text();
					});
					// Find the tag on the page
					var tagIndex = existingTags.indexOf(tag.name);

					// If this tag exists on the page
					if (tagIndex !== -1){
						// Calculation for finding the corresponding <ul> child of the tag
						tagIndex = (tagIndex + 1) * 2;
						// Append todo description to the list
						var $ul = $(".content ul:nth-child(" + tagIndex + ")");
						$content = $("<li>").text(tag.toDo);
						$ul.append($content);
						$content.hide().slideDown(1000);
					} else { // Tag is unique to this ToDo
						// Create a new tag header and unordered list and append to 'main'
						var $tagName = $("<h3>").text(tag.name),
							$li = $("<li>").text(tag.toDo);
						$content = $("<ul>");
						$content.append($li);
						// Append DOM elements
						$("main .content").append($tagName);
						$("main .content").append($content);
						$content.hide().slideDown(1000);
						$tagName.hide().slideDown(1000);
					}
				});
			}
		}
	});


	// Response from server that only the sender will receive
	socket.on("success", function(result){
		// Creates a notification that the new Todo was successfully added
		var n = noty({
			text: "You added a new task!",
			layout: "topCenter",
			type: "success",
			theme: "relax",
			animation: {
				open: {height: "toggle"}, // jQuery animate function property object
				close: {height: "toggle"}, // jQuery animate function property object
				easing: "swing", // easing
				speed: 500 // opening & closing animation speed
			},
			timeout: 5000,
			killer: true
		});
		// Receive all ToDo objects in database and save them in memory
		toDoObjects = result;
		// update toDos
		toDos = toDoObjects.map(function (toDo) {
			return toDo.description;
		});
	});


	// Basic error reporting received only by the sender
	socket.on("error", function (err){
		console.log(err);
	});


	// When page is completely loaded, display NEWEST tab as if it has been clicked
	$(".tabs a:first-child span").trigger("click");
};

// Primes the webpage with a todos JSON (received from server -- see app.get("/todos.json") )
$(document).ready(function () {
	"use strict";
	$.getJSON("todos.json", function (toDoObjects) {
		main(toDoObjects);
	});
});
