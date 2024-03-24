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
  const newInfo = [...Info];
  while (countDay < end) {
    for (const row of newInfo) {
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
            let stockRow = newInfo.find(i => i.type === row["type"] && i.status === "stock");
            if (stockRow) {
              stockRow["status"] = "active";
              stockRow["machineSerial"] = mSerial;
            }
          }
        }
        //maint状態の型をstockに変更し生産可能数をリセット
      } else if (row["status"] === "maint") {
        row["status"] = "stock";
        row["maintenance"] = 4000
        //前日のデータの中に後2回生産するとマイナスになる型があった場合は、型状態とマシンシリアルを変更
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
      //時刻を除外した日付に変換し生産データを挿入
      row["day"] = countDay.toISOString().split('T')[0];
      const updateRow = {...row};
      dailyUpdates.push(updateRow);
    }
    countDay.setDate(countDay.getDate() + 1);
  }
}

//計画作成する関数呼び出し
productPlan(taiyakiInfo, productNum, startDay, endDay);

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

  function updateCellBackground() {
    const table = document.querySelector('.gallery-table'); // テーブルのクラス名
    const rows = table.getElementsByTagName('tr'); // 全ての行を取得

    for (var i = 0; i < rows.length; i++) {
      const cells = rows[i].getElementsByTagName('td'); // 各行のセルを取得
      for (let j = 0; j < cells.length; j++) {
        const cell = cells[j];
        const value = cell.textContent || cell.innerText; // セルの値を取得
        
        // ここでセルの値に基づいて条件分岐
        if (value === 'A' ||value === 'B' ||value === 'C') {
          cell.style.backgroundColor = 'orange';
        } else if (value === 'stock') {
          cell.style.backgroundColor = 'lightblue';
        } else if (value === 'maint') {
          cell.style.backgroundColor = 'red';
        }
        // その他の条件も同様に追加可能
      }
    }
  }
  // 関数を実行してセルの背景色を更新
  updateCellBackground();
}

window.onload = function () {
  let timeLeft = 210;
  let timerElement = document.getElementById('timer');

  function updateTimer() {
      let minutes = Math.floor(timeLeft / 60);
      let seconds = timeLeft % 60;
      seconds = seconds < 10 ? '0' + seconds : seconds; // ゼロパディング
      timerElement.textContent = `${minutes}:${seconds}`;

      if (timeLeft > 0) {
          timeLeft -= 1; // 1秒ごとに減算
      } else {
          clearInterval(timerId); // タイマーが0になったら停止
      }
  }
  
  let timerId = setInterval(updateTimer, 1000);
};

//console.log(dailyUpdates)
