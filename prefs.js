/*
 * walNUT: A Gnome Shell Extension for NUT (Network UPS Tools)
 *
 * Copyright (C)
 *   2013 Daniele Pezzini <hyouko@gmail.com>
 * Based on prefs.js from gnome-shell-extensions-mediaplayer - Copyright (C)
 *   2011-2013 Jean-Philippe Braun <eon@patapon.info>
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

const	Gtk = imports.gi.Gtk,
	GObject = imports.gi.GObject;

// Gettext
const	Gettext = imports.gettext.domain('gnome-shell-extensions-walnut'),
	_ = Gettext.gettext;

const	Me = imports.misc.extensionUtils.getCurrentExtension(),
	Convenience = Me.imports.convenience;

// Settings
let	gsettings,		// Stored settings
	settings_general,	// General settings
	settings_panel,		// Panel settings
	settings_menu,		// Menu settings
	settings_cmd_desc;	// Children settings of 'device's commands' option

// Children boxes of 'device's commands' option
let	cmd_desc_box;

function init() {

	Convenience.initTranslations();
	gsettings = Convenience.getSettings();

	// General settings
	settings_general = {

		// Update time chooser
		update_time: {
			type: 'r',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Seconds before next update"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("The seconds after walNUT updates the data from the device. (default: 15)"),
			min: 5,
			max: 100,
			step: 1,
			default: 15
		},

		// Temperature unit
		temp_unit: {
			type: 'es',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Temperature unit"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("The unit (Centigrade or Fahrenheit) walNUT should display the temperature in. (default: Centigrade)"),
			list: [
				{
					nick: 'Centigrade',
					// TRANSLATORS: Temperature unit @ preferences
					name: _("Centigrade"),
					id: 0
				},
				{
					nick: 'Fahrenheit',
					// TRANSLATORS: Temperature unit @ preferences
					name: _("Fahrenheit"),
					id: 1
				}
			]
		}

	};

	// Panel settings
	settings_panel = {

		// Panel button options
		panel_icon_display_load: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display load in the icon"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the device load should be displayed in panel icon or not. (default: OFF)")
		},

		panel_text_display_load: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display load in the label"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the device load should be displayed in panel label or not. (default: OFF)")
		},

		panel_text_display_charge: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display charge in the label"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the battery charge should be displayed in panel label or not. (default: OFF)")
		}

	};

	// Menu settings
	settings_menu = {

		// Menu style
		less_noisy_menu: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Use a less noisy style for the menu"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the extension should use a less noisy, more in line with Gnome Shell's own, style or not for the panel menu. (default: ON)")
		},

		// Device List Options
		display_na: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display not available devices"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Display also not available devices in the submenu in panel menu (chosen device will be always displayed, also if not available, in spite of this option). (default: OFF)")
		},

		// Device model
		display_device_model: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display device model"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also device model ('manufacturer - model'), if available, in the panel menu. (default: ON)")
		},

		// Data table options
		display_battery_charge: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display battery charge"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also battery charge, if available, in the panel menu. (default: ON)")
		},

		display_load_level: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display load level"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also load level, if available, in the panel menu. (default: ON)")
		},

		display_backup_time: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display backup time"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also backup time, if available, in the panel menu. (default: ON)")
		},

		display_device_temperature: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display device temperature"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also device temperature, if available, in the panel menu. (default: ON)")
		},

		// Raw Data
		display_raw: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display raw data"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Show also raw data in a submenu. (default: OFF)")
		},

		// UPS Commands
		display_cmd: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display device's commands"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Display device's available commands. Requires upsd user and password to execute them. (default: OFF)"),
			// cb: callback function -> set children sensitivity
			cb: function(status) {
				cmd_desc_box.set_sensitive(status);
			}
		},

		// Credentials Box Options
		hide_pw: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Hide password at credentials box"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the password at credentials box should be hidden or not. (default: ON)")
		}

	};

	// Child setting of 'device's commands' option
	settings_cmd_desc = {

		display_cmd_desc: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display description of device's commands"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Display also a localized description of device's available commands in the submenu. (default: ON)"),
		}

	};

}

// General/Panel settings
const	walNUTPrefsGeneral = new GObject.Class({
	Name: 'walNUTPrefsGeneral',
	GTypeName: 'walNUTPrefsGeneral',
	Extends: Gtk.Box,

	_init: function() {

		this.parent({
			orientation: Gtk.Orientation.VERTICAL,
			margin: 10,
			spacing: 10
		});

		// TRANSLATORS: Tab's label @ preferences widget
		this.label = new Gtk.Label({ label: _("General/Panel") });

		// Horizontal boxes
		let hbox;

		// General options

		let general = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			margin_bottom: 10,
			margin_left: 10,
			margin_right: 10,
			margin_top: 0,
			spacing: 5
		});

		for (let setting in settings_general) {

			hbox = buildHbox(settings_general, setting);

			general.add(hbox);

		}

		// TRANSLATORS: Label @ preferences widget
		let generalFrame = new Gtk.Frame({ label: _("General options") });

		generalFrame.add(general);

		this.add(generalFrame);

		// Panel options

		let panel = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			margin_bottom: 10,
			margin_left: 10,
			margin_right: 10,
			margin_top: 0,
			spacing: 5
		});

		for (let setting in settings_panel) {

			hbox = buildHbox(settings_panel, setting);

			panel.add(hbox);

		}

		// TRANSLATORS: Label @ preferences widget
		let panelFrame = new Gtk.Frame({ label: _("Panel options") });

		panelFrame.add(panel);

		this.add(panelFrame);

	}
});

// Menu settings
const	walNUTPrefsMenu = new GObject.Class({
	Name: 'walNUTPrefsMenu',
	GTypeName: 'walNUTPrefsMenu',
	Extends: Gtk.Box,

	_init: function() {

		this.parent({
			orientation: Gtk.Orientation.VERTICAL,
			margin: 10,
			spacing: 5
		});

		// TRANSLATORS: Tab's label @ preferences widget
		this.label = new Gtk.Label({ label: _("Menu") });

		// Horizontal boxes
		let hbox;

		cmd_desc_box = new Gtk.VBox();

		if (cmd_desc_box.get_direction() == Gtk.TextDirection.RTL)
			cmd_desc_box.margin_right = 30;
		else
			cmd_desc_box.margin_left = 30;

		// Child setting of 'device's commands' option
		for (let setting in settings_cmd_desc) {

			hbox = buildHbox(settings_cmd_desc, setting);

			cmd_desc_box.add(hbox);

		}

		// Child's sensitivity
		cmd_desc_box.set_sensitive(gsettings.get_boolean('display-cmd'));

		// All other settings
		for (let setting in settings_menu) {

			hbox = buildHbox(settings_menu, setting);

			this.add(hbox);

			if (setting == 'display_cmd') {
				this.add(cmd_desc_box);
			}

		}

	}
});

// Preferences widget
const	walNUTPrefsWidget = new GObject.Class({
	Name: 'walNUTPrefsWidget',
	GTypeName: 'walNUTPrefsWidget',
	Extends: Gtk.Box,

	_init: function() {

		this.parent();

		let notebook = new Gtk.Notebook({
			margin_left: 5,
			margin_top: 5,
			margin_bottom: 5,
			margin_right: 5,
			expand: true
		});

		let general = new walNUTPrefsGeneral();
		let menu = new walNUTPrefsMenu();

		notebook.append_page(general, general.label);
		notebook.append_page(menu, menu.label);

		this.add(notebook);

	}
});

// Build preferences widget
function buildPrefsWidget() {

	let preferences = new walNUTPrefsWidget();

	preferences.show_all();

	return preferences;

}

// Build horizontal box for each setting
function buildHbox(settings, setting) {

	let hbox;

	if (settings[setting].type == 's')
		hbox = createStringSetting(settings, setting);
	if (settings[setting].type == 'i')
		hbox = createIntSetting(settings, setting);
	if (settings[setting].type == 'b')
		hbox = createBoolSetting(settings, setting);
	if (settings[setting].type == 'r')
		hbox = createRangeSetting(settings, setting);
	if (settings[setting].type == 'e')
		hbox = createEnumSetting(settings, setting);
	if (settings[setting].type == 'es')
		hbox = createEnumStringSetting(settings, setting);

	return hbox;

}

// Enum setting from string setting
function createEnumStringSetting(settings, setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Combobox
	let model = new Gtk.ListStore();
	model.set_column_types([ GObject.TYPE_STRING, GObject.TYPE_STRING ]);
	let setting_enum = new Gtk.ComboBox({ model: model });
	setting_enum.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);
	let renderer = new Gtk.CellRendererText();
	setting_enum.pack_start(renderer, true);
	setting_enum.add_attribute(renderer, 'text', 1);

	for (let i = 0; i < settings[setting].list.length; i++) {

		let item = settings[setting].list[i];
		let iter = model.append();

		model.set(iter, [ 0, 1 ], [ item.nick, item.name ]);

		if (item.nick == gsettings.get_string(setting.replace(/_/g, '-'))) {
			setting_enum.set_active(item.id);
		}

	}

	setting_enum.connect('changed', function(entry) {

		let [ success, iter ] = setting_enum.get_active_iter();

		if (!success)
			return;

		let nick = model.get_value(iter, 0)

		gsettings.set_string(setting.replace(/_/g, '-'), nick);

	});

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_enum.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_enum);

	return hbox;

}

// Enum setting
function createEnumSetting(settings, setting) {

	let hbox = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		margin_top: 5
	});

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Combobox
	let model = new Gtk.ListStore();
	model.set_column_types([ GObject.TYPE_INT, GObject.TYPE_STRING ]);
	let setting_enum = new Gtk.ComboBox({ model: model });
	setting_enum.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);
	let renderer = new Gtk.CellRendererText();
	setting_enum.pack_start(renderer, true);
	setting_enum.add_attribute(renderer, 'text', 1);

	for (let i = 0; i < settings[setting].list.length; i++) {

		let item = settings[setting].list[i];
		let iter = model.append();

		model.set(iter, [ 0, 1 ], [ item.id, item.name ]);

		if (item.id == gsettings.get_enum(setting.replace(/_/g, '-'))) {
			setting_enum.set_active(item.id);
		}

	}

	setting_enum.connect('changed', function(entry) {

		let [ success, iter ] = setting_enum.get_active_iter();

		if (!success)
			return;

		let id = model.get_value(iter, 0)

		gsettings.set_enum(setting.replace(/_/g, '-'), id);

	});

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_enum.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_enum);

	return hbox;

}

// String setting
function createStringSetting(settings, setting) {

	let hbox = new Gtk.Box({
		orientation: Gtk.Orientation.HORIZONTAL,
		margin_top: 0
	});

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Entry
	let setting_string = new Gtk.Entry({ text: gsettings.get_string(setting.replace(/_/g, '-')) });
	setting_string.set_width_chars(30);
	setting_string.connect('notify::text', function(entry) {
		gsettings.set_string(setting.replace(/_/g, '-'), entry.text);
	});

	if (settings[setting].mode == 'passwd') {
		setting_string.set_visibility(false);
	}

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_string.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_string);

	return hbox;

}

// Integer setting
function createIntSetting(settings, setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Numbers
	let adjustment = new Gtk.Adjustment({
		lower: 1,
		upper: 65535,
		step_increment: 1
	});
	let setting_int = new Gtk.SpinButton({
		adjustment: adjustment,
		snap_to_ticks: true
	});
	setting_int.set_value(gsettings.get_int(setting.replace(/_/g, '-')));
	setting_int.connect('value-changed', function(entry) {
		gsettings.set_int(setting.replace(/_/g, '-'), entry.value);
	});

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_int.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_int);

	return hbox;

}

// Boolean setting
function createBoolSetting(settings, setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Switch
	let setting_switch = new Gtk.Switch({ active: gsettings.get_boolean(setting.replace(/_/g, '-')) });
	setting_switch.connect('notify::active', function(button) {

		gsettings.set_boolean(setting.replace(/_/g, '-'), button.active);

		// Callback function
		if (settings[setting].cb)
			settings[setting].cb(button.active)

	});

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_switch.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_switch);

	return hbox;

}

// Range setting
function createRangeSetting(settings, setting) {

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL });

	// Label
	let setting_label = new Gtk.Label({
		label: settings[setting].label,
		xalign: 0
	});

	// Scale
	let setting_range = Gtk.HScale.new_with_range(settings[setting].min, settings[setting].max, settings[setting].step);
	setting_range.set_value(gsettings.get_int(setting.replace(/_/g, '-')));
	// without numbers
	//setting_range.set_draw_value(false);
	setting_range.add_mark(settings[setting].default, Gtk.PositionType.BOTTOM, null);
	setting_range.set_size_request(200, -1);
	setting_range.connect('value-changed', function(slider) {
		gsettings.set_int(setting.replace(/_/g, '-'), slider.get_value());
	});

	// Tip
	if (settings[setting].help) {
		setting_label.set_tooltip_text(settings[setting].help)
		setting_range.set_tooltip_text(settings[setting].help)
	}

	hbox.pack_start(setting_label, true, true, 0);
	hbox.add(setting_range);

	return hbox;

}
