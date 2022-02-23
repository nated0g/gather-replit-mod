import { Game, MoveDirection } from "@gathertown/gather-game-client";
import { Image } from "./images";

require('dotenv').config();
const API_KEY = process.env.GATHER_API_KEY || "";
const MAP_ID = process.env.GATHER_MAP_ID || "";
const SPACE_ID = process.env.GATHER_SPACE_ID || "";

let AVAILABLE_POSITIONS = [
	[11, 12],
	[14, 12],
	[17, 12],
	[11, 17],
	[14, 17],
	[17, 17],
	[26, 14],
	[29, 14],
	[32, 14]
];

global.WebSocket = require("isomorphic-ws");

function setUpGame(): Game {
	let game = new Game(() => Promise.resolve({ apiKey: API_KEY }));
	game.connect(SPACE_ID);
	game.subscribeToConnection((connected) => {
		console.log(connected ? "connected to Gather" : "disconnected from Gather");
	});
	return game;
};

let SignInBulletin = {
	id: "signInBulletin",
	normal: Image.Bulletin,
	x: 14, // use mapmaker to find the location you want
	y: 2,
	type: 7, // type 5s are the ones for extensions. emit an event we'll listen for below
	width: 1, // you're supposed to specify this even though it's something we could figure out from the image, sorry
	height: 2, // 1 tile is 32px
	// new variables
	previewMessage: "press x to sign in", // this is what shows up in the press x bubble
	properties: {
		extensionData: {
			entries: [
				{
					type: "header",
					value: "enter your repl.it username here",
					key: "bulletinHeader"
				},
				{
					type: "text",
					value: "username",
					key: "submitUsername"
				},
			]
		}
	}
};

let ModTerminal = {
	id: "modTerminal",
	normal: Image.ModTerminal,
	x: 22, // use mapmaker to find the location you want
	y: 25,
	type: 7, // type 5s are the ones for extensions. emit an event we'll listen for below
	width: 1, // you're supposed to specify this even though it's something we could figure out from the image, sorry
	height: 2, // 1 tile is 32px
	// new variables
	previewMessage: "Press x to boot admin terminal", // this is what shows up in the press x bubble
	properties: {
		extensionData: {
			entries: [
				{
					type: "header",
					value: "MOD TERMINAL v0.1",
					key: "terminalHeader",
					requiredLevel: "moderator"
				},
				{
					type: "paragraph",
					value: "Commands:",
					key: "helpList1",
					requiredLevel: "moderator"
				},
				{
					type: "paragraph",
					value: "reset - deletes all REPLs",
					key: "helpList2",
					requiredLevel: "moderator"
				},
				{
					type: "paragraph",
					value: "remove <username> - remove single REPL",
					key: "helpList3",
					requiredLevel: "moderator"
				},
				{
					type: "text",
					value: "$> enter command",
					key: "command",
					requiredLevel: "moderator"
				},

			]
		}
	}
};


let game = setUpGame();

setTimeout(() => {
	game.setObject(MAP_ID, SignInBulletin.id, SignInBulletin);
}, 5000);

setTimeout(() => {
	game.setObject(MAP_ID, ModTerminal.id, ModTerminal);
}, 3000);

let Repls = populateRepls(AVAILABLE_POSITIONS);

game.subscribeToEvent("playerInteracts", (data, context) => {
	console.log(data);
	if (data?.playerInteracts?.hasOwnProperty("dataJson")) {
		let objId = data.playerInteracts.objId;
		let dataJson = JSON.parse(data?.playerInteracts?.dataJson || "");
		switch (objId) {
			case "modTerminal":
				let command = dataJson.command;
				evalCommand(command);
				break;
			case "signInBulletin":
				let replUsername = dataJson.submitUsername;
				insertRepl(assignRepl(Repls, replUsername));
				break;
		}
	}
});

function evalCommand(command: string) {
	let args = command.split(" ");
	switch (args[0]) {
		case "reset":
			removeRepls(Repls);
			break;
		case "remove":
			removeRepl(args[1]);
			break;
	}
}

class Repl {
	constructor() {
		this.x = 0;
		this.y = 0;
		this.username = "";
		this.inUse = false;
	}
	x: number;
	y: number;
	username: string;
	inUse: boolean;
}

/**
 * Creates a array of Repls from array of available positions
 * @param positions array of co-ordinate pairs of available positions 
 * @returns Repl array 
 */
function populateRepls(positions: number[][]): Repl[] {
	let repls: Repl[] = [];
	positions.forEach((pos) => {
		repls.push({
			x: pos[0],
			y: pos[1],
			username: "",
			inUse: false
		})
	})
	return repls;
}

/**
 * Assigns a user to a repl, if one is available. 
 * @param repls Array of repls to assign from
 * @param username username to assign 
 * @returns 
 */
function assignRepl(repls: Repl[], username: string): Repl {
	let _repl = new Repl();
	try {
		let couldAssign = repls.some(repl => {
			if (!repl.inUse) {
				repl.username = username;
				repl.inUse = true;
				_repl = repl;
				return true;
			}
		})
		if (!couldAssign) {
			throw 'No repls left!';
		}
	}
	catch (e) {
		console.error(e);
	}
	return _repl;
}

function removeRepls(repls: Repl[]) {
	repls.forEach(repl => {
		if (repl.username != "") {
			game.deleteObject(MAP_ID, repl.username + "_repl");
			repl.inUse = false;
		}
	})
}

function removeRepl(username: string) {
	game.deleteObject(MAP_ID, username + "_repl");
}


function insertRepl(repl: Repl) {
	if (repl.username == "") {
		return
	}
	let objectId = repl.username + "_repl"
	let obj = {
		id: objectId,
		normal: Image.Terminal,
		x: repl.x, // use mapmaker to faaaaaaaaind the location you want
		y: repl.y,
		type: 1, // type 5s are the ones for extensions. emit an event we'll listen for below
		width: 1, // you're supposed to specify this even though it's something we could figure out from the image, sorry
		height: 1, // 1 tile is 32px
		distThreshold: 1,
		// new variables
		previewMessage: `Press x to open ${repl.username}'s repl.it`, // this is what shows up in the press x bubble
		properties: {
			url: `https://replit.com/@${repl.username}/nodeschool-test-1?lite=true`
		}
	};
	console.log(`Creating a repl for ${repl.username} at ${repl.x},${repl.y}.`);
	game.setObject(MAP_ID, objectId, obj);
}
