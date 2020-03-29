'use strict';

var vpnStatus = []
var checkVpn = function (set) {
  return new Promise((r, j) => {
    XHR.get(L.url('admin/services/shadowsocksr/check'), { set }, function (x, data) {
      r(data.ret)
    })
  })
}

function showStatus(ret) {
  if (!ret) {
    return '-';
  }
  const ok = ret === '0';
  return E('font', { 'color': ok ? 'green' : 'red' }, [ok ? 'Connect OK' : 'Connect Error'])
}

return L.Class.extend({
  title: _('VPN'),

  load: async () => {
    if (vpnStatus.length > 1) {
      return vpnStatus
    } else {
      vpnStatus = await Promise.all([
        L.resolveDefault(checkVpn('google'), false),
        L.resolveDefault(checkVpn('baidu'), false)
      ])
    }

  },

  render: function (status = []) {
    var fields = status ? [
      _('Google'), status[0],
      _('Baidu'), status[1],
    ] : [];

    var table = E('div', { 'class': 'table' });

    for (var i = 0; i < fields.length; i += 2) {
      table.appendChild(E('div', { 'class': 'tr' }, [
        E('div', { 'class': 'td left', 'width': '33%' }, [fields[i]]),
        E('div', { 'class': 'td left' }, [showStatus(fields[i + 1])])
      ]));
    }

    return table;
  }
});
