ゲームを検索出来るサービス(バックエンド)

■ファイルについて<br>
　●index.js<br>
　　AWS Lambdaで動作させるプログラム<br>
　　@vendia/serverless-expressを使用してexpressでコーディングした内容を<br>
　　Lambdaへそのままデプロイするようにしている。<br>
　　AWS CDKにより、コンソール画面を触らなくてもデプロイすることが可能。<br>
　●index_local.js<br>
　　ローカル用の実行ファイル。<br>
　　<br>
　●createQueryString.js<br>
　　クエリ操作の文字列を生成する処理をモジュール化したファイル。<br>
　　ローカル用、本番環境用ともに共通の処理のため、<br>
　　index.js、index_local.jsともにこのファイルの処理をrequireしている。<br>
<br><br>
■処理について<br>
　クライアントからのリクエストで渡された指定条件を解釈し、<br>
　DBからゲームの情報を1ページ分(9ゲーム分)取得しクライアントに返す。<br>
