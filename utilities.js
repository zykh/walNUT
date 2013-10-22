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

// To notify new UPS found/not found
const	Main = imports.ui.main;

// getLocale: returns the current locale (eg. en_US.utf8, it_IT.utf8.. or, for a multi-LANGUAGE variable, en, it ..) or null
function getLocale() {

	// Get environment variables
	let env = GLib.get_environ();

	// Try LANG variable
	let locale = GLib.environ_getenv(env,'LANG');

	// If not available, try LC_ALL
	if (!locale)
		locale = GLib.environ_getenv(env,'LC_ALL');

	// If not available, try LANGUAGE
	if (!locale) {
		locale = GLib.environ_getenv(env,'LANGUAGE');
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

// parserO: creates an object[val1] = val2 splitting each line of txt using sep as separator in val1 (up to sep) and val2 (from sep to end)
function toObj(txt, sep) {

	let output = txt.split('\n');
	let vars = {};

	// iterate through each lines and get every variable
	for (let i = 0; i < output.length; i++){

		// Skip empty tokens
		if (!output[i])
			continue;

		// don't use split to avoid unwanted results (since the value may contain another sep not used as a separator)
		let n = output[i].indexOf(sep);
		vars[output[i].substring(0,n).trim()] = output[i].substring(n+1).trim();

	}

	return vars;

}

// parserA: creates an array of obj[label1=>val1, label2=>val2] splitting each line of txt using sep as separator in val1 (up to sep) and val2 (from sep to end)
function toArr(txt, sep, label1, label2) {

	let output = txt.split('\n');
	let vars = new Array();

	// iterate through each lines and get every variable
	for(let i = 0; i < output.length; i++){

		// Skip empty tokens
		if (!output[i])
			continue;

		// don't use split to avoid unwanted results (since the value may contain another sep not used as a separator)
		let variable = {};
		let n = output[i].indexOf(sep);

		variable[label1] = output[i].substring(0,n).trim();
		variable[label2] = output[i].substring(n+1).trim();

		vars.push(variable);

	}

	return vars;

}

// Do: exec argv and return an array of stdout and stderr, if any (otherwise it returns null, e.g.: [stdout, null] -> no errors)
// argv must be an already parsed to array full path-ed executable and its arguments
// e.g.: ls -alh /tmp -> /usr/bin/ls -alh /tmp -> ['/usr/bin/ls', '-alh', '/tmp']
function Do(argv) {

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

	// Child watch
	let child_watch = GLib.child_watch_add(GLib.PRIORITY_DEFAULT, pid, Lang.bind(this, function(pid, status, requestObj) {
		GLib.source_remove(child_watch);
	}));

	// Read stdout and stderr
	// Method 1: read all
	// Standard Output
	let [stdout, out_size] = data_stdout.read_upto('\0', 1, null);
	// Standard Error
	let [stderr, err_size] = data_stderr.read_upto('\0', 1, null);

	// Method 2: read line by line
	// Standard Output
//	let [out, out_size] = data_stdout.read_line(null);
//	let stdout = out ? out+'\n' : out;
//	while (out_size > 0) {
//		[out, out_size] = data_stdout.read_line(null);
//		if (out)
//			stdout += out+'\n';
//	}
	// Standard Error
//	let [err, err_size] = data_stderr.read_line(null);
//	let stderr = err ? err+'\n' : err;
//	while (err_size > 0) {
//		[err, err_size] = data_stderr.read_line(null);
//		if (err)
//			stderr += err+'\n';
//	}

	// Close file descriptor for standard output & error
	stdout_str.close(null);
	stderr_str.close(null);

	return [stdout, stderr];

}

// DoT: exec function Do with a time limit: on timeout return stderr = 'Error! '
function DoT(timeoutPath, timeout, argv) {

	// timeout fallback of 100 ms
	if (!timeout || isNaN(timeout))
		timeout = 0.100;

	argv.unshift('%s'.format(timeoutPath), '-s', 'SIGKILL', '%fs'.format(timeout));

	let [stdout, stderr] = Do(argv);

	// Return 'Error! ' on timeout
	if (!stdout && !stderr)
		stderr = 'Error! ';

	return [stdout, stderr];

}

// checkUps: check through upsc whether a given UPS (in format name@hopt:port) is available or not
function checkUps(timeoutPath, timeout, upsc, ups) {

	let av;
	let [stdout, stderr] = DoT(timeoutPath, timeout, ['%s'.format(upsc), '%s'.format(ups)]);

	if (!stdout || stdout.length == 0 || (stderr && stderr.slice(0,7) == 'Error: '))
		av = 0;
	else
		av = 1;

	return av;

}

// getUps: returns an array of obj{ name: upsname, host: upshostname, port: upsport, user: username, pw: password } adding to already listed UPSes each UPS available at a given host:port
//	notify: whether we have to notify new devices found/not found or not
function getUps(timeoutPath, timeout, notify, upsc, host, port) {

	// Retrieving actual UPSes stored in schema
	let settings = Convenience.getSettings();

	let got = Array();

	let stored = settings.get_string('ups');

	// e.g.: got = [ { name: 'name', host: 'host', port: 'port'}, {name: 'name1', host: 'host1', port: 'port1', user: 'user1', pw: 'pw1' } .. ]
	got = JSON.parse(!stored || stored == '' ? '[]' : stored);

	// Store here the actual length of the retrieved list
	let l = got.length;

	// If list is empty we'll check localhost:3493
	if (!host && l == 0)
		host = 'localhost';
	if (!port && l == 0)
		port = '3493';

	let stdout, stderr;
	if (host && port)
		[stdout, stderr] = DoT(timeoutPath, timeout, ['%s'.format(upsc), '-l', '%s:%s'.format(host, port)]);

	// Unable to find an UPS/No new UPS to search -> returns already available ones
	if (!stdout || stdout.length == 0 || (stderr && stderr.slice(0,7) == 'Error: ')) {

		// Notify
		if (notify)
			// TRANSLATORS: Notify title/description for error while searching new devices
			Main.notifyError(_("NUT: Error!"), _("Unable to find new devices at host %s:%s").format(host, port));

		// No stored UPSes
		if (got.length == 0)
			return got;

		// Check which stored UPS is available
		let checked = Array();

		for each (let item in got){
			let av = checkUps(timeoutPath, timeout, upsc, '%s@%s:%s'.format(item.name, item.host, item.port));
			item.av = av;
			checked.push(item);
		}

		return checked;

	}

	// Splitting upsc answer in token: each token = an UPS
	let buffer = stdout.split('\n');

	// Number of devices found
	let df = 0;

	// Iterate through each token
	for (let i = 0; i < buffer.length; i++) {

		// Skip empty token
		if (buffer[i].length == 0)
			continue;

		let ups = {};

		ups.name = buffer[i];
		ups.host = host;
		ups.port = port;

		// Check if we already have this UPS
		let recurse = 1;

		// Don't do anything if there aren't stored UPSes in the list
		if (l != 0) {

			for (let j = 0; j < got.length && recurse; j++) {

				if (got[j].name == ups.name && got[j].host == ups.host && got[j].port == ups.port)
					recurse = 0;

			}

		}

		// New UPS found!
		if (recurse) {

			got.push(ups);

			// Notify
			if (notify) {

				// TRANSLATORS: Notify title/description on every new device found
				Main.notify(_("NUT: new device found"), _("Found device %s at host %s:%s").format(ups.name, ups.host, ups.port));
				df++;

			}

		}

	}

	// Notify
	if (notify) {

		// Devices found (more than 1)
		if (df > 1)
			// TRANSLATORS: Notify title/description on new devices found (more than one)
			Main.notify(_("NUT: new devices found"), _("Found %d devices at host %s:%s").format(df, host, port));
		// No devices found
		else if (!df)
			// TRANSLATORS: Notify title/description for error while searching new devices
			Main.notifyError(_("NUT: Error!"), _("Unable to find new devices at host %s:%s").format(host, port));

	}

	// First item of got array is the 'chosen' UPS: preserve it
	let chosen = got.shift();
	// Then sorting UPSes in alphabetical order (host:port, and then name)
	got.sort(function(a, b) { return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0); });
	// And now restore chosen UPS
	got.unshift(chosen);

	// Store new UPS in schema
	if (got.length > l)
		settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// Check which stored UPS is available
	let checked = Array();
	for each (let item in got){

		let av = checkUps(timeoutPath, timeout, upsc, '%s@%s:%s'.format(item.name, item.host, item.port));

		item.av = av;

		checked.push(item);

	}

	// Return stored UPSes + availability
	// e.g.: checked = [ { name: 'name', host: 'host', port: 'port', av:0 }, { name: 'name1', host: 'host1', port: 'port1', user: 'user1', pw: 'pw1', av: 1 } .. ]
	return checked;

}

// defaultUps: pick chosen UPS
function defaultUps(id) {

	// Don't do anything if UPS is already the chosen one
	if (id == 0)
		return;

	let settings = Convenience.getSettings();

	// Retrieving actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// Pick 'chosen' UPS
	let chosen = got.splice(id,1);
	// Then sorting UPSes in alphabetical order (host:port, and then name)
	got.sort(function(a, b) { return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0); });
	// And now restore chosen UPS
	got.unshift(chosen[0]);

	// Store newly ordered UPS list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// upsCred: update chosen UPS (the first one in UPS list stored in schema) credentials (user & pw)
function upsCred(user, pw) {

	let settings = Convenience.getSettings();

	// Retrieving actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to update credentials is through panel menu
	// and for the chosen UPS, that's at first position in UPS list
	// If user or password are empty we'll delete them from UPS's properties
	if (user.length > 0)
		got[0].user = user;
	else
		delete got[0].user;

	if (pw.length > 0)
		got[0].pw = pw;
	else
		delete got[0].pw;

	// Store back UPS list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}

// upsDel: remove chosen UPS (the first one) from UPS list stored in schema
function upsDel() {

	let settings = Convenience.getSettings();

	// Retrieving actual UPSes stored in schema
	let got = Array();
	got = JSON.parse(settings.get_string('ups') == '' ? '[]' : settings.get_string('ups'));

	// No UPSes stored in schema? return
	if (got.length == 0)
		return;

	// We're going to operate on the first item (index = 0)
	// since the only way to delete an UPS is through panel menu
	// and for the chosen UPS, that's at first position in UPS list
	got.shift();

	// Store back UPS list in schema
	settings.set_string('ups', '%s'.format(JSON.stringify(got)));

	// and then return
	return;

}
