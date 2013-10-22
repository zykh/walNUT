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

// Stored settings
let gsettings;

// Extensions settings
let settings;

// Children settings of UPS Commands
let settings_cmd_desc;

// Children boxes of UPS Commands
let cmd_desc_box;

function init() {

	Convenience.initTranslations();
	gsettings = Convenience.getSettings();

	// Extension settings
	settings = {
		// Update time chooser
		update_time: {
			type: 'r',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Seconds before next update"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("The seconds after walNUT updates the data from the device. (default: 15)"),
			min: 5,
			max: 100,
			step: 5,
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
				// TRANSLATORS: Temperature unit @ preferences
				{ nick: 'Centigrade', name: _("Centigrade"), id: 0 },
				// TRANSLATORS: Temperature unit @ preferences
				{ nick: 'Fahrenheit', name: _("Fahrenheit"), id: 1 }
			]
		},
		// Device List Options
		display_na: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display not available devices"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Display also not available devices in the combo box in panel menu (chosen device will be always displayed, also if not available, in spite of this option). (default: OFF)")
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
		},
		// Panel button options
		panel_icon_display_load: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display load in panel icon"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the device load should be displayed in panel icon or not. (default: OFF)")
		},
		panel_text_display_load: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display load in panel label"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the device load should be displayed in panel label or not. (default: OFF)")
		},
		panel_text_display_charge: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display charge in panel label"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Whether the battery charge should be displayed in panel label or not. (default: OFF)")
		}
	};

	// Child setting of UPS Commands
	settings_cmd_desc = {
		display_cmd_desc: {
			type: 'b',
			// TRANSLATORS: Label of setting @ preferences
			label: _("Display description of device's commands (submenu)"),
			// TRANSLATORS: Hint text of setting @ preferences
			help: _("Display also a localized description of device's available commands in the sub menu. (default: ON)"),
		//	margin: 30
		}
	};

}

// Put preferences widget together
function buildPrefsWidget() {

	let frame = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, border_width: 10 });

	// Vertical box
	let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_right: 10, margin_left: 10, margin_bottom: 0, margin_top: 0 });

	// Children boxes of UPS Commands preference
	cmd_desc_box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_left: 30, margin_bottom: 5 });

	// Horizontal box
	let hbox;

	// Child setting of UPS Commands
	for (let setting in settings_cmd_desc) {
		hbox = buildHbox(settings_cmd_desc, setting);
		cmd_desc_box.add(hbox);
	}

	// Children sensitivity
	cmd_desc_box.set_sensitive(gsettings.get_boolean('display-cmd'));

	// All other settings
	for (let setting in settings) {

		hbox = buildHbox(settings, setting);
		vbox.add(hbox);

		if (setting == 'display_cmd') {
			vbox.add(cmd_desc_box);
		}

	}

	frame.add(vbox);
	frame.show_all();

	return frame;

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

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 0 });

	// Label
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

	// Combobox
	let model = new Gtk.ListStore();
	model.set_column_types([GObject.TYPE_STRING, GObject.TYPE_STRING]);
	let setting_enum = new Gtk.ComboBox({ model: model });
	setting_enum.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);
	let renderer = new Gtk.CellRendererText();
	setting_enum.pack_start(renderer, true);
	setting_enum.add_attribute(renderer, 'text', 1);

	for (let i = 0; i < settings[setting].list.length; i++) {

		let item = settings[setting].list[i];
		let iter = model.append();

		model.set(iter, [0, 1], [item.nick, item.name]);

		if (item.nick == gsettings.get_string(setting.replace(/_/g, '-'))) {
			setting_enum.set_active(item.id);
		}

	}

	setting_enum.connect('changed', function(entry) {

		let [success, iter] = setting_enum.get_active_iter();

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

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });

	// Label
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

	// Combobox
	let model = new Gtk.ListStore();
	model.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);
	let setting_enum = new Gtk.ComboBox({ model: model });
	setting_enum.get_style_context().add_class(Gtk.STYLE_CLASS_RAISED);
	let renderer = new Gtk.CellRendererText();
	setting_enum.pack_start(renderer, true);
	setting_enum.add_attribute(renderer, 'text', 1);

	for (let i = 0; i < settings[setting].list.length; i++) {

		let item = settings[setting].list[i];
		let iter = model.append();

		model.set(iter, [0, 1], [item.id, item.name]);

		if (item.id == gsettings.get_enum(setting.replace(/_/g, '-'))) {
			setting_enum.set_active(item.id);
		}

	}

	setting_enum.connect('changed', function(entry) {

		let [success, iter] = setting_enum.get_active_iter();

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

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 0 });

	// Label
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

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

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 0 });

	// Label
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

	// Numbers
	let adjustment = new Gtk.Adjustment({ lower: 1, upper: 65535, step_increment: 1 });
	let setting_int = new Gtk.SpinButton({ adjustment: adjustment, snap_to_ticks: true });
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

	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 0, margin_left: settings[setting].margin ? settings[setting].margin : 0 });

	// Label
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

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
	let setting_label = new Gtk.Label({ label: settings[setting].label, xalign: 0 });

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
