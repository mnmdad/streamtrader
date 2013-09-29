exports.index = function (req, res) {
	res.render('index', { title: 'Stream Trader' })
};
exports.login = function (req, res) {
    res.render('login', { title: 'Login Page' })
};
exports.sales = function (req, res) {
	res.render('sales', { title: 'Sales View' })
};
exports.trader = function (req, res) {
	res.render('trader', { title: 'Trader View' })
};
exports.insto = function (req, res) {
	res.render('insto', { title: 'Insto Sales View'})
};
exports.boots = function (req, res) {
	res.render('boots', { title: 'Boot Strap Version'})
};