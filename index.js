const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const multer = require('multer');
const path = require('path');
const mysql = require('mysql');
const fs = require('fs')
const ncp = require('ncp').ncp

const PORT = 3000

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'restore_msbid'
});

let storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './bukti-tf/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname); 
  },
});
let upload = multer({ storage });

const app = express()

app.set('view engine', 'ejs')

app.use(bodyParser())
app.use(express.static('views/adminn'))
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
const generateFolderName = (namaBrg, jenisBrg) => namaBrg.split(' ')[0].toLowerCase() + jenisBrg.toLowerCase()


app.post('/admin/login', (req, res) => {
	let { username, password } = req.body;
	connection.query(
    	`select * from tb_user where username='${username}' and password='${password}' and Role='0'`,
    	(err, result, fields) => {
	   		if (err) throw err;
		   	if(req.session.user){
		   		res.redirect('/admin/pesanan')
			} else {
			    req.session.user = result[0]
			    req.session.authenticated = true;
			    res.redirect('/admin/pesanan')
			}
	    }
  	);
});

app.get('/admin/login', (req, res) => {
	res.render('adminn/login')
}) 	
app.get('/admin', (req, res) => {
	res.render('adminn/login')
})
app.get('/admin/datatable', (req, res) => { 
	connection.query('select * from tb_barang', (err, result, fields) => {
		if (err) throw err
		res.render('adminn/datatable', { 
			items: result
		})
	})
})

app.get('/admin/user', (req, res) => {
	res.render('adminn/user')
}) 	

app.get('/admin/pesanan', (req, res) => {
	connection.query('select * from tb_pembayaran', (err, result, fields) => {
		if (err) throw err
		res.render('adminn/pesanan', {
			items: result
		})
	}) 	
})

app.post('/admin/update/status', (req,res) => {
	let query =  `update tb_pembayaran set
		Status_brg ='delivered' where Id_transaksi = '${req.body.idTsc}'`
	connection.query(query, (err, result, fields) => {
		if (err) throw err
		res.redirect('/admin/pesanan')
	})
})

app.get('/admin/bikin-folder', (req, res) => {
    const path = __dirname + '/views/static/img/barang' + '/aahoy/'
    fs.mkdir(path)
    res.send(path)
})

app.get('/admin/formbrg', (req, res) => {
	res.render('adminn/formbrg')
})

storage = multer.diskStorage({
    destination : (req, file, cb) => {
        cb(null, './uploads/warehouse/')
    },
    filename : (req, file, cb)=>{
        cb(null, file.fieldname + '.jpg')
    }
})
upload = multer({storage})
const mfUpload = upload.fields([
  { name: '1', maxCount: 1 },
  { name: '2', maxCount: 1 },
  { name: '3', maxCount: 1 },
  { name: 'main', maxCount: 1 },
  { name: 'scart', maxCount: 1 }
])

app.post('/admin/formbrg', mfUpload, (req, res) => {
	let {idbarang, kategori, namabarang, jenis, stockbarang, shade, hargabrg, desbrg, detailbrg, gambar, status} = req.body
	console.log(req.body)
    let query = `insert into tb_barang values(
		'${idbarang}', 
		'${kategori}',
		'${namabarang}',
		'${jenis}',
		'${stockbarang}',
		'${shade}',
		'${hargabrg}',
		'${desbrg}',
		'${detailbrg}',
		'${gambar}',
		'${status}')`
	console.log("query insert", query)

		/* sisipin kodingan buat folder di sini*/
	const newFolder = generateFolderName(namabarang, jenis)
	const target = __dirname + `/views/static/img/barang/${newFolder}`
    // fs.mkdir(target)
    
    const oldPath = path.join(__dirname, 'uploads/warehouse')
    const newPath = path.join(__dirname, `${target}`)

    console.log("newFolder", newFolder)
    console.log("old path", oldPath)
    console.log("new path", newPath)

    // ncp(oldPath, newPath, function (err) {
    //      if (err) {
    //        return console.error(err);
    //      }
    //      console.log('done!');
    // });

  //  	connection.query(query, (err, result, fields)=> {
		// if (err) throw err
  //  		res.redirect('/admin')
  //  	})
   	res.redirect('/admin/datatable')
})

app.get('/admin/formbrg/:id_brg', (req, res) => {
    let query = `select * from tb_barang where Id_brg = '${req.params.id_brg}' limit 1`
	connection.query(query, (err, result, fields) => {
		if (err) throw err
		res.render(`adminn/formedit`, {
			item: result[0]
		})
	})
})

app.post('/admin/update-barang',  (req, res) => {
	let {idbarang, kategori, namabarang, jenis, stockbarang, shade, hargabrg, desbrg, detailbrg, gambar, status} = req.body
    let query = `update tb_barang set
		Kategori='${kategori}',
		Nama_brg='${namabarang.replace("'", "\\'")}',
		Jenis='${jenis}',
		Stok_brg='${stockbarang}',
		Shade = '${shade}',
		Harga_brg = '${hargabrg}',
		Deskripsi_brg = '${desbrg.replace("'", "\\'")}',
		Detail_brg = '${detailbrg.replace("'", "\\'")}',
		status = '${status}'
		where Id_brg='${idbarang}'`
   	connection.query(query, (err, result, fields)=> {
		if (err) throw err
   		res.redirect('/admin/datatable')
   	})

})

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


app.get('/customer-account',  checkAuth,  (req, res) => {
	if(req.session.user) {
		res.render('MSBEAUTYID/customer-account',{ userLoggedIn: req.session.user})
	} 	
})


app.get('/claim', (req, res) => {
	res.send(req.session)
})

app.get('/contact', (req, res) => {
	res.render('MSBEAUTYID/contact',{ userLoggedIn: req.session.user})
})
app.get('/contact', (req, res) => {
	res.render('MSBEAUTYID/register',{ userLoggedIn: req.session.user})
})
app.get('/', checkAuth, (req, res) => {
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
			connection.query(`insert into tb_scart values('${randomId[0]}', '${req.session.user.username}', 1, 10000)`, (err, result, fields) => {
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

app.get('/basket', (req, res) => {
	if(req.session.idcart) {
	    let query = `select * from tb_scartuser where id_shopping_cart = '${req.session.idcart}'`
	    connection.query(query , (err, result, fields) => {
	     	if (err) throw err;
	     	let itemsInBasket = result.map(item => item.Id_brg)
	 
	    	query = `select * from tb_barang where Id_brg in (?)`
	    	connection.query(query , [itemsInBasket],  (err, result, fields) => {
	      		if (err) throw err;
	     		res.render('MSBEAUTYID/basket', { idsc: req.session.idcart, items: result, userLoggedIn: req.session.user})
	     	})
	     
	    })
	} else {
        	res.redirect('/')
   	}
})

app.get('/payment-confirmation', checkAuth, (req,res)=>{
	res.render('MSBEAUTYID/payment-confirmation' , { userLoggedIn: req.session.user })
})

app.post('/payment-confirmation', upload.single('file'), (req,res)=>{
    // const file = req.file;
    // const meta = req.body;

    // console.log(file,meta)

    // res.end();
    res.redirect('/')
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


app.post('/checkout2', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout2', { userLoggedIn: req.session.user})
})


app.post('/checkout3', (req, res) => {
	let { username } = req.session.user
	let { idcart } = req.session
	let query = `select count(*) Jumlah_brg, Id_brg  from tb_scartuser 
		where id_shopping_cart = '${idcart}' group by Id_brg`
	connection.query(query, (err, result, fields)=> {
		if (err) throw err
		
		let itemsInBasket = result.map(item => item.Id_brg)
		let scartViewItems = result.map(item => item)
		req.session.user.scartUserItems = scartViewItems
		connection.query(`select * from tb_barang where Id_brg in (?)`, [itemsInBasket], (err, result, fields) => {
			if (err) throw err;
			res.render('MSBEAUTYID/checkout4', { 
				idsc: req.session.idcart, 
				items: result, 
				userLoggedIn: req.session.user, 
				shipp: shipping,
				pymntMthd: req.body.pembayaran,
				scartViewItems: scartViewItems
			})
		})		
	})
})

app.post('/checkout4', (req, res) => {
	let idsBarang = req.session.user.scartUserItems.map(item => item.Id_brg)
	let jmlhBarangPerIds = req.session.user.scartUserItems.map(item => item.Jumlah_brg)

	let query = 'select Stok_brg, Id_brg from tb_barang where Id_brg in (?)'
    connection.query(query , [idsBarang], (err, result, fields) => {
      if (err) throw err;
      result.map((item, index) => {
           query = `update tb_barang set Stok_brg = ${item.Stok_brg - req.session.user.scartUserItems[index].Jumlah_brg} where Id_brg = '${item.Id_brg}'`
           connection.query(query , (err, result, fields) => {
                 if (err) throw err;
           })
      })
    })
	res.render('MSBEAUTYID/finish-order', { userLoggedIn: req.session.user})
})


app.post('/upload-tf', upload.single('tfImage'), (req, res) => {
  	res.redirect('/');
});

app.post('/pencarian-produk', (req, res) => {
	let query = `select * from tb_barang where Nama_brg like '%${req.body.search}%'`
	connection.query(query , (err, result,fields)=> {
		res.render('./templates/pencarian-produk', {barang: result, userLoggedIn: req.session.user})
	})
})

app.post('/update-password', (req, res) => {
	let query = `update tb_user set Password = '${req.body.newpass}' where username = '${req.session.user.username}' and Password='${req.body.oldpass}'`
	connection.query(query , (err, result,fields)=> {
	res.redirect('/')
	})
})

app.post('/trash', (req,res) => {
	let query = `delete from tb_scartuser where id_shopping_cart = '${req.session.idcart}' and username = '${req.session.user.username}' and Id_brg = '${req.body.idBrg}'`
 	connection.query(query, (err, result, fields) => {
  		if (err) throw err
 	res.redirect('/')
	})
})


app.get('/finish-order', checkAuth, (req, res) => {
	res.render('MSBEAUTYID/checkout4', { userLoggedIn: req.session.user })
})

const shipping = {
	"Bandung"	: "10000",
	"Bekasi"	: "10000",
	"Batam"		: "28000",	
	"Denpasar"	: "22000",
	"Depok"		: "10000",
	"Jakarta"	: "10000",
	"Malang"	: "26000",
	"Surabaya"	: "16000",
	"Yogyakarta": "18000",
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

const ktgr = {
	Eye: {
		name: "Eye",
	},
	Face: {
		name : "Face",
	},
	Lips: {
		name : "Lips",
	},
	Cleanser: {
		name : "Cleanser", 

	},
	Moisturizer: {
		name : "Moisturizer"
	}
}

app.get('/barang/:kategori/:subkategori', (req, res) => {
	let {kategori, subkategori} = req.params
	let query = `select * from tb_barang where kategori='${req.params.subkategori}'`
	connection.query(query, (err, result, fields) => {
		if (err) throw err
		res.render(`templates/category`, { 
			nama: ktgr[`${req.params.subkategori}`].name, 
			desc: ktgr[`${req.params.subkategori}`].description, 
			jumlah: result.length,
			barang: result,
			path: kategori,
			userLoggedIn: req.session.user
		})
	})
})

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

app.get('/register', (req, res) => {
	res.render('MSBEAUTYID/register', { userLoggedIn: req.session.user})
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
		'belom trf',
		'${req.session.idcart}')`
	req.session.user.totalBelanja = req.body.total	
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
	let query =  `update tb_pengirim set
		Nama = '${req.body.nama}',
		Alamat = '${req.body.alamat}',
		Kode_pos = '${req.body.kodepos}',
		Email = '${req.body.email}',
		Telpon = '${req.body.telpon}'
		where Id_transaksi = '${req.session.user.idtsc}'`
	req.session.user.tujuan = req.body.alamat	
	connection.query(query, (err, result, fields) => {
		if(err) throw err
		res.render('msbeautyid/checkout2', { userLoggedIn: req.session.user })
	})
})
app.post('/update-checkout2', (req, res) => {
	req.session.user.shipping = parseInt(shipping[req.body.kota])
 let grandTotal = parseInt(req.session.user.totalBelanja) + parseInt(shipping[req.body.kota])
 let query = `update tb_pembayaran set
   Total_harga = '${grandTotal}' where Id_transaksi =${req.session.user.idtsc}`
  connection.query(query, (err, result, fields) => {
		if(err) throw err
		req.session.user.grandTotal = grandTotal;
		res.render('msbeautyid/checkout3', { userLoggedIn: req.session.user })
	})

})

app.listen(PORT, () => {
	console.log('listening on http://localhost:' + PORT)
})