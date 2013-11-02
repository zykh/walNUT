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

const	GLib = imports.gi.GLib,
	GObject = imports.gi.GObject,
	Gio = imports.gi.Gio,
	Lang = imports.lang;

// Gettext
const	Gettext = imports.gettext.domain('gnome-shell-extensions-walnut'),
	_ = Gettext.gettext;

// To save UPSes
const	Me = imports.misc.extensionUtils.getCurrentExtension(),
	Convenience = Me.imports.convenience;

// getLocale: return the current locale (eg. en_US.utf8, it_IT.utf8.. or, for a multi-LANGUAGE variable, en, it ..) or null
function getLocale() {

	// Get environment variables
	let env = GLib.get_environ();

	// Try LANG variable
	let locale = GLib.environ_getenv(env, 'LANG');

	// If not available, try LC_ALL
	if (!locale)
		locale = GLib.environ_getenv(env, 'LC_ALL');

	// If not available, try LANGUAGE
	if (!locale) {
		locale = GLib.environ_getenv(env, 'LANGUAGE');
		// Get the first one (e.g. it:en:.. -> it)
		locale = locale ? locale.split(':')[0] : locale;
	}

	// Return locale, if any, or null
	return locale;

}

// detect: detect the path of a given executable
function detect(ex) {

	let path = GLib.find_program_in_path(ex);

	return path ? [path] : undefined;

}

// parserO: create an object[val1] = val2 splitting each line of txt using sep as separator in val1 (up to sep) and val2 (from sep to end of line)
function toObj(txt, sep) {

	let output = txt.split('\n');
	let vars = {};

	// Iterate through each lines and get every variable
	for (let i = 0; i < output.length; i++) {

		// Skip empty tokens
		if (!output[i])
			continue;

		// Don't use split to avoid unwanted results (since the value may contain another sep not used as a separator)
		let n = output[i].indexOf(sep);
		vars[output[i].substring(0, n).trim()] = output[i].substring(n + 1).trim();

	}

	return vars;

}

// parserA: create an array of object
//  {
//	label1: val1,
//	label2: val2
//  }
// splitting each line of txt using sep as separator in val1 (up to sep) and val2 (from sep to end of line)
function toArr(txt, sep, label1, label2) {

	let output = txt.split('\n');
	let vars = new Array();

	// Iterate through each lines and get every variable
	for (let i = 0; i < output.length; i++) {

		// Skip empty tokens
		if (!output[i])
			continue;

		// Don't use split to avoid unwanted results (since the value may contain another sep not used as a separator)
		let variable = {};
		let n = output[i].indexOf(sep);

		variable[label1] = output[i].substring(0, n).trim();
		variable[label2] = output[i].substring(n + 1).trim();

		vars.push(variable);

	}

	return vars;

}

// parseSetVar: parse upsrw output
// return an object
//  {
//	name of the variable #1: { desc: descritpion of variable #1, type: type of variable #1, options: options of variable #1 },
//	name of the variable #2: { desc: descritpion of variable #2, type: type of variable #2, options: options of variable #2 },
//	..
//  }
// type is one of: RANGE, ENUM, STRING
// options are:
// if type = RANGE -> an array of the available ranges [ { min: minimum value #1, max: maximum value #1 }, { min: minimum value #2, max: maximum value #2 }, .. ]
// if type = ENUM -> an array of the available enumerated values [ enum1, enum2, enum3, .. ]
// if type = STRING -> nothing (I hoped to get the maximum length of the string but it's not implemented yet in upsrw)
function parseSetVar(txt) {

	// [var.name]
	// Variable's description
	// Type: ENUM
	// Option: "enum1" SELECTED
	// Option: "enum2"
	//
	// [var2.name]
	// Variable's description
	// Type: RANGE
	// Option: "min1-max1"
	// Option: "min2-max2" SELECTED
	//
	// [var3.name]
	// Variable's description
	// Type: STRING
	// Value: actual value

	let output = txt.split('\n\n');

	let setVar = {};

	// Get every variable
	for (let i = 0; i < output.length; i++) {

		let variable = output[i].split('\n');

		// Type unrecognized / no var value (STRING) / no var boundaries (ENUM/RANGE)
		if (variable.length < 4)
			continue;

		// Name of the variable
		let varName = variable[0].slice(1, -1);

		setVar[varName] = {};
		setVar[varName].desc = variable[1];
		setVar[varName].type = variable[2].slice(6);

		// type = STRING
		if (setVar[varName].type != 'ENUM' && setVar[varName].type != 'RANGE')
			continue;

		setVar[varName].options = new Array();

		// Get every option
		for (let j = 3; j < variable.length; j++) {

			let from = variable[j].indexOf('"') + 1;

			let to = variable[j].lastIndexOf('"');

			let option = variable[j].substring(from, to).trim();

			// varType = ENUM
			if (setVar[varName].type == 'ENUM') {

				setVar[varName].options.push(option);

				continue;

			}

			// varType = RANGE

			let ranges = option.split('-');

			let range = {};

			range.min = ranges[0] * 1;
			range.max = ranges[1] * 1;

			setVar[varName].options.push(range);

		}

	}

	return setVar;

}

// Do: exec argv and when the child process exits call the callback function, passing to it stdout and stderr - if any (otherwise null, e.g.: stderr = null -> no errors) - and opts
// argv must be an already parsed to array full path-ed executable and its arguments
// e.g.: ls -alh /tmp -> /usr/bin/ls -alh /tmp -> ['/usr/bin/ls', '-alh', '/tmp']
function Do(argv, callback, opts) {

	// Exec argv
	let [exit, pid, stdin_fd, stdout_fd, stderr_fd] = GLib.spawn_async_with_pipes(null,	/* inherit parent working directory */
											argv,	/* args */
											null,	/* env */
											GLib.SpawnFlags.DO_NOT_REAP_CHILD,
											null	/* child setup */);

	// Wrap stdout file descriptor in a UnixInputStream and then in a DataInputStream
	let stdout_str = new Gio.UnixInputStream({ fd: stdout_fd, close_fd: true });
	let data_stdout = new Gio.DataInputStream({ base_stream: stdout_str });

	// Wrap stderr file descriptor in a UnixInputStream and then in a DataInputStream
	let stderr_str = new Gio.UnixInputStream({ fd: stderr_fd, close_fd: true });
	let data_stderr = new Gio.DataInputStream({ base_stream: stderr_str });

	// Close file descriptor for std input opened by g_spawn_async_with_pipes
	new Gio.UnixOutputStream({ fd: stdin_fd, close_fd: true }).close(null);

	// Child watch: when child process exits get the std{out,err} and call the callback function
	let child_watch = GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, function(pid, status, requestObj) {

		// Read stdout and stderr
		// Method 1: read all
		// Standard Output
		let [stdout, out_size] = data_stdout.read_upto('\0', 1, null);
		// Standard Error
		let [stderr, err_size] = data_stderr.read_upto('\0', 1, null);

		// Method 2: read line by line
		// Standard Output
//		let [out, out_size] = data_stdout.read_line(null);
//		let stdout = out ? out + '\n' : out;
//		while (out_size > 0) {
//			[out, out_size] = data_stdout.read_line(null);
//			if (out)
//				stdout += out + '\n';
//		}
		// Standard Error
//		let [err, err_size] = data_stderr.read_line(null);
//		let stderr = err ? err + '\n' : err;
//		while (err_size > 0) {
//			[err, err_size] = data_stderr.read_line(null);
//			if (err)
//				stderr += err + '\n';
//		}

		// Close file descriptors for standard output & error
		stdout_str.close(null);
		stderr_str.close(null);

		GLib.source_remove(child_watch);

		callback(stdout, stderr, opts);

	}));

}

// defaultUps: pick chosen UPS
function defaultUps(id) {

	// Don't do anything if UPS is already the chosen one
	if (id == 0)
		return;

	let settings = Convenience.getSettings();

	// Retrieve actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// Pick 'chosen' UPS
	let chosen = got.splice(id, 1);

	// Then sort UPSes in alphabetical order (host:port, and then name)
	got.sort(function(a, b) { return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0); });

	// And now restore chosen UPS
	got.unshift(chosen[0]);

	// Store newly ordered devices' list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// upsCred: update chosen UPS's (the first one in devices' list stored in schema) credentials (user & pw)
function upsCred(user, pw) {

	let settings = Convenience.getSettings();

	// Retrieve actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to update credentials is through the panel menu
	// and for the chosen UPS, that's at first position in devices' list
	// If user or password are empty we'll delete them from UPS's properties
	if (user.length > 0)
		got[0].user = user;
	else
		delete got[0].user;

	if (pw.length > 0)
		got[0].pw = pw;
	else
		delete got[0].pw;

	// Store back devices' list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// upsDel: remove chosen UPS (the first one) from devices' list stored in schema
function upsDel() {

	let settings = Convenience.getSettings();

	// Retrieve actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to delete an UPS is through the panel menu
	// and for the chosen UPS, that's at first position in devices' list
	got.shift();

	// Store back devices' list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}
