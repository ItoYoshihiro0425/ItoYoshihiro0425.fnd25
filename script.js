'use strict'
// 1行目に記載している 'use strict' は削除しないでください

//タイヤキ製造と型メンテナンス計画作成プログラム

//タイヤキ製造する型の情報
const taiyakiInfo = [
  {type:"bream",serial:1,machineSerial:"A",status:"active",maintenance:4000}, //タイ
  {type:"bream",serial:2,machineSerial:"",status:"stock",maintenance:4000},
  {type:"whale",serial:1,machineSerial:"B",status:"active",maintenance:4000}, //クジラ
  {type:"whale",serial:2,machineSerial:"",status:"stock",maintenance:4000},
  {type:"tuna",serial:1,machineSerial:"C",status:"active",maintenance:4000}, //マグロ
  {type:"tuna",serial:2,machineSerial:"",status:"stock",maintenance:4000}
];

//日々の生産数
const productNum = {
  bream:600,
  whale:400,
  tuna:500
};

//開始日
const startDay = new Date();

//終了日
const endDay = new Date();
endDay.setDate(endDay.getDate() + 30);

//結果を入れる箱
const dailyUpdates = [];

//1ヶ月分の生産計画を作成
function productPlan(Info, pNum, start, end) {
  let countDay = new Date(start);
  while (countDay < end) {
    for (const row of Info) {
      if (row["status"] == "active") {
        //maintで型替した際に別の型をactiveにするのでショット数減算を防ぐ
        let newDay = new Date(countDay);
        newDay = newDay.toISOString().split('T')[0];
        let maintRow = dailyUpdates.find(i => 
          i.type === row["type"] && 
          i.status === "maint" && 
          i.day === newDay
        );
        //減算処理
        if (!maintRow) {
          row["maintenance"] -= pNum[row["type"]];
        }
        //次生産すると残り生産可能数がマイナスになる場合
        if (row["maintenance"] - pNum[row["type"]] < 0) {
          let activeRow = row;
          if (activeRow) {
            activeRow["status"] = "maint";
            let mSerial = activeRow["machineSerial"];
            activeRow["machineSerial"] = "";
            let stockRow = Info.filter(i => i.type === row["type"] && i.status === "stock");
            if (stockRow) {
              stockRow["status"] = "active";
              stockRow["machineSerial"] = mSerial;
            }
          }
        }
      } else if (row["status"] === "maint") {
        row["status"] = "stock";
        row["maintenance"] = 4000
      } else {
        let oldDay = new Date(countDay);
        oldDay.setDate(oldDay.getDate() - 1);
        oldDay = oldDay.toISOString().split('T')[0];
        let oldRow = dailyUpdates.find(i => i.type === row["type"] && i.maintenance < (pNum[row["type"]] * 2) && i.day === oldDay);
        if (oldRow) {
          row["machineSerial"] = oldRow["machineSerial"];
          row["status"] = "active";
        }
      }
      row["day"] = countDay.toISOString().split('T')[0];
      const updateRow = {...row};
      dailyUpdates.push(updateRow);
    }
    countDay.setDate(countDay.getDate() + 1);
  }
}

//計画作成する関数呼び出し
productPlan(taiyakiInfo, productNum, startDay, endDay);

//console.log(dailyUpdates)

//ボタンクリックで計画を表示
const create = document.getElementById("createPlan")
create.addEventListener("click", createPlan)

//縦持ちの計画をtype・serialでグループ化し横持ちにして表示
function createPlan() {
  const galleryContainer = document.getElementById('gallery-container');
  // 日付配列作成
  const days = [];
  for (let i = 0; i < 30; i++) {
    const start = new Date(startDay);
    start.setDate(start.getDate() + i);
    days.push(start.toISOString().split('T')[0]);
  }
  // typeとserialの組み合わせでグループ化
  const groupedItems = dailyUpdates.reduce((acc, obj) => {
    const key = `${obj.type}-${obj.serial}`;
    if (!acc[key]) {
      acc[key] = { type: obj.type, serial: obj.serial, days: {} };
    }
    acc[key].days[obj.day] = obj;
    return acc;
  }, {});

  // テーブルを生成
  const table = document.createElement('table');
  table.className = 'gallery-table';

  // ヘッダー行を追加
  const thead = table.createTHead();
  const headerRow = thead.insertRow();
  headerRow.insertCell().textContent = 'type';
  headerRow.insertCell().textContent = 'Serial';
  days.forEach(day => {
    const dayHeader = document.createElement('th');
    dayHeader.colSpan = "1";
    dayHeader.textContent = day;
    headerRow.appendChild(dayHeader);
  });

  // テーブルボディを生成
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);

  // グループ化したアイテムごとに行を追加
  Object.values(groupedItems).forEach(group => {
    const row = tbody.insertRow();
    
    // typeのセルを追加
    const typeCell = row.insertCell();
    typeCell.textContent = group.type;
    typeCell.rowSpan = "2";
    
    // serialのセルを追加
    const serialCell = row.insertCell();
    serialCell.textContent = group.serial;
    serialCell.rowSpan = "2";
    
    // 各日付のデータを追加（machineSerial情報）
    days.forEach(day => {
      const dayCell = row.insertCell();
      const dayData = group.days[day];
      if (dayData) {
        dayCell.textContent = dayData.machineSerial || dayData.status;
      }
    });
  
    // 新しい行を追加してmaintenance情報を埋める
    const maintenanceRow = tbody.insertRow();
    days.forEach(day => {
      const dayCell = maintenanceRow.insertCell();
      const dayData = group.days[day];
      if (dayData) {
        dayCell.textContent = dayData.maintenance;
      }
    });
  });

  // コンテナにテーブルを追加
  galleryContainer.appendChild(table);
}

//console.log(dailyUpdates)
