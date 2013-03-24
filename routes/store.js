exports.home = function (req, res) {
	res.render('home', { title: 'Ninja Store' })
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