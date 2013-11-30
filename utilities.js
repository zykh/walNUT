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

const	GLib = imports.gi.GLib;

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

// setAsDefaultUPS: pick chosen UPS
function setAsDefaultUPS(id) {

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
	got.sort(
		function(a, b) {
			return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (
				((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0
			);
		}
	);

	// And now restore chosen UPS
	got.unshift(chosen[0]);

	// Store newly ordered devices list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// setUPSCredentials: update chosen UPS's (the first one in devices list stored in schema) credentials (user & password)
// args = {
//	username: username to authenticate
//	password: password to authenticate
// }
function setUPSCredentials(args) {

	let user = args.username;
	let pw = args.password;

	let settings = Convenience.getSettings();

	// Retrieve actual UPSes stored in schema
	let got = [];
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to update credentials is through the panel menu
	// and for the chosen UPS, that's at first position in devices list
	// If user or password are empty we'll delete them from UPS's properties
	if (user.length > 0)
		got[0].user = user;
	else
		delete got[0].user;

	if (pw.length > 0)
		got[0].pw = pw;
	else
		delete got[0].pw;

	// Store back devices list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// deleteUPS: remove chosen UPS (the first one) from devices list stored in schema
function deleteUPS() {

	let settings = Convenience.getSettings();

	// Retrieve actual UPSes stored in schema
	let got = [];
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to delete an UPS is through the panel menu
	// and for the chosen UPS, that's at first position in devices list
	got.shift();

	// Store back devices list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// parseBatteryLevel: parse battery level for icons
function parseBatteryLevel(raw) {

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

// parseLoadLevel: parse load level for icons
function parseLoadLevel(raw) {

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
//  *raw*: raw status from the device (e.g. 'OB ALARM')
//  *icon*: boolean, whether this function is used for icons (true) or not (false)
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
			icon_line = 'O';
			break;

		case 'OB':

			// TRANSLATORS: Device status @ device status box
			line += _(" on battery");
			icon_line = 'B';
			break;

		case 'LB':

			// TRANSLATORS: Device status @ device status box
			status += _(", low battery");
			icon_alarm = 'A';
			break;

		case 'RB':

			// TRANSLATORS: Device status @ device status box
			status += _(", replace battery");
			icon_alarm = 'A';
			break;

		case 'CHRG':

			// TRANSLATORS: Device status @ device status box
			status += _(", charging");
			break;

		case 'DISCHRG':

			// TRANSLATORS: Device status @ device status box
			status += _(", discharging");
			icon_alarm = 'A';
			break;

		case 'BYPASS':

			// TRANSLATORS: Device status @ device status box
			status += _(", bypass");
			icon_alarm = 'A';
			break;

		case 'CAL':

			// TRANSLATORS: Device status @ device status box
			status += _(", runtime calibration");
			icon_alarm = 'A';
			break;

		case 'OFF':

			// TRANSLATORS: Device status @ device status box
			status += _(", offline");
			break;

		case 'OVER':

			// TRANSLATORS: Device status @ device status box
			status += _(", overloaded");
			icon_alarm = 'A';
			break;

		case 'TRIM':

			// TRANSLATORS: Device status @ device status box
			status += _(", trimming");
			icon_alarm = 'A';
			break;

		case 'BOOST':

			// TRANSLATORS: Device status @ device status box
			status += _(", boosting");
			icon_alarm = 'A';
			break;

		case 'FSD':

			// TRANSLATORS: Device status @ device status box
			status += _(", forced shutdown");
			icon_alarm = 'A';
			break;

		case 'ALARM':

			icon_alarm = 'A';
			break;

		default:

			break;

		}

	}

	// For panel/menu icons
	if (icon)
		return {
			line: icon_line,
			alarm: icon_alarm
		};

	// For menu label/description

	// Trim line, remove leading comma from status and then trim it
	return {
		line: line.trim(),
		// TRANSLATORS: Stupid comment (from 1973 Walt Disney's Robin Hood) @ device status box
		status: status ? status.substring(1).trim() : _("\u201f..and all's well!\u201d [NUTSY (shouting)]")
	};

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

// parseText: from a raw text to multi-row text where each row is at most *len* char long.
// If words (tokens from *raw* separated by *sep*) are shorter then *len* they won't be split
// otherwise they'll be split so that the resulting row will have a length of *len* chars
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

// cmdI18n: Translate description of device commands
// cmd = {
//	cmd: command name
//	desc: command description
// }
function cmdI18n(cmd) {

	switch (cmd.cmd)
	{
	case 'load.off':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn off the load immediately");
		break;

	case 'load.on':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn on the load immediately");
		break;

	case 'load.off.delay':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn off the load possibly after a delay");
		break;

	case 'load.on.delay':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn on the load possibly after a delay");
		break;

	case 'shutdown.return':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn off the load possibly after a delay and return when power is back");
		break;

	case 'shutdown.stayoff':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Turn off the load possibly after a delay and remain off even if power returns");
		break;

	case 'shutdown.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Stop a shutdown in progress");
		break;

	case 'shutdown.reboot':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Shut down the load briefly while rebooting the UPS");
		break;

	case 'shutdown.reboot.graceful':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("After a delay, shut down the load briefly while rebooting the UPS");
		break;

	case 'test.panel.start':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start testing the UPS panel");
		break;

	case 'test.panel.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Stop a UPS panel test");
		break;

	case 'test.failure.start':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start a simulated power failure");
		break;

	case 'test.failure.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Stop simulating a power failure");
		break;

	case 'test.battery.start':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start a battery test");
		break;

	case 'test.battery.start.quick':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start a \"quick\" battery test");
		break;

	case 'test.battery.start.deep':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start a \"deep\" battery test");
		break;

	case 'test.battery.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Stop the battery test");
		break;

	case 'calibrate.start':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Start runtime calibration");
		break;

	case 'calibrate.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Stop runtime calibration");
		break;

	case 'bypass.start':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Put the UPS in bypass mode");
		break;

	case 'bypass.stop':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Take the UPS out of bypass mode");
		break;

	case 'reset.input.minmax':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Reset minimum and maximum input voltage status");
		break;

	case 'reset.watchdog':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Reset watchdog timer (forced reboot of load)");
		break;

	case 'beeper.enable':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Enable UPS beeper/buzzer");
		break;

	case 'beeper.disable':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Disable UPS beeper/buzzer");
		break;

	case 'beeper.mute':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Temporarily mute UPS beeper/buzzer");
		break;

	case 'beeper.toggle':

		// TRANSLATORS: UPS Command description
		cmd.desc = _("Toggle UPS beeper/buzzer");
		break;

	// outlet.n.{shutdown.return,load.off,load.on,load.cycle}
	default:

		if (cmd.cmd.slice(0, 6) == 'outlet') {

			let buf = cmd.cmd.split('.');

			switch (buf[2] + '.' + buf[3])
			{
			case 'shutdown.return':

				// TRANSLATORS: UPS Command description
				cmd.desc = _("Turn off the outlet #%d possibly after a delay and return when power is back").format(buf[1]);
				break;

			case 'load.off':

				// TRANSLATORS: UPS Command description
				cmd.desc = _("Turn off the outlet #%d immediately").format(buf[1]);
				break;

			case 'load.on':

				// TRANSLATORS: UPS Command description
				cmd.desc = _("Turn on the outlet #%d immediately").format(buf[1]);
				break;

			case 'load.cycle':

				// TRANSLATORS: UPS Command description
				cmd.desc = _("Power cycle the outlet #%d immediately").format(buf[1]);
				break;

			default:

				break;

			}

		}

		break;

	}

	return cmd;

}
