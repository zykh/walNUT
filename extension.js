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

const	Atk = imports.gi.Atk,
	Clutter = imports.gi.Clutter,
	Config = imports.misc.config,
	Lang = imports.lang,
	Main = imports.ui.main,
	Mainloop = imports.mainloop,
	ModalDialog = imports.ui.modalDialog,
	PanelMenu = imports.ui.panelMenu,
	PopupMenu = imports.ui.popupMenu,
	ShellEntry = imports.ui.shellEntry,
	Slider = imports.ui.slider,
	St = imports.gi.St,
	Util = imports.misc.util;

// Gettext
const	Gettext = imports.gettext.domain('gnome-shell-extensions-walnut'),
	_ = Gettext.gettext;

const	Me = imports.misc.extensionUtils.getCurrentExtension(),
	Convenience = Me.imports.convenience,
	// Import utilities.js
	Utilities = Me.imports.utilities;

// Panel Icons
const	Icons = {
	// Error = E
	E:	'nut-error',

	// Battery	| Load
	// full = 2	| full = 23
	// good = 3	| good = 17
	// low = 5	| low = 13
	// empty = 7	| empty = 11
	// no battery/no load = 1
	// +: lightning = online (= status OL = not on battery (OB = B) = mains is not absent): full opacity = charging => O | transparent = charged => C
	// +: ! = caution (ALARM, BYPASS, OVER, RB..) => A

	// status = OB (-> B) - no caution
	// no battery/no load -> 1
	B1:	'nut-ghost-ob',
	//	battery full -> 2
	B2:	'nut-battery-full',
	B46:	'nut-battery-full-load-full',
	B34:	'nut-battery-full-load-good',
	B26:	'nut-battery-full-load-low',
	B22:	'nut-battery-full-load-empty',
	//	battery good -> 3
	B3:	'nut-battery-good',
	B69:	'nut-battery-good-load-full',
	B51:	'nut-battery-good-load-good',
	B39:	'nut-battery-good-load-low',
	B33:	'nut-battery-good-load-empty',
	//	battery low -> 5
	B5:	'nut-battery-low',
	B115:	'nut-battery-low-load-full',
	B85:	'nut-battery-low-load-good',
	B65:	'nut-battery-low-load-low',
	B55:	'nut-battery-low-load-empty',
	//	battery empty -> 7
	B7:	'nut-battery-empty',
	B161:	'nut-battery-empty-load-full',
	B119:	'nut-battery-empty-load-good',
	B91:	'nut-battery-empty-load-low',
	B77:	'nut-battery-empty',
	// just load
	//	load full -> 23
	B23:	'nut-battery-na-load-full',
	//	load good -> 17
	B17:	'nut-battery-na-load-good',
	//	load low -> 13
	B13:	'nut-battery-na-load-low',
	//	load empty -> 11
	B11:	'nut-battery-na-load-empty',

	// status = OB (->B) - caution (->A)
	// no battery/no load -> 1
	BA1:	'nut-ghost-ob-caution',
	//	battery full -> 2
	BA2:	'nut-battery-full-caution',
	BA46:	'nut-battery-full-load-full-caution',
	BA34:	'nut-battery-full-load-good-caution',
	BA26:	'nut-battery-full-load-low-caution',
	BA22:	'nut-battery-full-load-empty-caution',
	//	battery good -> 3
	BA3:	'nut-battery-good-caution',
	BA69:	'nut-battery-good-load-full-caution',
	BA51:	'nut-battery-good-load-good-caution',
	BA39:	'nut-battery-good-load-low-caution',
	BA33:	'nut-battery-good-load-empty-caution',
	//	battery low -> 5
	BA5:	'nut-battery-low-caution',
	BA115:	'nut-battery-low-load-full-caution',
	BA85:	'nut-battery-low-load-good-caution',
	BA65:	'nut-battery-low-load-low-caution',
	BA55:	'nut-battery-low-load-empty-caution',
	//	battery empty -> 7
	BA7:	'nut-battery-empty-caution',
	BA161:	'nut-battery-empty-load-full-caution',
	BA119:	'nut-battery-empty-load-good-caution',
	BA91:	'nut-battery-empty-load-low-caution',
	BA77:	'nut-battery-empty-caution',
	// just load
	//	load full -> 23
	BA23:	'nut-battery-na-load-full-caution',
	//	load good -> 17
	BA17:	'nut-battery-na-load-good-caution',
	//	load low -> 13
	BA13:	'nut-battery-na-load-low-caution',
	//	load empty -> 11
	BA11:	'nut-battery-na-load-empty-caution',

	// status = OL (->O[+C])
	// no battery/no load -> 1
	OC1:	'nut-ghost-ol-charged',
	O1:	'nut-ghost-ol-charging',
	//	battery full -> 2
	OC2:	'nut-battery-full-charged',
	O2:	'nut-battery-full-charging',
	OC46:	'nut-battery-full-load-full-charged',
	O46:	'nut-battery-full-load-full-charging',
	OC34:	'nut-battery-full-load-good-charged',
	O34:	'nut-battery-full-load-good-charging',
	OC26:	'nut-battery-full-load-low-charged',
	O26:	'nut-battery-full-load-low-charging',
	OC22:	'nut-battery-full-load-empty-charged',
	O22:	'nut-battery-full-load-empty-charging',
	//	battery good -> 3
	O3:	'nut-battery-good-charging',
	O69:	'nut-battery-good-load-full-charging',
	O51:	'nut-battery-good-load-good-charging',
	O39:	'nut-battery-good-load-low-charging',
	O33:	'nut-battery-good-load-empty-charging',
	//	battery low -> 5
	O5:	'nut-battery-low-charging',
	O115:	'nut-battery-low-load-full-charging',
	O85:	'nut-battery-low-load-good-charging',
	O65:	'nut-battery-low-load-low-charging',
	O55:	'nut-battery-low-load-empty-charging',
	//	battery empty -> 7
	O7:	'nut-battery-empty-charging',
	O161:	'nut-battery-empty-load-full-charging',
	O119:	'nut-battery-empty-load-good-charging',
	O91:	'nut-battery-empty-load-low-charging',
	O77:	'nut-battery-empty-charging',
	// just load
	//	load full -> 23
	OC23:	'nut-battery-na-load-full-charged',
	O23:	'nut-battery-na-load-full-charging',
	//	load good -> 17
	OC17:	'nut-battery-na-load-good-charged',
	O17:	'nut-battery-na-load-good-charging',
	//	load low -> 13
	OC13:	'nut-battery-na-load-low-charged',
	O13:	'nut-battery-na-load-low-charging',
	//	load empty -> 11
	OC11:	'nut-battery-na-load-empty-charged',
	O11:	'nut-battery-na-load-empty-charging',

	// status = OL (->O[+C]) - caution (->A)
	// no battery/no load ->
	OAC1:	'nut-ghost-ol-caution-charged',
	OA1:	'nut-ghost-ol-caution-charging',
	//	battery full -> 2
	OAC2:	'nut-battery-full-caution-charged',
	OA2:	'nut-battery-full-caution-charging',
	OAC46:	'nut-battery-full-load-full-caution-charged',
	OA46:	'nut-battery-full-load-full-caution-charging',
	OAC34:	'nut-battery-full-load-good-caution-charged',
	OA34:	'nut-battery-full-load-good-caution-charging',
	OAC26:	'nut-battery-full-load-low-caution-charged',
	OA26:	'nut-battery-full-load-low-caution-charging',
	OAC22:	'nut-battery-full-load-empty-caution-charged',
	OA22:	'nut-battery-full-load-empty-caution-charging',
	//	battery good -> 3
	OA3:	'nut-battery-good-caution-charging',
	OA69:	'nut-battery-good-load-full-caution-charging',
	OA51:	'nut-battery-good-load-good-caution-charging',
	OA39:	'nut-battery-good-load-low-caution-charging',
	OA33:	'nut-battery-good-load-empty-caution-charging',
	//	battery low -> 5
	OA5:	'nut-battery-low-caution-charging',
	OA115:	'nut-battery-low-load-full-caution-charging',
	OA85:	'nut-battery-low-load-good-caution-charging',
	OA65:	'nut-battery-low-load-low-caution-charging',
	OA55:	'nut-battery-low-load-empty-caution-charging',
	//	battery empty -> 7
	OA7:	'nut-battery-empty-caution-charging',
	OA161:	'nut-battery-empty-load-full-caution-charging',
	OA119:	'nut-battery-empty-load-good-caution-charging',
	OA91:	'nut-battery-empty-load-low-caution-charging',
	OA77:	'nut-battery-empty-caution-charging',
	// just load
	//	load full -> 23
	OAC23:	'nut-battery-na-load-full-caution-charged',
	OA23:	'nut-battery-na-load-full-caution-charging',
	//	load good -> 17
	OAC17:	'nut-battery-na-load-good-caution-charged',
	OA17:	'nut-battery-na-load-good-caution-charging',
	//	load low -> 13
	OAC13:	'nut-battery-na-load-low-caution-charged',
	OA13:	'nut-battery-na-load-low-caution-charging',
	//	load empty -> 11
	OAC11:	'nut-battery-na-load-empty-caution-charged',
	OA11:	'nut-battery-na-load-empty-caution-charging'
}

// Battery icon @ menu
const	BatteryIcon = {
	B1:	'imported-battery-missing',
	B2:	'imported-battery-full',
	B3:	'imported-battery-good',
	B5:	'imported-battery-low',
	B7:	'imported-battery-empty'
}

// Errors
const	ErrorType = {
	UPS_NA: 2,	// 'Chosen' UPS is not available
	NO_UPS: 4,	// No device found
	NO_NUT: 8	// NUT's executables (i.e. upsc) not found
}

// Max length (in chars)
const	Lengths = {
	ERR_LABEL: 35,	// ErrorBox Label
	ERR_DESC: 35,	// ErrorBox Description
	MODEL: 40,	// Device manufacturer+model
	TOPDATA: 40,	// Topdata (status/alarm) description (2nd row)
	RAW_VAR: 35,	// Raw data list: variable's name
	RAW_VALUE: 40,	// Raw data list: variable's value
	CMD: 45,	// UPS commands list - description
	CRED_DIALOG: 60	// Credentials dialog description
}

// Interval in milliseconds after which the extension should update the availability of the stored devices (15 minutes)
const	INTERVAL = 900000;

// Raw data button ornament
const RawDataButtonOrnament = {
	NONE:	0,
	OPENED:	1,
	CLOSED:	2
};

// UpscMonitor: exec upsc at a given interval and deliver infos
const	UpscMonitor = new Lang.Class({
	Name: 'UpscMonitor',

	_init: function() {

		// Actual status
		this._state |= ErrorType.NO_UPS | ErrorType.UPS_NA;

		// Device list
		this._devices = [];
		this._prevDevices = [];

		// Here we'll store chosen UPS's variables
		this._ups = {};
		this._vars = [];

		// upsc not found
		if (!upsc)
			this._state |= ErrorType.NO_NUT;
		else
			// Update devices
			this.update({ forceRefresh: true });

		// Get time between updates
		this._interval = gsettings.get_int('update-time');

		// Connect update on settings changed
		this._settingsChangedId = gsettings.connect('changed', Lang.bind(this, function() {

			// Update interval between updates
			this._interval = gsettings.get_int('update-time');

			// Remove timers
			if (this._timer)
				Mainloop.source_remove(this._timer);

			if (this._forceRefresh)
				Mainloop.source_remove(this._forceRefresh);

			// Update devices
			this.update({ forceRefresh: true });

			// Update infos
			this._updateTimer();

		}));

		this._updateTimer();

	},

	// getDevices: Get available devices
	// if a host:port is given call a function to check whether new UPSes are found there and add them to the already listed ones
	// otherwise, get stored UPSes or if there's no stored UPS try to find new ones at localhost:3493
	// args = {
	//	hostname: hostname,
	//	port: port,
	//	notify: whether we have to notify new devices found/not found or not
	// }
	getDevices: function(args) {

		let host, port, notify;

		if (args) {
			host = args.hostname;
			port = args.port;
			notify = args.notify;
		}

		// Save actual devices
		this._prevDevices = JSON.parse(JSON.stringify(this._devices));

		let got = [];

		// Retrieve actual UPSes stored in schema
		let stored = gsettings.get_string('ups');

		// e.g.:
		//  got = [
		//	{
		//		name: 'name',
		//		host: 'host',
		//		port: 'port'
		//	},
		//	{
		//		name: 'name1',
		//		host: 'host1',
		//		port: 'port1',
		//		user: 'user1',
		//		pw: 'pw1'
		//	},
		//		...
		//  ]
		got = JSON.parse(!stored || stored == '' ? '[]' : stored);

		if (!got.length)
			this._state |= ErrorType.NO_UPS;

		// If list is empty we'll check localhost:3493
		if (!host && !got.length)
			host = 'localhost';
		if (!port && !got.length)
			port = '3493';

		if (host && port) {

			Utilities.Do({
				command: [
					'%s'.format(upsc),
					'-l',
					'%s:%s'.format(host, port)
				],
				callback: Lang.bind(this, this._postGetDevices),
				opts: [
					notify,
					host,
					port
				]
			});

			return;

		}

		// No new UPS to search
		this._devices = got;

		// Check which stored UPS is available
		this._checkAll();

		this._state &= ~ErrorType.NO_UPS;

	},

	// _postGetDevices: process the result of the Do() function called by getDevices() and save them in schema and in this._devices as an array of objects:
	//  {
	//	name: upsname,
	//	host: upshostname,
	//	port: upsport,
	//	user: username,
	//	pw: password
	//  }
	// then call _checkAll() to fill the devices list with the availability of each stored UPS
	_postGetDevices: function(stdout, stderr, opts) {

		let notify = opts[0];
		let host = opts[1];
		let port = opts[2];

		let got = [];

		let stored = gsettings.get_string('ups');

		// e.g.:
		//  got = [
		//	{
		//		name: 'name',
		//		host: 'host',
		//		port: 'port'
		//	},
		//	{
		//		name: 'name1',
		//		host: 'host1',
		//		port: 'port1',
		//		user: 'user1',
		//		pw: 'pw1'
		//	},
		//		...
		// ]
		got = JSON.parse(!stored || stored == '' ? '[]' : stored);

		// Unable to find an UPS -> returns already available ones
		if (!stdout || stdout.length == 0 || (!stdout && !stderr) || (stderr && stderr.slice(0, 7) == 'Error: ')) {

			// Notify
			if (notify)
				Main.notifyError(
					// TRANSLATORS: Notify title/description for error while searching new devices
					_("NUT: Error!"),
					_("Unable to find new devices at host %s:%s").format(host, port)
				);

			this._devices = got;

			// No stored UPSes
			if (!this._devices.length) {

				this._state |= ErrorType.NO_UPS;

				return;

			}

			// Check which stored UPS is available
			this._checkAll();

			this._state &= ~ErrorType.NO_UPS;

			return;

		}

		// Store here the actual length of the retrieved list
		let l = got.length;

		// Split upsc answer in token: each token = an UPS
		let buffer = stdout.split('\n');

		// Number of devices found
		let foundDevices = 0;

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
			let isNew = 1;

			// Don't do anything if there aren't stored UPSes in the list
			if (l > 0) {

				for (let j = 0; j < got.length; j++) {

					if (got[j].name != ups.name)
						continue;

					if (got[j].host != ups.host)
						continue;

					if (got[j].port != ups.port)
						continue;

					isNew = 0;

					break;

				}

			}

			// New UPS found!
			if (isNew) {

				got.push(ups);

				// Notify
				if (notify) {

					Main.notify(
						// TRANSLATORS: Notify title/description on every new device found
						_("NUT: new device found"),
						_("Found device %s at host %s:%s").format(ups.name, ups.host, ups.port)
					);

					foundDevices++;

				}

			}

		}

		// Notify
		if (notify) {

			// Devices found (more than 1)
			if (foundDevices > 1)
				Main.notify(
					// TRANSLATORS: Notify title/description on new devices found (more than one)
					_("NUT: new devices found"),
					_("Found %d devices at host %s:%s").format(foundDevices, host, port)
				);

			// No devices found
			else if (!foundDevices)
				Main.notifyError(
					// TRANSLATORS: Notify title/description for error while searching new devices
					_("NUT: Error!"),
					_("Unable to find new devices at host %s:%s").format(host, port)
				);

		}

		// First item of got array is the 'chosen' UPS: preserve it
		let chosen = got.shift();

		// Then sort UPSes in alphabetical order (host:port, and then name)
		got.sort(
			function(a, b) {
				return ((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? 1 : (
					((a.host + a.port + a.name) > (b.host + b.port + b.name)) ? -1 : 0
				);
			}
		);

		// And now restore chosen UPS
		got.unshift(chosen);

		// Store new devices in schema
		if (got.length > l)
			gsettings.set_string('ups', '%s'.format(JSON.stringify(got)));

		this._devices = got;

		// Check which stored UPS is available
		this._checkAll();

		this._state &= ~ErrorType.NO_UPS;

	},

	// _checkAll: Check which stored UPS is available
	_checkAll: function() {

		for each (let item in this._devices) {

			// Just in case we lose the UPS..
			item.av = 0;

			Utilities.Do({
				command: [
					'%s'.format(upsc),
					'%s@%s:%s'.format(item.name, item.host, item.port)
				],
				callback: Lang.bind(this, this._checkUps),
				opts: [ item ]
			});

		}

	},

	// _checkUps: callback function to tell whether a given UPS is available or not
	// The currently processed UPS will get added to its properties its availability:
	// - if available -> av = 1:
	//   e.g. {
	//	name: 'name',
	//	host: 'host',
	//	port: 'port',
	//	av: 1
	//   }
	// - if not available -> av = 0:
	//   e.g. {
	//	name: 'name1',
	//	host: 'host1',
	//	port: 'port1',
	//	user: 'user1',
	//	pw: 'pw1',
	//	av: 0
	//   }
	_checkUps: function(stdout, stderr, opts) {

		// The UPS we're checking
		let ups = opts[0];

		if (!stdout || stdout.length == 0 || (!stdout && !stderr) || (stderr && stderr.slice(0, 7) == 'Error: '))
			ups.av = 0;
		else
			ups.av = 1;

		let updateNeeded = true;

		for each (let prev in this._prevDevices) {

			if (prev.name != ups.name)
				continue;

			if (prev.host != ups.host)
				continue;

			if (prev.port != ups.port)
				continue;

			if (prev.av != ups.av)
				continue;

			// Don't update the displayed list of devices if nothing changes
			updateNeeded = false;

		}

		if (updateNeeded && walnut) {

			// Refresh the list of devices
			walnut.refreshList();

		}

	},

	// _getVars: Retrieve chosen UPS's variables
	_getVars: function() {

		// Reset status
		this._state |= ErrorType.UPS_NA;

		Utilities.Do({
			command: [
				'%s'.format(upsc),
				'%s@%s:%s'.format(this._devices[0].name, this._devices[0].host, this._devices[0].port)
			],
			callback: Lang.bind(this, this._processVars),
			opts: [ this._devices[0] ]
		});

	},

	// _processVars: callback function for _getVars() - update status and vars
	_processVars: function(stdout, stderr, opts) {

		// The device the currently processed function belongs to
		let device = opts[0];

		let hasChanged = false;

		// The actual 'chosen' device
		let act = this._devices[0] || { name: '' };

		// This device is no longer the chosen one
		if (act.name != device.name || act.host != device.host || act.port != device.port)
			return;

		if (!stdout || stderr || (!stdout && !stderr)) {

			this._state |= ErrorType.UPS_NA;

			act.av = 0;

		} else {

			this._ups = Utilities.toObject(stdout, ':');
			this._vars = Utilities.toArray(stdout, ':', 'var', 'value');

			this._state &= ~ErrorType.UPS_NA;

			act.av = 1;

			// Update setvars/commands

			let prev = this._prevChosen || { name: '' };

			// Update only if something changed
			if (act.name != prev.name || act.host != prev.host || act.port != prev.port || act.av != prev.av) {

				if (upsrwDo)
					upsrwDo.update();

				if (upscmdDo)
					upscmdDo.update();

				hasChanged = true;

			}

		}

		if (this._forceRefresh) {

			Mainloop.source_remove(this._forceRefresh);

			delete this._forceRefresh;

		}

		// Update panel/menu
		if (walnut) {

			walnut.refreshPanel();

			if (walnut.menu.isOpen)
				walnut.refreshMenu({ forceRefresh: hasChanged });

		}

		// Save actually processed device
		this._prevChosen = JSON.parse(JSON.stringify(act));

	},

	// _updateTimer: update infos at a given interval
	_updateTimer: function() {

		if (this._state & ErrorType.NO_NUT)
			return;

		this.update();

		this._timer = Mainloop.timeout_add_seconds(this._interval, Lang.bind(this, this._updateTimer));

		// Just in case we lose the UPS..
		this._forceRefresh = Mainloop.timeout_add_seconds(2, Lang.bind(this, function() {

			if (walnut) {

				walnut.refreshPanel();

				if (walnut.menu.isOpen)
					walnut.refreshMenu({ forceRefresh: true });

			}

			delete this._forceRefresh;

		}));

	},

	// update: Search for available devices and then for the first one's variables
	// args = {
	//	forceRefresh: whether to do a refresh also if INTERVAL time isn't elapsed
	// }
	update: function(args) {

		let forceRefresh = args ? args.forceRefresh : false;

		// milliseconds
		let now = Date.now();

		// Last time the list has been updated
		if (!this._lastTime)
			this._lastTime = now;

		// Update the list
		if (forceRefresh || ((now - this._lastTime) > INTERVAL)) {

			this.getDevices();

			this._lastTime = now;

		}

		if (this._state & ErrorType.NO_UPS)
			return;

		this._getVars();

	},

	// getState: return actual UpscMonitor status (ErrorType.{NO_NUT,NO_UPS, ..})
	getState: function() {

		return this._state;

	},

	// getList: return actual device list and their availability
	getList: function() {

		return this._devices;

	},

	// getVars: return actual chosen device's variables in an Object where keys are variables' names
	// (e.g.: {
	//	'battery.charge': '100',
	//	'ups.status': 'OL',
	//		...
	// })
	getVars: function() {

		return this._ups;

	},

	// getVarsArr: return actual chosen device's variables in an Array of Objects with keys var and value
	// (e.g.: [
	//	{
	//		var: 'battery.charge',
	//		value: '100'
	//	},
	//	{
	//		var: 'ups.status',
	//		value: 'OL'
	//	},
	//		...
	// ])
	getVarsArr: function() {

		return this._vars;

	},

	// destroy: remove timer and disconnect signals
	destroy: function() {

		// Remove timers
		if (this._timer)
			Mainloop.source_remove(this._timer);

		if (this._forceRefresh)
			Mainloop.source_remove(this._forceRefresh);

		// Disconnect settings-changed connection
		gsettings.disconnect(this._settingsChangedId);

	}
});

// UpscmdDo: execute upscmd and process the reply
const	UpscmdDo = new Lang.Class({
	Name: 'UpscmdDo',

	_init: function() {

		this._hasCmds = false;

		this._cmds = [];

	},

	update: function() {

		// Reset status
		this._hasCmds = false;

		// Get actual device
		this._device = upscMonitor.getList()[0];

		// Don't do anything in case of errors
		if (upscMonitor.getState() & (ErrorType.NO_NUT | ErrorType.NO_UPS | ErrorType.UPS_NA))
			return;

		this._retrieveCmds();

	},

	// _retrieveCmds: get instant commands from the UPS through upscmd
	_retrieveCmds: function() {

		if (!upscmd) {
			this._hasCmds = false;
			return;
		}

		Utilities.Do({
			command: [
				'%s'.format(upscmd),
				'-l',
				'%s@%s:%s'.format(this._device.name, this._device.host, this._device.port)
			],
			callback: Lang.bind(this, this._processRetrievedCmds),
			opts: [ this._device ]
		});

	},

	// _processRetrievedCmds: callback function for _retrieveCmds()
	_processRetrievedCmds: function(stdout, stderr, opts) {

		// The device the currently processed function belongs to
		let device = opts[0];

		// The actually chosen device
		let act = upscMonitor.getList()[0] || { name: '' };

		// This device is no longer the chosen one
		if (act.name != device.name || act.host != device.host || act.port != device.port)
			return;

		if (!stdout && !stderr) {
			this._hasCmds = false;
			return;
		}

		let cmds;

		if (stderr)
			cmds = stderr;
		else
			cmds = stdout;

		// Error!
		if (cmds.length == 0 || cmds.slice(0, 7) == 'Error: ') {
			this._hasCmds = false;
			return;
		}

		this._cmds = [];

		// Parse reply to retrieve upscmd commands
		this._cmds = Utilities.toArray(cmds, '-', 'cmd', 'desc');

		// Remove leading comment
		this._cmds.shift();

		this._hasCmds = true;

	},

	hasCmds: function() {

		return this._hasCmds;

	},

	getCmds: function() {

		return this._cmds;

	},

	// cmdExec: try to exec a NUT instant command
	// args = {
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	device: device which should get the command
	//	command: command name
	//	extradata: extradata to pass to the command
	// }
	cmdExec: function(args) {

		let user = args.username;
		let pw = args.password;
		let device = args.device;
		let cmd = args.command;
		let extradata = args.extradata;

		let extra = extradata.trim();

		// We have both user and password
		if (user && pw) {

			Utilities.Do({
				command: [
					'%s'.format(upscmd),
					'-u',
					'%s'.format(user),
					'-p',
					'%s'.format(pw),
					'%s@%s:%s'.format(device.name, device.host, device.port),
					'%s'.format(cmd),
					'%s'.format(extra)
				],
				callback: Lang.bind(this, this._processExecutedCmd),
				opts: [
					device,
					cmd,
					extradata,
					user,
					pw
				]
			});

		// User, password or both are not available
		} else {

			// ..ask for them
			let credDialog = new CredDialogCmd({
				device: device,
				username: user,
				password: pw,
				command: cmd,
				extradata: extra
			});
			credDialog.open(global.get_current_time());

		}

	},

	// _processExecutedCmd: callback function for cmdExec() - process the result of the executed instant command
	_processExecutedCmd: function(stdout, stderr, opts) {

		let device = opts[0];

		let cmd = opts[1];

		let extra = opts[2];

		let user = opts[3];

		let pw = opts[4];

		let cmdExtra;

		if (extra.length)
			cmdExtra = '\'%s %s\''.format(cmd, extra);
		else
			cmdExtra = cmd;

		// Just a note here: upscmd uses always stderr (also if a command has been successfully sent to the driver)

		// stderr = "Unexpected response from upsd: ERR ACCESS-DENIED" -> Authentication error -> Wrong username or password
		if (stderr && stderr.indexOf('ERR ACCESS-DENIED') != -1) {

			// ..ask for them and tell the user the previuosly sent ones were wrong
			let credDialog = new CredDialogCmd({
				device: device,
				username: user,
				password: pw,
				command: cmd,
				extradata: extra,
				error: true
			});
			credDialog.open(global.get_current_time());

		// stderr = OK\n -> Command sent to the driver successfully
		} else if (stderr && stderr.indexOf('OK') != -1) {

			Main.notify(
				// TRANSLATORS: Notify title/description on command successfully sent
				_("NUT: command handled"),
				_("Successfully sent command %s to device %s@%s:%s").format(cmdExtra, device.name, device.host, device.port)
			);

			// Update vars/panel/menu (not devices)
			upscMonitor.update();

		// mmhh.. something's wrong here!
		} else {

			Main.notifyError(
				// TRANSLATORS: Notify title/description for error on command sent
				_("NUT: error while handling command"),
				_("Unable to send command %s to device %s@%s:%s").format(cmdExtra, device.name, device.host, device.port)
			);

		}

	}
});

// UpsrwDo: execute upsrw and process the reply
const	UpsrwDo = new Lang.Class({
	Name: 'UpsrwDo',

	_init: function() {

		this._hasSetVars = false;

		this._setVar = {};

	},

	update: function() {

		// Reset status
		this._hasSetVars = false;

		// Get actual device
		this._device = upscMonitor.getList()[0];

		// Don't do anything in case of errors
		if (upscMonitor.getState() & (ErrorType.NO_NUT | ErrorType.NO_UPS | ErrorType.UPS_NA))
			return;

		this._retrieveSetVars();

	},

	// _retrieveSetVars: get settable vars and their boundaries from the UPS through upsrw
	_retrieveSetVars: function() {

		if (!upsrw) {
			this._hasSetVars = false;
			return;
		}

		Utilities.Do({
			command: [
				'%s'.format(upsrw),
				'%s@%s:%s'.format(this._device.name, this._device.host, this._device.port)
			],
			callback: Lang.bind(this, this._processRetrievedSetVars),
			opts: [ this._device ]
		});

	},

	// _processRetrievedSetVars: callback function for _retrieveSetVars()
	_processRetrievedSetVars: function(stdout, stderr, opts) {

		// The device the currently processed function belongs to
		let device = opts[0];

		// The actual 'chosen' device
		let act = upscMonitor.getList()[0] || { name: '' };

		// This device is no longer the chosen one
		if (act.name != device.name || act.host != device.host || act.port != device.port)
			return;

		let svreply = '';

		if (!stdout && !stderr) {
			this._hasSetVars = false;
			return;
		}

		if (stderr)
			svreply = stderr;
		else
			svreply = stdout;

		// Error!
		if (svreply.length == 0 || svreply.slice(0, 7) == 'Error: ') {
			this._hasSetVars = false;
			return;
		}

		this._setVar = {};

		// Parse reply to get setvars
		this._setVar = Utilities.parseSetVar(svreply);

		// No setvars
		if (!Object.keys(this._setVar).length) {
			this._hasSetVars = false;
			return;
		}

		this._hasSetVars = true;

	},

	hasSetVars: function() {

		return this._hasSetVars;

	},

	getSetVars: function() {

		return this._setVar;

	},

	// setVar: try to set args.*varName* to args.*varValue* in args.*device*
	// args = {
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	device: device which should get the variable changed
	//	varName: variable's name
	//	varValue: variable's value
	// }
	setVar: function(args) {

		let device = args.device;
		let user = args.username;
		let pw = args.password;
		let varName = args.varName;
		let varValue = args.varValue;

		if (!user)
			user = device.user;

		if (!pw)
			pw = device.pw;

		// We have both user and password
		if (user && pw) {

			Utilities.Do({
				command: [
					'%s'.format(upsrw),
					'-s',
					'%s=%s'.format(varName, varValue),
					'-u',
					'%s'.format(user),
					'-p',
					'%s'.format(pw),
					'%s@%s:%s'.format(device.name, device.host, device.port)
				],
				callback: Lang.bind(this, this._processSetVar),
				opts: [
					device,
					varName,
					varValue,
					user,
					pw
				]
			});

		// User, password or both are not available
		} else {

			// ..ask for them
			let credDialog = new CredDialogSetvar({
				device: device,
				username: user,
				password: pw,
				varName: varName,
				varValue: varValue
			});
			credDialog.open(global.get_current_time());

		}

	},

	// _processSetVar: callback function for setVar()
	_processSetVar: function(stdout, stderr, opts) {

		let device = opts[0];

		let varName = opts[1];

		let varValue = opts[2];

		let user = opts[3];

		let pw = opts[4];

		// Just a note here: upsrw uses always stderr (also if a setvar has been successfully sent to the driver)

		// stderr = "Unexpected response from upsd: ERR ACCESS-DENIED" -> Authentication error -> Wrong username or password
		if (stderr && stderr.indexOf('ERR ACCESS-DENIED') != -1) {

			// ..ask for them and tell the user the previuosly sent ones were wrong
			let credDialog = new CredDialogSetvar({
				device: device,
				username: user,
				password: pw,
				varName: varName,
				varValue: varValue,
				error: true
			});
			credDialog.open(global.get_current_time());

		// stderr = OK\n -> Setvar sent to the driver successfully
		} else if (stderr && stderr.indexOf('OK') != -1) {

			Main.notify(
				// TRANSLATORS: Notify title/description on setvar successfully sent
				_("NUT: setvar handled"),
				_("Successfully set %s to %s in device %s@%s:%s").format(varName, varValue, device.name, device.host, device.port)
			);

			// Update vars/panel/menu (not devices)
			upscMonitor.update();

		// mmhh.. something's wrong here!
		} else {

			Main.notifyError(
				// TRANSLATORS: Notify title/description for error on setvar sent
				_("NUT: error while handling setvar"),
				_("Unable to set %s to %s in device %s@%s:%s").format(varName, varValue, device.name, device.host, device.port)
			);

		}

	}
});

// walNUT: Panel button/menu
const	walNUT = new Lang.Class({
	Name: 'walNUT',
	Extends: PanelMenu.Button,

	_init: function() {

		this.parent(0.0, 'walNUT');

		this._monitor = upscMonitor;
		this._state = this._monitor.getState();

		// Panel button
		let _btnBox = new St.BoxLayout();
		// Panel icon
		this._icon = new St.Icon({
			icon_name: Icons.E + '-symbolic',
			style_class: 'system-status-icon'
		});
		// Panel label for battery charge and device load
		this._status = new St.Label({ y_align: Clutter.ActorAlign.CENTER });

		_btnBox.add(this._icon);
		_btnBox.add(this._status);

		this.actor.add_actor(_btnBox);
		this.actor.add_style_class_name('panel-status-button');

		// Menu
		let menu = new walNUTMenu({ sourceActor: this.actor });
		this.setMenu(menu);

		// Bottom Buttons

		// Settings button
		this._pref_btn = new Button({
			icon: 'imported-preferences-system',
			// TRANSLATORS: Accessible name of 'Preferences' button
			accessibleName: _("Preferences"),
			callback: function() {

				Main.shellDBusService._extensionsService.LaunchExtensionPrefs(Me.metadata.uuid);

			}
		});

		// Credentials button
		this._cred_btn = new Button({
			icon: 'imported-dialog-password',
			// TRANSLATORS: Accessible name of 'Credentials' button
			accessibleName: _("Credentials"),
			callback: Lang.bind(this, function() {

				// Close, if open, {add,del}Box and if credBox is visible, close it, otherwise, open it

				this.menu.addBox.close();

				this.menu.delBox.close();

				this.menu.credBox.toggle();

			})
		});

		// Add UPS button
		this._add_btn = new Button({
			icon: 'imported-edit-find',
			// TRANSLATORS: Accessible name of 'Find new devices' button
			accessibleName: _("Find new devices"),
			callback: Lang.bind(this, function() {

				// Close, if open, {cred,del}Box and if addBox is visible, close it, otherwise, open it

				this.menu.credBox.close();

				this.menu.delBox.close();

				this.menu.addBox.toggle();

			})
		});

		// Delete UPS from devices list button
		this._del_btn = new Button({
			icon: 'imported-user-trash',
			// TRANSLATORS: Accessible name of 'Delete device' button
			accessibleName: _("Delete device"),
			callback: Lang.bind(this, function() {

				// Close, if open, {add,cred}Box and if delBox is visible, close it, otherwise, open it

				this.menu.addBox.close();

				this.menu.credBox.close();

				this.menu.delBox.toggle();

			})
		});

		// Help button
		this._help_btn = new Button({
			icon: 'imported-help-browser',
			// TRANSLATORS: Accessible name of 'Help' button
			accessibleName: _("Help"),
			callback: function() {

				let yelp = Utilities.detect('yelp');
				let help = Me.dir.get_child('help');

				// Get locale
				let locale = Utilities.getLocale();

				// If yelp is available and the [localized] help is found, we'll use them..
				if (yelp && help.query_exists(null)) {

					// Language code + country code (eg. en_US, it_IT, ..)
					if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
						Util.spawn([
							'yelp',
							'%s/%s'.format(help.get_path(), locale.split('.')[0])
						]);

					// Language code (eg. en, it, ..)
					else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
						Util.spawn([
							'yelp',
							'%s/%s'.format(help.get_path(), locale.split('_')[0])
						]);

					else
						Util.spawn([
							'yelp',
							'%s/C'.format(help.get_path())
						]);

				// ..otherwise we'll open the html page
				} else {

					// If [localized] help is found, we'll use it
					if (help.query_exists(null)) {

						// Language code + country code (eg. en_US, it_IT, ..)
						if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
							Util.spawn([
								'xdg-open',
								'%s/%s/help.html'.format(help.get_path(), locale.split('.')[0])
							]);

						// Language code (eg. en, it, ..)
						else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
							Util.spawn([
								'xdg-open',
								'%s/%s/help.html'.format(help.get_path(), locale.split('_')[0])
							]);

						else
							Util.spawn([
								'xdg-open',
								'%s/C/help.html'.format(help.get_path())
							]);

					// ..otherwise we'll open the web page
					} else {

						Util.spawn([
							'xdg-open',
							'https://github.com/zykh/walNUT'
						]);

					}

				}

			}
		});

		// Always show Bottom Buttons (some won't be reactive in case of certain errors)

		// Preferences
		this.menu.controls.addControl({ button: this._pref_btn });

		// Credentials
		this.menu.controls.addControl({
			button: this._cred_btn,
			status: !(this._state & (ErrorType.NO_UPS | ErrorType.NO_NUT)) ? 'active' : 'inactive'
		});

		// Find new UPSes
		this.menu.controls.addControl({
			button: this._add_btn,
			status: !(this._state & ErrorType.NO_NUT) ? 'active' : 'inactive'
		});

		// Delete UPS
		this.menu.controls.addControl({
			button: this._del_btn,
			status: !(this._state & (ErrorType.NO_UPS | ErrorType.NO_NUT)) ? 'active' : 'inactive'
		});

		// Help
		this.menu.controls.addControl({ button: this._help_btn });

		// Update options stored in schema
		this._updateOptions();

		// Connect update on settings changed
		let settingsChangedId = gsettings.connect('changed', Lang.bind(this, this._updateOptions));

		// Disconnect settings-changed connection on destroy
		this.connect('destroy', Lang.bind(this, function() {
			gsettings.disconnect(settingsChangedId);
		}));

		// Init panel/menu
		this.refreshPanel();
		this.refreshMenu({ forceRefresh: true });

	},

	// Hide panel button
	hide: function() {

		this.actor.hide();

	},

	// Show panel button
	show: function() {

		this.actor.show();

	},

	// Update Options
	_updateOptions: function() {

		// Retrieve values stored in schema

		// Device model ('manufacturer - model')
		this._display_device_model = gsettings.get_boolean('display-device-model');

		// Info displayed in 'DataTable'

		// Battery charge
		this._display_battery_charge = gsettings.get_boolean('display-battery-charge');

		// Load level
		this._display_load_level = gsettings.get_boolean('display-load-level');

		// Backup time
		this._display_backup_time = gsettings.get_boolean('display-backup-time');

		// Device temperature
		this._display_device_temperature = gsettings.get_boolean('display-device-temperature');

		// Raw Data

		// Display raw data
		this._display_raw = gsettings.get_boolean('display-raw');

		// UPS commands

		// Display UPS commands
		this._display_cmd = gsettings.get_boolean('display-cmd');

		// Panel button options

		// Display device load in panel icon
		this._panel_icon_display_load = gsettings.get_boolean('panel-icon-display-load');

		// Display device load in panel label
		this._panel_text_display_load = gsettings.get_boolean('panel-text-display-load');

		// Display battery charge in panel label
		this._panel_text_display_charge = gsettings.get_boolean('panel-text-display-charge');

	},

	// _onOpenStateChanged: close the boxes and update the menu when it's opened
	_onOpenStateChanged: function(menu, open) {

		this.parent(menu, open);

		// open -> update
		if (open) {

			this.refreshMenu({ forceRefresh: true });

			// How ugly is having different values in panel and in menu?
			this.refreshPanel();

			// Close {add,cred,del}Box

			this.menu.addBox.close();

			this.menu.delBox.close();

			this.menu.credBox.close();

		}

	},

	// refreshPanel: Update panel icon and text
	refreshPanel: function() {

		this._state = this._monitor.getState();

		this._updatePanelIcon();
		this._updatePanelText();

	},

	// _updatePanelIcon: Update icon displayed in panel
	_updatePanelIcon: function() {

		// Errors!
		if (this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS | ErrorType.UPS_NA)) {
			// Set panel icon
			this._icon.icon_name = Icons.E + '-symbolic';
			// ..and return
			return;
		}

		let vars = this._monitor.getVars();
		let icon, battery_level = 1, load_level = 1, charged = false;

		if (vars['battery.charge']) {

			battery_level = Utilities.parseBatteryLevel(vars['battery.charge']);

			charged = vars['battery.charge'] * 1 == 100;

		} else {

			// If the UPS isn't telling us it's charging or discharging -> we suppose it's charged
			charged = vars['ups.status'].indexOf('CHRG') != -1 ? charged : true;

		}

		if (vars['ups.load'] && this._panel_icon_display_load)
			load_level = Utilities.parseLoadLevel(vars['ups.load']);

		let status = Utilities.parseStatus(vars['ups.status'], true);

		icon = status.line + (status.alarm || '') + ((status.line == 'O') && charged ? 'C' : '') + battery_level * load_level;

		this._icon.icon_name = Icons[icon] + '-symbolic';

	},

	// _updatePanelText: Update infos displayed in panel
	_updatePanelText: function() {

		// Errors!
		if (this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS | ErrorType.UPS_NA)) {
			// Set panel text
			this._status.text = '';
			// ..and return
			return;
		}

		let vars = this._monitor.getVars();
		let text = '';

		// Display battery charge
		if (this._panel_text_display_charge && vars['battery.charge'])
			// TRANSLATORS: Panel text for battery charge
			text += _("C: %d%").format(vars['battery.charge'] * 1);

		// Display UPS load
		if (this._panel_text_display_load && vars['ups.load']) {

			// If battery charge is displayed, add comma + white space
			if (text)
				// TRANSLATORS: Panel text between battery charge and device load
				text += _(", ");

			// TRANSLATORS: Panel text for device load
			text += _("L: %d%").format(vars['ups.load'] * 1);

		}

		if (text)
			text = ' ' + text;

		this._status.text = text;

	},

	// refreshMenu: Update menu
	// args = {
	//	forceRefresh: whether the menu has to be forcedly refreshed, e.g. if the chosen device has changed
	// }
	refreshMenu: function(args) {

		let forceRefresh = args ? args.forceRefresh : false;

		this._state = this._monitor.getState();

		// If upsc is available, the devices list will be shown if at least one UPS is in the list, also if it's not currently available
		if (!(this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS))) {

			if (forceRefresh)
				this.refreshList();

			if (!this.menu.upsList.actor.visible)
				this.menu.upsList.show();

		// ..else, hide it
		} else {

			if (this.menu.upsList.actor.visible)
				this.menu.upsList.hide();

		}

		// If upsc is available and at least one UPS is available -> show menu..
		if (!(this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS | ErrorType.UPS_NA))) {

			let vars = this._monitor.getVars();
			let varsArr = this._monitor.getVarsArr();
			let devices = this._monitor.getList();

			// Hide error box, if visible
			if (this.menu.errorBox.actor.visible)
				this.menu.errorBox.hide();

			// UPS model
			if (this._display_device_model && (vars['device.mfr'] || vars['device.model']))
				this.menu.upsModel.show({
					manufacturer: vars['device.mfr'],
					model: vars['device.model']
				});

			else if (this.menu.upsModel.actor.visible)
				this.menu.upsModel.hide();

			// TopDataList

			// UPS status
			this.menu.upsTopDataList.update({
				type: 'S',
				value: vars['ups.status']
			});
			this.menu.upsTopDataList.show();

			// UPS alarm
			if (vars['ups.alarm'])
				this.menu.upsTopDataList.update({
					type: 'A',
					value: vars['ups.alarm']
				});
			else
				this.menu.upsTopDataList.hide({ type: 'A' });

			// UpsDataTable

			if (forceRefresh) {
				this.menu.upsDataTableAlt.clean();
				this.menu.upsDataTableAlt.hide();
			}

			let count = 0;

			// UPS charge
			if (this._display_battery_charge && vars['battery.charge']) {

				count++;

				if (forceRefresh)
					this.menu.upsDataTableAlt.addData({ type: 'C' });

				this.menu.upsDataTableAlt.update({
					type: 'C',
					value: vars['battery.charge']
				});

			}

			// UPS load
			if (this._display_load_level && vars['ups.load']) {

				count++;

				if (forceRefresh)
					this.menu.upsDataTableAlt.addData({ type: 'L' });

				this.menu.upsDataTableAlt.update({
					type: 'L',
					value: vars['ups.load']
				});

			}

			// UPS remaining time
			if (this._display_backup_time && vars['battery.runtime']) {

				count++;

				if (forceRefresh)
					this.menu.upsDataTableAlt.addData({ type: 'R' });

				this.menu.upsDataTableAlt.update({
					type: 'R',
					value: vars['battery.runtime']
				});

			}

			// UPS temperature
			if (this._display_device_temperature && vars['ups.temperature']) {

				count++;

				if (forceRefresh)
					this.menu.upsDataTableAlt.addData({ type: 'T' });

				this.menu.upsDataTableAlt.update({
					type: 'T',
					value: vars['ups.temperature']
				});

			}

			// Don't show table if no data is available
			if (count) {
				this.menu.upsDataTableAlt.show();
			} else if (this.menu.upsDataTableAlt.actor.visible) {
				this.menu.upsDataTableAlt.clean();
				this.menu.upsDataTableAlt.hide();
			}

			// Separator
			if (this._display_raw || this._display_cmd) {

				if (!this.menu.separator.actor.visible)
					this.menu.separator.actor.show();

			} else if (this.menu.separator.actor.visible) {

					this.menu.separator.actor.hide();

			}

			// UPS Raw Data
			if (this._display_raw)
				this.menu.upsRaw.update({
					vars: varsArr,
					forceRefresh: forceRefresh
				});

			else if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();

			// UPS Commands..
			if (this._display_cmd)
				this.menu.upsCmdList.show();

			else if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			// UPS Credentials Box
			if (forceRefresh)
				this.menu.credBox.update({ device: devices[0] });

		// ..else show error 'upsc not found'/'NUT not installed' or 'No UPS found'
		} else {

			// Hide not available infos

			if (this.menu.upsModel.actor.visible)
				this.menu.upsModel.hide();

			if (this.menu.upsTopDataList.actor.visible)
				this.menu.upsTopDataList.hide();

			if (this.menu.upsDataTableAlt.actor.visible) {
				this.menu.upsDataTableAlt.clean();
				this.menu.upsDataTableAlt.hide();
			}

			if (this.menu.separator.actor.visible)
				this.menu.separator.actor.hide();

			if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();

			if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			// Show errorBox
			this.menu.errorBox.show(this._state);

		}

		// Update Bottom Buttons (some won't be reactive in case of certain errors)

		// Credentials
		this.menu.controls.setControl({
			button: this._cred_btn,
			status: !(this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS)) ? 'active' : 'inactive'
		});

		// Find new UPSes
		this.menu.controls.setControl({
			button: this._add_btn,
			status: !(this._state & ErrorType.NO_NUT) ? 'active' : 'inactive'
		});

		// Delete UPS
		this.menu.controls.setControl({
			button: this._del_btn,
			status: !(this._state & (ErrorType.NO_NUT | ErrorType.NO_UPS)) ? 'active' : 'inactive'
		});

	},

	refreshList: function() {

		let devices = this._monitor.getList();

		this.menu.upsList.update({ devices: devices });

	}
});

// CredDialog: prompt user for valid credentials (username and password)
const	CredDialog = new Lang.Class({
	Name: 'CredDialog',
	Extends: ModalDialog.ModalDialog,

	// args = {
	//	device: device for which authenticate
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	error: whether to show error 'Wrong username/password' or not
	// }
	_init: function(args) {

		this._device = args.device;
		let user = args.username;
		let pw = args.password;
		let error = args.error;

		this.parent({ styleClass: 'walnut-cred-dialog' });

		// Main container
		let container = new St.BoxLayout({
			style_class: 'prompt-dialog-main-layout',
			vertical: false
		});
		this.contentLayout.add(container, {
			x_fill: true,
			y_fill: true
		});

		// Icon
		let icon = new St.Icon({
			icon_name: 'imported-dialog-password-symbolic',
			style_class: 'walnut-cred-dialog-icon'
		});
		container.add(icon, {
			x_fill: true,
			y_fill: false,
			x_align: St.Align.END,
			y_align: St.Align.MIDDLE
		});

		// Container for messages and username and password entries
		let textBox = new St.BoxLayout({
			style_class: 'prompt-dialog-message-layout',
			vertical: true
		});
		container.add(textBox, { y_align: St.Align.START });

		// Label
		let label = new St.Label({
			// TRANSLATORS: Label of credentials dialog
			text: _("UPS Credentials"),
			style_class: 'prompt-dialog-headline walnut-cred-dialog-headline'
		});
		textBox.add(label, {
			y_fill: false,
			y_align: St.Align.START
		});

		// Description
		this.desc = new St.Label({
			text: '',
			style_class: 'prompt-dialog-description walnut-cred-dialog-description'
		});
		textBox.add(this.desc, {
			y_fill: true,
			y_align: St.Align.START,
			expand: true
		});

		// Username/password table
		let table = new St.BoxLayout({ style_class: 'walnut-cred-dialog-table' });
		textBox.add(table);

		// Username label
		let userLabel = new St.Label({
			// TRANSLATORS: Username @ credentials dialog
			text: _("Username:"),
			style_class: 'prompt-dialog-password-label',
			x_align: Clutter.ActorAlign.START,
			y_align: Clutter.ActorAlign.CENTER,
			y_expand: true
		});

		// Username entry
		this.user = new St.Entry({
			text: user || '',
			can_focus: true,
			reactive: true,
			style_class: 'walnut-add-entry'
		});

		// Username right-click menu
		ShellEntry.addContextMenu(this.user, { isPassword: false });

		// user_valid tells us whether a username is set or not
		this.user_valid = user ? true : false;

		// Update Execute button when text changes in user entry
		this.user.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.user_valid = this.user.get_text().length > 0;
			this._updateOkButton({ error: false });
			// Hide errorBox, if visible
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Password label
		let pwLabel = new St.Label({
			// TRANSLATORS: Password @ credentials dialog
			text: _("Password:"),
			style_class: 'prompt-dialog-password-label',
			x_align: Clutter.ActorAlign.START,
			y_align: Clutter.ActorAlign.CENTER,
			y_expand: true
		});

		// Password entry
		this.pw = new St.Entry({
			text: pw || '',
			can_focus: true,
			reactive: true,
			style_class: 'prompt-dialog-password-entry'
		});

		// Password right-click menu
		ShellEntry.addContextMenu(this.pw, { isPassword: true });

		// Password visual appearance (hidden)
		this.pw.clutter_text.set_password_char('\u25cf');

		// pw_valid tells us whether a password is set or not
		this.pw_valid = pw ? true : false;

		// Update Execute button when text changes in pw entry
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.pw_valid = this.pw.get_text().length > 0;
			this._updateOkButton({ error: false });
			// Hide errorBox, if visible
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Put user/password together
		let labelColumn = new St.BoxLayout({
			style_class: 'walnut-cred-dialog-table-column',
			vertical: true
		});
		labelColumn.add(userLabel);
		labelColumn.add(pwLabel);
		let entryColumn = new St.BoxLayout({
			style_class: 'walnut-cred-dialog-table-column',
			vertical: true
		});
		entryColumn.add(this.user);
		entryColumn.add(this.pw);
		table.add(labelColumn);
		table.add(entryColumn, { expand: true });

		// Error box
		let errorBox = new St.BoxLayout({ style_class: 'walnut-cred-dialog-error-box' });
		textBox.add(errorBox, { expand: true });

		// Hide error box if no error has been reported
		if (error)
			errorBox.show();
		else
			errorBox.hide();

		// Error Icon
		let errorIcon = new St.Icon({
			icon_name: 'imported-dialog-error-symbolic',
			style_class: 'walnut-cred-dialog-error-icon'
		});
		errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });

		// Error message
		let errorText = new St.Label({
			// TRANSLATORS: Error message @ credentials dialog
			text: _("Wrong username or password"),
			style_class: 'walnut-cred-dialog-error-label'
		});
		errorText.clutter_text.line_wrap = true;
		errorBox.add(errorText, {
			expand: true,
			y_align: St.Align.MIDDLE,
			y_fill: false
		});

		this.ok = {
			// TRANSLATORS: Execute button @ credentials dialog
			label: _("Execute"),
			action: Lang.bind(this, this._onOk),
			default: true
		};

		this.setButtons([
			{
				// TRANSLATORS: Cancel button @ credentials dialog
				label: _("Cancel"),
				action: Lang.bind(this, this._onCancel),
				key: Clutter.KEY_Escape
			},
			this.ok
		]);

		this._updateOkButton({ error: error });

		// Set initial key-focus to the user entry
		this.setInitialKeyFocus(this.user);

	},

	// _updateOkButton: The Execute button will be reactive only if both username and password are set (length > 0) and if args.*error* isn't true
	// args = {
	//	error: whether username/password proved to be wrong
	// }
	_updateOkButton: function(args) {

		let error = args.error;
		let valid = false;

		valid = this.user_valid && this.pw_valid;

		this.ok.button.reactive = valid && !error;
		this.ok.button.can_focus = valid && !error;

	},

	// _onOk: actions to do when Execute button is pressed
	_onOk: function() {

		this.close(global.get_current_time());

	},

	// cancel: actions to do when Cancel button is pressed
	_onCancel: function() {

		this.close(global.get_current_time());

	}
});

// CredDialogCmd: credential dialog for instant commands
const	CredDialogCmd = new Lang.Class({
	Name: 'CredDialogCmd',
	Extends: CredDialog,

	// args = {
	//	device: device which should get args.*command*
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	command: NUT command to send to args.*device*
	//	extradata: extradata to pass to args.*command*
	//	error: whether username/password proved to be wrong
	// }
	_init: function(args) {

		this.parent({
			device: args.device,
			username: args.username,
			password: args.password,
			error: args.error
		});

		this._cmd = args.command;

		this._extra = args.extradata;

		// Description
		let cmdExtraDesc;

		if (this._extra.length)
			cmdExtraDesc = '\'%s %s\''.format(this._cmd, this._extra);
		else
			cmdExtraDesc = this._cmd;

		// TRANSLATORS: Description @ credentials dialog for instant commands
		this.desc.text = Utilities.parseText(_("To execute the command %s on device %s@%s:%s, please insert a valid username and password").format(cmdExtraDesc, this._device.name, this._device.host, this._device.port), Lengths.CRED_DIALOG);

	},

	_onOk: function() {

		upscmdDo.cmdExec({
			username: this.user.get_text(),
			password: this.pw.get_text(),
			device: this._device,
			command: this._cmd,
			extradata: this._extra
		});

		this.parent();

	}
});

// CredDialogSetvar: credential dialog for setvars
const	CredDialogSetvar = new Lang.Class({
	Name: 'CredDialogSetvar',
	Extends: CredDialog,

	// args = {
	//	device: device in which set args.*varName*
	//	username: username to use to authenticate
	//	password: password to use to authenticate
	//	varName: name of the variable to set
	//	varValue: value to set args.*varName* to
	//	error: whether username/password proved to be wrong
	// }
	_init: function(args) {

		this.parent({
			device: args.device,
			username: args.username,
			password: args.password,
			error: args.error
		});

		this._varName = args.varName;

		this._varValue = args.varValue;

		// TRANSLATORS: Description @ credentials dialog for setvars
		this.desc.text = Utilities.parseText(_("To set the variable %s to %s on device %s@%s:%s, please insert a valid username and password").format(this._varName, this._varValue, this._device.name, this._device.host, this._device.port), Lengths.CRED_DIALOG);

	},

	_onOk: function() {

		upsrwDo.setVar({
			username: this.user.get_text(),
			password: this.pw.get_text(),
			device: this._device,
			varName: this._varName,
			varValue: this._varValue
		});

		this.parent();

	}
});

// DelBox: a box used to delete UPSes from devices list
const	DelBox = new Lang.Class({
	Name: 'DelBox',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({
			icon_name: 'imported-user-trash-symbolic',
			style_class: 'walnut-delbox-icon'
		});
		container.add(icon, {
			row: 0,
			col: 0,
			row_span: 3
		});

		// Description
		let desc = new St.Label({
			// TRANSLATORS: Label @ delete device box
			text: _("Delete UPS"),
			style_class: 'walnut-delbox-desc'
		});
		container.add(desc, {
			row: 0,
			col: 1
		});

		// Text
		let text = new St.Label({
			// TRANSLATORS: Description @ delete device box
			text: Utilities.parseText(_("Do you really want to delete the current UPS from the list?"), 30),
			style_class: 'walnut-delbox-text'
		});
		container.add(text, {
			row: 1,
			col: 1
		});

		// Delete/Go buttons
		let del = new Button({
			icon: 'imported-window-close',
			// TRANSLATORS: Accessible name of 'Don't delete' button @ Delete device box
			accessibleName: _("Don't delete"),
			callback: Lang.bind(this, function() {

				this.hide();

				// Give back focus to our 'submenu-toggle button'
				walnut._del_btn.actor.grab_key_focus();

			}),
			size: 'small'
		});

		let go = new Button({
			icon: 'imported-emblem-ok',
			// TRANSLATORS: Accessible name of 'Delete' button @ Delete device box
			accessibleName: _("Delete"),
			callback: Lang.bind(this, function() {

				Utilities.deleteUPS();

				this.hide();

				// Give back focus to our 'submenu-toggle button'
				walnut._del_btn.actor.grab_key_focus();

				// Make the menu close itself to force an update
				this.emit('activate', null);

			}),
			size: 'small'
		});

		// Put buttons together
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-delbox-buttons-box'
		});
		btns.add(del.actor, {
			x_fill: false,
			y_fill: false
		});
		btns.add(go.actor, {
			x_fill: false,
			y_fill: false
		});

		// Right-align buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, {
			row: 2,
			col: 1
		});

		this.actor.add(container, {
			expand: true,
			x_fill: false
		});

	},

	close: function() {

		if (this.actor.visible)
			this.hide();

	},

	toggle: function() {

		if (this.actor.visible)
			this.hide();
		else
			this.show();

	},

	hide: function() {

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// CredBox: a box used to set UPS credentials (user/password)
const	CredBox = new Lang.Class({
	Name: 'CredBox',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({
			icon_name: 'imported-dialog-password-symbolic',
			style_class: 'walnut-credbox-icon'
		});
		container.add(icon, {
			row: 0,
			col: 0,
			row_span: 3
		});

		// Description
		let desc = new St.Label({
			// TRANSLATORS: Label @ credentials box
			text: _("UPS Credentials"),
			style_class: 'walnut-credbox-desc'
		});
		container.add(desc, {
			row: 0,
			col: 1,
			col_span: 2
		});

		// Username
		this.user = new St.Entry({
			text: '',
			// TRANSLATORS: Username hint @ credentials box
			hint_text: _("username"),
			can_focus: true,
			style_class: 'walnut-credbox-username'
		});
		container.add(this.user, {
			row: 1,
			col: 1
		});

		// Password
		this.pw = new St.Entry({
			text: '',
			// TRANSLATORS: Password hint @ credentials box
			hint_text: _("password"),
			can_focus: true,
			style_class: 'walnut-credbox-password'
		});
		container.add(this.pw, {
			row: 1,
			col: 2
		});
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, this._updatePwAppearance));

		// Delete/Go buttons
		let del = new Button({
			icon: 'imported-window-close',
			// TRANSLATORS: Accessible name of 'Undo and close' button @ Credentials box
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				this._undoAndClose();

				// Give back focus to our 'submenu-toggle button'
				walnut._cred_btn.actor.grab_key_focus();

			}),
			size: 'small'
		});

		let go = new Button({
			icon: 'imported-emblem-ok',
			// TRANSLATORS: Accessible name of 'Save credentials' button @ Credentials box
			accessibleName: _("Save credentials"),
			callback: Lang.bind(this, this._credUpdate),
			size: 'small'
		});

		// Put buttons together
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-credbox-buttons-box'
		});
		btns.add(del.actor, {
			x_fill: false,
			y_fill: false
		});
		btns.add(go.actor, {
			x_fill: false,
			y_fill: false
		});

		// Right-align buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, {
			row: 2,
			col: 1,
			col_span: 2
		});

		this.actor.add(container, {
			expand: true,
			x_fill: false
		});

	},

	// Update credentials: if empty user or password is given it'll be removed from the UPS's properties
	_credUpdate: function() {

		let user = this.user.get_text();
		let pw = this.pw.get_text();

		Utilities.setUPSCredentials({
			username: user,
			password: pw
		});

	},

	// Update password visual appearance (hidden or not)
	_updatePwAppearance: function() {

		if (this.pw.get_text().length > 0 && this._hide_pw)
			this.pw.clutter_text.set_password_char('\u25cf');
		else
			this.pw.clutter_text.set_password_char('');

	},

	// Undo changes and hide CredBox
	_undoAndClose: function() {

		let device = upscMonitor.getList()[0];
		this.update({ device: device });

		this.hide();

	},

	// Update username and password
	// args = {
	//	device: device whose user/password should be taken into account
	// }
	update: function(args) {

		let device = args.device;

		this.user.text = device.user || '';
		this.pw.text = device.pw || '';

		// Hide password chars?
		this._hide_pw = gsettings.get_boolean('hide-pw');

		this._updatePwAppearance();

	},

	close: function() {

		if (this.actor.visible)
			this.hide();

	},

	toggle: function() {

		if (this.actor.visible)
			this.hide();
		else
			this.show();

	},

	hide: function() {

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// AddBox: box used to find new UPSes
const	AddBox = new Lang.Class({
	Name: 'AddBox',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({
			icon_name: 'imported-edit-find-symbolic',
			style_class: 'walnut-addbox-icon'
		});
		container.add(icon, {
			row: 0,
			col: 0,
			row_span: 3
		});

		// Description
		let desc = new St.Label({
			// TRANSLATORS: Label @ find new devices box
			text: _("Find new UPSes"),
			style_class: 'walnut-addbox-desc'
		});
		container.add(desc, {
			row: 0,
			col: 1,
			col_span: 2
		});

		// Hostname
		this.hostname = new St.Entry({
			// TRANSLATORS: Hostname hint @ find new devices box
			hint_text: _("hostname"),
			can_focus: true,
			style_class: 'walnut-addbox-host'
		});
		container.add(this.hostname, {
			row: 1,
			col: 1
		});

		// Port
		this.port = new St.Entry({
			// TRANSLATORS: Port hint @ find new devices box
			hint_text: _("port"),
			can_focus: true,
			style_class: 'walnut-addbox-port'
		});
		container.add(this.port, {
			row: 1,
			col: 2
		});

		// Delete/Go buttons
		let del = new Button({
			icon: 'imported-window-close',
			// TRANSLATORS: Accessible name of 'Undo and close' button @ Find new devices box
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				this._undoAndClose();

				// Give back focus to our 'submenu-toggle button'
				walnut._add_btn.actor.grab_key_focus();

			}),
			size: 'small'
		});

		let go = new Button({
			icon: 'imported-emblem-ok',
			// TRANSLATORS: Accessible name of 'Start search' button @ Find new devices box
			accessibleName: _("Start search"),
			callback: Lang.bind(this, this._addUps),
			size: 'small'
		});

		// Put buttons together
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-addbox-buttons-box'
		});
		btns.add(del.actor, {
			x_fill: false,
			y_fill: false
		});
		btns.add(go.actor, {
			x_fill: false,
			y_fill: false
		});

		// Right-align buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, {
			row: 2,
			col: 1,
			col_span: 2
		});

		this.actor.add(container, {
			expand: true,
			x_fill: false
		});

	},

	// Search new UPSes at a given host:port, if not given it'll search at localhost:3493
	_addUps: function() {

		let host = this.hostname.get_text();
		let port = this.port.get_text();

		// Try to find the device
		upscMonitor.getDevices({
			notify: true,
			hostname: host || 'localhost',
			port: port || '3493'
		});

		// Clear and close AddBox
		this._undoAndClose();

	},

	// Undo changes and hide AddBox
	_undoAndClose: function() {

		this.hostname.text = '';
		this.port.text = '';

		this.hide();

	},

	close: function() {

		if (this.actor.visible)
			this.hide();

	},

	toggle: function() {

		if (this.actor.visible)
			this.hide();
		else
			this.show();

	},

	hide: function() {

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// Button: Buttons with callback
const	Button = new Lang.Class({
	Name: 'Button',

	// args = {
	//	icon: name of the icon to use
	//	accessibleName: accessible name of the button
	//	callback: function to call when the button gets clicked
	//	size: size of the button {small,big}
	// }
	_init: function(args) {

		let size = args.size;

		if (!size || size != 'small')
			size = 'big';

		// Icon
		let button_icon = new St.Icon({ icon_name: args.icon + '-symbolic' });

		// Button
		this.actor = new St.Button({
			reactive: true,
			can_focus: true,
			track_hover: true,
			accessible_name: args.accessibleName,
			style_class: 'system-menu-action walnut-buttons-%s'.format(size),
			child: button_icon
		});

		// Set callback, if any
		if (args.callback)
			this.actor.connect('clicked', args.callback);

	},

	// setCallback: set the callback function
	setCallback: function(cb) {

		this.actor.connect('clicked', cb);

	}
});

// BottomControls: container of bottom buttons
const	BottomControls = new Lang.Class({
	Name: 'BottomControls',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: false,
			can_focus: false
		});

	},

	// addControl: add a button to buttons box
	// args = {
	//	button: button to add to the buttons box
	//	status: status of the button {active,inactive}
	// }
	addControl: function(args) {

		this.actor.add(args.button.actor, {
			expand: true,
			x_fill: false,
			y_fill: false
		});

		this.setControl(args);

	},

	// setControl: set the buttons' reactivity
	// args = {
	//	button: button whose status is to set
	//	status: status of the button {active,inactive}
	// }
	setControl: function(args) {

		let active = true;

		if (args.status && args.status == 'inactive')
			active = false;

		if (active)
			args.button.actor.reactive = true;
		else
			args.button.actor.reactive = false;

	}
});

// CmdPopupSubMenu: a PopupSubMenu for UpsCmdList: we need this so that we can update the submenu (= populate the PopupSubMenu) only and every time the menu is opened
const	CmdPopupSubMenu = new Lang.Class({
	Name: 'CmdPopupSubMenu',
	Extends: PopupMenu.PopupSubMenu,

	// args = {
	//	parent: this submenu's parent
	//	sourceActor: args.*parent*'s actor
	//	sourceArrow: args.*parent*'s spinning triangle
	// }
	_init: function(args) {

		this._delegate = args.parent;

		this.parent(args.sourceActor, args.sourceArrow);

	},

	open: function(animate) {

		if (this.isOpen)
			return;

		// Clean submenu..
		this._delegate.clean();

		// ..and then update it
		if (this.isEmpty()) {

			this._delegate.update();

			if (this.isEmpty())
				return;

		}

		this.parent(animate);

	}
});

// UpsCmdList: a submenu listing UPS commands
const	UpsCmdList = new Lang.Class({
	Name: 'UpsCmdList',
	Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function() {

		// TRANSLATORS: Label of UPS commands sub menu
		this.parent(_("UPS Commands"));

		// Command's extradata

		// Remove focus from St.BoxLayout..
		this.actor.can_focus = false;

		// ..and add it to our child St.BoxLayout
		let labelBox = new St.BoxLayout({
			can_focus: true,
			x_expand: true
		});

		// Add the label to our St.BoxLayout and put it in its place
		this.actor.insert_child_below(labelBox, this.label);
		this.actor.remove_child(this.label);
		labelBox.add(this.label);

		// Connect key focus
		labelBox.connect('key-focus-in', Lang.bind(this, this._onKeyFocusIn));
		labelBox.connect('key-focus-out', Lang.bind(this, this._onKeyFocusOut));

		// Remove the expander
		let expander = labelBox.get_next_sibling();
		this.actor.remove_child(expander);
		expander.destroy();

		// TRANSLATORS: Extradata's label @ Device commands submenu
		this.status.text = _("extradata:");
		this.status.add_style_class_name('walnut-cmd-extradata-label');

		// Extradata's entry: we need to start with a nonempty entry otherwise, when clicking-in, the submenu will close itself
		this.extradata = new St.Entry({
			text: ' ',
			reactive: true,
			can_focus: true,
			style_class: 'walnut-cmd-extradata'
		});

		// For the same reason, if the user leave the entry empty, fill it with a space
		this.extradata.clutter_text.connect('text-changed', Lang.bind(this, function() {
			if (!this.extradata.get_text().length)
				this.extradata.text = ' ';
		}));

		// Add extradata's entry just before the triangle
		this.actor.insert_child_below(this.extradata, this._triangleBin);

		// Hide extradata's {entry,label}
		this.status.hide();
		this.extradata.hide();

		// Override base PopupSubMenu with our sub menu that update itself only and every time it is opened
		this.menu = new CmdPopupSubMenu({
			parent: this,
			sourceActor: this.actor,
			sourceArrow: this._triangle
		});

		// Connect our extradata-toggle
		this.menu.connect('open-state-changed', Lang.bind(this, this._extradataToggle));

		// Reconnect SubMenuMenuItem standard function
		this.menu.connect('open-state-changed', Lang.bind(this, this._subMenuOpenStateChanged));

	},

	// _extradataToggle: toggle extradata's view
	_extradataToggle: function(menu, open) {

		if (open) {

			this.status.show();
			this.extradata.show();

		} else {

			this.status.hide();

			// Clear extradata
			this.extradata.text = ' ';

			this.extradata.hide();

		}

	},

	// _buildInfo: build submenu
	_buildInfo: function() {

		// Error!
		if (!upscmdDo.hasCmds()) {

			this.menu.addMenuItem(
				new PopupMenu.PopupMenuItem(
					// TRANSLATORS: Error @ UPS commands submenu
					Utilities.parseText(_("Error while retrieving UPS commands"), Lengths.CMD),
					{
						reactive: true,
						activate: false,
						hover: false,
						can_focus: false
					}
				)
			);

			return;

		}

		// Retrieve upscmd commands
		let commands = upscmdDo.getCmds();

		// List available commands, if any
		if (commands.length > 0) {

			// List UPS commands in submenu
			for each (let item in commands) {

				let cmd = new PopupMenu.PopupMenuItem(gsettings.get_boolean('display-cmd-desc') ? '%s\n%s'.format(item.cmd, Utilities.parseText(Utilities.cmdI18n(item).desc, Lengths.CMD)) : item.cmd);
				let command = item.cmd;

				cmd.connect('activate', Lang.bind(this, function() {
					upscmdDo.cmdExec({
						username: this._device.user,
						password: this._device.pw,
						device: this._device,
						command: command,
						extradata: this.extradata.get_text().trim()
					});
				}));

				this.menu.addMenuItem(cmd);

				// Scroll the parent menu when item gets key-focus
				cmd.actor.connect('key-focus-in', Lang.bind(this, function(self) {
					if (self.get_hover())
						return;
					Util.ensureActorVisibleInScrollView(this.menu.actor, self);
				}));

			}

			return;

		}

		// No UPS command available

		this.menu.addMenuItem(
			new PopupMenu.PopupMenuItem(
				// TRANSLATORS: Error @ UPS commands submenu
				Utilities.parseText(_("No UPS command available"), Lengths.CMD),
				{
					reactive: true,
					activate: false,
					hover: false,
					can_focus: false
				}
			)
		);

	},

	// clean: remove submenu's children, if any
	clean: function() {

		if (!this.menu.isEmpty())
			this.menu.removeAll();

	},

	// update: update submenu
	update: function() {

		this._device = upscMonitor.getList()[0];

		this.clean();

		this._buildInfo();

		this.show();

	},

	hide: function() {

		// If the submenu is not empty, destroy all children
		this.clean();

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// SetvarBox: box used to handle setvars
const	SetvarBox = new Lang.Class({
	Name: 'SetvarBox',
	Extends: PopupMenu.PopupMenuSection,

	// args = {
	//	varName: name of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this.parent();

		// Variable's name
		this._varName = args.varName;

		// Our toggle-button
		this._scrollView = args.scrollView;

	},

	// show: open SetvarBox and if actual value is not equal to the previous value, update the SetvarBox
	// args = {
	//	actualValue: actual value of the settable variable
	// }
	show: function(args) {

		if (args.actualValue != this._actualValue)
			this._resetTo(args.actualValue);

		this.actor.show();

	},

	// hide: Hide SetvarBox
	hide: function() {

		this.actor.hide();

	},

	isClosed: function() {

		return !this.actor.visible;

	},

	// _resetTo: reset setvar box to *value*
	_resetTo: function(value) {

		if (this._actualValue != value)
			this._actualValue = value;

	}
});

// SetvarRangeItem: one of the available ranges displayed in SetvarBoxRanges
const	SetvarRangeItem = new Lang.Class({
	Name: 'SetvarRangeItem',
	Extends: PopupMenu.PopupMenuItem,

	// args = {
	//	range: {
	//		min: lower limit of the range
	//		max: upper limit of the range
	//	},
	//	callback: function to call, passing to it *range*, when activated; if not set, the item is treated (and represented) as the actual range
	// }
	_init: function(args) {

		this._range = args.range;
		// TRANSLATORS: Range interval @ Setvar box
		let rangeLabel = _("%s - %s").format(this._range.min, this._range.max);

		this._callback = args.callback;
		if (this._callback != null) {
			this.parent(rangeLabel);
		} else {
			this.parent(rangeLabel, { activate: false });
			// Set the item as checked if it represents actual range
			this.setOrnament(PopupMenu.Ornament.DOT);
		}

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this.actor.insert_child_below(spacer, this._ornamentLabel)

	},

	activate: function(event) {

		if (this._callback != null)
			this._callback(this._range);

		this._parent.focusSlider();

	}
});

// SetvarBoxRanges: box to set r/w variables with ranges
const	SetvarBoxRanges = new Lang.Class({
	Name: 'SetvarBoxRanges',
	Extends: SetvarBox,

	// args = {
	//	varName: name of the settable variable
	//	rages: available ranges of the settable variable
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this.parent({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// _ranges: [
		//	{
		//		min: value,
		//		max: value
		//	},
		//	{
		//		min: value,
		//		max: value
		//	},
		//		...
		// ]
		this._ranges = args.ranges;

		// _rangeAct: {
		//	min: value,
		//	max: value
		// }
		this._rangeAct = {};

		// Slider
		this._slider = new Slider.Slider(0.5);
		let sliderItem = new PopupMenu.PopupBaseMenuItem({ activate: false });
		sliderItem.actor.add(this._slider.actor, { expand: true });
		sliderItem.actor.connect('button-press-event', Lang.bind(this, function(actor, event) {
			return this._slider.startDragging(event);
		}));
		sliderItem.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {
			return this._slider.onKeyPressEvent(actor, event);
		}));
		this.addMenuItem(sliderItem);

		// Flip slider for RTL locales
		if (this._slider.actor.get_text_direction() == Clutter.TextDirection.RTL)
			this._slider.actor.set_scale_with_gravity(-1.0, 1.0, Clutter.Gravity.NORTH);

		// Labels box
		let rangeValueBox = new St.BoxLayout({ style_class: 'popup-menu-item' });
		this.actor.add(rangeValueBox, { expand: true });

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		rangeValueBox.add(spacer);

		// Labels
		this._rangeMinLabel = new St.Label({ text: '' });
		rangeValueBox.add(this._rangeMinLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		this._rangeActLabel = new St.Label({
			text: '',
			style_class: 'walnut-setvar-range-actual'
		});
		rangeValueBox.add(this._rangeActLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		this._rangeMaxLabel = new St.Label({ text: '' });
		rangeValueBox.add(this._rangeMaxLabel, {
			expand: true,
			x_fill: false,
			align: St.Align.MIDDLE
		});

		// Buttons
		this._minus = new Button({
			icon: 'imported-list-remove',
			// TRANSLATORS: Accessible name of 'Decrement' button @ setvar ranges
			accessibleName: _("Decrement by one"),
			size: 'small'
		});
		rangeValueBox.insert_child_below(this._minus.actor, this._rangeActLabel);
		rangeValueBox.child_set(this._minus.actor, {
			x_fill: false,
			y_fill: false
		});

		this._minus.actor.connect('button-release-event', Lang.bind(this, this._minusAction));
		this._minus.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {

			let key = event.get_key_symbol();

			if (key == Clutter.KEY_space || key == Clutter.KEY_Return)
				this._minusAction();

		}));

		this._plus = new Button({
			icon: 'imported-list-add',
			// TRANSLATORS: Accessible name of 'Increment' button @ setvar ranges
			accessibleName: _("Increment by one"),
			size: 'small'
		});
		rangeValueBox.insert_child_above(this._plus.actor, this._rangeActLabel);
		rangeValueBox.child_set(this._plus.actor, {
			x_fill: false,
			y_fill: false
		});

		this._plus.actor.connect('button-release-event', Lang.bind(this, this._plusAction));
		this._plus.actor.connect('key-press-event', Lang.bind(this, function(actor, event) {

			let key = event.get_key_symbol();

			if (key == Clutter.KEY_space || key == Clutter.KEY_Return)
				this._plusAction();

		}));

		let del = new Button({
			icon: 'imported-window-close',
			// TRANSLATORS: Accessible name of 'Undo and close' button @ setvar
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				// Reset submenu
				this._resetTo(this._actualValue);

				// Give focus back to our 'toggle button'
				this._parent._button.actor.grab_key_focus();

				// Close the setvarBox and change the ornament
				this._parent.fold();

			}),
			size: 'small'
		});

		this._go = new Button({
			icon: 'imported-emblem-ok',
			// TRANSLATORS: Accessible name of 'Set' button @ setvar
			accessibleName: _("Set"),
			callback: Lang.bind(this, function() {

				upsrwDo.setVar({
					device: upscMonitor.getList()[0],
					varName: this._varName,
					varValue: '%d'.format(this._valueToSet)
				});

				// Close the setvarBox and change the ornament
				this._parent.fold();

				// Close top menu
				this.itemActivated();

			}),
			size: 'small'
		});

		// Buttons box
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-setvar-buttons-box'
		});
		btns.add(del.actor, {
			x_fill: false,
			y_fill: false
		});
		btns.add(this._go.actor, {
			x_fill: false,
			y_fill: false
		});
		rangeValueBox.add(btns);

		// Connect slider
		this._slider.connect('value-changed', Lang.bind(this, function(item) {

			let rangeWindow = this._rangeAct.max - this._rangeAct.min;

			// Get value
			this._valueToSet = this._rangeAct.min + Math.round(item._value * rangeWindow);

			// Update value's label
			this._rangeActLabel.text = '%d'.format(this._valueToSet);

			// Update buttons' clickability
			this._updateButtons();

		}));

		// 'Grab' the scroll (i.e. 'ungrab' it from the PopupSubMenu) when mouse is over the slider
		this._slider.actor.connect('enter-event', Lang.bind(this, function(actor, event) {
			if (event.is_pointer_emulated())
				return;
			this._parent._parent.actor.set_mouse_scrolling(false);
		}));

		// 'Ungrab' the scroll (i.e. give it back to the PopupSubMenu) when mouse leaves the slider
		this._slider.actor.connect('leave-event', Lang.bind(this, function(actor, event) {
			if (event.is_pointer_emulated())
				return;
			this._parent._parent.actor.set_mouse_scrolling(true);
		}));

		this._resetTo(args.actualValue);

		// Scroll the menu when items get key-focus
		sliderItem.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, self);
		}));
		this._minus.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		this._plus.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		del.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));
		this._go.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, rangeValueBox);
		}));

		this.hide();

	},

	// _minusAction: actions to execute when 'minus' button gets activated
	_minusAction: function() {

		if (this._valueToSet <= this._rangeAct.min)
			this._valueToSet = this._rangeAct.min

		else if (this._valueToSet > this._rangeAct.max)
			this._valueToSet = this._rangeAct.max

		// this._rangeAct.min < this._valueToSet <= this._rangeAct.max
		else
			this._valueToSet--;

		// Update value's label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Update slider's appearance
		let rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
		rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

	},

	// _plusAction: actions to execute when 'plus' button gets activated
	_plusAction: function() {

		if (this._valueToSet < this._rangeAct.min)
			this._valueToSet = this._rangeAct.min

		else if (this._valueToSet >= this._rangeAct.max)
			this._valueToSet = this._rangeAct.max

		// this._rangeAct.min <= this._valueToSet < this._rangeAct.max
		else
			this._valueToSet++;

		// Update value's label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Update slider's appearance
		let rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
		rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

	},

	// _changeRangeTo: change actual range to the one whose maximum and minimum settable value are args.*max* and args.*min*
	// args = {
	//	min: lower limit of the range
	//	max: upper limit of the range
	// }
	_changeRangeTo: function(args) {

		// Update actual range
		// - min
		this._rangeAct.min = args.min;
		this._rangeMinLabel.text = '%d'.format(this._rangeAct.min);
		// - max
		this._rangeAct.max = args.max;
		this._rangeMaxLabel.text = '%d'.format(this._rangeAct.max);

		// Reset this._valueToSet
		if (this._actualValueNumeric != undefined)
			this._valueToSet = this._actualValueNumeric;
		else
			this._valueToSet = this._rangeAct.min;
		// Actual value to set label
		this._rangeActLabel.text = '%d'.format(this._valueToSet);

		// Slider
		let rangeActInRange = 0;
		if (this._valueToSet >= this._rangeAct.min && this._valueToSet <= this._rangeAct.max) {
			rangeActInRange = (this._valueToSet - this._rangeAct.min) / (this._rangeAct.max - this._rangeAct.min);
			rangeActInRange = isFinite(rangeActInRange) ? rangeActInRange : 0.5;
		} else if (this._valueToSet > this._rangeAct.max) {
			rangeActInRange = 1;
		}
		this._slider.setValue(rangeActInRange);

		// Update buttons' clickability
		this._updateButtons();

		// Remove old ranges, if any
		if (this._rangeItems && this._rangeItems.length)
			for (let i = 0; i < this._rangeItems.length; i++)
				this._rangeItems[i].destroy();
		// Add settable ranges
		this._rangeItems = [];
		if (this._ranges.length > 1)
			for (let i = 0; i < this._ranges.length; i++) {
				let range = this._ranges[i];
				// The item represents actual range
				if (this._rangeAct.min == range.min && this._rangeAct.max == range.max)
					this._rangeItems[i] = new SetvarRangeItem({ range: range });
				else
					this._rangeItems[i] = new SetvarRangeItem({
						range: range,
						callback: Lang.bind(this, this._changeRangeTo)
					});
				this.addMenuItem(this._rangeItems[i]);
				// Scroll the menu when item gets key-focus
				this._rangeItems[i].actor.connect('key-focus-in', Lang.bind(this, function(self) {
					if (self.get_hover())
						return;
					Util.ensureActorVisibleInScrollView(this._scrollView, self);
				}));
			}

	},

	// _updateButtons: 'Set' button is usable only when this._valueToSet != actual value; +/- buttons are usable only when value is in the range and not the respective range limit
	_updateButtons: function() {

		if (
			this._actualValueNumeric == undefined ||
			this._actualValueNumeric != this._valueToSet
		) {
			this._go.actor.reactive = true;
			this._go.actor.can_focus = true;
		} else {
			this._go.actor.reactive = false;
			this._go.actor.can_focus = false;
		}

		if (this._valueToSet > this._rangeAct.min) {
			this._minus.actor.reactive = true;
			this._minus.actor.can_focus = true;
		} else {
			this._minus.actor.reactive = false;
			this._minus.actor.can_focus = false;
		}

		if (this._valueToSet < this._rangeAct.max) {
			this._plus.actor.reactive = true;
			this._plus.actor.can_focus = true;
		} else {
			this._plus.actor.reactive = false;
			this._plus.actor.can_focus = false;
		}

	},

	// _resetTo: reset setvar box to *value*
	_resetTo: function(value) {

		this._actualValue = value;
		this._actualValueNumeric = Number(this._actualValue);

		let rangeAct = {};

		// Actual value is an acceptable number
		if (!isNaN(this._actualValueNumeric) && isFinite(this._actualValueNumeric)) {

			// Ranges only support ints
			this._actualValueNumeric = parseInt(this._actualValue);

			for each (let range in this._ranges) {
				if (!(this._actualValueNumeric >= range.min && this._actualValueNumeric <= range.max))
					continue;
				rangeAct.min = range.min;
				rangeAct.max = range.max;
				break;
			}

			// Actual value is out of the available ranges, choose the nearest one
			if (rangeAct.min == null || rangeAct.max == null) {
				if (this._ranges.length > 1) {
					let delta;
					for each (let range in this._ranges) {
						let localDelta;
						// Less than minimum
						if (this._actualValueNumeric < range.min)
							localDelta = range.min - this._actualValueNumeric;
						// Greater than maximum
						else
							localDelta = this._actualValueNumeric - range.max;
						if (delta == undefined || localDelta < delta) {
							delta = localDelta;
							rangeAct.min = range.min;
							rangeAct.max = range.max;
						}
					}
				} else {
					rangeAct.min = this._ranges[0].min;
					rangeAct.max = this._ranges[0].max;
				}
			}

		// Actual value is not an acceptable number -> use first available range
		} else {

			rangeAct.min = this._ranges[0].min;
			rangeAct.max = this._ranges[0].max;
			this._actualValueNumeric = undefined;

		}

		this._changeRangeTo(rangeAct);

	},

	// focusSlider: move key focus to the slider
	focusSlider: function() {

		this._slider.actor.get_parent().grab_key_focus();

	}
});

// SetvarEnumItem: one of the enumerated values displayed in SetvarBoxEnums
const	SetvarEnumItem = new Lang.Class({
	Name: 'SetvarEnumItem',
	Extends: PopupMenu.PopupMenuItem,

	// args = {
	//	enumValue: enumerated value this item represents
	//	callback: function to call when activated; if not set, the item is treated (and represented) as the actually chosen one
	// }
	_init: function(args) {

		if (args.callback != null) {
			this.parent(args.enumValue);
			this.connect('activate', args.callback);
		} else {
			this.parent(args.enumValue, { activate: false });
			// Set the item as checked if it represents actual value
			this.setOrnament(PopupMenu.Ornament.DOT);
		}

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this.actor.insert_child_below(spacer, this._ornamentLabel)

	}
});

// SetvarBoxEnums: box to set r/w variables with enumerated values
const	SetvarBoxEnums = new Lang.Class({
	Name: 'SetvarBoxEnums',
	Extends: SetvarBox,

	// args = {
	//	varName: name of the settable variable
	//	enums: available enumerated values of the settable variable
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this.parent({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// enums: {
		//	enum1,
		//	enum2,
		//	enum3,
		//	...
		// }
		this._enums = args.enums;

		// Reset to actual value
		this._resetTo(args.actualValue);

		this.hide();

	},

	// _resetTo: reset setvar box to *value*
	_resetTo: function(value) {

		if (this._actualValue == value)
			return;

		// Update actual value
		this._actualValue = value;

		// Remove old enums, if any
		if (this._enumItems && this._enumItems.length)
			for (let i = 0; i < this._enumItems.length; i++)
				this._enumItems[i].destroy();
		// Add settable enums
		this._enumItems = [];
		// Iterate through all the enumerated values
		for (let i = 0; i < this._enums.length; i++) {
			let enumValue = this._enums[i];
			// The item represents actual value
			if (
				enumValue == this._actualValue ||
				// Take into account different notations for numbers
				(
					!isNaN(Number(enumValue)) &&
					isFinite(Number(enumValue)) &&
					!isNaN(Number(this._actualValue)) &&
					isFinite(Number(this._actualValue)) &&
					parseFloat(enumValue) == parseFloat(this._actualValue)
				)
			)
				this._enumItems[i] = new SetvarEnumItem({ enumValue: enumValue });
			else
				this._enumItems[i] = new SetvarEnumItem({
					enumValue: enumValue,
					callback: Lang.bind(this, function() {
						upsrwDo.setVar({
							device: upscMonitor.getList()[0],
							varName: this._varName,
							varValue: enumValue
						});
						this._parent.fold();
					})
				});

			this.addMenuItem(this._enumItems[i]);
			// Scroll the menu when item gets key-focus
			this._enumItems[i].actor.connect('key-focus-in', Lang.bind(this, function(self) {
				if (self.get_hover())
					return;
				Util.ensureActorVisibleInScrollView(this._scrollView, self);
			}));
		}

	}
});

// SetvarBoxString: box to set r/w string variables
const	SetvarBoxString = new Lang.Class({
	Name: 'SetvarBoxString',
	Extends: SetvarBox,

	// args = {
	//	varName: name of the settable variable
	//	len: maximum length of the settable string
	//	actualValue: actual value of the settable variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this.parent({
			varName: args.varName,
			scrollView: args.scrollView
		});

		// Max length of the string
		this._maxLength = args.len;

		// Actual value
		this._actualValue = args.actualValue;

		let container = new St.BoxLayout({
			can_focus: false,
			track_hover: false,
			style_class: 'popup-menu-item'
		});
		this.actor.add(container, { expand: true });

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		container.add(spacer);

		// Error box
		this._errorBox = new St.BoxLayout({
			can_focus: false,
			track_hover: false,
			style_class: 'popup-menu-item'
		});
		this.actor.add(this._errorBox);

		// Spacer
		let spacer = new St.Label({ style_class: 'popup-menu-ornament' });
		this._errorBox.add(spacer);

		// Error Icon
		let errorIcon = new St.Icon({
			icon_name: 'imported-dialog-error-symbolic',
			style_class: 'walnut-setvar-string-error-icon'
		});
		this._errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });

		// Error message
		let errorText = new St.Label({
			// TRANSLATORS: Error message @ string setvar
			text: _("String too long"),
			style_class: 'walnut-setvar-string-error-text'
		});
		this._errorBox.add(errorText, {
			expand: true,
			y_align: St.Align.MIDDLE,
			y_fill: false
		});

		this._errorBox.hide();

		this._entry = new St.Entry({
			text: '',
			// TRANSLATORS: Hint text @ string setvar
			hint_text: _("set this variable to.."),
			can_focus: true,
			reactive: true,
			style_class: 'walnut-setvar-string-entry'
		});
		container.add(this._entry, { expand: true });

		this._entry.clutter_text.connect('text-changed', Lang.bind(this, function() {

			this._valueToSet = this._entry.get_text();

			if (this._maxLength && this._valueToSet.trim().length > this._maxLength)
				this._errorBox.show();
			else
				this._errorBox.hide();

			this._updateOkButton();

		}));

		// Buttons
		let del = new Button({
			icon: 'imported-window-close',
			// TRANSLATORS: Accessible name of 'Undo and close' button @ setvar
			accessibleName: _("Undo and close"),
			callback: Lang.bind(this, function() {

				// Reset submenu
				this._resetTo(this._actualValue);

				// Give focus back to our 'toggle button'
				this._parent._button.actor.grab_key_focus();

				// Close the setvarBox and toggle the 'expander'
				this._parent.fold();

			}),
			size: 'small'
		});

		this._go = new Button({
			icon: 'imported-emblem-ok',
			// TRANSLATORS: Accessible name of 'Set' button @ setvar
			accessibleName: _("Set"),
			callback: Lang.bind(this, function() {

				upsrwDo.setVar({
					device: upscMonitor.getList()[0],
					varName: this._varName,
					varValue: this._valueToSet.trim()
				});

				// Close the setvarBox and change the ornament
				this._parent.fold();

				// Close top menu
				this.itemActivated();

			}),
			size: 'small'
		});

		this._valueToSet = this._actualValue;

		this._updateOkButton();

		// Buttons box
		let btns = new St.BoxLayout({
			vertical: false,
			style_class: 'walnut-setvar-buttons-box'
		});
		btns.add(del.actor, {
			x_fill: false,
			y_fill: false
		});
		btns.add(this._go.actor, {
			x_fill: false,
			y_fill: false
		});
		container.add(btns);

		// Scroll the menu when items get key-focus
		this._entry.clutter_text.connect('key-focus-in', Lang.bind(this, function(self) {
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));
		del.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));
		this._go.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, this.actor);
		}));

		this.hide();

	},

	// _updateOkButton: 'Set' button is usable only when this._valueToSet != actual value
	_updateOkButton: function() {

		let len = this._valueToSet.trim().length;

		if (this._actualValue != this._valueToSet && len > 0 && (!this._maxLength || len <= this._maxLength)) {
			this._go.actor.reactive = true;
			this._go.actor.can_focus = true;
		} else {
			this._go.actor.reactive = false;
			this._go.actor.can_focus = false;
		}

	},

	// _resetTo: reset setvar box to *value*
	_resetTo: function(value) {

		this._actualValue = value;

		this._entry.text = '';

		this._valueToSet = value;

		this._errorBox.hide();

		this._updateOkButton();

	}
});

// RawDataButton: expander/name/value
const	RawDataButton = new Lang.Class({
	Name: 'RawDataButton',
	Extends: PopupMenu.PopupBaseMenuItem,

	// args = {
	//	varName: name of the variable
	//	varValue: actual value of the variable
	//	setvarBox: child setvar box; if not set, the item won't be activatable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this._setvarBox = args.setvarBox;
		if (this._setvarBox != null) {
			this.parent();
			this.actor.add_accessible_state(Atk.StateType.EXPANDABLE);
			this.setOrnament(RawDataButtonOrnament.CLOSED);
		} else {
			this.parent({ activate: false });
		}

		// Variable's name
		this._varName = new St.Label({
			text: '',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.varName = args.varName;
		this.actor.add(this._varName, { expand: true });
		this.actor.label_actor = this._varName;

		// Variable's value
		this._varValue = new St.Label({
			text: '',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.varValue = args.varValue;
		this.actor.add(this._varValue);

		// Scroll the menu when items get key-focus
		this._scrollView = args.scrollView;
		this.actor.connect('key-focus-in', Lang.bind(this, function(self) {
			if (self.get_hover())
				return;
			Util.ensureActorVisibleInScrollView(this._scrollView, self);
		}));

	},

	_toggle: function() {

		if (this._setvarBox == null)
			return;

		if (this._setvarBox.isClosed()) {
			this._setvarBox.show({ actualValue: this.varValue });
			this.setOrnament(RawDataButtonOrnament.OPENED);
		} else {
			this._setvarBox.hide();
			this.setOrnament(RawDataButtonOrnament.CLOSED);
		}

	},

	close: function() {

		if (this._setvarBox == null)
			return;

		if (this._setvarBox.isClosed())
			return;

		this._setvarBox.hide();
		this.setOrnament(RawDataButtonOrnament.CLOSED);

	},

	activate: function(event) {

		if (this._setvarBox != null)
			this._toggle();

	},

	setOrnament: function(ornament) {

		if (ornament == this._ornament)
			return;

		this._ornament = ornament;

		if (ornament == RawDataButtonOrnament.CLOSED) {
			this._ornamentLabel.text = '+';
			this.actor.remove_accessible_state(Atk.StateType.EXPANDED);
		} else if (ornament == RawDataButtonOrnament.OPENED) {
			this._ornamentLabel.text = '-';
			this.actor.add_accessible_state(Atk.StateType.EXPANDED);
		} else if (ornament == RawDataButtonOrnament.NONE) {
			this._ornamentLabel.text = '';
			this.actor.remove_accessible_state(Atk.StateType.EXPANDED);
		}

	},

	get varName() {

		return this._varName.get_clutter_text().text;

	},

	set varName(name) {

		this._varName.text = Utilities.parseText(name, Lengths.RAW_VAR, '.');

	},

	get varValue() {

		return this._varValue.get_clutter_text().text;

	},

	set varValue(value) {

		this._varValue.text = Utilities.parseText(value, Lengths.RAW_VALUE);

	}
});

// UpsRawDataItem: each item of the raw data submenu
const	UpsRawDataItem = new Lang.Class({
	Name: 'UpsRawDataItem',
	Extends: PopupMenu.PopupMenuSection,

	// args = {
	//	varName: name of the variable
	//	varValue: actual value of the variable
	//	scrollView: container that should be scrolled to ensure visibility of elements
	// }
	_init: function(args) {

		this.parent();

		// Variable's name/value
		this._varName = args.varName;
		this._varValue = args.varValue;

		// Set scrollView
		this._scrollView = args.scrollView;

		// Expander/name/value container
		this._button = new RawDataButton({
			varName: this._varName,
			varValue: this._varValue,
			scrollView: this._scrollView
		});
		this.addMenuItem(this._button);

	},

	get varName() {

		return this._varName;

	},

	set varName(name) {

		this._varName = name;
		this._button.varName = name;

	},

	get varValue() {

		return this._varValue;

	},

	set varValue(value) {

		this._varValue = value;
		this._button.varValue = value;

	},

	// _addSetvarBox: common function for adding a SetvarBox
	_addSetvarBox: function() {

		// Expander/name/value container
		let button = new RawDataButton({
			varName: this._varName,
			varValue: this._button.varValue,
			setvarBox: this.setvarBox,
			scrollView: this._scrollView
		});
		this._button.destroy();
		this._button = button;
		this.addMenuItem(this._button);

		this.addMenuItem(this.setvarBox);

	},

	// setVarRange: add a SetvarBox for ranges
	// args = {
	//	ranges: available ranges of the settable variable
	//	actualValue: actual value of the settable variable
	// }
	setVarRange: function(args) {

		this.setvarBox = new SetvarBoxRanges({
			varName: this.varName,
			ranges: args.ranges,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	},

	// setVarEnum: add a SetvarBox for enumerated values
	// args = {
	//	enums: available enumerated values of the settable variable
	//	actualValue: actual value of the settable variable
	// }
	setVarEnum: function(args) {

		this.setvarBox = new SetvarBoxEnums({
			varName: this.varName,
			enums: args.enums,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	},

	// setVarString: add a SetvarBox for strings
	// args = {
	//	len: maximum length of the settable string
	//	actualValue: actual value of the settable variable
	// }
	setVarString: function(args) {

		this.setvarBox = new SetvarBoxString({
			varName: this.varName,
			len: args.len,
			actualValue: args.actualValue,
			scrollView: this._scrollView
		});

		this._addSetvarBox();

	},

	// fold: close the setvarBox, change button ornament
	fold: function() {

		if (this._button != null)
			this._button.close();

	}
});

// UpsRawDataList: list UPS's raw data in a submenu
const	UpsRawDataList = new Lang.Class({
	Name: 'UpsRawDataList',
	Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function() {

		// TRANSLATORS: Label of raw data submenu
		this.parent(_("Raw Data"));

	},

	_buildInfo: function() {

		// Actual submenu children (children of this.menu.box of type PopupMenuSection or PopupBaseMenuItem -> our own UpsRawDataItem)
		let actual;

		// Object where keys are variables' names (battery.charge, ups.status..) that stores the original position of the children (used to delete vars no longer available)
		let stored = {};

		// Array of variables' names of the submenu's children (used to sort new vars alphabetically)
		let ab = [];

		// Submenu has children
		if (!this.menu.isEmpty()) {

			actual = this.menu._getMenuItems();

			for (let i = 0; i < actual.length; i++) {

				// e.g.: stored['battery.charge'] = '0';
				stored[actual[i].varName] = '%d'.format(i);

				// e.g.: ab[0] = 'battery.charge';
				ab[i] = actual[i].varName;

			}

		}

		// this._vars = [
		//	{
		//		var: 'battery.charge',
		//		value: '100'
		//	},
		//	{
		//		var: 'ups.status',
		//		value: 'OL'
		//	},
		//		...
		// ]
		for each (let item in this._vars) {

			// Submenu has children and the current var is one of them
			if (actual && stored[item.var]) {

				// -> update only the variable's value
				this['_' + item.var].varValue = item.value;

				// Handle setvars
				this._handleSetVar(item);

				// and delete it from stored -> we won't delete this var
				delete stored[item.var];

			// Submenu doesn't have children or the current var isn't one of them
			} else {

				// this._vars is already alphabetically ordered, but, if a new var arises (e.g. ups.alarm)
				// now we have to insert new items so that they are alphabetically ordered

				let position;

				// ab ? -> the submenu has already children
				if (ab) {

					// add new var to array
					ab.push(item.var);

					// and sort the lengthened array alphabetically
					ab.sort();

					// ..finally get the position
					position = ab.indexOf(item.var);

				}

				this['_' + item.var] = new UpsRawDataItem({
					varName: item.var,
					varValue: item.value,
					scrollView: this.menu.actor
				});

				// Handle setvars
				this._handleSetVar(item);

				// If the var is a new one in an already ordered submenu, add it in the right position
				if (position)
					this.menu.addMenuItem(this['_' + item.var], position);
				// If the var is new as well as the submenu add it at the default position, as vars are already alphabetically ordered
				else
					this.menu.addMenuItem(this['_' + item.var]);

			}

		}

		// Destroy all children still stored in 'stored' obj
		for each (let item in stored) {
			actual[item].destroy();
		}

	},

	// _handleSetVar: If we have setvars and item is one of them, add its SetvarBox
	_handleSetVar: function(item) {

		// No setvars
		if (!upsrwDo.hasSetVars())
			return;

		let setVars = upsrwDo.getSetVars();

		if (setVars[item.var] && !this['_' + item.var].setvarBox) {

			let setVar = setVars[item.var];

			if (setVar.type == 'STRING')
				this['_' + item.var].setVarString({
					len: setVar.options,
					actualValue: item.value
				});

			else if (setVar.type == 'ENUM')
				this['_' + item.var].setVarEnum({
					enums: setVar.options,
					actualValue: item.value
				});

			else if (setVar.type == 'RANGE')
				this['_' + item.var].setVarRange({
					ranges: setVar.options,
					actualValue: item.value
				});

			return;

		}

	},

	// update: Update variables and show the menu if not already visible
	// args = {
	//	vars: device's variables
	//	forceRefresh: boolean, whether to destroy the menu and rebuild it or not
	// }
	update: function(args) {

		if (args.forceRefresh && !this.menu.isEmpty())
			this.menu.removeAll();

		if (!this.actor.visible)
			this.show();

		this._vars = args.vars;

		this._buildInfo();

	},

	// hide: Hide the menu and, if it's not empty, destroy all children
	hide: function() {

		// If the submenu is not empty (e.g. we don't want anymore to display Raw Var submenu in panel menu), destroy all children
		if (!this.menu.isEmpty())
			this.menu.removeAll();

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// UpsDataTableAlt: Alternative, less noisy, data table
const	UpsDataTableAlt = new Lang.Class({
	Name: 'UpsDataTableAlt',
	Extends: PopupMenu.PopupMenuSection,

	_init: function() {

		this.parent();

	},

	// args = {
	//	type: type of the data to add {'C','L','R','T'}
	// }
	addData: function(args) {

		let cell = {};

		switch (args.type)
		{
		case 'C':	// Battery Charge

			cell.type = 'batteryCharge';
			// TRANSLATORS: Label of battery charge @ alternative, less noisy, data table
			cell.label = _("Battery Charge");
			break;

		case 'L':	// Device Load

			cell.type = 'deviceLoad';
			// TRANSLATORS: Label of device load @ alternative, less noisy, data table
			cell.label = _("Device Load");
			cell.icon = 'imported-system-run';
			break;

		case 'R':	// Backup Time

			cell.type = 'backupTime';
			// TRANSLATORS: Label of estimated backup time @ alternative, less noisy, data table
			cell.label = _("Backup Time");
			cell.icon = 'imported-preferences-system-time';
			break;

		case 'T':	// Device Temperature

			cell.type = 'deviceTemp';
			// TRANSLATORS: Label of device temperature @ alternative, less noisy, data table
			cell.label = _("Temperature");
			cell.icon = 'nut-thermometer';
			break;

		default:

			break;

		}

		// Create item
		this[cell.type] = new UpsDataTableAltItem();

		// Populate item
		this[cell.type].setLabel(cell.label);
		if (cell.icon)
			this[cell.type].setIcon(cell.icon + '-symbolic');

		// Add item
		this.addMenuItem(this[cell.type]);

	},

	// update: update table's data/icons
	// args = {
	//	type: type of the data to update {'C','L','R','T'}
	//	value: actual value of this type of data
	// }
	update: function(args) {

		let cell = {};

		switch (args.type)
		{
		case 'C':	// Battery Charge

			cell.type = 'batteryCharge';
			cell.icon = BatteryIcon['B' + Utilities.parseBatteryLevel(args.value)];
			// TRANSLATORS: Battery charge level @ alternative, less noisy, data table
			cell.value = _("%s %").format(args.value);
			break;

		case 'L':	// Device Load

			cell.type = 'deviceLoad';
			// TRANSLATORS: Device load level @ alternative, less noisy, data table
			cell.value = _("%s %").format(args.value);
			break;

		case 'R':	// Backup Time

			cell.type = 'backupTime';
			cell.value = Utilities.parseTime(args.value);
			break;

		case 'T':	// Device Temperature

			cell.type = 'deviceTemp';
			cell.value = Utilities.formatTemp(args.value);
			break;

		default:

			break;

		}

		if (cell.icon)
			this[cell.type].setIcon(cell.icon + '-symbolic');

		this[cell.type].setValue(cell.value);

	},

	// clean: destroy table's children, if any
	clean: function() {

		if (this.actor.get_children().length > 0)
			this.actor.destroy_all_children();

	},

	hide: function() {

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// UpsDataTableAltItem: Alternative, less noisy, data table - item
const	UpsDataTableAltItem = new Lang.Class({
	Name: 'UpsDataTableAltItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({ activate: false });

		// Icon
		this.icon = new St.Icon({ style_class: 'popup-menu-icon' });
		this.actor.add(this.icon);

		// Label
		this.label = new St.Label({
			text: '',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add(this.label, { expand: true });
		this.actor.label_actor = this.label;

		// Value
		this.value = new St.Label({
			text: '',
			style_class: 'popup-status-menu-item',
			y_expand: true,
			y_align: Clutter.ActorAlign.CENTER
		});
		this.actor.add(this.value);

	},

	setIcon: function(icon) {

		this.icon.icon_name = icon;

	},

	setLabel: function(label) {

		this.label.text = label;

	},

	setValue: function(value) {

		this.value.text = value;

	}
});

// UpsTopDataList: List (if available/any) ups.{status,alarm}
const	UpsTopDataList = new Lang.Class({
	Name: 'UpsTopDataList',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let container = new St.Bin();

		let dataBox = new St.BoxLayout({
			vertical: true,
			style_class: 'walnut-ups-top-data-box'
		});

		container.set_child(dataBox);

		// Device status
		this.statusIcon = new St.Icon({
			icon_name: 'imported-utilities-system-monitor-symbolic',
			style_class: 'walnut-ups-top-data-icon'
		});
		this.statusLabel = new St.Label({ style_class: 'walnut-ups-top-data-label' });
		this.statusText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let statusDescBox = new St.BoxLayout({ vertical: true });
		statusDescBox.add_actor(this.statusLabel);
		statusDescBox.add_actor(this.statusText);

		// Icon + desc box
		let statusBox = new St.BoxLayout({ style_class: 'popup-menu-item walnut-ups-top-data-status-box' });
		statusBox.add_actor(this.statusIcon);
		statusBox.add_actor(statusDescBox);

		// Alarm
		this.alarmIcon = new St.Icon({
			icon_name: 'imported-dialog-warning-symbolic',
			style_class: 'walnut-ups-top-data-icon'
		});
		let alarmLabel = new St.Label({
			// TRANSLATORS: Label of device alarm box
			text: _("Alarm!"),
			style_class: 'walnut-ups-top-data-label'
		});
		this.alarmText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let alarmDescBox = new St.BoxLayout({ vertical: true });
		alarmDescBox.add_actor(alarmLabel);
		alarmDescBox.add_actor(this.alarmText);

		// Icon + desc box
		this.alarmBox = new St.BoxLayout({ style_class: 'popup-menu-item walnut-ups-top-data-alarm-box' });
		this.alarmBox.add_actor(this.alarmIcon);
		this.alarmBox.add_actor(alarmDescBox);

		// Add to dataBox
		dataBox.add_actor(statusBox);
		dataBox.add_actor(this.alarmBox);

		this.actor.add(container);

	},

	// update: update displayed data
	// args = {
	//	type: type of the data to update {'S','A'}
	//	value: actual value of this type of data
	// }
	update: function(args) {

		switch (args.type)
		{
		case 'S':	// Device status

			let status = Utilities.parseStatus(args.value);

			this.statusLabel.text = status.line;
			this.statusText.text = Utilities.parseText(status.status, Lengths.TOPDATA);
			this.statusIcon.style_class = 'popup-menu-icon';

			break;

		case 'A':	// Alarm

			this.alarmText.text = Utilities.parseText(args.value, Lengths.TOPDATA);
			this.alarmIcon.style_class = 'popup-menu-icon';

			if (!this.alarmBox.visible)
				this.alarmBox.show();

			break;

		default:

			break;

		}

	},

	// args = {
	//	type: type of the data to hide {'S','A'}
	// }
	hide: function(args) {

		// All UpsTopDataList
		if (!args || !args.type) {
			this.actor.hide();
			return;
		}

		// Alarm
		if (args.type == 'A' && this.alarmBox.visible) {
			this.alarmText.text = '';
			this.alarmBox.hide();
		}

	},

	show: function() {

		this.actor.show();

	}
});

// UpsModel: List chosen UPS's model/manufacturer (if available)
const	UpsModel = new Lang.Class({
	Name: 'UpsModel',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		this.label = new St.Label({ style_class: 'walnut-ups-model' });

		this.actor.add(this.label, { expand: true });

	},

	hide: function() {

		this.label.text = '';

		this.actor.hide();

	},

	// args = {
	//	manufacturer: UPS manufacturer
	//	model: UPS model
	// }
	show: function(args) {

		let mfr = args.manufacturer;
		let model = args.model;

		let text = '';

		if (mfr && model) {
			if ((mfr.length + model.length) < Lengths.MODEL)
				text = '%s - %s'.format(mfr, model);
			else
				text = '%s\n%s'.format(Utilities.parseText(mfr, Lengths.MODEL), Utilities.parseText(model, Lengths.MODEL));
		} else {
			text = Utilities.parseText((mfr || model), Lengths.MODEL);
		}

		this.label.text = text;

		this.actor.show();

	}
});

// UpsList: a submenu listing available UPSes in a upsc-like way (i.e. ups@hostname:port)
const	UpsList = new Lang.Class({
	Name: 'UpsList',
	Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function() {

		this.parent('');

	},

	_buildInfo: function() {

		// Counter used to decide whether the submenu will be sensitive or not: only 1 entry -> not sensitive, 2+ entries -> sensitive
		let count = 0;

		for (let i = 0; i < this._devices.length; i++) {

			let label;

			let item = this._devices[i];

			label = '%s@%s:%s'.format(item.name, item.host, item.port);

			// N/A
			if (item.av != 1)
				// TRANSLATORS: Device not available @ devices list
				label += _(" (N/A)");

			if (i == 0) {
				this.label.text = label;
				continue;
			}

			let ups_l = new PopupMenu.PopupMenuItem(label);

			let index = i;

			ups_l.connect('activate', Lang.bind(this, function() {
				Utilities.setAsDefaultUPS(index);
			}));

			// N/A -> Style = popup-menu-item:insensitive
			if (item.av != 1) {

				ups_l.actor.add_style_pseudo_class('insensitive');

				// If !display-na: UPSes not currently available won't be shown (apart from the chosen one)
				if (this._display_na == false)
					continue;

			}

			count++;

			this.menu.addMenuItem(ups_l);

			// Scroll the parent menu when item gets key-focus
			ups_l.actor.connect('key-focus-in', Lang.bind(this, function(self) {
				if (self.get_hover())
					return;
				Util.ensureActorVisibleInScrollView(this.menu.actor, self);
			}));

		}

		// Submenu sensitive or not
		if ((this._display_na == false && count == 0) || this._devices.length == 1)
			this.setSensitive(false);
		else
			this.setSensitive(true);

	},

	// update: Empty the submenu and update it with the new device list
	// args = {
	//	devices: available devices
	// }
	update: function(args) {

		// Update device list
		this._devices = args.devices;

		// Destroy all previously added items, if any
		if (this.menu._getMenuItems().length)
			this.menu.removeAll();

		// Display also not available UPSes, if at least one of the 'not chosen' is available:
		//  - display-na: Display also not available UPSes
		//  - !display-na: Display chosen UPS and then only available UPSes
		this._display_na = gsettings.get_boolean('display-na');

		// Rebuild submenu
		this._buildInfo();

	},

	hide: function() {

		// If the submenu is not empty, destroy all children
		if (!this.menu.isEmpty())
			this.menu.removeAll();

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	}
});

// ErrorBox: a box to display errors (if any)
const	ErrorBox = new Lang.Class({
	Name: 'ErrorBox',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({
			reactive: true,
			activate: false,
			hover: false,
			can_focus: false
		});

		let eBox = new St.BoxLayout({ vertical: false });

		// Box for the message
		let textBox = new St.BoxLayout({ vertical: true });

		// Icon
		let icon = new St.Icon({
			icon_name: 'imported-dialog-error-symbolic',
			style_class: 'walnut-error-icon'
		});
		eBox.add(icon, {
			x_fill: true,
			y_fill: false,
			x_align: St.Align.END,
			y_align: St.Align.MIDDLE
		});

		// Error label
		this.label = new St.Label({ style_class: 'walnut-error-label' });
		textBox.add(this.label);

		// Error description
		this.desc = new St.Label({ style_class: 'walnut-error-desc' });
		textBox.add(this.desc);

		eBox.add(textBox, { y_align: St.Align.START });

		this.actor.add(eBox, { expand: true });

	},

	hide: function() {

		this.label.text = '';
		this.desc.text = '';

		this.actor.hide();

	},

	show: function(type) {

		let label, desc;

		// Unable to find upsc -> ErrorType.NO_NUT
		if (type & ErrorType.NO_NUT) {

			// TRANSLATORS: Error label NO NUT @ main menu
			label = _("Error! No NUT found");

			// TRANSLATORS: Error description NO NUT @ main menu
			desc = _("walNUT can't find NUT's executable, please check your installation");

		// Unable to find any UPS -> ErrorType.NO_UPS
		} else if (type & ErrorType.NO_UPS) {

			// TRANSLATORS: Error label NO UPS @ main menu
			label = _("Error! No UPS found");

			// TRANSLATORS: Error description NO UPS @ main menu
			desc = _("walNUT can't find any UPS, please add one hostname:port to search in");

		// Currently chosen UPS not available -> ErrorType.UPS_NA
		} else {

			// TRANSLATORS: Error label UPS NOT AVAILABLE @ main menu
			label = _("Error! UPS not available");

			// TRANSLATORS: Error description UPS NOT AVAILABLE @ main menu
			desc = _("walNUT can't communicate to chosen UPS, please select or add another one or check your installation");

		}

		this.label.text = Utilities.parseText(label, Lengths.ERR_LABEL);
		this.desc.text = Utilities.parseText(desc, Lengths.ERR_DESC);

		this.actor.show();

	}
});

// Panel menu
const	walNUTMenu = new Lang.Class({
	Name: 'walNUTMenu',
	Extends: PopupMenu.PopupMenu,

	// args = {
	//	sourceActor: actor of the menu's parent
	// }
	_init: function(args) {

		this.parent(args.sourceActor, 0.0, St.Side.TOP);

		// Override base style
		this.actor.add_style_class_name('walnut-menu');
		// Highlight Gnome Shell version
		let [ major, minor ] = Config.PACKAGE_VERSION.split('.');
		this.actor.add_style_class_name('walnut-gs-%s-%s'.format(major, minor));

		// Error Box
		this.errorBox = new ErrorBox();
		this.errorBox.hide();

		// Devices list
		this.upsList = new UpsList();
		this.upsList.hide();

		// Chosen UPS's data
		// Model/manufacturer
		this.upsModel = new UpsModel();
		this.upsModel.hide();
		// Device status/alarm
		this.upsTopDataList = new UpsTopDataList;
		this.upsTopDataList.hide();
		// Battery charge, battery runtime, device load, device temperature
		this.upsDataTableAlt = new UpsDataTableAlt();
		this.upsDataTableAlt.hide();

		// Separator between chosen UPS's data & raw data/UPS commands
		this.separator = new PopupMenu.PopupSeparatorMenuItem();
		this.separator.actor.hide();

		// UPS Raw Data
		this.upsRaw = new UpsRawDataList();
		this.upsRaw.hide();
		// UPS Commands
		this.upsCmdList = new UpsCmdList();
		this.upsCmdList.hide();

		// Box for bottom buttons functions
		this.credBox = new CredBox();
		this.credBox.hide();
		this.addBox = new AddBox(this);
		this.addBox.hide();
		this.delBox = new DelBox();
		this.delBox.hide();

		// Bottom buttons
		this.controls = new BottomControls();

		// Put menu together

		// Devices list
		this.addMenuItem(this.upsList);

		// Error Box
		this.addMenuItem(this.errorBox);

		// Top data - Manufacturer & model, status & alarm, battery {charge,runtime} & device {load,temperature}
		this.addMenuItem(this.upsModel);
		this.addMenuItem(this.upsTopDataList);
		this.addMenuItem(this.upsDataTableAlt);

		// Separator - Raw Data / UPS Commands
		this.addMenuItem(this.separator);
		this.addMenuItem(this.upsRaw);
		this.addMenuItem(this.upsCmdList);

		// Separator - Bottom buttons and their boxes
		this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
		this.addMenuItem(this.credBox);
		this.addMenuItem(this.addBox);
		this.addMenuItem(this.delBox);
		this.addMenuItem(this.controls);

	}
});

// Start!
let	gsettings,
	upscMonitor,	// upsc monitor
	upsrwDo,	// upsrw handler
	upscmdDo,	// upscmd handler
	walnut,		// Panel/menu
	upsc,		// Absolute path of upsc
	upscmd,		// Absolute path of upscmd
	upsrw;		// Absolute path of upsrw

// Init extension
function init(extensionMeta) {

	gsettings = Convenience.getSettings();
	Convenience.initTranslations();

	// Import icons
	let theme = imports.gi.Gtk.IconTheme.get_default();
	theme.append_search_path(extensionMeta.path + '/icons');

}

// Enable Extension
function enable() {

	// First, find upsc, upscmd and upsrw
	// Detect upsc
	upsc = Utilities.detect('upsc');
	// Detect upscmd
	upscmd = Utilities.detect('upscmd');
	// Detect upsrw
	upsrw = Utilities.detect('upsrw');

	upscMonitor = new UpscMonitor();

	upsrwDo = new UpsrwDo();

	upscmdDo = new UpscmdDo();

	walnut = new walNUT();

	Main.panel.addToStatusArea('walNUT', walnut);

}

// Disable Extension
function disable() {

	walnut.destroy();
	walnut = null;

	upscMonitor.destroy();
	upscMonitor = null;

	upsrwDo = null;

	upscmdDo = null;

}
