// require
const mysql = require('mysql2/promise');
const serverlessExpress = require('@vendia/serverless-express')
const express = require('express');
const app = express();
const {createQuery, createQueryForGetRecordNum} = require("./createQueryString.js");


//テーブル名
const famicomTableName = "famicomtitle"
const n64TableName = "n64title"
// テーブル一覧 クエリ生成時に参照する
const dbTableName = [famicomTableName, n64TableName]


// expressサーバー
const server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listening at http://%s:%s', host, port);
});

// リクエストボディーをjsonオブジェクトに変換.
app.use(express.json());
// // リクエストボディーでクエリパラメータとして送られてきたものをいい感じに変換
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');              // クロスサイトオリジンを許可する
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');    // 'Content-Type'ヘッダーを許可する
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');     // 'GET''POST'メソッドを許可する
  next();
})

app.param(['id', 'page'], function (req, res, next, value) {
  console.log('CALLED ONLY ONCE with', value)
  next()
})

// dbから取得する値は以下の通り
// id {number}、softtitle {string}、maker {string}、consoletype {string}、releaseyear {date}、imgurl {string}、series {string}、genre {string}
// 
// リクエスト時に指定される値は以下の通り
// ゲーム機の種類、ソフトタイトル、発売年、シリーズ、ジャンル
app.get('/', async (req, res)=>{
  const id = req.query.hoge;
  const connection = await mysql.createConnection({
    host     : 'mysqldb',
    user     : 'toposon',
    password : 'KtKs5223!',
    database : 'gamedata',
    port     : 3306
  });
  
  let result =null;
  try {
    result = await connection.query(`SELECT * FROM n64title UNION SELECT * FROM famicomtitle`);
    // result = await connection.query(`SELECT * FROM n64title where id>${id-1} AND id<11`);
    console.log(result[0][0]);
  }
  catch (e) {
    console.log(e);
  }
  try {
    connection.destroy()
    console.error("ok")
  }
  catch (e) {
    console.log(e)
  }
  res.json(result[0])
});

app.post('/', async (req, res)=>{
  const {famicom, n64, yearmin, yearmax, page, title} = req.body
  // console.log("famicom is " + famicom);
  // console.log("n64 is " + n64);
  // console.log("yearmin is " + yearmin);
  // console.log("yearmax is " + yearmax);
  // console.log("page is " + page);
  // console.log("title is " + title);

  const connection = await mysql.createConnection({
    host     : 'mysqldb',
    user     : 'hogehoge',
    password : 'hogehoge',
    database : 'gamedata',
    port     : 3306
  });
  
    // DBからアイテムの取得
  let query = createQuery(req.body)
  console.log(query);
  if (false === query) {
    res.send("NG");
    return
  }

  let record = null;
  try {
    record = await connection.query(query);
  }
  catch (e) {
    console.log(e);
  }

  // アイテム件数の取得
  query = createQueryForGetRecordNum(query)
  let recordNum = null;
  console.log(query);
  try {
    recordNum = await connection.query(query);
    console.log(recordNum[0][0].count);
  }
  catch (e) {
    console.log(e);
  }

  const result = {
    count:recordNum[0][0].count,
    itemList:record[0]
  }
  
  // console.log("result is " + result[0][0].maker);

  connection.destroy()
  res.send(result);
});

// export const handler = serverlessExpress({ app })