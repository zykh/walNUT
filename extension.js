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

const	Clutter = imports.gi.Clutter,
	Main = imports.ui.main,
	Mainloop = imports.mainloop,
	ModalDialog = imports.ui.modalDialog,
	Lang = imports.lang,
	PanelMenu = imports.ui.panelMenu,
	PopupMenu = imports.ui.popupMenu,
	Shell = imports.gi.Shell,
	ShellEntry = imports.ui.shellEntry,
	St = imports.gi.St,
	Util = imports.misc.util;

// Gettext
const	Gettext = imports.gettext.domain('gnome-shell-extensions-walnut'),
	_ = Gettext.gettext;

const	Me = imports.misc.extensionUtils.getCurrentExtension(),
	Convenience = Me.imports.convenience,
	// Importing utilities.js
	Utilities = Me.imports.utilities;

// Panel Icons
const	icons = {
	// Error = e
	e:	'nut-error',

	// Battery	| Load
	// full = 2	| full = 23
	// good = 3	| good = 17
	// low = 5	| low = 13
	// empty = 7	| empty = 11
	// no battery/no load = 1
	// +: lightning = online (= status OL = not on battery (OB = b) = main is not absent): full opacity = charging => o | transparent = charged => c
	// +: ! = caution (ALARM, BYPASS, OVER, RB..) => a

	// status = OB (-> b) - no caution
	// no battery/no load -> 1
	b1:	'nut-ghost-ob',
	//	battery full -> 2
	b2:	'nut-battery-full',
	b46:	'nut-battery-full-load-full',
	b34:	'nut-battery-full-load-good',
	b26:	'nut-battery-full-load-low',
	b22:	'nut-battery-full-load-empty',
	//	battery good -> 3
	b3:	'nut-battery-good',
	b69:	'nut-battery-good-load-full',
	b51:	'nut-battery-good-load-good',
	b39:	'nut-battery-good-load-low',
	b33:	'nut-battery-good-load-empty',
	//	battery low -> 5
	b5:	'nut-battery-low',
	b115:	'nut-battery-low-load-full',
	b85:	'nut-battery-low-load-good',
	b65:	'nut-battery-low-load-low',
	b55:	'nut-battery-low-load-empty',
	//	battery empty -> 7
	b7:	'nut-battery-empty',
	b161:	'nut-battery-empty-load-full',
	b119:	'nut-battery-empty-load-good',
	b91:	'nut-battery-empty-load-low',
	b77:	'nut-battery-empty',
	// just load
	//	load full -> 23
	b23:	'nut-battery-full',
	//	load good -> 17
	b17:	'nut-battery-good',
	//	load low -> 13
	b13:	'nut-battery-low',
	//	load empty -> 11
	b11:	'nut-battery-empty',

	// status = OB (->b) - caution (->a)
	// no battery/no load -> 1
	ba1:	'nut-ghost-ob-caution',
	//	battery full -> 2
	ba2:	'nut-battery-full-caution',
	ba46:	'nut-battery-full-load-full-caution',
	ba34:	'nut-battery-full-load-good-caution',
	ba26:	'nut-battery-full-load-low-caution',
	ba22:	'nut-battery-full-load-empty-caution',
	//	battery good -> 3
	ba3:	'nut-battery-good-caution',
	ba69:	'nut-battery-good-load-full-caution',
	ba51:	'nut-battery-good-load-good-caution',
	ba39:	'nut-battery-good-load-low-caution',
	ba33:	'nut-battery-good-load-empty-caution',
	//	battery low -> 5
	ba5:	'nut-battery-low-caution',
	ba115:	'nut-battery-low-load-full-caution',
	ba85:	'nut-battery-low-load-good-caution',
	ba65:	'nut-battery-low-load-low-caution',
	ba55:	'nut-battery-low-load-empty-caution',
	//	battery empty -> 7
	ba7:	'nut-battery-empty-caution',
	ba161:	'nut-battery-empty-load-full-caution',
	ba119:	'nut-battery-empty-load-good-caution',
	ba91:	'nut-battery-empty-load-low-caution',
	ba77:	'nut-battery-empty-caution',
	// just load
	//	load full -> 23
	ba23:	'nut-battery-full-caution',
	//	load good -> 17
	ba17:	'nut-battery-good-caution',
	//	load low -> 13
	ba13:	'nut-battery-low-caution',
	//	load empty -> 11
	ba11:	'nut-battery-empty-caution',

	// status = OL (->o[+c])
	// no battery/no load -> 1
	oc1:	'nut-ghost-ol-charging',
	o1:	'nut-ghost-ol-charged',
	//	battery full -> 2
	oc2:	'nut-battery-full-charged',
	o2:	'nut-battery-full-charging',
	oc46:	'nut-battery-full-load-full-charged',
	o46:	'nut-battery-full-load-full-charging',
	oc34:	'nut-battery-full-load-good-charged',
	o34:	'nut-battery-full-load-good-charging',
	oc26:	'nut-battery-full-load-low-charged',
	o26:	'nut-battery-full-load-low-charging',
	oc22:	'nut-battery-full-load-empty-charged',
	o22:	'nut-battery-full-load-empty-charging',
	//	battery good -> 3
	o3:	'nut-battery-good-charging',
	o69:	'nut-battery-good-load-full-charging',
	o51:	'nut-battery-good-load-good-charging',
	o39:	'nut-battery-good-load-low-charging',
	o33:	'nut-battery-good-load-empty-charging',
	//	battery low -> 6
	o6:	'nut-battery-low-charging',
	o115:	'nut-battery-low-load-full-charging',
	o85:	'nut-battery-low-load-good-charging',
	o65:	'nut-battery-low-load-low-charging',
	o55:	'nut-battery-low-load-empty-charging',
	//	battery empty -> 7
	o7:	'nut-battery-empty-charging',
	o161:	'nut-battery-empty-load-full-charging',
	o119:	'nut-battery-empty-load-good-charging',
	o91:	'nut-battery-empty-load-low-charging',
	o77:	'nut-battery-empty-charging',
	// just load
	//	load full -> 23
	o23:	'nut-battery-full-charging',
	//	load good -> 17
	o17:	'nut-battery-good-charging',
	//	load low -> 13
	o13:	'nut-battery-low-charging',
	//	load empty -> 11
	o11:	'nut-battery-empty-charging',

	// status = OL (->o[+c]) - caution (->a)
	// no battery/no load ->
	oac1:	'nut-ghost-ol-caution-charging',
	oa1:	'nut-ghost-ol-caution-charged',
	//	battery full -> 2
	oac2:	'nut-battery-full-caution-charged',
	oa2:	'nut-battery-full-caution-charging',
	oac46:	'nut-battery-full-load-full-caution-charged',
	oa46:	'nut-battery-full-load-full-caution-charging',
	oac34:	'nut-battery-full-load-good-caution-charged',
	oa34:	'nut-battery-full-load-good-caution-charging',
	oac26:	'nut-battery-full-load-low-caution-charged',
	oa26:	'nut-battery-full-load-low-caution-charging',
	oac22:	'nut-battery-full-load-empty-caution-charged',
	oa22:	'nut-battery-full-load-empty-caution-charging',
	//	battery good -> 3
	oa3:	'nut-battery-good-caution-charging',
	oa69:	'nut-battery-good-load-full-caution-charging',
	oa51:	'nut-battery-good-load-good-caution-charging',
	oa39:	'nut-battery-good-load-low-caution-charging',
	oa33:	'nut-battery-good-load-empty-caution-charging',
	//	battery low -> 5
	oa5:	'nut-battery-low-caution-charging',
	oa115:	'nut-battery-low-load-full-caution-charging',
	oa85:	'nut-battery-low-load-good-caution-charging',
	oa65:	'nut-battery-low-load-low-caution-charging',
	oa55:	'nut-battery-low-load-empty-caution-charging',
	//	battery empty -> 7
	oa7:	'nut-battery-empty-caution-charging',
	oa161:	'nut-battery-empty-load-full-caution-charging',
	oa119:	'nut-battery-empty-load-good-caution-charging',
	oa91:	'nut-battery-empty-load-low-caution-charging',
	oa77:	'nut-battery-empty-caution-charging',
	// just load
	//	load full -> 23
	oa23:	'nut-battery-full-caution-charging',
	//	load good -> 17
	oa17:	'nut-battery-good-caution-charging',
	//	load low -> 13
	oa13:	'nut-battery-low-caution-charging',
	//	load empty -> 11
	oa11:	'nut-battery-empty-caution-charging'
}

// Battery icon @ menu
const	BatteryIcon = {
	b1:	'imported-battery-missing',
	b2:	'imported-battery-full',
	b3:	'imported-battery-good',
	b5:	'imported-battery-low',
	b7:	'imported-battery-empty'
}

// BatteryLevel: battery level for icons
function BatteryLevel(raw){

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
function LoadLevel(raw){

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

// Errors
const	ErrorType = {
	NO_ERROR: 0,
	UPS_NA: 1,
	NO_UPS: 2,
	NO_NUT: 3,
	NO_TIMEOUT: 4
}

// Max length (in chars)
const	ERR_LABEL_LENGTH = 35,		// ErrorBox Label
	ERR_DESC_LENGTH = 40,		// ErrorBox Description
	MODEL_LENGTH = 40,		// Device manufacturer+model
	TOPDATA_LENGTH = 40,		// Topdata (status/alarm) description (2nd row)
	RAW_VAR_LENGTH = 35,		// Raw data list: variable name
	RAW_VALUE_LENGTH = 40,		// Raw data list: variable value
	CMD_LENGTH = 45,		// UPS commands list - description @ submenu
	CMD_DESC_LENGTH = 45,		// UPS commands list - description @ combobox
	CRED_DIALOG_LENGTH = 60;	// Credentials dialog description

// Interval in milliseconds after which the menu, if open, has to be updated (15 minutes)
const	INTERVAL = 900000;

// UpscMonitor: exec upsc at a given interval and deliver infos
const	UpscMonitor = new Lang.Class({
	Name: 'UpscMonitor',

	_init: function() {

		// Actual status
		this._state = '';

		// Device list
		this._devices = new Array();

		// Here we'll store chosen UPS's variables
		this._ups = {};
		this._vars = Array();

		// upsc not found
		if (!upsc)
			this._state = ErrorType.NO_NUT;
		// timeout not found
		else if (!timeout)
			this._state = ErrorType.NO_TIMEOUT;
		// upsc found
		else {
			this._state = ErrorType.NO_ERROR;
			this.update();
		}

		// Get time between updates
		this._interval = gsettings.get_int('update-time');

		// Get timeout
		this._timeout = gsettings.get_double('timeout');

		this._settingsChangedId = gsettings.connect('changed', Lang.bind(this, function() {

			// Update interval between updates
			this._interval = gsettings.get_int('update-time');

			// Update timeout
			this._timeout = gsettings.get_double('timeout');

			// Update infos
			this.updateTimer();

		}));

		this.updateTimer();

	},

	// _getDevices: Search available devices
	_getDevices: function() {

		this._devices = Utilities.getUps(timeout, this._timeout, false, upsc);

		if (this._devices.length == 0)
			this._state = ErrorType.NO_UPS;
		else
			this._state = ErrorType.NO_ERROR;

	},

	// _getVars: Retrieve chosen UPS's variables
	_getVars: function() {

		let [stdout, stderr] = Utilities.DoT(timeout, this._timeout, ['%s'.format(upsc), '%s@%s:%s'.format(this._devices[0].name, this._devices[0].host, this._devices[0].port)]);

		if (!stdout || stderr)
			this._state = ErrorType.UPS_NA;
		else {
			this._ups = Utilities.toObj(stdout, ':');
			this._vars = Utilities.toArr(stdout, ':', 'var', 'value');
			this._state = ErrorType.NO_ERROR;
		}

	},

	// updateTimer: update infos at a given interval
	updateTimer: function() {

		this.update();

		if (this._state != ErrorType.NO_NUT && this._state != ErrorType.NO_TIMEOUT)
			this._timer = Mainloop.timeout_add_seconds(this._interval, Lang.bind(this, this.updateTimer));

	},

	// update: Search for available devices and then for the first one's variables
	update: function() {

		this._getDevices();

		if (this._state == ErrorType.NO_ERROR)
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

	// getVars: return actual chosen device's variables in an Obj where keys are variables' names (e.g.: { 'battery.charge': '100', 'ups.status': 'OL', .. })
	getVars: function() {

		return this._ups;

	},

	// getVarsArr: return actual chosen device's variables in an Array of Obj with keys var and value (e.g.: [ { var: 'battery.charge', value: '100' }, { var: 'ups.status', value: 'OL' }, .. ])
	getVarsArr: function() {

		return this._vars;

	},

	// destroy: remove timer and disconnect signals
	destroy: function() {

		// Remove timer
		if (this._timer)
			Mainloop.source_remove(this._timer);

		// Disconnect settings changed connection
		gsettings.disconnect(this._settingsChangedId);

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

		// Timers
		this._timers = {};

		// Panel button
		this._btnBox = new St.BoxLayout();
		// Panel icon
		this._icon = new St.Icon({ icon_name: icons.e+'-symbolic', style_class: 'system-status-icon' });
		// Panel label for battery charge and device load
		this._status = new St.Label();

		this._btnBox.add(this._icon);
		this._btnBox.add(this._status);

		this.actor.add_actor(this._btnBox);
		this.actor.add_style_class_name('panel-status-button');

		// Menu
		let menu = new NutMenu(this.actor)
		this.setMenu(menu);

		// Bottom Buttons

		// Settings button
		this._pref_btn = new Button('imported-preferences-system', function() {

			let _appSys = Shell.AppSystem.get_default();
			let _gsmPrefs = _appSys.lookup_app('gnome-shell-extension-prefs.desktop');

			if (_gsmPrefs.get_state() == _gsmPrefs.SHELL_APP_STATE_RUNNING)
				_gsmPrefs.activate();
			else
				_gsmPrefs.launch(global.display.get_current_time_roundtrip(), [Me.metadata.uuid], -1, null);

		});

		// Credentials button
		this._cred_btn = new Button('imported-dialog-password', Lang.bind(this, function() {

			// Close, if open, {add,del}Box and if credBox is visible, close it, otherwise, open it
			if (this.menu.addBox.actor.visible)
				this.menu.addBox.hide();
			if (this.menu.delBox.actor.visible)
				this.menu.delBox.hide();
			if (this.menu.credBox.actor.visible)
				this.menu.credBox.hide();
			else
				this.menu.credBox.show();

		}));

		// Add UPS button
		this._add_btn = new Button('imported-edit-find', Lang.bind(this, function() {

			// Close, if open, {cred,del}Box and if addBox is visible, close it, otherwise, open it
			if (this.menu.credBox.actor.visible)
				this.menu.credBox.hide();
			if (this.menu.delBox.actor.visible)
				this.menu.delBox.hide();
			if (this.menu.addBox.actor.visible)
				this.menu.addBox.hide();
			else
				this.menu.addBox.show();

		}));

		// Delete UPS from UPS list button
		this._del_btn = new Button('imported-user-trash', Lang.bind(this, function() {

			// Close, if open, {add,cred}Box and if delBox is visible, close it, otherwise, open it
			if (this.menu.addBox.actor.visible)
				this.menu.addBox.hide();
			if (this.menu.credBox.actor.visible)
				this.menu.credBox.hide();
			if (this.menu.delBox.actor.visible)
				this.menu.delBox.hide();
			else
				this.menu.delBox.show();

		}));

		// Help button
		this._help_btn = new Button('imported-help-browser', function() {

			let yelp = Utilities.detect('yelp');
			let help = Me.dir.get_child('help');

			// Get locale
			let locale = Utilities.getLocale();

			// If yelp is available and the [localized] help is found, we'll use them..
			if (yelp && help.query_exists(null)) {

				// Language code + country code (eg. en_US, it_IT, ..)
				if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
					Util.spawn(['yelp', '%s/%s'.format(help.get_path(), locale.split('.')[0])]);
				// Language code (eg. en, it, ..)
				else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
					Util.spawn(['yelp', '%s/%s'.format(help.get_path(), locale.split('_')[0])]);
				else
					Util.spawn(['yelp', '%s/C'.format(help.get_path())]);

			// ..otherwise we'll open the html page
			} else {

				// If [localized] help is found, we'll use it
				if (help.query_exists(null)) {

					// Language code + country code (eg. en_US, it_IT, ..)
					if (locale && help.get_child(locale.split('.')[0]).query_exists(null))
						Util.spawn(['xdg-open', '%s/%s/help.html'.format(help.get_path(), locale.split('.')[0])]);
					// Language code (eg. en, it, ..)
					else if (locale && help.get_child(locale.split('_')[0]).query_exists(null))
						Util.spawn(['xdg-open', '%s/%s/help.html'.format(help.get_path(), locale.split('_')[0])]);
					else
						Util.spawn(['xdg-open', '%s/C/help.html'.format(help.get_path())]);

				// ..otherwise we'll open the web page
				} else
					Util.spawn(['xdg-open', 'https://github.com/zykh/walNUT']);

			}

		});

		// Always show Bottom Buttons (some won't be reactive in case of certain errors)
		// Preferences
		this.menu.controls.addControl(this._pref_btn);
		// Credentials
		this.menu.controls.addControl(this._cred_btn, this._state == ErrorType.NO_ERROR || this._state == ErrorType.UPS_NA ? 'active' : 'inactive' );
		// Find new UPSes
		this.menu.controls.addControl(this._add_btn, this._state != ErrorType.NO_NUT && this._state != ErrorType.NO_TIMEOUT ? 'active' : 'inactive' );
		// Delete UPS
		this.menu.controls.addControl(this._del_btn, this._state == ErrorType.NO_ERROR || this._state == ErrorType.UPS_NA ? 'active' : 'inactive' );
		// Help
		this.menu.controls.addControl(this._help_btn);

		// Update options stored in schema
		this.updateOptions();

		let settingsChangedId = gsettings.connect('changed', Lang.bind(this, function() {

			this._state = this._monitor.getState();

			this.updateOptions();

			this.refreshPanel();
			this.refreshMenu(true);

		}));

		// Disconnect settings changing connection on destroy
		this.connect('destroy', Lang.bind(this, function(){ gsettings.disconnect(settingsChangedId); }));

		// this._prevState = Status when the menu was closed the last time
		this._prevState = this._state;

		// Set timer for panel icon/text update
		this.updatePanel();

		// Build menu
		this.refreshMenu(true);

	},

	// Hide panel button
	hide: function() {

		this.actor.hide();

	},

	// Show panel button
	show: function() {

		this.actor.show();

	},

	// updatePanel: update panel icon/text at a given interval
	updatePanel: function() {

		this._state = this._monitor.getState();

		this.refreshPanel();
		this._timers.panel = Mainloop.timeout_add_seconds(this._interval, Lang.bind(this, this.updatePanel));

	},

	// updateMenu: update menu at a given interval
	updateMenu: function() {

		this._state = this._monitor.getState();

		this.refreshMenu();
		this._timers.menu = Mainloop.timeout_add_seconds(this._interval, Lang.bind(this, this.updateMenu));

	},

	// Update Options
	updateOptions: function() {

		// Retrieving values stored in schema

		// General Options
		// Time between updates
		this._interval = gsettings.get_int('update-time');

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

	// _onOpenStateChanged: update the menu only if it's not closed
	_onOpenStateChanged: function(menu, open) {

		this.parent(menu, open);

		// open -> update
		if (open)
			this.updateMenu();
		// close -> remove timer
		else {
			if (this._timers.menu) {
				Mainloop.source_remove(this._timers.menu);
				delete this._timers.menu;
			}
		}

	},

	// refreshPanel: Update panel icon and text
	refreshPanel: function() {

		this.updatePanelIcon();
		this.updatePanelText();

	},

	// updatePanelIcon: Update icon displayed in panel
	updatePanelIcon: function() {

		// Errors!
		if (this._state != ErrorType.NO_ERROR) {
			// Set panel icon
			this._icon.icon_name = icons.e+'-symbolic';
			// ..and return
			return;
		}

		let vars = this._monitor.getVars();
		let icon, battery_level = 1, load_level = 1, charged = false;

		if (vars['battery.charge']) {
			battery_level = BatteryLevel(vars['battery.charge']);
			charged = vars['battery.charge']*1 == 100;
		// The UPS isn't telling us it's charging or discharging -> we suppose it's charged
		} else
			charged = vars['ups.status'].indexOf('CHRG') != -1 ? charged : true;

		if (vars['ups.load'] && this._panel_icon_display_load)
			load_level = LoadLevel(vars['ups.load']);

		let status = parseStatus(vars['ups.status'], true);

		icon = status.line + (status.alarm ? status.alarm : '') + (charged ? 'c' : '') + battery_level*load_level;

		this._icon.icon_name = icons[icon]+'-symbolic';

	},

	// updatePanelText: Update infos displayed in panel
	updatePanelText: function() {

		// Errors!
		if (this._state != ErrorType.NO_ERROR) {
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
			text += _("C: %d%").format(vars['battery.charge']*1);

		// Display UPS load
		if (this._panel_text_display_load && vars['ups.load']) {

			// If battery charge is displayed, add comma + white space
			if (text)
				// TRANSLATORS: Panel text between battery charge and device load
				text += _(", ");

			// TRANSLATORS: Panel text for device load
			text += _("L: %d%").format(vars['ups.load']*1);

		}

		if (text)
			text = ' ' + text;

		this._status.text = text;

	},

	// refreshMenu: Update menu
	refreshMenu: function(hasChanged) {

		// hasChanged -> true also if previous status != actual status
		hasChanged = hasChanged || this._state != this._prevState;

		// If upsc and timeout are available, UPS list will be shown if at least one UPS is in the list, also if it's not currently available
		if (this._state != ErrorType.NO_NUT && this._state != ErrorType.NO_TIMEOUT && this._state != ErrorType.NO_UPS) {

			let devices = this._monitor.getList();

			// milliseconds
			let now = Date.now();

			// Last time the menu has been updated
			if (!this._lastTime)
				this._lastTime = now;

			// UPS list combobox
			if (hasChanged || ((now - this._lastTime) > INTERVAL)) {
				this.menu.upsList.update(devices);
				this._lastTime = now;
			}

			if (!this.menu.upsList.actor.visible)
				this.menu.upsList.show();

		// ..else, hide it
		} else {

			if (this.menu.upsList.actor.visible)
				this.menu.upsList.hide();

		}

		// If upsc is available and at least one UPS is available -> show menu..
		if (this._state == ErrorType.NO_ERROR) {

			let vars = this._monitor.getVars();
			let varsArr = this._monitor.getVarsArr();
			let devices = this._monitor.getList();

			// Hide error box, if visible
			if (this.menu.errorBox.actor.visible)
				this.menu.errorBox.hide();

			// UPS model
			if (vars['device.mfr'] || vars['device.model'])
				this.menu.upsModel.show(vars['device.mfr'], vars['device.model']);

			// TopDataList
			// UPS status
			this.menu.upsTopDataList.update('S', vars['ups.status']);
			this.menu.upsTopDataList.show();
			// UPS alarm
			if (vars['ups.alarm'])
				this.menu.upsTopDataList.update('A', vars['ups.alarm']);
			else
				this.menu.upsTopDataList.hide('A');

			// UpsDataTable

			if (hasChanged)
				this.menu.upsDataTable.clean();

			let count = 0;

			// UPS charge
			if (vars['battery.charge']) {

				count++;

				if (hasChanged)
					this.menu.upsDataTable.addData('C', count);

				this.menu.upsDataTable.update('C', vars['battery.charge']);

			}

			// UPS load
			if (vars['ups.load']) {

				count++;

				if (hasChanged)
					this.menu.upsDataTable.addData('L', count);

				this.menu.upsDataTable.update('L', vars['ups.load']);

			}

			// UPS remaining time
			if (vars['battery.runtime']) {

				count++;

				if (hasChanged)
					this.menu.upsDataTable.addData('R', count);

				this.menu.upsDataTable.update('R', vars['battery.runtime']);

			}

			// UPS temperature
			if (vars['ups.temperature']) {

				count++;

				if (hasChanged)
					this.menu.upsDataTable.addData('T', count);

				this.menu.upsDataTable.update('T', vars['ups.temperature']);

			}

			// Don't show table if no data is available
			if (count)
				this.menu.upsDataTable.show();

			// Separator
			if (this._display_raw || this._display_cmd) {

				if (!this.menu.separator.actor.visible)
					this.menu.separator.actor.show();

			} else if (this.menu.separator.actor.visible)
					this.menu.separator.actor.hide();

			// UPS Raw Data
			if (this._display_raw)
				this.menu.upsRaw.update(varsArr);
			else if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();

			// UPS Commands..
			if (this._display_cmd) {

				if (hasChanged)
					this.menu.upsCmdList.update();

				this.menu.upsCmdList.show();

			} else if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			// UPS Credentials Box
			if (hasChanged)
				this.menu.credBox.update(devices[0]);

		// ..else show error 'upsc not found'/'NUT not installed' or 'No UPS found'
		} else {

			// Hiding not available infos
			if (this.menu.upsModel.actor.visible)
				this.menu.upsModel.hide();
			if (this.menu.upsTopDataList.actor.visible)
				this.menu.upsTopDataList.hide();
			if (this.menu.upsDataTable.actor.visible) {
				this.menu.upsDataTable.clean();
				this.menu.upsDataTable.hide();
			}
			if (this.menu.separator.actor.visible)
				this.menu.separator.actor.hide();
			if (this.menu.upsRaw.actor.visible)
				this.menu.upsRaw.hide();
			if (this.menu.upsCmdList.actor.visible)
				this.menu.upsCmdList.hide();

			this.menu.errorBox.show(this._state);

		}

		// Update Bottom Buttons (some won't be reactive in case of certain errors)
		// Credentials
		this.menu.controls.setControl(this._cred_btn, this._state == ErrorType.NO_ERROR || this._state == ErrorType.UPS_NA ? 'active' : 'inactive' );
		// Find new UPSes
		this.menu.controls.setControl(this._add_btn, this._state != ErrorType.NO_NUT && this._state != ErrorType.NO_TIMEOUT ? 'active' : 'inactive' );
		// Delete UPS
		this.menu.controls.setControl(this._del_btn, this._state == ErrorType.NO_ERROR || this._state == ErrorType.UPS_NA ? 'active' : 'inactive' );

		this._prevState = this._state;

	},

	destroy: function() {

		// Remove timers
		for (let item in this._timers)
			Mainloop.source_remove(this._timers[item]);

		this.parent();

	}
});

// CredDialog: prompt user for valid credentials (username and password)
const	CredDialog = new Lang.Class({
	Name: 'CredDialog',
	Extends: ModalDialog.ModalDialog,

	_init: function(delegate, cmd, error) {

		this.parent({ styleClass: 'walnut-cred-dialog' });

		this._delegate = delegate;
		this._cmd = cmd;
		this._device = upscMonitor.getList()[0];

		// Main container
		let container = new St.BoxLayout({ style_class: 'prompt-dialog-main-layout', vertical: false });
		this.contentLayout.add(container, { x_fill: true, y_fill: true });

		// Icon
		let icon = new St.Icon({ icon_name: 'imported-dialog-password-symbolic', style_class: 'walnut-cred-dialog-icon' });
		container.add(icon, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE });

		// Container for messages and username and password entries
		let textBox = new St.BoxLayout({ style_class: 'prompt-dialog-message-layout', vertical: true });
		container.add(textBox, { y_align: St.Align.START });

		// Label
		// TRANSLATORS: Label of credentials dialog
		let label = new St.Label({ text: _("UPS Credentials"), style_class: 'prompt-dialog-headline walnut-cred-dialog-headline' });
		textBox.add(label, { y_fill: false, y_align: St.Align.START });

		// Description
		// TRANSLATORS: Description @ credentials dialog
		let desc = new St.Label({ text: parseText(_("To execute the command %s on device %s@%s:%s, please insert a valid username and password").format(this._cmd, this._device.name, this._device.host, this._device.port), CRED_DIALOG_LENGTH), style_class: 'prompt-dialog-description walnut-cred-dialog-description' });
		textBox.add(desc, { y_fill: true, y_align: St.Align.START, expand: true });

		// Username/password table
		let table = new St.Table({ style_class: 'walnut-cred-dialog-table' });
		textBox.add(table);

		// Username label
		// TRANSLATORS: Username @ credentials dialog
		let userLabel = new St.Label({ text: _("Username:"), style_class: 'prompt-dialog-password-label' });
		table.add(userLabel, { row: 0, col: 0, x_expand: false, x_fill: true, x_align: St.Align.START, y_fill: false, y_align: St.Align.MIDDLE });
		// Username entry
		let name = this._device.user;
		this.user = new St.Entry({ text: name ? name : '', style_class: 'walnut-add-entry' });
		// Username right-click menu
		ShellEntry.addContextMenu(this.user, { isPassword: false });
		table.add(this.user, { row: 0, col: 1, x_expand: true, x_fill: true, y_align: St.Align.END });

		// user_valid tells us whether a username is set or not
		this.user_valid = name ? true : false;
		// Update Execute button when text changes in user entry
		this.user.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.user_valid = this.user.get_text().length > 0;
			this._updateOkButton();
		}));
		// Hide errorBox, if visible, when selected
		this.user.clutter_text.connect('button-press-event', Lang.bind(this, function() {
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Password label
		// TRANSLATORS: Password @ credentials dialog
		let pwLabel = new St.Label({ text: _("Password:"), style_class: 'prompt-dialog-password-label' });
		table.add(pwLabel, { row: 1, col: 0, x_expand: false, x_fill: true, x_align: St.Align.START, y_fill: false, y_align: St.Align.MIDDLE });
		// Password entry
		let pass = this._device.pw;
		this.pw = new St.Entry({ text: pass ? pass : '', can_focus: true, reactive: true, style_class: 'prompt-dialog-password-entry' });
		// Password right-click menu
		ShellEntry.addContextMenu(this.pw, { isPassword: true });
		// Password visual appearance (hidden)
		this.pw.clutter_text.set_password_char('\u25cf');
		table.add(this.pw, { row: 1, col: 1, x_expand: true, x_fill: true, y_align: St.Align.END });

		// pw_valid tells us whether a password is set or not
		this.pw_valid = pass ? true : false;
		// Update Execute button when text changes in pw entry
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this.pw_valid = this.pw.get_text().length > 0;
			this._updateOkButton();
		}));
		// Hide errorBox, if visible, when selected
		this.pw.clutter_text.connect('button-press-event', Lang.bind(this, function() {
			if (errorBox.visible)
				errorBox.hide();
		}));

		// Error box
		let errorBox = new St.BoxLayout({ style_class: 'walnut-cred-dialog-error-box' });
		textBox.add(errorBox, { expand: true });
		// Hide error box if no error has been reported
		if (error)
			errorBox.show();
		else
			errorBox.hide();

		// Error Icon
		let errorIcon = new St.Icon({ icon_name: 'imported-dialog-error-symbolic', style_class: 'walnut-cred-dialog-error-icon' });
		errorBox.add(errorIcon, { y_align: St.Align.MIDDLE });

		// Error message
		// TRANSLATORS: Error message @ credentials dialog
		let errorText = new St.Label({ text: _("Wrong username or password"), style_class: 'walnut-cred-dialog-error-label' });
		errorText.clutter_text.line_wrap = true;
		errorBox.add(errorText, { expand: true, y_align: St.Align.MIDDLE, y_fill: false });

		// TRANSLATORS: Execute button @ credentials dialog
		this.ok = { label: _("Execute"), action: Lang.bind(this, this._onOk), default: true };
		// TRANSLATORS: Cancel button @ credentials dialog
		this.setButtons([{ label: _("Cancel"), action: Lang.bind(this, this.cancel), key: Clutter.KEY_Escape, }, this.ok]);
		this._updateOkButton();

	},

	// _updateOkButton: The Execute button will be reactive only if both username and password are set (length > 0)
	_updateOkButton: function() {

		let valid = false;

		valid = this.user_valid && this.pw_valid;

		this.ok.button.reactive = valid;
		this.ok.button.can_focus = valid;

	},

	// _onOk: actions to do when Execute button is pressed
	_onOk: function() {

		this._delegate.cmdExec(this.user.get_text(), this.pw.get_text(), this._cmd);
		this.close(global.get_current_time());

	},

	cancel: function() {

		this.close(global.get_current_time());

	}
});

// DelBox: a box used to delete UPSes from UPS list
const	DelBox = new Lang.Class({
	Name: 'DelBox',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({ icon_name: 'imported-user-trash-symbolic', style_class: 'walnut-delbox-icon' });
		container.add(icon, { row: 0, col: 0, row_span: 3 });

		// Description
		// TRANSLATORS: Label @ delete device box
		let desc = new St.Label({ text: _("Delete UPS"), style_class: 'walnut-delbox-desc' });
		container.add(desc, { row: 0, col: 1 });

		// Text
		// TRANSLATORS: Description @ delete device box
		let text = new St.Label({ text: parseText(_("Do you really want to delete the current UPS from the list?"), 30), style_class: 'walnut-delbox-text' });
		container.add(text, { row: 1, col: 1 });

		// Delete/Go buttons
		let del = new Button('imported-window-close', Lang.bind(this, this.hide), 'small');
		let go = new Button('imported-emblem-ok', Utilities.upsDel, 'small');

		// Putting buttons together
		let btns = new St.BoxLayout({ vertical: false, style_class: 'walnut-delbox-buttons-box' });
		btns.add_actor(del.actor);
		btns.add_actor(go.actor);

		// Right-aligning buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, { row: 2, col: 1 });

		this.addActor(container, { span: -1, align: St.Align.MIDDLE });

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

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({ icon_name: 'imported-dialog-password-symbolic', style_class: 'walnut-credbox-icon' });
		container.add(icon, { row: 0, col: 0, row_span: 3 });

		// Description
		// TRANSLATORS: Label @ credentials box
		let desc = new St.Label({ text: _("UPS Credentials"), style_class: 'walnut-credbox-desc' });
		container.add(desc, { row: 0, col: 1, col_span: 2 });

		// Username
		// TRANSLATORS: Username hint @ credentials box
		this.user = new St.Entry({ text: '', hint_text: _("username"), style_class: 'walnut-credbox-username' });
		let userBox = new St.Bin({ style_class: 'walnut-credbox-userbox', x_align: St.Align.END });
		userBox.add_actor(this.user);
		container.add(userBox, { row: 1, col: 1 });

		// Password
		// TRANSLATORS: Password hint @ credentials box
		this.pw = new St.Entry({ text: '', hint_text: _("password"), style_class: 'walnut-credbox-password' });
		let pwBox = new St.Bin({ style_class: 'walnut-credbox-pwbox', x_align: St.Align.END });
		pwBox.add_actor(this.pw);
		container.add(pwBox, { row: 1, col: 2 });
		this.pw.clutter_text.connect('text-changed', Lang.bind(this, function() {
			this._updatePwAppearance();
		}));

		// Delete/Go buttons
		let del = new Button('imported-window-close', Lang.bind(this, this.undoAndClose), 'small');
		let go = new Button('imported-emblem-ok', Lang.bind(this, this.credUpdate), 'small');

		// Putting buttons together
		let btns = new St.BoxLayout({ vertical: false, style_class: 'walnut-credbox-buttons-box' });
		btns.add_actor(del.actor);
		btns.add_actor(go.actor);

		// Right-aligning buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, { row: 2, col: 1, col_span: 2 });

		this.addActor(container, { span: -1, align: St.Align.MIDDLE });

	},

	// Update credentials: if empty user or password is given it'll be removed from the UPS's properties
	credUpdate: function() {

		let user = this.user.get_text();
		let pw = this.pw.get_text();

		Utilities.upsCred(user, pw);

	},

	// Update password visual appearance (hidden or not)
	_updatePwAppearance: function() {

		if (this.pw.get_text().length > 0 && this._hide_pw)
			this.pw.clutter_text.set_password_char('\u25cf');
		else
			this.pw.clutter_text.set_password_char('');

	},

	// Undo changes and hide CredBox
	undoAndClose: function() {

		let device = upscMonitor.getList()[0];
		this.update(device);

		this.hide();

	},

	// Update username and password
	update: function(device) {

		this.user.text = device.user ? device.user : '';
		this.pw.text = device.pw ? device.pw : '';

		// Hide password chars?
		this._hide_pw = gsettings.get_boolean('hide-pw');

		this._updatePwAppearance();

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

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		let container = new St.Table();

		// Icon
		let icon = new St.Icon({ icon_name: 'imported-edit-find-symbolic', style_class: 'walnut-addbox-icon' });
		container.add(icon, { row: 0, col: 0, row_span: 3 });

		// Description
		// TRANSLATORS: Label @ find new devices box
		let desc = new St.Label({ text: _("Find new UPSes"), style_class: 'walnut-addbox-desc' });
		container.add(desc, { row: 0, col: 1, col_span: 2 });

		// Hostname - left-aligned
	//	this.hostname = new St.Entry({ hint_text: _("hostname"), style_class: 'add-entry', style: 'width: 110px; padding: 5px;' });
	//	container.add(this.hostname, { row: 1, col: 1 });
		// Hostname - right-aligned
		// TRANSLATORS: Hostname hint @ find new devices box
		this.hostname = new St.Entry({ hint_text: _("hostname"), style_class: 'walnut-addbox-host' });
		let hostnameBox = new St.Bin({ style_class: 'walnut-addbox-hostbox', x_align: St.Align.END });
		hostnameBox.add_actor(this.hostname);
		container.add(hostnameBox, { row: 1, col: 1 });

		// Port - left-aligned
	//	this.port = new St.Entry({ hint_text: _("port"), style_class: 'add-entry', style: 'width: 50px; padding: 5px;' });
	//	container.add(this.port, { row: 1, col: 2 });
		// Port - right-aligned
		// TRANSLATORS: Port hint @ find new devices box
		this.port = new St.Entry({ hint_text: _("port"), style_class: 'walnut-addbox-port' });
		let portBox = new St.Bin({ style_class: 'walnut-addbox-portbox', x_align: St.Align.END });
		portBox.add_actor(this.port);
		container.add(portBox, { row: 1, col: 2 });


		// Delete/Go buttons
		let del = new Button('imported-window-close', Lang.bind(this, this.undoAndClose), 'small');
		let go = new Button('imported-emblem-ok', Lang.bind(this, this.addUps), 'small');

		// Putting buttons together
		let btns = new St.BoxLayout({ vertical: false, style_class: 'walnut-addbox-buttons-box' });
		btns.add_actor(del.actor);
		btns.add_actor(go.actor);

		// Right-aligning buttons in table
		let btnsBox = new St.Bin({ x_align: St.Align.END });
		btnsBox.add_actor(btns);

		container.add(btnsBox, { row: 2, col: 1, col_span: 2 });

		this.addActor(container, { span: -1, align: St.Align.MIDDLE });

	},

	// Search new UPSes at a given host:port, if not given it'll search at localhost:3493
	addUps: function() {

		let host = this.hostname.get_text();
		let port = this.port.get_text();
		let _timeout = upscMonitor._timeout;

		Utilities.getUps(timeout, _timeout, true, upsc, host ? host : 'localhost', port ? port : '3493');

	},

	// Undo changes and hide AddBox
	undoAndClose: function() {

		this.hostname.text = '';
		this.port.text = '';

		this.hide();

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

	_init: function(icon, callback, type) {

		if (!type || type != 'small')
			type = 'big';

		// Icon
		let button_icon = new St.Icon({ icon_name: icon + '-symbolic', style_class: 'walnut-buttons-icon-%s'.format(type) });

		// Button
		this.actor = new St.Button({ style_class: 'notification-icon-button walnut-buttons-%s'.format(type), child: button_icon });

		// Set callback, if any
		if (callback)
			this.actor.connect('clicked', callback);

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

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		this.btns = new St.BoxLayout({ style_class: 'walnut-bottom-controls-box' });

		this.addActor(this.btns, { span: -1, align: St.Align.MIDDLE });

	},

	// addControl: add a button to buttons box
	addControl: function(button, status){

		this.btns.add_actor(button.actor);
		this.setControl(button, status);

	},

	// setControl: set the buttons' reactivity
	setControl: function(button, status){

		let active = true;

		if (status && status == 'inactive')
			active = false;

		if (active)
			button.actor.reactive = true;
		else
			button.actor.reactive = false;

	}
});

// UpsCmdDescAndGo: the label + button for UpsCmdList's combobox
const	UpsCmdDescAndGo = new Lang.Class({
	Name: 'UpsCmdDescAndGo',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(button) {

		this.parent({ reactive: false });

		this.desc = new St.Label();

		this.addActor(this.desc);

		this.addActor(button.actor, { span: -1, align: St.Align.END });

	},

	// setInfo: set the description text
	setInfo: function(text) {

		this.desc.text = parseText(text, CMD_DESC_LENGTH);

	},

	// Override getColumnWidths() to make the item independent from the overall column layout of the menu
	// getColumnWidths: return an empty array
	getColumnWidths: function() {

		return [];

	}
});

// CmdPopupSubMenu: a PopupSubMenu for UpsCmdList: we need this so that we can update the submenu (= populate the PopupSubMenu) only and every time the menu is opened
const	CmdPopupSubMenu = new Lang.Class({
	Name: 'CmdPopupSubMenu',
	Extends: PopupMenu.PopupSubMenu,

	_init: function(delegate, sourceActor, sourceArrow) {

		this._delegate = delegate;

		this.parent(sourceActor, sourceArrow);

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

// UpsCmdList: a submenu listing UPS commands (displayed either in a combobox or in a submenu)
const	UpsCmdList = new Lang.Class({
	Name: 'UpsCmdList',
	Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function() {

		// TRANSLATORS: Label of UPS commands sub menu
		this.parent(_("UPS Commands"));

		// Remove triangle
		this.removeActor(this._triangle);

		// Re-add triangle with span to put the triangle at the end of the row
		this.addActor(this._triangle, { span: -1, align: St.Align.END });

		// Override base PopupSubMenu with our sub menu that update itself only and every time it is opened
		this.menu = new CmdPopupSubMenu(this, this.actor, this._triangle);

	},

	// retrieveCmds: get instant commands from the UPS through upscmd and return success/failure status
	retrieveCmds: function() {

		if (!upscmd)
			return true;

		let [stdout, stderr] = Utilities.DoT(timeout, this._timeout, ['%s'.format(upscmd), '-l', '%s@%s:%s'.format(this._device.name, this._device.host, this._device.port)]);

		if (!stdout && !stderr)
			return true;

		if (stderr)
			this._cmds = stderr;
		else
			this._cmds = stdout;

		return false;

	},

	// buildInfo: build submenu
	buildInfo: function() {

		this._timeout = upscMonitor._timeout;

		let fail = this.retrieveCmds();

		// Error!
		if (fail || this._cmds.length == 0 || this._cmds.slice(0,7) == 'Error: ') {

			// TRANSLATORS: Error @ UPS commands submenu
			this.menu.addMenuItem(new PopupMenu.PopupMenuItem(parseText(_("Error while retrieving UPS commands"), CMD_LENGTH), { reactive: false }));

		} else {

			let commands = new Array();

			// Retrieving upscmd commands
			commands = Utilities.toArr(this._cmds, '-', 'cmd', 'desc');

			// Removing leading comment
			commands.shift();

			// Listing available commands, if any
			if (commands.length > 0){

				// List UPS commands in combobox
				if (gsettings.get_boolean('display-cmd-cb')) {

					// New combobox
					let cb = new PopupMenu.PopupComboBoxMenuItem({ style_class: 'status-chooser-combo' });

					// No command chosen label
					// TRANSLATORS: default item @ UPS commands combobox
					cb.addMenuItem(new PopupMenu.PopupMenuItem(_("Choose..")));

					for each (let item in commands){
						cb.addMenuItem(new PopupMenu.PopupMenuItem(item.cmd));
					}

					// Set active item to 'Choose..'
					cb.setActiveItem(0);

					// No command chosen description
					// TRANSLATORS: Description of default item @ UPS commands combobox
					let desc = _("Pick one of the commands and then click here");

					// Go! button
					let go = new Button('imported-media-playback-start', false, 'small');
					go.actor.hide();

					// Command description and Go! button
					let descAndGo = new UpsCmdDescAndGo(go);
					descAndGo.setInfo(desc);

					// Set chosen UPS command

					// Variable to store signal handler id from call to call
					let prevCallback = '';

					cb.connect('active-item-changed', Lang.bind(this, function(menuItem, id){

						// Id = 0 (Choose..) -> desc
						if (id == 0) {

							descAndGo.setInfo(desc);
							go.actor.hide();

						// Id != 0 -> command description
						} else {

							descAndGo.setInfo(cmdI18n(commands[id-1]).desc);

							if (prevCallback)
								// Remove previous signal handler
								go.actor.disconnect(prevCallback);

							// prevCallback will store the signal handler id so that we can remove it in future
							prevCallback = go.actor.connect('clicked', Lang.bind(this, function(){
								this.cmdExec(this._device.user, this._device.pw, commands[id-1].cmd);
							}));

							go.actor.show();

						}

					}));

					// Adding combobox and descAndGo to UPS commands submenu
					this.menu.addMenuItem(cb);
					this.menu.addMenuItem(descAndGo);

				// List UPS commands in submenu
				} else {

					for each (let item in commands){

						let cmd = new PopupMenu.PopupMenuItem(gsettings.get_boolean('display-cmd-desc') ? '%s\n%s'.format(item.cmd, parseText(cmdI18n(item).desc, CMD_LENGTH)) : item.cmd);
						let command = item.cmd;

						cmd.connect('activate', Lang.bind(this, function(){
								this.cmdExec(this._device.user, this._device.pw, command);
						}));

						this.menu.addMenuItem(cmd);

					}

				}

			// No UPS command available
			} else {

				// TRANSLATORS: Error @ UPS commands submenu
				this.menu.addMenuItem(new PopupMenu.PopupMenuItem(parseText(_("No UPS command available"), CMD_LENGTH), { reactive: false }));

			}

		}

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

		this.buildInfo();

		this.show();

	},

	// cmdExec: try to exec the command cmd
	cmdExec: function(user, pw, cmd) {

		// We have both user and password
		if (user && pw) {

			// Just a note here: upscmd use always stderr (also if a command has been successfully sent to the driver)
			let [stdout, stderr] = Utilities.DoT(timeout, this._timeout, ['%s'.format(upscmd), '-u', '%s'.format(user), '-p', '%s'.format(pw), '%s@%s:%s'.format(this._device.name, this._device.host, this._device.port), '%s'.format(cmd)]);

			// stderr = "Unexpected response from upsd: ERR ACCESS-DENIED" -> Authentication error -> Wrong username or password
			if (stderr && stderr.indexOf('ERR ACCESS-DENIED') != -1) {

				// ..ask for them and tell the user the previuosly sent ones were wrong
				let credDialog = new CredDialog(this, cmd, true);
				credDialog.open(global.get_current_time());

			// stderr = OK\n -> Command sent to the driver successfully
			} else if (stderr && stderr.indexOf('OK') != -1)

				// TRANSLATORS: Notify title/description on command successfully sent
				Main.notify(_("NUT: command handled"), _("Successfully sent command %s to device %s@%s:%s").format(cmd, this._device.name, this._device.host, this._device.port));

			// mmhh.. something's wrong here!
			else
				// TRANSLATORS: Notify title/description for error on command sent
				Main.notifyError(_("NUT: error while handling command"), _("Unable to send command %s to device %s@%s:%s").format(cmd, this._device.name, this._device.host, this._device.port));

		// User, password or both are not available
		} else {

			// ..ask for them
			let credDialog = new CredDialog(this, cmd, false);
			credDialog.open(global.get_current_time());

		}

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

// UpsRawDataItem: each item of the raw data submenu
const	UpsRawDataItem = new Lang.Class({
	Name: 'UpsRawDataItem',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function(label, value) {

		this.parent({ activate: false });

		this.label = new St.Label({ text: label });
		this.addActor(this.label);

		this.value = new St.Label({ text: value });
		this.addActor(this.value, { span: -1, align: St.Align.END });

	},

	// Override getColumnWidths() to make the item independent from the overall column layout of the menu
	// getColumnWidths: return an empty array
	getColumnWidths: function() {

		return [];

	}
});

// UpsRawDataList: listing UPS's raw data in a submenu
const	UpsRawDataList = new Lang.Class({
	Name: 'UpsRawDataList',
	Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function() {

		// TRANSLATORS: Label of raw data submenu
		this.parent(_("Raw Data"));

		// Remove triangle
		this.removeActor(this._triangle);

		// Re-add triangle with span to put the triangle at the end of the row
		this.addActor(this._triangle, { span: -1, align: St.Align.END });

	},

	buildInfo: function() {

		// Actual submenu children (children of this.menu.box of type PopupMenuSection or PopupBaseMenuItem -> our own UpsRawDataItem)
		let actual;

		// Object where keys are variable names (battery.charge, ups.status..) that stores the original position of the children (used to delete vars no longer available)
		let stored = {};

		// Array of variable's names of the submenu's children (used to sort new vars alphabetically)
		let ab = Array();

		// Submenu has children
		if (!this.menu.isEmpty()) {

			actual = this.menu._getMenuItems();

			for (let i = 0; i < actual.length; i++) {

				// e.g.: stored['battery.charge'] = '0';
				stored[actual[i].label.get_clutter_text().text] = '%d'.format(i);

				// e.g.: ab[0] = 'battery.charge';
				ab[i] = actual[i].label.get_clutter_text().text;

			}

		}

		// this._vars = [ { var: 'battery.charge', value: '100' }, { var: 'ups.status', value: 'OL' } .. ]
		for each (let item in this._vars){

			// Submenu has children and the current var is one of them
			if (actual && stored[item.var]) {

				// -> update only the variable's value
				this['_'+item.var].value.text = parseText(item.value, RAW_VALUE_LENGTH);

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

				this['_'+item.var] = new UpsRawDataItem(parseText(item.var, RAW_VAR_LENGTH, '.'), parseText(item.value, RAW_VALUE_LENGTH));

				// If the var is a new one in an already ordered submenu, add it in the right position
				if (position)
					this.menu.addMenuItem(this['_'+item.var], position);
				// If the var is new as well as the submenu add it at the default position, as vars are already alphabetically ordered
				else
					this.menu.addMenuItem(this['_'+item.var]);

			}

		}

		// Destroy all children still stored in 'stored' obj
		for each (let item in stored) {
			actual[item].destroy();
		}

	},

	// update: Update variables and show the menu if not already visible
	update: function(vars) {

		if (!this.actor.visible)
			this.show();

		this._vars = vars;

		this.buildInfo();

	},

	// hide: Hide the menu and, if it's not empty, desroy all children
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

// UpsDataTable: a table to display (if available/any) ups.{load,temperature}, battery.{charge,runtime}
const	UpsDataTable = new Lang.Class({
	Name: 'UpsDataTable',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		// New table
		this.table = new St.Table();

		this.addActor(this.table, { span: -1, align: St.Align.MIDDLE });

	},

	addData: function(type, count) {

		let cell = {};

		switch (type)
		{
		case 'C':	// Battery Charge

			cell.type = 'batteryCharge';
			// TRANSLATORS: Label of battery charge @ data table
			cell.label = _("Charge");
			break;

		case 'L':	// Device Load

			cell.type = 'deviceLoad';
			// TRANSLATORS: Label of device load @ data table
			cell.label = _("Load");
			cell.icon = 'imported-system-run';
			break;

		case 'R':	// Backup Time

			cell.type = 'backupTime';
			// TRANSLATORS: Label of estimated backup time @ data table
			cell.label = _("Backup Time");
			cell.icon = 'imported-preferences-system-time';
			break;

		case 'T':	// Device Temperature

			cell.type = 'deviceTemp';
			// TRANSLATORS: Label of device temperature @ data table
			cell.label = _("Temperature");
			cell.icon = 'nut-thermometer';
			break;

		default:

			break;

		}

		this[cell.type+'Icon'] = new St.Icon({ icon_name: cell.icon ? cell.icon+'-symbolic' : '', style_class: 'walnut-ups-data-table-icon' });
		this[cell.type+'Label'] = new St.Label({ text: cell.label, style_class: 'walnut-ups-data-table-label' });
		this[cell.type+'Text'] = new St.Label({ style_class: 'walnut-ups-data-table-text' });

		// Description box {label\ntext}
		this[cell.type+'DescBox'] = new St.BoxLayout({ vertical: true })
		this[cell.type+'DescBox'].add_actor(this[cell.type+'Label']);
		this[cell.type+'DescBox'].add_actor(this[cell.type+'Text']);

		// Row and column handling
		let row, col;

		switch (count)
		{
		case 1:

			row = 0;
			col = 0;
			break;

		case 2:

			row = 0;
			col = 2;
			break;

		case 3:

			row = 1;
			col = 0;
			break;

		case 4:

			row = 1;
			col = 2;
			break;

		default:

			break;

		}

		// Populating table
		this.table.add(this[cell.type+'Icon'], { row: row, col: col });
		this.table.add(this[cell.type+'DescBox'], { row: row, col: col + 1 });

	},

	// update: update table's data/icons
	update: function(type, value) {

		let cell = {};

		switch (type)
		{
		case 'C':	// Battery Charge

			cell.type = 'batteryCharge';
			cell.icon = BatteryIcon['b'+BatteryLevel(value)];
			cell.value = '%s %'.format(value);
			break;

		case 'L':	// Device Load

			cell.type = 'deviceLoad';
			cell.value = '%s %'.format(value);
			break;

		case 'R':	// Backup Time

			cell.type = 'backupTime';
			cell.value = parseTime(value);
			break;

		case 'T':	// Device Temperature

			cell.type = 'deviceTemp';
			cell.value = formatTemp(value);
			break;

		default:

			break;

		}

		if (cell.icon)
			this[cell.type+'Icon'].icon_name = cell.icon+'-symbolic';

		this[cell.type+'Text'].text = cell.value;

	},

	// clean: destroy table's children, if any
	clean: function() {

		if (this.table.get_children().length > 0)
			this.table.destroy_all_children();

	},

	hide: function() {

		this.actor.hide();

	},

	show: function() {

		this.actor.show();

	},

	// Override getColumnWidths() to allocate 10% less width
	getColumnWidths: function() {

		let widths = [];

		for (let i = 0, col = 0; i < this._children.length; i++) {

			let child = this._children[i];
			let [min, natural] = child.actor.get_preferred_width(-1);

			widths[col++] = (natural*0.9);

			if (child.span > 1) {

				for (let j = 1; j < child.span; j++)
					widths[col++] = 0;

			}

		}

		return widths;

	}
});

// UpsTopDataList: Listing (if available/any) ups.{status,alarm}
const	UpsTopDataList = new Lang.Class({
	Name: 'UpsTopDataList',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		let container = new St.Bin();

		let dataBox = new St.BoxLayout({ vertical: true, style_class: 'walnut-ups-top-data-box' });

		container.set_child(dataBox);

		// Device status
		let statusIcon = new St.Icon({ icon_name: 'imported-utilities-system-monitor-symbolic', style_class: 'walnut-ups-top-data-icon' });
		this.statusLabel = new St.Label({ style_class: 'walnut-ups-top-data-label'});
		this.statusText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let statusDescBox = new St.BoxLayout({ vertical: true });
		statusDescBox.add_actor(this.statusLabel);
		statusDescBox.add_actor(this.statusText);

		// Icon + desc box
		let statusBox = new St.BoxLayout();
		statusBox.add_actor(statusIcon);
		statusBox.add_actor(statusDescBox);

		// Alarm
		let alarmIcon = new St.Icon({ icon_name: 'imported-dialog-warning-symbolic', style_class: 'walnut-ups-top-data-icon' });
		// TRANSLATORS: Label of device alarm box
		let alarmLabel = new St.Label({ text: _("Alarm!"), style_class: 'walnut-ups-top-data-label' });
		this.alarmText = new St.Label({ style_class: 'walnut-ups-top-data-text' });

		// Description box {label\ntext}
		let alarmDescBox = new St.BoxLayout({ vertical: true });
		alarmDescBox.add_actor(alarmLabel);
		alarmDescBox.add_actor(this.alarmText);

		// Icon + desc box
		this.alarmBox = new St.BoxLayout();
		this.alarmBox.add_actor(alarmIcon);
		this.alarmBox.add_actor(alarmDescBox);

		// Adding to dataBox
		dataBox.add_actor(statusBox);
		dataBox.add_actor(this.alarmBox);

		this.addActor(container, { span: -1, align: St.Align.MIDDLE });

	},

	// update: update displayed data
	update: function(type, value) {

		switch (type)
		{
		case 'S':	// Device status

			let status = parseStatus(value);

			this.statusLabel.text = status.line;
			this.statusText.text = parseText(status.status, TOPDATA_LENGTH);

			break;

		case 'A':	// Alarm

			this.alarmText.text = parseText(value, TOPDATA_LENGTH);
			break;

		default:

			break;

		}

	},

	hide: function(type) {

		// All UpsTopDataList
		if (!type)
			this.actor.hide();

		// Alarm
		if (type == 'A' && this.alarmBox.visible) {
			this.alarmText = '';
			this.alarmBox.hide();
		}

	},

	show: function() {

		this.actor.show();

	},

	// Override getColumnWidths() to allocate 10% less width
	getColumnWidths: function() {

		let widths = [];

		for (let i = 0, col = 0; i < this._children.length; i++) {

			let child = this._children[i];
			let [min, natural] = child.actor.get_preferred_width(-1);

			widths[col++] = (natural*0.9);

			if (child.span > 1) {

				for (let j = 1; j < child.span; j++)
					widths[col++] = 0;

			}

		}

		return widths;

	}
});

// UpsModel: Listing chosen UPS's Model/manufacturer (if available)
const	UpsModel = new Lang.Class({
	Name: 'UpsModel',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		this.label = new St.Label({ style_class: 'walnut-ups-model' });

		this.addActor(this.label, { span: -1, align: St.Align.MIDDLE });

	},

	hide: function() {

		this.label.text = '';

		this.actor.hide();

	},

	show: function(mfr, model) {

		let text = '';

		if (mfr && model) {
			if ((mfr.length + model.length) < MODEL_LENGTH)
				text = '%s - %s'.format(mfr, model);
			else
				text = '%s\n%s'.format(parseText(mfr, MODEL_LENGTH), parseText(model, MODEL_LENGTH));
		} else
			text = parseText((mfr ? mfr : model), MODEL_LENGTH);

		this.label.text = text;

		this.actor.show();

	},

	// Override getColumnWidths() to allocate 10% less width
	getColumnWidths: function() {

		let widths = [];

		for (let i = 0, col = 0; i < this._children.length; i++) {

			let child = this._children[i];
			let [min, natural] = child.actor.get_preferred_width(-1);

			widths[col++] = (natural*0.9);

			if (child.span > 1) {

				for (let j = 1; j < child.span; j++)
					widths[col++] = 0;

			}

		}

		return widths;

	}
});

// UpsList: a combobox listing available UPSes in a upsc-like way (e.g. ups@hostname:port)
const	UpsList = new Lang.Class({
	Name: 'UpsList',
	Extends: PopupMenu.PopupComboBoxMenuItem,

	_init: function() {

		this.parent({ style_class: 'status-chooser-combo' });

		// Change chosen UPS to selected one
		this.connect('active-item-changed', Lang.bind(this, Utilities.defaultUps));

	},

	buildInfo: function() {

		// Counter used to decide whether the combobox will be sensitive or not: only 1 entry -> not sensitive, 2+ entries -> sensitive
		let count = 0;
		let i = 0;

		for each (let item in this._devices) {

			// Available
			if (item.av == 1)
				this.addMenuItem(new PopupMenu.PopupMenuItem('%s@%s:%s'.format(item.name, item.host, item.port)));

			// N/A
			else {

				// TRANSLATORS: Device not available @ UPS list
				let na = new PopupMenu.PopupMenuItem(_("%s@%s:%s (N/A)").format(item.name, item.host, item.port));

				// Style = popup-menu-item:insensitive
				na.actor.add_style_pseudo_class('insensitive');
				this.addMenuItem(na);

				// Chosen UPS (1st one) is always visible
				// If !display-na: UPSes not currently available won't be shown (apart from the chosen one)
				if (this._display_na == false && i != 0)
					this.setItemVisible(i, false);

				if (i != 0)
					count++;

			}

			i++;

		}

		// Combo box sensitive or not
		if ((this._display_na == false && count >= (this._devices.length - 1)) || this._devices.length == 1)
			this.setSensitive(false);
		else
			this.setSensitive(true);

		// Set active item to actual chosen UPS (the first one in UPS list)
		this.setActiveItem(0);

	},

	// update: Empty the combobox and update it with the new device list
	update: function(devices) {

		// Update device list
		this._devices = devices;

		// Destroy all previously added items, if any
		if (this._menu._getMenuItems().length)
			this._menu.removeAll();

		// Unset active item position
		this._activeItemPos = -1;

		// Display also not available UPSes, if at least one of the 'not chosen' is available:
		//  - display-na: Display also not available UPSes
		//  - !display-na: Display chosen UPS and then only available UPSes
		this._display_na = gsettings.get_boolean('display-na');

		// Rebuild combobox
		this.buildInfo();

	},

	hide: function() {

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

		this.parent({ reactive: false });

		// Align Shell.GenericContainer to center
		this.actor.set_x_align(Clutter.ActorAlign.CENTER);

		let eBox = new St.BoxLayout({ vertical: false });

		// Box for the message
		let textBox = new St.BoxLayout({ vertical: true });

		// Icon
		let icon = new St.Icon({ icon_name: 'imported-dialog-error-symbolic', style_class: 'walnut-error-icon' });
		eBox.add(icon, { x_fill: true, y_fill: false, x_align: St.Align.END, y_align: St.Align.MIDDLE });

		// Error label
		this.label = new St.Label({ style_class: 'walnut-error-label' });
		textBox.add(this.label);

		// Error description
		this.desc = new St.Label({ style_class: 'walnut-error-desc' });
		textBox.add(this.desc);

		eBox.add(textBox, { y_align: St.Align.START });

		this.addActor(eBox, { span: -1, align: St.Align.MIDDLE });

	},

	hide: function() {

		this.label.text = '';
		this.desc.text = '';

		this.actor.hide();

	},

	show: function(type) {

		let label, desc;

		// Unable to find upsc -> ErrorType.NO_NUT
		if (type == ErrorType.NO_NUT) {

			// TRANSLATORS: Error label NO NUT @ main menu
			label = _("Error! No NUT found");
			// TRANSLATORS: Error description NO NUT @ main menu
			desc = _("walNUT can't find NUT's executable, please check your installation");

		// Unable to find timeout -> ErrorType.NO_TIMEOUT
		} else if (type == ErrorType.NO_TIMEOUT) {

			// TRANSLATORS: Error label NO TIMEOUT @ main menu
			label = _("Error! 'timeout' not found");
			// TRANSLATORS: Error description NO TIMEOUT @ main menu
			desc = _("walNUT can't find 'timeout' executable, please check your installation");

		// Unable to find any UPS -> ErrorType.NO_UPS
		} else if (type == ErrorType.NO_UPS) {

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

		this.label.text = parseText(label, ERR_LABEL_LENGTH);
		this.desc.text = parseText(desc, ERR_DESC_LENGTH);

		this.actor.show();

	},

	// Override getColumnWidths() to allocate 10% less width
	getColumnWidths: function() {

		let widths = [];

		for (let i = 0, col = 0; i < this._children.length; i++) {

			let child = this._children[i];
			let [min, natural] = child.actor.get_preferred_width(-1);

			widths[col++] = (natural*0.9);

			if (child.span > 1) {

				for (let j = 1; j < child.span; j++)
					widths[col++] = 0;

			}

		}

		return widths;

	}
});

// Panel menu
const	NutMenu = new Lang.Class({
	Name: 'NutMenu',
	Extends: PopupMenu.PopupMenu,

	_init: function(sourceActor) {

		this.parent(sourceActor, 0.0, St.Side.TOP);

		// Override base style
		this._boxWrapper.add_style_class_name('walnut-menu');

		// Error Box
		this.errorBox = new ErrorBox();
		this.errorBox.hide();

		// UPS List
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
		this.upsDataTable = new UpsDataTable();
		this.upsDataTable.hide();

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

		// Putting menu together

		// UPS list
		this.addMenuItem(this.upsList);

		// Error Box
		this.addMenuItem(this.errorBox);

		// Top data - Manufacturer & model, status & alarm, battery {charge,runtime} & device {load,temperature}
		this.addMenuItem(this.upsModel);
		this.addMenuItem(this.upsTopDataList);
		this.addMenuItem(this.upsDataTable);

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
	walnut,		// Panel/menu
	upsc,		// Absolute path of upsc
	upscmd,		// Absolute path of upscmd
	timeout;	// Absolute path of timeout

// Init extension
function init(extensionMeta) {

	gsettings = Convenience.getSettings();
	Convenience.initTranslations();

	// Importing icons
	let theme = imports.gi.Gtk.IconTheme.get_default();
	theme.append_search_path(extensionMeta.path + '/icons');

}

// Enable Extension
function enable() {

	// First, find upsc, upscmd and timeout
	// Detect upsc
	upsc = Utilities.detect('upsc');
	// Detect upscmd
	upscmd = Utilities.detect('upscmd');
	// Detect timeout
	timeout = Utilities.detect('timeout');

	upscMonitor = new UpscMonitor();

	walnut = new walNUT();

	Main.panel.addToStatusArea('walNUT', walnut);

}

// Disable Extension
function disable() {

	walnut.destroy();
	walnut = null;

	upscMonitor.destroy();
	upscMonitor = null;

}

// toFahrenheit: °C -> °F
function toFahrenheit(c){

	return ((9 / 5) * c + 32);

}

// formatTemp: Format temperature + °C/F
function formatTemp(value) {

	// Don't do anything if not a number
	if (isNaN(value))
		return value;

	// UPS temperature unit (Centigrade/Fahrenheit)
	let unit = gsettings.get_string('temp-unit');

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

	// Tokenizing raw
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
					row = row.slice(0,len);

				}

				// If token is shorter than len, we'll close this row and push token to next row

				repeat = 0;

			// Case: still building row
			} else {

				// Restoring sep between tokens
				row += tok[i] + sep;
				i++;

			}

		}

		// Removing leading and trailing space and adding new line character
		ret += row.trim() + '\n';

	}

	// Removing trailing sep (if not a space) and \n from ret
	return ret.slice(0, sep != ' ' ? ret.length - 2 : ret.length - 1);

}

// cmdI18n: Translating UPS commands' description
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

		if (cmd['cmd'].slice(0,6) == 'outlet') {

			let buf = cmd['cmd'].split('.');

			switch (buf[2]+'.'+buf[3])
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
