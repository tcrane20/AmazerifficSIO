// JSHINT CONFIGURATION
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
var express = require("express"),
	app = express(),
	http = require("http").Server(app),
	sio = require("socket.io")(http),
	// import the mongoose library
	mongoose = require("mongoose");

app.use(express.static(__dirname + "/client"));
app.use(express.bodyParser());

// connect to the amazeriffic data store in mongo
mongoose.connect("mongodb://localhost/amazeriffic");

// This is our mongoose model for todos
var ToDoSchema = mongoose.Schema({
	description: String,
	tags: [ String ]
});
var ToDo = mongoose.model("ToDo", ToDoSchema);

// Socket.IO things============================================================
sio.on("connection", function (socket){
	"use strict";
	console.log("user connected");

	socket.on("disconnect", function(){
		console.log("user disconnected");
	});

	socket.on("todo", function (addtodo){
		// Read the client's new ToDo being added
		//console.log(addtodo);
		// Create new ToDo based on description and tags, and save to database
		var newToDo = new ToDo({"description":addtodo.description, "tags":addtodo.tags});
		newToDo.save(function (err) {
			// Problem saving the item
			if (err !== null) {
				// the element did not get saved!
				console.log(err);
				// send error only to the sending client
				socket.emit("error", err);
			} else {
				// our client expects *all* of the todo items to be returned, so we'll do
				// an additional request to maintain compatibility
				ToDo.find({}, function (err, result) {
					if (err !== null) {
						socket.emit("error", err);
						return;
					}
					// Send message back to sender that the todo was added
					socket.emit("success", result);
					// Send message to other clients that a new todo was added
					socket.broadcast.emit("todos", result);
				});
			}
		});
	});

});
//=============================================================================


// Start the server
//http.createServer(app).listen(3000);
http.listen(3000);

// Gets all ToDos loaded in the database and send all to client as JSON
app.get("/todos.json", function (req, res) {
	"use strict";
	ToDo.find({}, function (err, toDos) {
		res.json(toDos);
	});
});

// Client is adding a ToDo. Server saves it and responds back with all ToDos as JSON
app.post("/todos", function (req, res) {
	"use strict";
	// Read the client's new ToDo being added
	//console.log(req.body);
	// Create new ToDo based on description and tags, and save to database
	var newToDo = new ToDo({"description":req.body.description, "tags":req.body.tags});
	newToDo.save(function (err) {
		// Problem saving the item
		if (err !== null) {
			// the element did not get saved!
			console.log(err);
			res.send("ERROR");
		} else {
			// our client expects *all* of the todo items to be returned, so we'll do
			// an additional request to maintain compatibility
			ToDo.find({}, function (err, result) {
				if (err !== null) {
					res.send("ERROR");
				}
				res.json(result);
			});
		}
	});
});

