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

	return path ? [ path ] : undefined;

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
	let vars = [];

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
// if type = STRING -> maximum length of the string if NUT >= 2.7.1, otherwise nothing
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
	// Maximum length: value	<- this line is published only in NUT >= 2.7.1
	// Value: actual value

	let output = txt.split('\n\n');

	let setVar = {};

	// Get every variable
	for (let i = 0; i < output.length; i++) {

		let variable = output[i].split('\n');

		// Type unrecognized / no var value or maximum length (STRING) / no var boundaries (ENUM/RANGE)
		if (variable.length < 4)
			continue;

		// Name of the variable
		let varName = variable[0].slice(1, -1);

		setVar[varName] = {};
		setVar[varName].desc = variable[1];
		setVar[varName].type = variable[2].slice(6);

		// type = STRING
		if (setVar[varName].type == 'STRING') {

			// NUT >= 2.7.1
			if (!variable[3].indexOf('Maximum length: '))
				setVar[varName].options = variable[3].slice(16);

			continue;

		}

		setVar[varName].options = [];

		// Get every option
		for (let j = 3; j < variable.length; j++) {

			let from = variable[j].indexOf('"') + 1;

			let to = variable[j].lastIndexOf('"');

			let option = variable[j].substring(from, to).trim();

			// type = ENUM
			if (setVar[varName].type == 'ENUM') {

				setVar[varName].options.push(option);

				continue;

			}

			// type = RANGE

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
// e.g.: ls -alh /tmp -> /usr/bin/ls -alh /tmp -> [ '/usr/bin/ls', '-alh', '/tmp' ]
function Do(argv, callback, opts) {

	// Exec argv
	let [ exit, pid, stdin_fd, stdout_fd, stderr_fd ] = GLib.spawn_async_with_pipes(null,	// inherit parent working directory
											argv,	// args
											null,	// env
											GLib.SpawnFlags.DO_NOT_REAP_CHILD,
											null);	// child setup

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
		let [ stdout, out_size ] = data_stdout.read_upto('\0', 1, null);
		// Standard Error
		let [ stderr, err_size ] = data_stderr.read_upto('\0', 1, null);

		// Method 2: read line by line
		// Standard Output
//		let [ out, out_size ] = data_stdout.read_line(null);
//		let stdout = out ? out + '\n' : out;
//		while (out_size > 0) {
//			[ out, out_size ] = data_stdout.read_line(null);
//			if (out)
//				stdout += out + '\n';
//		}
		// Standard Error
//		let [ err, err_size ] = data_stderr.read_line(null);
//		let stderr = err ? err + '\n' : err;
//		while (err_size > 0) {
//			[ err, err_size ] = data_stderr.read_line(null);
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
	let got = [];
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
	let got = [];
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
	let got = [];
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

// BatteryLevel: battery level for icons
function BatteryLevel(raw) {

	// Battery Level:
	//	unknown	-> 1
	//	full	-> 2
	//	good	-> 3
	//	low	-> 5
	//	empty	-> 7

	let level = 1;

	if (raw.isNaN)
		return level;

	let bt = raw * 1;

	if (bt > 75)
		level = 2;
	else if (bt <= 75 && bt > 50)
		level = 3;
	else if (bt <= 50 && bt > 25)
		level = 5;
	else if (bt <= 25)
		level = 7;

	return level;

}

// LoadLevel: load level for icons
function LoadLevel(raw) {

	// Load Level:
	//	unknown	-> 1
	//	full	-> 23
	//	good	-> 17
	//	low	-> 13
	//	empty	-> 11

	let level = 1;

	if (raw.isNaN)
		return level;

	let load = raw * 1;

	if (load > 75)
		level = 23;
	else if (load <= 75 && load > 50)
		level = 17;
	else if (load <= 50 && load > 25)
		level = 13;
	else if (load <= 25)
		level = 11;

	return level;

}

// toFahrenheit: °C -> °F
function toFahrenheit(c) {

	return ((9 / 5) * c + 32);

}

// formatTemp: Format temperature + °C/F
function formatTemp(value) {

	// Don't do anything if not a number
	if (isNaN(value))
		return value;

	// UPS temperature unit (Centigrade/Fahrenheit)
	let unit = Convenience.getSettings().get_string('temp-unit');

	if (unit == 'Fahrenheit')
		value = toFahrenheit(value);

	return '%.1f %s'.format(value, unit == 'Fahrenheit' ? '\u00b0F' : '\u00b0C');

}

// parseStatus: Status Parser
function parseStatus(raw, icon) {

	let st = raw.split(' ');

	let line = '', status = '', icon_line = '', icon_alarm = '';

	// Iterate through each status
	for (let i = 0; i < st.length; i++) {

		switch (st[i])
		{
		case 'OL':

			// TRANSLATORS: Device status @ device status box
			line += _(" on line");
			icon_line = 'o';
			break;

		case 'OB':

			// TRANSLATORS: Device status @ device status box
			line += _(" on battery");
			icon_line = 'b';
			break;

		case 'LB':

			// TRANSLATORS: Device status @ device status box
			status += _(", low battery");
			icon_alarm = 'a';
			break;

		case 'RB':

			// TRANSLATORS: Device status @ device status box
			status += _(", replace battery");
			icon_alarm = 'a';
			break;

		case 'CHRG':

			// TRANSLATORS: Device status @ device status box
			status += _(", charging");
			break;

		case 'DISCHRG':

			// TRANSLATORS: Device status @ device status box
			status += _(", discharging");
			icon_alarm = 'a';
			break;

		case 'BYPASS':

			// TRANSLATORS: Device status @ device status box
			status += _(", bypass");
			icon_alarm = 'a';
			break;

		case 'CAL':

			// TRANSLATORS: Device status @ device status box
			status += _(", runtime calibration");
			icon_alarm = 'a';
			break;

		case 'OFF':

			// TRANSLATORS: Device status @ device status box
			status += _(", offline");
			break;

		case 'OVER':

			// TRANSLATORS: Device status @ device status box
			status += _(", overloaded");
			icon_alarm = 'a';
			break;

		case 'TRIM':

			// TRANSLATORS: Device status @ device status box
			status += _(", trimming");
			icon_alarm = 'a';
			break;

		case 'BOOST':

			// TRANSLATORS: Device status @ device status box
			status += _(", boosting");
			icon_alarm = 'a';
			break;

		case 'FSD':

			// TRANSLATORS: Device status @ device status box
			status += _(", forced shutdown");
			icon_alarm = 'a';
			break;

		case 'ALARM':

			icon_alarm = 'a';
			break;

		default:

			break;

		}

	}

	// For panel/menu icons
	if (icon)
		return { line: icon_line, alarm: icon_alarm };

	// For menu label/description

	// Trim line, remove leading comma from status and then trim it
	// TRANSLATORS: Stupid comment (from 1973 Walt Disney's Robin Hood) @ device status box
	return { line: line.trim(), status: status ? status.substring(1).trim() : _("\u201f..and all's well!\u201d [NUTSY (shouting)]") };

}

// parseTime: Time Parser (from seconds to dhms)
function parseTime(raw) {

	// Don't do anything if not a number
	if (isNaN(raw))
		return raw;

	return (
		// TRANSLATORS: Days @ remaining time
		(Math.floor(raw / 86400) != 0 ? Math.floor(raw / 86400) + _("d ") : '') +
		// TRANSLATORS: Hours @ remaining time
		(Math.floor(((raw / 86400) % 1) * 24) != 0 ? Math.floor(((raw / 86400) % 1) * 24) + _("h ") : '') +
		// TRANSLATORS: Minutes @ remaining time
		(Math.floor(((raw / 3600) % 1) * 60) != 0 ? Math.floor(((raw / 3600) % 1) * 60) + _("m ") : '') +
		// TRANSLATORS: Seconds @ remaining time
		Math.round(((raw / 60) % 1) * 60) + _("s")
	);

}

// parseText: from a raw text to multi-row text where each row is at most len char long.
// If words (tokens from raw separated by sep) are shorter then len they won't be split
// otherwise they'll be split so that the resulting row will have a length of len chars
function parseText(raw, len, sep) {

	// Don't do anything if raw is shorter than len
	if (raw.length <= len)
		return raw;

	// If sep isn't given we assume it's a space
	if (!sep)
		sep = ' ';

	// Tokenize raw
	let tok = raw.split(sep);

	let ret = '';
	let i = 0;

	// Iterate through each token
	while (i < (tok.length)) {

		let repeat = 1;
		let row = '';

		while (repeat && (i < tok.length)) {

			let buf = '' + tok[i];

			// Case: row is going to be longer than len (trailing space is not considered here since we're going to trim it)
			if ((row.length + buf.length) > (sep != ' ' ? len - sep.length : len)) {

				// Token is longer than len -> we can split it up
				if (buf.length > (sep != ' ' ? len - sep.length : len)) {

					row += tok[i];
					tok[i] = row.slice(len);
					row = row.slice(0, len);

				}

				// If token is shorter than len, we'll close this row and push token to next row

				repeat = 0;

			// Case: still building row
			} else {

				// Restore sep between tokens
				row += tok[i] + sep;
				i++;

			}

		}

		// Remove leading and trailing space and add new line character
		ret += row.trim() + '\n';

	}

	// Remove trailing sep (if not a space) and \n from ret
	return ret.slice(0, sep != ' ' ? ret.length - 2 : ret.length - 1);

}

// cmdI18n: Translate description of device's commands
function cmdI18n(cmd) {

	switch (cmd['cmd'])
	{
	case 'load.off':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn off the load immediately");
		break;

	case 'load.on':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn on the load immediately");
		break;

	case 'load.off.delay':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn off the load possibly after a delay");
		break;

	case 'load.on.delay':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn on the load possibly after a delay");
		break;

	case 'shutdown.return':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn off the load possibly after a delay and return when power is back");
		break;

	case 'shutdown.stayoff':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Turn off the load possibly after a delay and remain off even if power returns");
		break;

	case 'shutdown.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Stop a shutdown in progress");
		break;

	case 'shutdown.reboot':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Shut down the load briefly while rebooting the UPS");
		break;

	case 'shutdown.reboot.graceful':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("After a delay, shut down the load briefly while rebooting the UPS");
		break;

	case 'test.panel.start':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start testing the UPS panel");
		break;

	case 'test.panel.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Stop a UPS panel test");
		break;

	case 'test.failure.start':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start a simulated power failure");
		break;

	case 'test.failure.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Stop simulating a power failure");
		break;

	case 'test.battery.start':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start a battery test");
		break;

	case 'test.battery.start.quick':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start a \"quick\" battery test");
		break;

	case 'test.battery.start.deep':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start a \"deep\" battery test");
		break;

	case 'test.battery.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Stop the battery test");
		break;

	case 'calibrate.start':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Start runtime calibration");
		break;

	case 'calibrate.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Stop runtime calibration");
		break;

	case 'bypass.start':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Put the UPS in bypass mode");
		break;

	case 'bypass.stop':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Take the UPS out of bypass mode");
		break;

	case 'reset.input.minmax':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Reset minimum and maximum input voltage status");
		break;

	case 'reset.watchdog':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Reset watchdog timer (forced reboot of load)");
		break;

	case 'beeper.enable':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Enable UPS beeper/buzzer");
		break;

	case 'beeper.disable':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Disable UPS beeper/buzzer");
		break;

	case 'beeper.mute':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Temporarily mute UPS beeper/buzzer");
		break;

	case 'beeper.toggle':

		// TRANSLATORS: UPS Command description
		cmd['desc'] = _("Toggle UPS beeper/buzzer");
		break;

	// outlet.n.{shutdown.return,load.off,load.on,load.cycle}
	default:

		if (cmd['cmd'].slice(0, 6) == 'outlet') {

			let buf = cmd['cmd'].split('.');

			switch (buf[2] + '.' + buf[3])
			{
			case 'shutdown.return':

				// TRANSLATORS: UPS Command description
				cmd['desc'] = _("Turn off the outlet #%d possibly after a delay and return when power is back").format(buf[1]);
				break;

			case 'load.off':

				// TRANSLATORS: UPS Command description
				cmd['desc'] = _("Turn off the outlet #%d immediately").format(buf[1]);
				break;

			case 'load.on':

				// TRANSLATORS: UPS Command description
				cmd['desc'] = _("Turn on the outlet #%d immediately").format(buf[1]);
				break;

			case 'load.cycle':

				// TRANSLATORS: UPS Command description
				cmd['desc'] = _("Power cycle the outlet #%d immediately").format(buf[1]);
				break;

			default:

				break;

			}

		}

		break;

	}

	return cmd;

}
