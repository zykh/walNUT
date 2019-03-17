/*
 * walNUT: A Gnome Shell Extension for NUT (Network UPS Tools)
 *
 * Copyright (C)
 *   2013 Daniele Pezzini <hyouko@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */

const	Gio = imports.gi.Gio,
	GLib = imports.gi.GLib,
	Lang = imports.lang;

// TCPClient: simple TCP client
// NOTE:
// - the connection is created when *connect()* method is called
// - the connection gets closed when *destroy()* method is called
const	TCPClient = class {
	// args = {
	//	host: hostname to connect to,
	//	port: port to use for connection,
	// }
	constructor(args) {

		this._host = args.host;

		this._port = args.port;

		this._isConnected = false;

	}

	// Start connection
	// args = {
	//	callback: optional, function to call when the connection is ready or in case of errors,
	// }
	connect(args) {

		if (args && args.callback)
			this._callback = args.callback;

		this._connection = null;

		this._isConnected = false;

		let client = new Gio.SocketClient({
			protocol: Gio.SocketProtocol.TCP,
			tls: false
		});

		this._cancellable = new Gio.Cancellable();

		client.connect_to_host_async(
			this._port ? this._host + ':' + this._port : this._host,
			3143,
			this._cancellable,
			Lang.bind(this, this._connectCallback)
		);

	}

	// Get connection & input/output streams
	_connectCallback(client, result) {

		// Connection cancelled
		if (this._cancellable.is_cancelled()) {
			this._raiseError('CONNECTION-CANCELLED');
			return;
		}

		this._cancellable = null;

		try {
			this._connection = client.connect_to_host_finish(result);
		} catch (error) {
			this._raiseError('CONNECTION-ERROR (%s)'.format(error));
			return;
		}

		// Connection errors
		if (!this._connection) {
			this._raiseError('CONNECTION-ERROR');
			return;
		}

		this._isConnected = true;

		// When disconnecting, do it gracefully
		this._connection.set_graceful_disconnect(true);

		let inputStream = this._connection.get_input_stream();

		this.input = new Gio.DataInputStream({ base_stream: inputStream });

		this.output = this._connection.get_output_stream();

		if (this._callback)
			this._callback();

	}

	// Start disconnection
	_disconnect() {

		if (this._isConnected) {
			this._connection.close_async(
				GLib.PRIORITY_DEFAULT,
				null,
				Lang.bind(this, this._disconnectCallback)
			);
			return;
		}

		// Connection still pending
		if (this._cancellable)
			this._cancellable.cancel();

	}

	// End disconnection
	_disconnectCallback(source_object, result) {

		this._connection.close_finish(result);

	}

	// Call, if set, *this._callback* passing to it *error*
	_raiseError(error) {

		if (this._callback)
			this._callback({ error: 'ERR ' + error });

	}

	// Whether the client is connected or not
	isConnected() {

		if (!this._isConnected)
			return this._isConnected;

		return this._connection.is_connected();

	}

	// Disconnect the client
	destroy() {

		this._disconnect();

	}
};

// TCPClientDo: handle actions with TCPClient, i.e. write something to it and pass to a callback function what we got back
// NOTE: callback function will get:
//  args = {
//	data: an array of lines/errors got from client,
//	opts: optional data to pass to the callback function
//  }
//  e.g., upon success: {
//	data: [
//		'Line #1',
//		'Line #2',
//		...
//		'Line #n'
//	],
//	opts: 'Whatever you passed to *constructor(args.opts)*'
//  }
//  e.g., upon errors: {
//	data: [
//		'ERR CONNECTION-ERROR'
//	],
//	opts: 'Whatever you passed to *constructor(args.opts)*'
//  }
const	TCPClientDo = class {
	// If the client is not yet connected, connect it, pass to it args.*data* and try to read from it.
	// If the client is already connected, pass to it args.*data* and try to read from it.
	// args = {
	//	client: TCPClient to use,
	//	callback: callback function to call upon success/errors,
	//	opts: optional, data to pass to callback function,
	//	data: data to write to the output stream,
	//	upto: optional, string that will stop the reading from client - if unset, only one line will be read
	// }
	constructor(args) {

		this._client = args.client;

		this._callbackFunction = args.callback;

		this._opts = args.opts;

		this._data = args.data;

		this._upto = args.upto;

		this._returnData = [];

		if (!this._client.isConnected()) {

			this._client.connect({ callback: Lang.bind(this, this._write) });
			return;

		}

		this._write();

	}

	// Write *this._data* to the output stream, then try to read from the input stream just one line or all up to *this._upto*
	// args = {
	//	error: set by *this._client.connect()* method called (if the client is not already connected) in *this.constructor()* upon problems in the connection
	// }
	_write(args) {

		if (args && args.error) {
			this._returnData.push(args.error);
			this._callback();
			return;
		}

		this._client.output.write_async(
			this._data + '\n',
			GLib.PRIORITY_DEFAULT,
			null,
			Lang.bind(this, this._writeCallback)
		);

	}

	// Finish the writing and call the read function
	_writeCallback(source_object, result) {

		let error, size;

		try {
			size = this._client.output.write_finish(result);
		} catch (e) {
			error = e;
		}

		if (!error && !size)
			error = "no data";

		if (error) {
			this._returnData.push('ERR WRITE-ERROR (%s)'.format(error));
			this._callback();
			return;
		}

		this._readLine();

	}

	// Read something from the input stream, one line at a time
	_readLine() {

		this._client.input.read_line_async(
			GLib.PRIORITY_DEFAULT,
			null,
			Lang.bind(this, this._readLineCallback)
		);

	}

	// Finish reading the line, then call the callback function or read the next line
	_readLineCallback(source_object, result) {

		let error, line, lineSize;

		try {
			[ line, lineSize ] = this._client.input.read_line_finish_utf8(result);
		} catch (e) {
			error = e;
		}

		if (!error && (!line || !lineSize))
			error = "no data";

		if (error) {
			// Reinitialize *this._returnData*, in case this isn't the first line
			this._returnData = [];
			this._returnData.push('ERR READ-ERROR (%s)'.format(error));
			this._callback();
			return;
		}

		this._returnData.push(line);

		// Just one line, or last line
		if (!this._upto || line.indexOf(this._upto) != -1) {
			this._callback();
			return;
		}

		this._readLine();

	}

	// Execute callback function
	_callback() {

		this._callbackFunction({
			data: this._returnData,
			opts: this._opts
		});

	}
};

// NUTClient: create a new TCPClient and map NUT's net protocol
// NOTE: all the net protocol-related methods take this argument:
//  args = {
//	callback: function to call upon success/errors,
//	opts: optional data to pass to the callback function
//		...
//	method-specific options
//		...
//  }
// and pass, in their respective callback method, to the callback function:
//  args = {
//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both,
//	opts: optional data to pass to the callback function - i.e. *method(args.opts)*,
//  }
// *error* may be:
// - one of NUT's net protocol errors
// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
// - 'ERR UNKNOWN' - unknown errors
var	NUTClient = class {
	// args = {
	//	host: hostname to connect to,
	//	port: port to use for connection,
	// }
	constructor(args) {

		this._client = new TCPClient(args);

		this._isBusy = false;

	}

	// If busy return error 'ERR CLIENT-BUSY', otherwise set parameters:
	// args = {
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// (other properties, i.e. args.*, are used by the calling method)
	_checkIfBusy(args) {

		if (this._isBusy)
			return {
				error: 'ERR CLIENT-BUSY',
				opts: args.opts
			};

		this._isBusy = true;

		this._opts = args.opts;

		this._callback = args.callback;

		return false;
	}

	// Get the number of clients which have done *LOGIN* for the UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = number of logged clients (e.g. '3')
	getNumLogins(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET NUMLOGINS %s'.format(args.upsName),
			callback: Lang.bind(this, this._getNumLoginsCallback)
		});

	}

	// Callback function for *this.getNumLogins()* method
	_getNumLoginsCallback(args) {

		// > GET NUMLOGINS <upsname>
		// < NUMLOGINS <upsname> <value>

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: clear(args.data[0], 2),
			opts: this._opts
		});

	}

	// Get UPS's descriptions as set in ups.conf or 'Unavailable' if 'desc' is not set
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = UPS's description (e.g. 'My little precious UPS')
	getUPSDesc(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET UPSDESC %s'.format(args.upsName),
			callback: Lang.bind(this, this._getUPSDescCallback)
		});

	}

	// Callback function for *this.getUPSDesc()* method
	_getUPSDescCallback(args) {

		// > GET UPSDESC <upsname>
		// < UPSDESC <upsname> "<description>"

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: unquote(clear(args.data[0], 2)),
			opts: this._opts
		});

	}

	// Get the value of a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's value (e.g. '230.4')
	getVar(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET VAR %s %s'.format(args.upsName, args.varName),
			callback: Lang.bind(this, this._getVarCallback)
		});

	}

	// Callback function for *this.getVar()* method
	_getVarCallback(args) {

		// > GET VAR <upsname> <varname>
		// < VAR <upsname> <varname> "<value>"

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: unquote(clear(args.data[0], 3)),
			opts: this._opts
		});

	}

	// Get the type of a variable
	// Type can be several values, and multiple words may be returned:
	// - 'RW': this variable may be set to another value with SET
	// - 'ENUM': an enumerated type, which supports a few specific values
	// - 'STRING:n': this is a string of maximum length n
	// - 'RANGE': this is an integer, comprised in the range (see LIST RANGE)
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's type (e.g. 'RW STRING:32')
	getType(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET TYPE %s %s'.format(args.upsName, args.varName),
			callback: Lang.bind(this, this._getTypeCallback)
		});

	}

	// Callback function for *this.getType()* method
	_getTypeCallback(args) {

		// > GET TYPE <upsname> <varname>
		// < TYPE <upsname> <varname> <type>...

		// '<type>' can be several values, and multiple words may be returned:
		// - 'RW': this variable may be set to another value with SET
		// - 'ENUM': an enumerated type, which supports a few specific values
		// - 'STRING:n': this is a string of maximum length n
		// - 'RANGE': this is an integer, comprised in the range (see LIST RANGE)

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: clear(args.data[0], 3),
			opts: this._opts
		});

	}

	// Get the description of a variable (or 'Unavailable', if the description is not available)
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's description (e.g. 'Input voltage (V)')
	getDesc(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET DESC %s %s'.format(args.upsName, args.varName),
			callback: Lang.bind(this, this._getDescCallback)
		});

	}

	// Callback function for *this.getDesc()* method
	_getDescCallback(args) {

		// > GET DESC <upsname> <varname>
		// < DESC <upsname> <varname> "<description>"

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: unquote(clear(data[0], 3)),
			opts: this._opts
		});

	}

	// Get the description of a command (or 'Unavailable', if the description is not available)
	// args = {
	//	upsName: name of the UPS,
	//	cmdName: name of the command,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = command's description (e.g. 'Turn off the load and return when power is back')
	getCmdDesc(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'GET CMDDESC %s %s'.format(args.upsName, args.cmdName),
			callback: Lang.bind(this, this._getCmdDescCallback)
		});

	}

	// Callback function for *this.getCmdDesc()* method
	_getCmdDescCallback(args) {

		// > GET CMDDESC <upsname> <cmdname>
		// < CMDDESC <upsname> <cmdname> "<description>"

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		this._callback({
			data: unquote(clear(args.data[0], 3)),
			opts: this._opts
		});

	}

	// Get the list of UPSes available at *this._host:this._port* (as set in *constructor()* method, i.e. constructor()'s args.{*host*,*port*})
	// args = {
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'ups #1 name': 'ups #1's description',
	//	'ups #1 name': 'ups #2's description',
	//		...
	// }
	// e.g. {
	//	'mlpu': 'My little precious UPS',
	//	'mbbu': 'My big bad UPS'
	// }
	listUPS(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST UPS',
			upto: 'END LIST UPS',
			callback: Lang.bind(this, this._listUPSCallback)
		});

	}

	// Callback function for *this.listUPS()* method
	_listUPSCallback(args) {

		// > LIST UPS
		// < BEGIN LIST UPS
		// < UPS <upsname> "<description>"
		// < ...
		// < END LIST UPS

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let upses = {};

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			let buffer = divideAndUnquote(clear(line, 1));

			upses[buffer[0]] = buffer[1];

		}

		this._isBusy = false;

		this._callback({
			data: upses,
			opts: this._opts
		});

	}

	// Get the list of a UPS's available variables
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'var.1 name': 'var.1's value',
	//	'var.2 name': 'var.2's value',
	//		...
	// }
	// e.g. {
	//	'input.voltage': '228.2',
	//	'ups.status': 'OL CHRG'
	// }
	listVar(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST VAR %s'.format(args.upsName),
			upto: 'END LIST VAR %s'.format(args.upsName),
			callback: Lang.bind(this, this._listVarCallback)
		});

	}

	// Callback function for *this.listVar()* method
	_listVarCallback(args) {

		// > LIST VAR <upsname>
		// < BEGIN LIST VAR <upsname>
		// < VAR <upsname> <varname> "<value>"
		// < ...
		// < END LIST VAR <upsname>

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let vars = {};

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			let buffer = divideAndUnquote(clear(line, 2));

			vars[buffer[0]] = buffer[1];

		}

		this._isBusy = false;

		this._callback({
			data: vars,
			opts: this._opts
		});

	}

	// Get the list of RW variables available for a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'var.1 name': 'var.1's value',
	//	'var.2 name': 'var.2's value',
	//		...
	// }
	// e.g. {
	//	'battery.protection': 'yes',
	//	'ups.delay.shutdown': '180'
	// }
	listRW(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST RW %s'.format(args.upsName),
			upto: 'END LIST RW %s'.format(args.upsName),
			callback: Lang.bind(this, this._listRWCallback)
		});

	}

	// Callback function for *this.listRW()* method
	_listRWCallback(args) {

		// > LIST RW <upsname>
		// < BEGIN LIST RW <upsname>
		// < RW <upsname> <varname> "<value>"
		// < ...
		// < END LIST RW <upsname>

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: args.opts
			});
			return;
		}

		let lines = args.data;

		let rwvars = {};

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			let buffer = divideAndUnquote(clear(line, 2));

			rwvars[buffer[0]] = buffer[1];

		}

		this._isBusy = false;

		this._callback({
			data: rwvars,
			opts: this._opts
		});

	}

	// Get the list of commands available for a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'command.1 name',
	//	'command.2 name',
	//	...
	// ]
	// e.g. [
	//	'test.battery.start',
	//	'shutdown.return'
	// ]
	listCmd(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST CMD %s'.format(args.upsName),
			upto: 'END LIST CMD %s'.format(args.upsName),
			callback: Lang.bind(this, this._listCmdCallback)
		});

	}

	// Callback function for *this.listCmd()* method
	_listCmdCallback(args) {

		// > LIST CMD <upsname>
		// < BEGIN LIST CMD <upsname>
		// < CMD <upsname> <cmdname>
		// < ...
		// < END LIST CMD <cmdname>

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let cmds = [];

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			cmds.push(clear(line, 2));

		}

		this._isBusy = false;

		this._callback({
			data: cmds,
			opts: this._opts
		});

	}

	// Get the list of enumerated values available for a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'enumerated value #1',
	//	'enumerated value #2',
	//		...
	// ]
	// e.g. [
	//	'120',
	//	'240'
	// ]
	listEnum(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST ENUM %s %s'.format(args.upsName, args.varName),
			upto: 'END LIST ENUM %s %s'.format(args.upsName, args.varName),
			callback: Lang.bind(this, this._listEnumCallback)
		});

	}

	// Callback function for *this.listEnum()* method
	_listEnumCallback(args) {

		// > LIST ENUM <upsname> <varname>
		// < BEGIN LIST ENUM <upsname> <varname>
		// < ENUM <upsname> <varname> "<value>"
		// < ...
		// < END LIST ENUM <upsname> <varname>

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let enums = [];

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			enums.push(unquote(clear(line, 3)));

		}

		this._isBusy = false;

		this._callback({
			data: enums,
			opts: this._opts
		});

	}

	// Get the list of ranges available for a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	{
	//		min: 'range #1's minimum acceptable value',
	//		max: 'range #1's maximum acceptable value'
	//	},
	//	{
	//		min: 'range #2's minimum acceptable value',
	//		max: 'range #2's maximum acceptable value'
	//	}
	//		...
	// ]
	// e.g. [
	//	{
	//		min: '50',
	//		max: '60'
	//	},
	//	{
	//		min: '70',
	//		max: '90'
	//	}
	// ]
	listRange(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST RANGE %s %s'.format(args.upsName, args.varName),
			// In NUT (till 2.7.1) the reply wrongly ends with 'END LIST ENUM <upsname> <varname>'
			upto: 'END LIST ',
			// In a perfect world, this would be:
			//upto: 'END LIST RANGE %s %s'.format(args.upsName, args.varName),
			callback: Lang.bind(this, this._listRangeCallback)
		});

	}

	// Callback function for *this.listRange()* method
	_listRangeCallback(args) {

		// > LIST RANGE <upsname> <varname>
		// < BEGIN LIST RANGE <upsname> <varname>
		// < RANGE <upsname> <varname> "<min>" "<max>"
		// < ...
		// < END LIST RANGE <upsname> <varname>

		// NOTE: In NUT (till 2.7.1) the reply wrongly ends with 'END LIST ENUM <upsname> <varname>'

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let ranges = [];

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			let buffer = clear(line, 3).split(' ');

			ranges.push({
				min: unquote(buffer[0]) * 1,
				max: unquote(buffer[1]) * 1
			});

		}

		this._isBusy = false;

		this._callback({
			data: ranges,
			opts: this._opts
		});

	}

	// Get the list of clients connected to a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'client #1's IP address',
	//	'client #2's IP address',
	//	...
	// ]
	// e.g. [
	//	'::1',
	//	'192.168.1.2'
	// ]
	listClient(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'LIST CLIENT %s'.format(args.upsName),
			upto: 'END LIST CLIENT %s'.format(args.upsName),
			callback: Lang.bind(this, this._listClientCallback)
		});

	}

	// Callback function for *this.listClient()* method
	_listClientCallback(args) {

		// > LIST CLIENT <device_name>
		// < BEGIN LIST CLIENT <device_name>
		// < CLIENT <device name> <client IP address>
		// < ...
		// < END LIST CLIENT <device_name>

		let error = checkForErrors(args.data);

		if (error) {
			this._isBusy = false;
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		let lines = args.data;

		let clients = [];

		// Iterate through each line
		for (let i = 1; i < lines.length; i++) {

			let line = lines[i];

			// Skip empty tokens
			if (!line || !line.length)
				continue;

			// End of the list
			if (!line.indexOf('END'))
				break;

			clients.push(clear(line, 2));

		}

		this._isBusy = false;

		this._callback({
			data: clients,
			opts: this._opts
		});

	}

	// Set the value of a RW variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	setVar(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'SET VAR %s %s "%s"'.format(args.upsName, args.varName, args.varValue),
			callback: Lang.bind(this, this._setVarCallback)
		});

	}

	// Callback function for *this.setVar()* method
	_setVarCallback(args) {

		// > SET VAR <upsname> <varname> "<value>"
		// < OK
		// < ERR ...

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		if (!args.data[0].indexOf('OK'))
			this._callback({
				data: args.data[0],
				opts: this._opts
			});
		else
			this._callback({
				error: 'ERR UNKNOWN',
				opts: this._opts
			});

	}

	// Execute instant command
	// args = {
	//	upsName: name of the UPS,
	//	cmdName: name of the command to execute,
	//	cmdValue: value to pass to the command,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	instCmd(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium;

		if (args.cmdExtraData !== undefined)
			medium = new TCPClientDo({
				client: this._client,
				data: 'INSTCMD %s %s "%s"'.format(args.upsName, args.cmdName, args.cmdExtraData),
				callback: Lang.bind(this, this._instCmdCallback)
			});
		else
			medium = new TCPClientDo({
				client: this._client,
				data: 'INSTCMD %s %s'.format(args.upsName, args.cmdName),
				callback: Lang.bind(this, this._instCmdCallback)
			});

	}

	// Callback function for *this.instCmd()* method
	_instCmdCallback(args) {

		// > INSTCMD <upsname> <cmdname> "<value>"
		// < OK
		// < ERR ...

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		if (!args.data[0].indexOf('OK'))
			this._callback({
				data: args.data[0],
				opts: this._opts
			});
		else
			this._callback({
				error: 'ERR UNKNOWN',
				opts: this._opts
			});

	}

	// Set the password for the current connection
	// args = {
	//	password: password to use for authentication,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	password(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'PASSWORD %s'.format(args.password),
			callback: Lang.bind(this, this._passwordCallback)
		});

	}

	// Callback function for *this.password()* method
	_passwordCallback(args) {

		// > PASSWORD <password>
		// < OK
		// < ERR ...

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		if (!args.data[0].indexOf('OK'))
			this._callback({
				data: args.data[0],
				opts: this._opts
			});
		else
			this._callback({
				error: 'ERR UNKNOWN',
				opts: this._opts
			});

	}

	// Set the username for the current connection
	// args = {
	//	username: username to use for authentication,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	username(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'USERNAME %s'.format(args.username),
			callback: Lang.bind(this, this._usernameCallback)
		});

	}

	// Callback function for *this.username()* method
	_usernameCallback(args) {

		// > USERNAME <username>
		// < OK
		// < ERR ...

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		if (!args.data[0].indexOf('OK'))
			this._callback({
				data: args.data[0],
				opts: this._opts
			});
		else
			this._callback({
				error: 'ERR UNKNOWN',
				opts: this._opts
			});

	}

	// Tell upsd to switch to TLS mode internally, so all future communications will be encrypted.
	// You must also change to TLS mode in the client after receiving the OK, or the connection will be useless.
	// args = {
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	startTLS(args) {

		let isBusy = this._checkIfBusy(args);

		if (isBusy) {
			args.callback(isBusy);
			return;
		}

		let medium = new TCPClientDo({
			client: this._client,
			data: 'STARTTLS',
			callback: Lang.bind(this, this._startTLSCallback)
		});

	}

	// Callback function for *this.startTLS()* method
	_startTLSCallback(args) {

		// > STARTTLS
		// < OK STARTTLS
		// < ERR ...

		let error = checkForErrors(args.data);

		this._isBusy = false;

		if (error) {
			this._callback({
				error: error,
				opts: this._opts
			});
			return;
		}

		if (!args.data[0].indexOf('OK STARTTLS'))
			this._callback({
				data: args.data[0],
				opts: this._opts
			});
		else
			this._callback({
				error: 'ERR UNKNOWN',
				opts: this._opts
			});

	}

	// Destroy the TCPClient
	destroy() {

		this._client.destroy();

	}
};

// NUTHelper: facilitate communications with NUT
// NOTE: all the public methods take this argument:
//  args = {
//	callback: function to call upon success/errors,
//	opts: optional data to pass to the callback function
//		...
//	method-specific options
//		...
//  }
// and pass, in their respective callback method, to the callback function:
//  args = {
//	data: data got from client, parsed - NOTE: either *data* or *error* is passed to callback function, not both,
//	error: errors got from client - NOTE: either *data* or *error* is passed to callback function, not both,
//	host: hostname used by the client, set in the *constructor()* method
//	port: port used by the client, set in the *constructor()* method
//	opts: optional data to pass to the callback function - i.e. *method(args.opts)*,
//		...
//	all the method-specific options requested by *method()*
//		...
//  }
// *error* may be:
// - one of NUT's net protocol errors
// - 'ERR CLIENT-BUSY' if the TCPClient is busy doing something else when the method is called
// - 'ERR CONNECTION-ERROR'/'ERR CONNECTION-ERROR (<error>)' if the TCPClient had some problem connecting
// - 'ERR CONNECTION-CANCELLED' if you cancel (i.e. TCPClient.*destroy()*) the connection before it's connected
// - 'ERR WRITE-ERROR (<error>)' upon errors writing to the TCPClient
// - 'ERR READ-ERROR (<error>)' upon errors reading from the TCPClient
// - 'ERR TOO-FEW-ARGUMENTS' if you called a method without all the required data
// - 'ERR UNKNOWN' - unknown errors
var	NUTHelper = class {
	// args = {
	//	host: hostname to connect to,
	//	port: port to use for connection,
	// }
	constructor(args) {

		this._host = args.host;

		this._port = args.port;

		// Data to pass to method's args.*callback()* functions
		this._returnData = {};

		this._returnData.host = this._host;
		this._returnData.port = this._port;

		this._client = new NUTClient(args);

	}

	// Check if all the required data is passed to a method and then register it and also the optional data as properties of *this* (private, dashed) and of *this._returnData*
	// args = {
	//	required: required data, as an array of names
	//	optional: optional data, as an array of names
	//	source: object whose properties are to check against args.*required* and args.*optional*
	// }
	_setData(args) {

		let source = args.source || {};
		let required = args.required;
		let optional = args.optional;

		for (let item in source) {

			let index = required.indexOf(item);
			if (index != -1) {

				this['_' + item] = source[item];

				if (item != 'callback')
					this._returnData[item] = source[item];

				required.splice(index, 1);

				continue;

			}

			if (optional.indexOf(item) != -1) {

				this['_' + item] = source[item];

				if (item != 'callback')
					this._returnData[item] = source[item];

			}

		}

		// We didn't get all the required data
		if (required.length) {

			this._returnData.error = 'ERR TOO-FEW-ARGUMENTS';

			if (this._callback)
				this._callback(this._returnData);

			// callback function not given? time to silently fail..
			log('NUT GJS: You must provide a callback function!');

			return false;

		}

		return true;

	}

	// Standard callback function for methods
	_standardCallback(args) {

		this._client.destroy();

		if (args.error)
			this._returnData.error = args.error;
		else
			this._returnData.data = args.data;

		this._callback(this._returnData);

	}

	// Get the value of a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's value (e.g. '230.4')
	getVar(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.getVar({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get UPS's descriptions as set in ups.conf or 'Unavailable' if 'desc' is not set
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = UPS's description (e.g. 'My little precious UPS')
	getUPSDesc(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.getUPSDesc({
			upsName: this._upsName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the description of a variable (or 'Unavailable', if the description is not available)
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's description (e.g. 'Input voltage (V)')
	getDesc(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.getDesc({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the description of a command (or 'Unavailable', if the description is not available)
	// args = {
	//	upsName: name of the UPS,
	//	cmdName: name of the command,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = command's description (e.g. 'Turn off the load and return when power is back')
	getCmdDesc(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'cmdName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.getCmdDesc({
			upsName: this._upsName,
			cmdName: this._cmdName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the type of a variable
	// Type can be several values, and multiple words may be returned:
	// - 'RW': this variable may be set to another value with SET
	// - 'ENUM': an enumerated type, which supports a few specific values
	// - 'STRING:n': this is a string of maximum length n
	// - 'RANGE': this is an integer, comprised in the range (see LIST RANGE)
	// args = {
	//	upsName: name of the UPS,
	//	varNam: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = var's type (e.g. 'RW STRING:32')
	getType(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.getType({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of UPSes available at *this._host:this._port* (as set in *constructor()* method, i.e. constructor()'s args.{*host*,*port*})
	// args = {
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'ups #1 name': 'ups #1's description',
	//	'ups #1 name': 'ups #2's description',
	//		...
	// }
	// e.g. {
	//	'mlpu': 'My little precious UPS',
	//	'mbbu': 'My big bad UPS'
	// }
	listUPS(args) {

		let isOk = this._setData({
			required: [ 'callback' ],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listUPS({ callback: Lang.bind(this, this._standardCallback) });

	}

	// Get the list of variables available for a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'var.1 name': 'var.1's value',
	//	'var.2 name': 'var.2's value',
	//		...
	// }
	// e.g. {
	//	'input.voltage': '228.2',
	//	'ups.status': 'OL CHRG'
	// }
	listVars(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listVar({
			upsName: this._upsName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of clients connected to a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'client #1's IP address',
	//	'client #2's IP address',
	//	...
	// ]
	// e.g. [
	//	'::1',
	//	'192.168.1.2'
	// ]
	listClients(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listClient({
			upsName: this._upsName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of RW variables available for a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'var.1 name': 'var.1's value',
	//	'var.2 name': 'var.2's value',
	//		...
	// }
	// e.g. {
	//	'battery.protection': 'yes',
	//	'ups.delay.shutdown': '180'
	// }
	listRW(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listRW({
			upsName: this._upsName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of enumerated values available for a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'enumerated value #1',
	//	'enumerated value #2',
	//		...
	// ]
	// e.g. [
	//	'120',
	//	'240'
	// ]
	listEnum(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listEnum({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of ranges available for a variable
	// args = {
	//	upsName: name of the UPS,
	//	varName: name of the variable,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	{
	//		min: 'range #1's minimum acceptable value',
	//		max: 'range #1's maximum acceptable value'
	//	},
	//	{
	//		min: 'range #2's minimum acceptable value',
	//		max: 'range #2's maximum acceptable value'
	//	}
	//		...
	// ]
	// e.g. [
	//	{
	//		min: '50',
	//		max: '60'
	//	},
	//	{
	//		min: '70',
	//		max: '90'
	//	}
	// ]
	listRange(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listRange({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of RW variables available for a UPS and their type and boundaries
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'var.1 name': {
	//		type: var.1's type,
	//		opts: var.1's options
	//	},
	//	'var.2 name': {
	//		type: var.2's type,
	//		opts: var.2's options
	//	},
	//		...
	// }
	// type (args.data['var.n name'].*type*) is one of: RANGE, ENUM, STRING, UNKNOWN (on errors)
	// options (args.data['var.n name'].*opts*) are:
	// - if type = RANGE -> an array of the available ranges:
	//	[
	//		{
	//			min: 'range #1's minimum acceptable value',
	//			max: 'range #1's maximum acceptable value'
	//		},
	//		{
	//			min: 'range #2's minimum acceptable value',
	//			max: 'range #2's maximum acceptable value'
	//		},
	//			...
	//	]
	// - if type = ENUM -> an array of the available enumerated values:
	//	[
	//		'enumerated value #1',
	//		'enumerated value #2',
	//		...
	//	]
	// - if type = STRING -> maximum length of the string
	listRWs(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listRW({
			upsName: this._upsName,
			callback: Lang.bind(this, this._listRWsCallback)
		});

	}

	// Callback function for *this.listRWs()* method:
	// - check for errors
	// - prepare vars
	// - start the loop through all the vars
	_listRWsCallback(args) {

		if (args.error) {
			this._client.destroy();
			this._returnData.error = args.error;
			this._callback(this._returnData);
			return;
		}

		let rws = args.data;

		this._rws = {};

		this._rwsToDo = [];

		// Prepare vars
		for (let rw in rws) {

			this._rws[rw] = {};

			this._rws[rw].val = rws[rw];

			this._rwsToDo.push(rw);

		}

		// Get data
		this._listRWsGetType();

	}

	// Try to get the actual type of a variable (the first one in *this._rwsToDo* array)
	_listRWsGetType() {

		this._varName = this._rwsToDo[0];

		this._client.getType({
			upsName: this._upsName,
			varName: this._varName,
			callback: Lang.bind(this, this._listRWsGetTypeCallback)
		});

	}

	// Callback function for *this._listRWsGetType()* method:
	// - determine the type of a variable according to the answer got from TCPClient
	// - try to get the variable's boundaries
	_listRWsGetTypeCallback(args) {

		if (args.error) {
			this._rws[this._varName].type = 'UNKNOWN';
			this._listRWsGoNext();
			return;
		}

		this._rws[this._varName].type = args.data;

		// Remove 'RW' from type
		if (!this._rws[this._varName].type.indexOf('RW ')) {
			let buffer = clear(this._rws[this._varName].type, 1);
			this._rws[this._varName].type = buffer;
		}

		// Range
		if (this._rws[this._varName].type.indexOf('RANGE') != -1) {
			this._client.listRange({
				upsName: this._upsName,
				varName: this._varName,
				callback: Lang.bind(this, this._listRWsSetOptsCallback)
			});
			return;
		}

		// ENUM
		if (this._rws[this._varName].type.indexOf('ENUM') != -1) {
			this._client.listEnum({
				upsName: this._upsName,
				varName: this._varName,
				callback: Lang.bind(this, this._listRWsSetOptsCallback)
			});
			return;
		}

		// STRING
		if (this._rws[this._varName].type.indexOf('STRING:') != -1) {
			this._rws[this._varName].opts = this._rws[this._varName].type.split(':')[1] * 1;
			this._rws[this._varName].type = this._rws[this._varName].type.replace(/STRING:\d*/, 'STRING');
		}

		this._listRWsGoNext();

	}

	// Set a variable's boundaries, then go to the next var
	_listRWsSetOptsCallback(args) {

		if (args.error) {
			this._listRWsGoNext();
			return;
		}

		this._rws[this._varName].opts = args.data;

		this._listRWsGoNext();

	}

	// Loop through the vars whose type is to check
	_listRWsGoNext() {

		this._rwsToDo.shift();

		if (!this._rwsToDo.length) {
			this._client.destroy();
			this._returnData.data = this._rws;
			this._callback(this._returnData);
			return;
		}

		this._listRWsGetType();

	}

	// Get the list of commands available for a UPS
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = [
	//	'command.1 name',
	//	'command.2 name',
	//	...
	// ]
	// e.g. [
	//	'test.battery.start',
	//	'shutdown.return'
	// ]
	listCmd(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listCmd({
			upsName: this._upsName,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Get the list of commands available for a UPS and their description
	// args = {
	//	upsName: name of the UPS,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = {
	//	'command.1 name': 'command.1's description',
	//	'command.2 name': 'command.2's description',
	//	...
	// }
	// NOTE: if a command's description is not available, it'll be set as 'Unavailable'
	// e.g. {
	//	'test.battery.start': 'Start a battery test',
	//	'shutdown.return': 'Turn off the load and return when power is back'
	// }
	listCmds(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._client.listCmd({
			upsName: this._upsName,
			callback: Lang.bind(this, this._listCmdsCallback)
		});

	}

	// Callback function for *this.listCmds()* method
	// - check for errors
	// - prepare commands list
	// - start the loop through all the commands
	_listCmdsCallback(args) {

		if (args.error) {
			this._client.destroy();
			this._returnData.error = args.error;
			this._callback(this._returnData);
			return;
		}

		this._cmdsToDo = args.data;

		this._cmds = {};

		// Get data
		this._listCmdsGetDesc();

	}

	// Try to get the description of a command (the first one in *this._cmdsToDo* array)
	_listCmdsGetDesc() {

		this._cmd = this._cmdsToDo[0];

		this._client.getCmdDesc({
			upsName: this._upsName,
			cmdName: this._cmd,
			callback: Lang.bind(this, this._listCmdsGetDescCallback)
		});

	}

	// Callback function for *this._listCmdsGetDesc()* method
	_listCmdsGetDescCallback(args) {

		this._cmds[this._cmd] = args.data || 'Unavailable';

		this._listCmdsGoNext(args);

	}

	// Loop through the commands whose description is to get
	_listCmdsGoNext(args) {

		this._cmdsToDo.shift();

		if (!this._cmdsToDo.length) {
			this._client.destroy();
			this._returnData.data = this._cmds;
			this._callback(this._returnData);
			return;
		}

		this._listCmdsGetDesc();

	}

	// Set username and password (as set in *this._username* and *this._password*) for the current connection
	// args = {
	//	callback: function to call upon success/errors
	// }
	// callback's args.*data* = 'OK' (in case of success)
	_authenticate(args) {

		this._authCallback = args.callback;

		this._client.username({
			username: this._username,
			callback: Lang.bind(this, this._authenticateUserCallback)
		});

	}

	// Callback function for *this._authenticate()* method:
	// - check if there were errors setting username
	// - if there weren't errors, try to set password
	_authenticateUserCallback(args) {

		if (args.error) {
			this._authCallback({ error: args.error });
			return;
		}

		this._client.password({
			password: this._password,
			callback: Lang.bind(this, this._authenticatePwCallback)
		});

	}

	// Callback function for *this._authenticate()* method, through *this._authenticateUserCallback()* method
	// - check if there were errors setting password
	// - if there weren't errors, call the callback function *this._authCallback()* (i.e. *this._authenticate()*'s args.*callback*)
	_authenticatePwCallback(args) {

		if (args.error) {
			this._authCallback({ error: args.error });
			return;
		}

		this._authCallback({ data: args.data });

	}

	// Set the value of a RW variable
	// args = {
	//	upsName: name of the UPS,
	//	username: username to use for authentication,
	//	password: password to use for authentication,
	//	varName: name of the variable,
	//	varValue: value to set variable to
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	setVar(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'varName',
				'varValue',
				'username',
				'password',
				'callback'
			],
			optional: [ 'opts' ],
			source: args
		});

		if (!isOk)
			return;

		this._authenticate({ callback: Lang.bind(this, this._setVarAuthenticateCallback) });

	}

	// Callback function for *this.setVar()* method's authentication
	_setVarAuthenticateCallback(args) {

		if (args.error) {
			this._client.destroy();
			this._returnData.error = args.error;
			this._callback(this._returnData);
			return;
		}

		this._client.setVar({
			upsName: this._upsName,
			varName: this._varName,
			varValue: this._varValue,
			callback: Lang.bind(this, this._standardCallback)
		});

	}

	// Execute instant command
	// args = {
	//	upsName: name of the UPS,
	//	username: username to use for authentication,
	//	password: password to use for authentication,
	//	cmdName: name of the command to execute,
	//	cmdExtraData: value to pass to the command,
	//	callback: function to call upon success/errors,
	//	opts: optional data to pass to the callback function
	// }
	// callback's args.*data* = 'OK' (in case of success)
	instCmd(args) {

		let isOk = this._setData({
			required: [
				'upsName',
				'cmdName',
				'username',
				'password',
				'callback'
			],
			optional: [
				'opts',
				'cmdExtraData'
			],
			source: args
		});

		if (!isOk)
			return;

		this._authenticate({ callback: Lang.bind(this, this._instCmdAuthenticateCallback) });

	}

	// Callback function for *this.instCmd()* method's authentication
	_instCmdAuthenticateCallback(args) {

		if (args.error) {
			this._client.destroy();
			this._returnData.error = args.error;
			this._callback(this._returnData);
			return;
		}

		this._client.instCmd({
			upsName: this._upsName,
			cmdName: this._cmdName,
			cmdExtraData: this._cmdExtraData,
			callback: Lang.bind(this, this._standardCallback)
		});

	}
};

// Support functions

// Check for errors in *data*
function checkForErrors(data) {

	if (!data || !data.length)
		return 'ERR UNKNOWN';

	if (!data[0].indexOf('ERR'))
		return data[0];

	return false;

}

// Remove from *data* a sequence of 'non-space characters + one space' the number of times specified by *numberOfTimes*
function clear(data, numberOfTimes) {

	let buffer = data;

	for (let i = 1; i <= numberOfTimes; i++)
		buffer = buffer.replace(/^\S+\s/, '');

	return buffer;

}

// Split *data* in val1 (up to the first space) and val2 (from the first space to the end) and return an array [ val1, val2 ]
function divide(data) {

	let separator = data.indexOf(' ');

	let val1 = data.substring(0, separator);
	let val2 = data.substring(separator + 1);

	return [ val1, val2 ];

}

// Remove first and last character from *data*
function unquote(data) {

	return data.slice(1).slice(0, -1);

}

// Split *data* in val1 (up to the first space) and val2 (from the first space to the end), remove first and last character from val2 and return an array [ val1, val2 ]
function divideAndUnquote(data) {

	let buffer = divide(data);

	return [ buffer[0], unquote(buffer[1]) ];

}
