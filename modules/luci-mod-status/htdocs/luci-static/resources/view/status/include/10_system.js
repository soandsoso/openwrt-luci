'use strict';
'require fs';
'require rpc';

var callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board'
});

var callSystemInfo = rpc.declare({
	object: 'system',
	method: 'info'
});

return L.Class.extend({
	title: _('System'),

	load: function() {
		return Promise.all([
			L.resolveDefault(callSystemBoard(), {}),
			L.resolveDefault(callSystemInfo(), {}),
			fs.lines('/usr/lib/lua/luci/version.lua'),
			L.resolveDefault(fs.trimmed('/sys/class/hwmon/hwmon0/temp1_input'), 0),
			L.resolveDefault(fs.trimmed('/sys/class/hwmon/hwmon1/temp1_input'), 0)
		]);
	},

	render: function(data) {
		var boardinfo   = data[0],
		    systeminfo  = data[1],
				luciversion = data[2],
				wifi0 = Math.floor(data[3] / 1000),
				wifi1 = Math.floor(data[4] / 1000);

		luciversion = luciversion.filter(function(l) {
			return l.match(/^\s*(luciname|luciversion)\s*=/);
		}).map(function(l) {
			return l.replace(/^\s*\w+\s*=\s*['"]([^'"]+)['"].*$/, '$1');
		}).join(' ');

		var datestr = null;

		if (systeminfo.localtime) {
			var date = new Date(systeminfo.localtime * 1000);

			datestr = '%04d-%02d-%02d %02d:%02d:%02d'.format(
				date.getUTCFullYear(),
				date.getUTCMonth() + 1,
				date.getUTCDate(),
				date.getUTCHours(),
				date.getUTCMinutes(),
				date.getUTCSeconds()
			);
		}

		var versionL = L.isObject(boardinfo.release) ? boardinfo.release.description + ' ' + boardinfo.release.revision : '';
		var versionR = ' / Linux ' + boardinfo.kernel;
		var updateTime = systeminfo.uptime ? '%t'.format(systeminfo.uptime) : null

		var fields = [
			_('Hostname'), boardinfo.hostname,
			_('Architecture'), boardinfo.system,
			_('Firmware Version'), versionL + versionR,
			_('Local Time'), datestr + ' [' + updateTime + ']',
			_('Load Average'), Array.isArray(systeminfo.load) ? '%.2f, %.2f, %.2f'.format(
				systeminfo.load[0] / 65535.0,
				systeminfo.load[1] / 65535.0,
				systeminfo.load[2] / 65535.0
			) : null
		];
		if (wifi0 && wifi1) {
			fields.push(_('WIFI Temperature'), '2G: ' + wifi0 + '℃ | 5G: ' + wifi1 + '℃')
		}

		var table = E('div', { 'class': 'table' });

		for (var i = 0; i < fields.length; i += 2) {
			table.appendChild(E('div', { 'class': 'tr' }, [
				E('div', { 'class': 'td left', 'width': '33%' }, [ fields[i] ]),
				E('div', { 'class': 'td left' }, [ (fields[i + 1] != null) ? fields[i + 1] : '?' ])
			]));
		}

		return table;
	}
});
