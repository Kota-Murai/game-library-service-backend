// require
const mysql = require('mysql2/promise');
const serverlessExpress = require('@vendia/serverless-express')
const express = require('express');
const app = express();
const {createQuery, createQueryForGetRecordNum} = require("./createQueryString.js");
const AWS = require("aws-sdk");


// cert情報
const cert = `
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----
`.trim()


//テーブル名
const famicomTableName = "famicomtitle"
const n64TableName = "n64title"
// テーブル一覧 クエリ生成時に参照する
const dbTableName = [famicomTableName, n64TableName]


// リクエストボディーをjsonオブジェクトに変換.
app.use(express.json());
// // リクエストボディーでクエリパラメータとして送られてきたものをいい感じに変換
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.gametosho.jp'); // クロスサイトオリジン
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');            // 'Content-Type'ヘッダー
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');               // 'GET''POST'メソッドを許可する
  next();
})

// dbから取得する値は以下の通り
// id {number}、softtitle {string}、maker {string}、consoletype {string}、releaseyear {date}、imgurl {string}、series {string}、genre {string}
// 
// リクエスト時に指定される値は以下の通り
// ゲーム機の種類、ソフトタイトル、発売年、シリーズ、ジャンル

// ゲームデータ一覧取得要求
app.post('/getGameData', async (req, res)=>{

  // シークレットマネージャーのインスタンス生成
  const secretsManager = new AWS.SecretsManager({
    region: "ap-northeast-1",
  })

  // シークレットマネージャーからシークレット情報を取得
  const response = await secretsManager.getSecretValue({
    SecretId: "CdkstackStack-rds-credentials",
  }).promise()

  // シークレット情報からホスト名、ユーザー名、パスワードを取得
  const {host, username, password} = JSON.parse(response.SecretString ?? '')

  // 接続を確率
  const connection = await mysql.createConnection({
    host     : process.env.PROXY_ENDPOINT,
    user     : username,
    password,
    database : 'gamedata',
    ssl: {
      cert: cert
    },
  });
  
  // DBから該当条件に会うクエリを生成
  let query = createQuery(req.body)
  console.log(query);
  if (false === query) {
    res.send("NG");
    return
  }

  // 条件に合致したレコードの取得
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
  try {
    recordNum = await connection.query(query);
  }
  catch (e) {
    console.log(e);
  }

  const result = {
    count:recordNum[0][0].count,
    itemList:record[0]
  }

  connection.destroy()
  res.send(result);
});

// serverless-expressのexports
exports.handler = serverlessExpress({ app })