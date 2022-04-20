// Query文字列生成処理

// ゲーム情報取得クエリ生成処理
exports.createQuery = (body)=> {
    const {famicom, n64, yearmin, yearmax, page, title} = body

    let multiTableFlag = false;
    let query = "";

    if (true === famicom){
        query = createQueryMain(famicomTableName, parseInt(yearmin), parseInt(yearmax), title)
        multiTableFlag = true;
    }
    if (true === n64) {
        if (true === multiTableFlag) {
        query += " UNION ALL "
        }
        query += createQueryMain(n64TableName, parseInt(yearmin), parseInt(yearmax), title)
        multiTableFlag = true;
    }

    // ここまで来てmultiTableFlagがfalseの場合
    // 全てのテーブルに対して検索するクエリを生成する。
    if (false == multiTableFlag) {
        query = createQueryMain("all", parseInt(yearmin), parseInt(yearmax), title)
    }

    // 最後にそのページで取得したい情報のみを指定する。
    // 1ページ当たり9つ表示。OFFSETで開始位置を指定。

    if (true == isNaN(parseInt(page))) {
        return false;
    }

    query += ` LIMIT 9 OFFSET ${parseInt(page -1) * 9}`

    return query;
}

function createQueryMain(tablename, yearmin, yearmax, title) {
    let query = ""

    // ゲーム機に指定がない場合
    if ("all" === tablename) {
        for (let i=0; i < dbTableName.length; i ++) {
        query += createQuerySub(dbTableName[i], yearmin, yearmax, title)
        if (i >= dbTableName.length -1) { // 最後の要素の場合
            return query;
        }
        else {
            query += " UNION ALL "
        }
        }
        return query;
    }
    else {
        return createQuerySub(tablename, yearmin, yearmax, title)
    }
}

// 検索クエリ文字列生成関数
function createQuerySub(tablename, yearmin, yearmax, title) {
    let query = "";

    // テーブル指定
    query += `(SELECT * FROM ${tablename} `
    // タイトル指定
    query += `WHERE (softtitle LIKE "%${title}%") AND `
    // 発売年指定
    yearmin = ((-1 === parseInt(yearmin)) ? 1980 : yearmin)
    yearmax = ((-1 === parseInt(yearmax)) ? 2022 : yearmax)

    query += `(releaseyear BETWEEN "${yearmin}-01-01" AND "${yearmax}-01-01")) `

    return query;
}


// 検索該当件数取得関数
exports.createQueryForGetRecordNum = (query)=> {
    query = query.substring(0, query.indexOf("LIMIT"))
    query = `SELECT COUNT(*) as count FROM (`.concat(query)
    query = query.concat(`) as UNI`)
    return query;
}