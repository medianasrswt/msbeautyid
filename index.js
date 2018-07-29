const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const session = require('express-session')
const PORT = '3000'

const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'restore_msbid'
});

app.set('view engine', 'ejs')

app.use(bodyParser())
// app.use(express.static('views/adminn'))
app.use(express.static('views/static'))
app.use(session({ name: 'ketek', secret: 'ms', resave: false, cookie: { maxAge: 600000}}))

const checkAuth = (req, res, next) => {
    if (!req.session.authenticated) {
         res.redirect('/');
         return;
     } else {
         next();
     }
}

const generateRandomNumber = (length) => parseInt(Math.random().toString(10).substr(4, length))

app.get('/', (req, res) => {
	connection.query('select * from tb_barang group by Jenis', (err, result, fields) => {
		if (err) throw err

		if(req.session.user) {
			res.render('MSBEAUTYID/index', { barang: result, path: 'home', userLoggedIn: req.session.user })
		} else {
			res.render('MSBEAUTYID/index', { barang: result, path: 'home', userLoggedIn: req.session.user })
		}

	})
	
	
})

app.get('/logout', (req, res) => {
	delete req.session.user
	delete req.session.authenticated
	res.redirect('/')
})

app.post('/login', (req, res) => {
  let { email, password } = req.body;
  connection.query(
    `select * from tb_user where email='${email}' and password='${password}'`,
    (err, result, fields) => {
      if (err) throw err;

      if(req.session.user){
      	res.redirect('/')
      } else {
      	req.session.user = result[0]
      	req.session.authenticated = true;
      	res.redirect('/')
      }
    }
  );
});

// bukan disitu med
app.get('/customer-account',  checkAuth,  (req, res) => {
	if(req.session.user) {
		res.render('MSBEAUTYID/customer-account',{ userLoggedIn: req.session.user})
	} 	
})


app.get('/claim', (req, res) => {
	res.send(req.session.user)
})

app.get('/contact', (req, res) => {
	res.render('MSBEAUTYID/contact')
})

app.get('/basket', checkAuth, (req, res) => {
 	res.render('MSBEAUTYID/basket', { userLoggedIn: req.session.user})
})

app.post('/basket', (req, res) => {
	if(!req.session.user){
		res.redirect('/');
		return
	} else {
		if(req.session.idcart) {
			connection.query(`insert into tb_scartuser values('${req.session.idcart}', '${req.body.nama}', '${req.session.user.username}', 1000)`, (err, result, fields) => {
				if(err) throw err;
				connection.query(`select * from tb_scartuser where id_shopping_cart = '${req.session.idcart}'`, (err, result, fields) => {
					if (err) throw err;
					let itemsInBasket = result.map(item => item.Id_brg)

					connection.query(`select * from tb_barang where Id_brg in (?)`, [itemsInBasket],(err, result, fields) => {
						if (err) throw err;
						res.render('MSBEAUTYID/basket', { idsc: req.session.idcart, items: result, userLoggedIn: req.session.user})
					})
					
				})
			})
		} else {
			const randomId = [generateRandomNumber(6)]
			connection.query(`insert into tb_scart values(${randomId[0]}, '${req.session.user.username}', 1, 10000)`, (err, result, fields) => {
				if(err) throw err;
				connection.query(`insert into tb_scartuser values('${randomId[0]}', '${req.body.nama}', '${req.session.user.username}', 1000)`, (err, result, fields) => {
					if(err) throw err;
					if(!req.session.idcart) { 
						req.session.idcart = randomId[0]
					}
					connection.query(`select * from tb_scartuser where id_shopping_cart = '${req.session.idcart}'`, (err, result, fields) => {
						if (err) throw err;
						let itemsInBasket = result.map(item => item.Id_brg)

						connection.query(`select * from tb_barang where Id_brg in (?)`, [itemsInBasket],(err, result, fields) => {
							if (err) throw err;
							res.render('MSBEAUTYID/basket', { idsc: req.session.idcart, items: result, userLoggedIn: req.session.user})
						})
					})
				})
			})
		}
	}
})

//bnr kan itu yg diapus hooh

app.get('/register', (req, res) => {
	res.render('MSBEAUTYID/register', { userLoggedIn: req.session.user})
})

app.get('/checkout1', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout1', { userLoggedIn: req.session.user})
})

app.get('/checkout2', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout2', { userLoggedIn: req.session.user })
})
app.get('/checkout3', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout3', { userLoggedIn: req.session.user })
})
app.get('/checkout4', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout4', { userLoggedIn: req.session.user })
})


app.post('/checkout2', (req, res) => {
	res.render('MSBEAUTYID/checkout2', { userLoggedIn: req.session.user})
})
app.post('/checkout3', (req, res) => {
	res.render('MSBEAUTYID/checkout3', { userLoggedIn: req.session.user})
})
app.post('/checkout4', (req, res) => {
	res.render('MSBEAUTYID/checkout4', { userLoggedIn: req.session.user})
})

app.post('/update-password', (req, res) => {
	res.redirect('/')
})

const shipping ={
	"Jakarta" : "10000",
	"Bali" : "24000",
	"Surabaya" : "16000",
}

var descriptions = {
	"Foundation": "Foundation is a skin-coloured makeup applied to the face to create an even, uniform colour to the complexion, to cover flaws and, sometimes, to change the natural skintone.",
	"Blush": "Perfect pinks. Rosy red hues. Blush that brings out your inner glow.",
	"Bronzer": "Bronzer is a cream or powder that you put on your face and body to make your skin look brown from being in the sun.",
	"Concealer": "A concealer or color corrector is a type of cosmetic that is used to mask dark circles, age spots, large pores, and other small blemishes visible on the skin.",
	"Loose Powder":"loose powder creates a soft focus effect on the skin. Helps mask fine lines and imperfections for a radiant looking complexion.",
	"Mascara": "Mascara, a thick dark liquid make-up that is used to make eyelashes dark and make them appear thicker and longer.",
	"Eyeshadow": "Eyeshadow is a colored cosmetic, typically in powder form, applied to the eyelids or to the skin around the eyes to accentuate them.",
	"Lipstick": "Lipstick is a cosmetic product containing pigments, oils, waxes, and emollients that apply color, texture, and protection to the lips.",
	"Lip Balm": "Lip balm is a wax-like substance applied topically to the lips of the mouth to moisturize and relieve chapped or dry lips, angular cheilitis, stomatitis, or cold sores. Lip balm often contains beeswax or carnauba wax, camphor, cetyl alcohol, lanolin, paraffin, and petrolatum, among other ingredients. Some varieties contain dyes, flavor, fragrance, phenol, salicylic acid, and sunscreens.",
	"Make Up Remover": "Make Up Remover is a substance that you use to remove make-up from your face.",
	"Moisturizer": "A moisturizer is a cream that you put on your skin to make it feel softer and smoother."
}

const barang = {
	foundation: {
		name: "Foundation",
		description: "Foundation is a skin-coloured makeup applied to the face to create an even, uniform colour to the complexion, to cover flaws and, sometimes, to change the natural skintone."
	},
	blush: {
		name: "Blush",
		description: "Perfect pinks. Rosy red hues. Blush that brings out your inner glow."
	
	},
	bronzer: {
		name: "Bronzer",
		description: "Bronzer is a cream or powder that you put on your face and body to make your skin look brown from being in the sun."
	},
	concealer: {
		name: "Concealer",
		description: "A concealer or color corrector is a type of cosmetic that is used to mask dark circles, age spots, large pores, and other small blemishes visible on the skin."
	},
	loosepowder: {
		name: "Loose Powder",
		description: "loose powder creates a soft focus effect on the skin. Helps mask fine lines and imperfections for a radiant looking complexion."
	},
	mascara: {
		name: "Mascara",
		description: "Mascara, a thick dark liquid make-up that is used to make eyelashes dark and make them appear thicker and longer."
	},
	eyeshadow: {
		name: "Eyeshadow",
		description: "Eyeshadow is a colored cosmetic, typically in powder form, applied to the eyelids or to the skin around the eyes to accentuate them."
	},
	lipstick: {
		name: "Lipstick",
		description: "Lipstick is a cosmetic product containing pigments, oils, waxes, and emollients that apply color, texture, and protection to the lips."
	},
	lipbalm: {
		name: "Lip Balm",
		description: "Lip balm is a wax-like substance applied topically to the lips of the mouth to moisturize and relieve chapped or dry lips, angular cheilitis, stomatitis, or cold sores. Lip balm often contains beeswax or carnauba wax, camphor, cetyl alcohol, lanolin, paraffin, and petrolatum, among other ingredients. Some varieties contain dyes, flavor, fragrance, phenol, salicylic acid, and sunscreens."
	},
	makeupremover: {
		name: "Make Up Remover",
		description: "Make Up Remover is a substance that you use to remove make-up from your face."
	},
	moisturizer: {
		name: "Moisturizer",
		description: "A moisturizer is a cream that you put on your skin to make it feel softer and smoother."
	}
}

app.get('/barang/:kategori/:subkategori/:jenis', (req, res) => {
	let { kategori, subkategori, jenis } = req.params
	connection.query(`select * from tb_barang where jenis like '%${req.params.jenis}%'`, (err, result, fields) => {
		if (err) throw err
		res.render(`templates/category`, { 
			nama: barang[`${req.params.jenis}`].name, 
			desc: barang[`${req.params.jenis}`].description, 
			jumlah: result.length,
			barang: result,
			path: kategori,
			userLoggedIn: req.session.user
		})
	})
})

app.get('/detail/:jenis', (req, res) => {
	connection.query(`select * from tb_barang where gambar_brg = '${req.params.jenis}' limit 1`, (err, result, fields) => {
		if (err) throw err
		res.render(`MSBEAUTYID/detail`, {
			jenis: result[0],
			userLoggedIn: req.session.user
		})
	})
})

app.post('/register',  (req, res) => {
   let {username, nama, email, password, alamat, kelurahan, kecamatan, kodepos, kota, telpon} = req.body
   connection.query(`insert into tb_user(username, Nama, Email, Password, Alamat, Kelurahan, Kecamatan, Kode_pos, Kota, Telpon) 
   		values('${username}','${nama}','${email}','${password}','${alamat}','${kelurahan}','${kecamatan}','${kodepos}','${kota}','${telpon}')`, (err, result, fields) => {
   			if(err) throw err
   			res.redirect('/')
   		})
})

app.post('/checkout1', (req, res) => {
	const randomId = [generateRandomNumber(6)]
	let now = new Date()
	let query = `insert into tb_pembayaran values(
		'${randomId[0]}', 
		${connection.escape(now)},
		'pending',
		'${req.session.user.username}',
		'${req.body.total}',
		'${req.session.idcart}')`

	connection.query(query, (err, result, fields) => {
		if (err) throw err
		const { Nama, Alamat, Kode_pos, Email, Telpon} = req.session.user
		const dataUser = { Nama, Alamat, Kode_pos, Email, Telpon }
		query =  `insert into tb_pengirim values(
			'${randomId[0]}',
			'${req.session.user.Nama}',
			'${req.session.user.Alamat}',
			'${req.session.user.Kode_pos}',
			'${req.session.user.Email}',
			'${req.session.user.Telpon}')`
		connection.query(query, (err, result, fields) => {
			if(err) throw err
			if(!req.session.user.idtsc){
				req.session.user.idtsc = randomId[0]
			}		
			res.render('msbeautyid/checkout1', { userLoggedIn: req.session.user, data: dataUser  }) 
		})
		
	})
})

app.post('/update-checkout1', (req, res) => {
	console.log(req.body)
	let query =  `update tb_pengirim set
		Nama = '${req.body.nama}',
		Alamat = '${req.body.alamat}',
		Kode_pos = '${req.body.kodepos}',
		Email = '${req.body.email}',
		Telpon = '${req.body.telpon}'
		where Id_transaksi = '${req.session.user.idtsc}'`
	console.log(query)
	connection.query(query, (err, result, fields) => {
		if(err) throw err
		res.render('msbeautyid/checkout2', { userLoggedIn: req.session.user })
	})
})

app.listen(PORT, () => {
	console.log('listening on http://localhost:' + PORT)
})