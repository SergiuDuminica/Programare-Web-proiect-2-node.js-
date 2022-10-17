const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();

app.use("/public", express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(session(
	{
		secret: 'secret',
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 10000 }
	}
));

var conn = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "20701001",
	database: "cumparaturi"
});

const port = 6789;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
app.get('/', (req, res) => {
	// if (req.cookies.utilizator != undefined) {
	// 	let user = JSON.parse(req.cookies.utilizator);
	// 	username = user.username;
	// }
	let username = req.session.username;
	let nume = req.session.nume;
	let prenume = req.session.prenume;
	let rol = req.session.rol;
	var q = "SELECT * FROM produse;";
	conn.query(q, (err, result) => {
		if (err) throw err;
		res.render('index', { username, produse: result, rol });
	});
	// res.render('index', {username});

});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	const fs = require('fs');
	fs.readFile('intrebari.json', (err, data) => {
		let username = req.session.username;
		if (err) throw err;
		var listaIntrebari = JSON.parse(data);
		res.render('chestionar', { intrebari: listaIntrebari, username });
	});
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	// res.render('chestionar', {intrebari: listaIntrebari});
});

app.post('/rezultat-chestionar', (req, res) => {
	let username = req.session.username;
	const raspunsuri_corecte = ['Da', '8', 'SSD', '65°C', 'Personal'];
	var numar_raspunsuri_corecte = 0;
	for (var i = 0; i < raspunsuri_corecte.length; ++i) {
		if (req.body[raspunsuri_corecte[i].toString()] != 'undefined')
			if (req.body[raspunsuri_corecte[i].toString()] == 'on')
				numar_raspunsuri_corecte++;
	}
	res.render('rezultat-chestionar', { numar_raspunsuri_corecte, username });
});

app.get('/autentificare', (req, res) => {
	// let mesaj_eroare = req.cookies.mesajEroare;
	let mesaj_eroare = req.session.mesajEroare;
	res.render('autentificare', { mesaj_eroare });
});

app.post('/verificare-autentificare', (req, res) => {
	const fs = require('fs');
	fs.readFile('utilizatori.json', (err, data) => {
		if (err) throw err;
		var listaUtilizatori = JSON.parse(data);
		var corect = false;
		var index;
		for (var i = 0; i < listaUtilizatori.length; ++i) {
			if (listaUtilizatori[i].utilizator == req.body.username &&
				listaUtilizatori[i].parola == req.body.password) {
				corect = true;
				index = i;
				break;
			}
		}
		if (corect) {
			// var valoare_cookie = JSON.stringify({username: listaUtilizatori[index].utilizator});
			// res.cookie('utilizator', valoare_cookie);
			// res.clearCookie('mesajEroare');
			req.session.username = listaUtilizatori[index].utilizator;
			req.session.rol = listaUtilizatori[index].rol;
			let username = req.session.username;
			req.session.cos = [];
			res.redirect('/');
		}
		else {
			// res.cookie('mesajEroare', 'Ați introdus greșit credențialele.');
			req.session.mesajEroare = 'Ați introdus greșit credențialele.';
			res.redirect('/autentificare');
		}
	});
});

app.post('/logout', (req, res) => {
	let username;
	// res.clearCookie('utilizator');
	req.session.destroy();
	res.render('index', { username });
});

app.get('/creare-bd', (req, res) => {
	conn.connect(function (err) {
		if (err) throw err;
		conn.query("CREATE DATABASE IF NOT EXISTS cumparaturi", function (err, result) {
			console.log("A fost creata baza de date.");
		});
		console.log("Conexiune reusita.");
	});
	var q = "CREATE TABLE IF NOT EXISTS produse (id INT(5) UNSIGNED AUTO_INCREMENT PRIMARY KEY, componenta VARCHAR(255), producator VARCHAR(255), model VARCHAR(255), cantitate VARCHAR(255), pret VARCHAR(255))";
	conn.query(q, function (err) {
		if (err) throw err;
		console.log("Tabela produse a fost creata.");
	});
	res.redirect('/');
});

app.get('/inserare-bd', (req, res) => {
	var q;
	conn.connect(function (err) {
		if (err) throw err;
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Placa video', 'NVIDIA', 'GeForce RTX 3050', '1', '1850 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Placa video', 'AMD', 'Radeon RX 6500 XT', '1', '1250 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Periferice', 'Logitech', 'MX Keys', '1', '1110 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Periferice', 'Asus', 'Monitor VG278QR', '1', '900 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Mediu de stocare', 'Samsung', 'SSD 870 QVO 1 TB', '1', '529 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Mediu de stocare', 'Adata', 'HD650 2TB', '1', '360 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Placa de baza', 'Asus', 'ROG STRIX B560-E', '1', '1300 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Placa de baza', 'Gigabyte', 'X570 AORUS PRO', '1', '1200 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Procesor', 'Intel', 'i9-11900F', '1', '1900 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Procesor', 'AMD', 'Ryzen 7 5700G', '1', '1500 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Cooler pentru procesor', 'Asus', 'ROG STRIX LC 360', '1', '1320 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Cooler pentru procesor', 'Gigabyte', 'AORUS WATERFORCE X 360', '1', '1340 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Module RAM', 'Corsair', '8GB DDR4', '2', '610 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Module RAM', 'Adata', '16GB DDR5', '2', '1400 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});

		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Sursa alimentare', 'Gigabyte', 'P850GM 850W', '1', '420 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
		q = "INSERT INTO produse (componenta, producator, model, cantitate, pret) VALUES ('Sursa alimentare', 'Corsair', 'CX750F', '1', '540 lei')";
		conn.query(q, (result) => {
			if (err) throw err;
		});
	})
	res.redirect('/');
});

app.post('/adauga-cos', (req, res) => {
	req.session.cos.push(req.body['id']);
	res.redirect('/');
});

app.post("/vizualizare-cos", (req, res) => {
	conn.query("SELECT id, componenta, producator, model, cantitate, pret FROM produse", function (err, result) {
		if (err) throw err;
		res.render('vizualizare-cos', { vector: result, cos: req.session.cos });
	});
});

app.get("/admin", (req, res) => {
	res.render('admin');
});

app.post("/adauga-produs", (req, res) => {
	let componenta = req.body.componenta;
	let producator = req.body.producator;
	let model = req.body.model;
	let cantitate = req.body.cantitate;
	let pret = req.body.pret;
	let username = session.username;
	conn.connect(function (err) {
		if (err) throw err;
		var q = "INSERT INTO cumparaturi.produse (componenta, producator, model, cantitate, pret) VALUES ('" + componenta + "', '" + producator + "', '" + model + "', '" + cantitate + "', '" + pret + "');";
		conn.query(q, (err, result) => {
			if (err) throw err;
		});
	});
	res.redirect('/?username=' + username);
});

app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:`, port));