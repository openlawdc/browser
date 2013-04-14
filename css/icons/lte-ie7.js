/* Load this script using conditional IE comments if you need to support IE 7 and IE 6. */

window.onload = function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'typicons\'">' + entity + '</span>' + html;
	}
	var icons = {
			'icon-battery-low' : '&#xe000;',
			'icon-battery' : '&#xe001;',
			'icon-battery-full' : '&#xe002;',
			'icon-battery-charging' : '&#xe003;',
			'icon-plus' : '&#xe004;',
			'icon-cross' : '&#xe005;',
			'icon-arrow-right' : '&#xe006;',
			'icon-arrow-left' : '&#xe007;',
			'icon-pencil' : '&#xe008;',
			'icon-search' : '&#xe009;',
			'icon-grid' : '&#xe00a;',
			'icon-list' : '&#xe00b;',
			'icon-star' : '&#xe00c;',
			'icon-heart' : '&#xe00d;',
			'icon-back' : '&#xe00e;',
			'icon-forward' : '&#xe00f;',
			'icon-map-marker' : '&#xe010;',
			'icon-phone' : '&#xe011;',
			'icon-home' : '&#xe012;',
			'icon-camera' : '&#xe013;',
			'icon-arrow-left-2' : '&#xe014;',
			'icon-arrow-right-2' : '&#xe015;',
			'icon-arrow-up' : '&#xe016;',
			'icon-arrow-down' : '&#xe017;',
			'icon-refresh' : '&#xe018;',
			'icon-refresh-2' : '&#xe019;',
			'icon-escape' : '&#xe01a;',
			'icon-repeat' : '&#xe01b;',
			'icon-loop' : '&#xe01c;',
			'icon-shuffle' : '&#xe01d;',
			'icon-feed' : '&#xe01e;',
			'icon-cog' : '&#xe01f;',
			'icon-wrench' : '&#xe020;',
			'icon-bars' : '&#xe021;',
			'icon-chart' : '&#xe022;',
			'icon-stats' : '&#xe023;',
			'icon-eye' : '&#xe024;',
			'icon-zoom-out' : '&#xe025;',
			'icon-zoom-in' : '&#xe026;',
			'icon-export' : '&#xe027;',
			'icon-user' : '&#xe028;',
			'icon-users' : '&#xe029;',
			'icon-microphone' : '&#xe02a;',
			'icon-mail' : '&#xe02b;',
			'icon-comment' : '&#xe02c;',
			'icon-trashcan' : '&#xe02d;',
			'icon-delete' : '&#xe02e;',
			'icon-infinity' : '&#xe02f;',
			'icon-key' : '&#xe030;',
			'icon-globe' : '&#xe031;',
			'icon-thumbs-up' : '&#xe032;',
			'icon-thumbs-down' : '&#xe033;',
			'icon-tag' : '&#xe034;',
			'icon-views' : '&#xe035;',
			'icon-warning' : '&#xe036;',
			'icon-beta' : '&#xe037;',
			'icon-unlocked' : '&#xe038;',
			'icon-locked' : '&#xe039;',
			'icon-eject' : '&#xe03a;',
			'icon-move' : '&#xe03b;',
			'icon-expand' : '&#xe03c;',
			'icon-cancel' : '&#xe03d;',
			'icon-electricity' : '&#xe03e;',
			'icon-compass' : '&#xe03f;',
			'icon-location' : '&#xe040;',
			'icon-directions' : '&#xe041;',
			'icon-pin' : '&#xe042;',
			'icon-mute' : '&#xe043;',
			'icon-volume' : '&#xe044;',
			'icon-globe-2' : '&#xe045;',
			'icon-pencil-2' : '&#xe046;',
			'icon-minus' : '&#xe047;',
			'icon-equals' : '&#xe048;',
			'icon-list-2' : '&#xe049;',
			'icon-flag' : '&#xe04a;',
			'icon-info' : '&#xe04b;',
			'icon-question' : '&#xe04c;',
			'icon-chat' : '&#xe04d;',
			'icon-clock' : '&#xe04e;',
			'icon-calendar' : '&#xe04f;',
			'icon-sun' : '&#xe050;',
			'icon-contrast' : '&#xe051;',
			'icon-mobile' : '&#xe052;',
			'icon-download' : '&#xe053;',
			'icon-puzzle' : '&#xe054;',
			'icon-music' : '&#xe055;',
			'icon-scissors' : '&#xe056;',
			'icon-bookmark' : '&#xe057;',
			'icon-anchor' : '&#xe058;',
			'icon-checkmark' : '&#xe059;'
		},
		els = document.getElementsByTagName('*'),
		i, attr, html, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		attr = el.getAttribute('data-icon');
		if (attr) {
			addIcon(el, attr);
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
};