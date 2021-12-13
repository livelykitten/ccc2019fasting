// app/routes.js

var mysql = require('mysql');
var dbconfig = require('./config/database');
var connection = mysql.createPool(dbconfig.poolconfig);
var overview_pw = "heart";
var ccc_setting = require('./config/ccc');

module.exports = function(app, passport) {

	app.get('/', isLoggedIn, function(req, res, next) {
		var show_register_buttons = false;
		if (ccc_setting.register_start_time < (new Date())) {
			show_register_buttons = true;
		}
		connection.query("SELECT bid, cid FROM Users where uid = ?", [req.user.uid], function(err, rows) {
			if (err) next(err);
			connection.query("SELECT * FROM Bible", function(err1, rows1) {
				if (err1) next(err1);
				connection.query("SELECT * FROM Classes", function(err2, rows2) {
					if (err2) next(err2);
					res.render('index.ejs', {
						mybid : rows[0].bid, // null if not registered yet
						mycid : rows[0].cid,
						biblelist : rows1,
						classlist : rows2,
						show_register_buttons: show_register_buttons
					});
				})
			})
		})
	});

	app.get('/login', function(req, res, next) {
		var loginMessage = req.flash('loginMessage');
		var name = req.flash('name');
		var earth = req.flash('earth');
		var campus = req.flash('campus');
		var year = req.flash('year');
		res.render('login.ejs', {wrong : (loginMessage.length != 0), login_message : loginMessage, name : name, earth : earth, campus : campus, year : year});
	});

	app.get('/notice', isLoggedIn, function(req, res, next) {
		res.render('notice.ejs');
	})

	app.post('/login', passport.authenticate('local-login', { successRedirect : '/', failureRedirect : '/' }));


	app.get('/logout', isLoggedIn, function(req, res, next) {
		req.logOut();
		res.redirect('/');
	});

	app.get('/deleteAccount', function(req, res, next) {
		connection.query("DELETE FROM Users WHERE id = ?", [req.user.uid], function(err, rows) {
			console.log("Account deleted");
			console.log(rows);
			if (err) console.log(err);
			req.logOut();
			res.redirect('/');
		})
	});

	app.get('/details', isLoggedIn, function(req, res, next) {
		var show_register_buttons = false;
		if (ccc_setting.register_start_time <= (new Date())) {
			show_register_buttons = true;
		}
		if (req.query.t == "c") {
			connection.query("SELECT * from Classes_countdown", function (err, classes_countdown_row) {
				if (err) {
					console.log(err);
					res.redirect('/confirm?t=e');
				} else {
					var reveal_zoom_link = false;
					if (ccc_setting.reveal_links_before_in_min >= classes_countdown_row[0].countdown &&
						req.query.cid == req.user.cid) {
							reveal_zoom_link = true;
						}
					connection.query("SELECT * FROM Classes where cid = ?", [req.query.cid], function(err1, rows1) {
						if (err1) 
							next(err1);
						if (rows1.length == 0)
							res.redirect('/confirm?t=de');
						else {
							connection.query("SELECT * FROM Users where uid = ? and cid = ?", [req.user.uid, req.query.cid], function(err2, rows2) {
								if (err2)
									next(err2);
								res.render('detail.ejs', {type : "class", classinfo : rows1[0], registered : (rows2.length > 0), reveal_zoom_link: reveal_zoom_link, show_register_buttons: show_register_buttons});
							});
						}
					});
				}
			});
		}
		else {
			connection.query("SELECT * from Bible_countdown", function (err, bible_countdown_row) {
				if (err) {
					console.log(err);
					res.redirect('/confirm?t=e');
				} else {
					var reveal_zoom_link = false;
					if (ccc_setting.reveal_links_before_in_min >= bible_countdown_row[0].countdown &&
						req.query.bid == req.user.bid) {
							reveal_zoom_link = true;
						}
					connection.query("SELECT * FROM Bible where bid = ?", [req.query.bid], function(err1, rows1) {
						if (err1)
							console.log(err1);
						if (rows1.length == 0)
							res.redirect('/confirm?t=de');
						else {
							connection.query("SELECT * FROM Users where uid = ? and bid = ?", [req.user.uid, req.query.bid], function(err2, rows2) {
								if (err2)
									console.log(err2);
								res.render('detail.ejs', {type : "bible", bibleinfo : rows1[0], registered : (rows2.length > 0), reveal_zoom_link: reveal_zoom_link, show_register_buttons: show_register_buttons});
							});
						}
					});
				}
			});
		}
	});

	app.get('/cancel', isLoggedIn, function(req, res, next) {
		if (ccc_setting.register_start_time > (new Date())) {
			res.status(400);
			res.send('None shall pass');
		}
		else if (req.query.t == "c") {
			connection.query("SELECT cid from Users where uid = ?", [req.user.uid], function(err, rows) {
				if (err)
					res.redirect('/confirm?t=e');
				else if (rows[0].cid == null || rows[0].cid != req.query.cid)
					res.redirect('/confirm?t=cet');
				else {
					connection.query("UPDATE Classes SET current = (current - 1) where cid = ?", [req.query.cid], function(err1, rows1) {
						if (err1)
							res.redirect('/confirm?t=ce');
						else {
							connection.query("UPDATE Users SET cid = null where uid = ?", [req.user.uid], function(err, rows) {
								if (err)
									res.redirect('/confirm?t=e');
								else
									res.redirect('/confirm?t=cs');
							})
						}
					})
				}
			})
		}
		else {
			connection.query("SELECT bid from Users where uid = ?", [req.user.uid], function(err, rows) {
				if (err)
					res.redirect('/confirm?t=e');
				else if (rows[0].bid == null || rows[0].bid != req.query.bid)
					res.redirect('/confirm?t=cet');
				else {
					connection.query("UPDATE Bible SET current = (current - 1) where bid = ?", [req.query.bid], function(err1, rows1) {
						if (err1)
							res.redirect('/confirm?t=ce');
						else {
							connection.query("UPDATE Users SET bid = null where uid = ?", [req.user.uid], function(err, rows) {
								if (err)
									res.redirect('/confirm?t=e');
								else
									res.redirect('/confirm?t=cs');
							})
						}
					})
				}
			})
		}
	})

	app.get('/register', isLoggedIn, function(req, res, next) {
		if (ccc_setting.register_start_time > (new Date())) {
			res.status(400);
			res.send('None shall pass');
		}
		else if (req.query.t == "c") {
			connection.query("SELECT cid from Users where uid = ?", [req.user.uid], function(err, rows) {
				if (err)
					res.redirect('/confirm?t=e');
				else if (rows[0].cid == req.query.cid)
					res.redirect('/confirm?t=ret');
				else if (rows[0].cid != null)
					res.redirect('/confirm?t=red');
				else {
					connection.query("UPDATE Classes SET current = (current + 1) where cid = ?", [req.query.cid], function(err1, rows1) {
						if (err1)
							res.redirect('/confirm?t=ref');
						else {
							connection.query("UPDATE Users SET cid = ? where uid = ?", [req.query.cid, req.user.uid], function(err, rows) {
								if (err)
									res.redirect('/confirm?t=e');
								else
									res.redirect('/confirm?t=rs');
							})
						}
					})
				}
			})
		}
		else {
			connection.query("SELECT bid from Users where uid = ?", [req.user.uid], function(err, rows) {
				if (err)
					res.redirect('/confirm?t=e');
				else if (rows[0].bid == req.query.bid)
					res.redirect('/confirm?t=ret');
				else if (rows[0].bid != null)
					res.redirect('/confirm?t=red');
				else {
					connection.query("UPDATE Bible SET current = (current + 1) where bid = ?", [req.query.bid], function(err1, rows1) {
						if (err1)
							res.redirect('/confirm?t=ref');
						else {
							connection.query("UPDATE Users SET bid = ? where uid = ?", [req.query.bid, req.user.uid], function(err, rows) {
								if (err)
									res.redirect('/confirm?t=e');
								else
									res.redirect('/confirm?t=rs');
							})
						}
					})
				}
			})
		}
	})

	app.get('/confirm', isLoggedIn, function(req, res, next){
		res.render('confirm.ejs', {t : req.query.t});
	});

	app.get('/my', isLoggedIn, function(req, res, next) {
		connection.query("SELECT cid, bid FROM Users where uid = ?", [req.user.uid], function(err, rows) {
			connection.query("SELECT * FROM Classes where cid = ?", [rows[0].cid], function(err1, rows1) {
				connection.query("SELECT * FROM Bible where bid = ?", [rows[0].bid], function(err2, rows2) {
					if (err || err1 || err2)
						res.redirect('/confirm?t=e');
					var creg = true;
					var breg = true;
					if (rows1.length < 1)
						creg = false;
					if (!rows2.length < 1)
						breg = false;
					res.render('my.ejs', {creg : creg, breg : breg, classinfo : rows1[0], bibleinfo : rows2[0]});
				})
			})
		})
	});

	app.get('/overview', function(req, res, next) {
		res.render('overviewauthenticate.ejs', {wrong : false});
	});

	app.post('/overview', function(req, res, next) {
		
		if (req.body.password == overview_pw) {
			connection.query("SELECT cid, title FROM Classes", function(err1, classes) {
				if (err1) next(err1);
				connection.query("SELECT bid, title FROM Bible", function(err2, bibles) {
					if (err2) next(err2);
					connection.query("SELECT name, campus, cid, bid FROM Users", function(err, rows) {
						var classlist = [["미신청"]];
						var biblelist = [["미신청"]];
						for (i in classes)
							classlist.push([classes[i].title]);
						for (i in bibles)
							biblelist.push([bibles[i].title]);
						for (p in rows) {
							classlist[rows[p].cid==null ? 0 : cid].push({name : rows[p].name, campus : rows[p].campus});
							biblelist[rows[p].bid==null ? 0 : rows[p].bid].push({name : rows[p].name, campus : rows[p].campus});
						}

						res.render('overview.ejs', {classlist : classlist, biblelist : biblelist});
					})	
				})
			})
		}
		else {
			res.render('overviewauthenticate.ejs', {wrong : true});
		}
	})

};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/login');
}
