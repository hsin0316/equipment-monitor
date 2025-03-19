// 動態設置 max 為今天
window.onload = function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("date").setAttribute("max", today);
  document.getElementById("startdate").setAttribute("max", today);
  document.getElementById("enddate").setAttribute("max", today);
};

// 檢查dataform的欄位條件並提交
document
  .getElementById("dataform")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // 阻止默認表單提交行為

    const date = document.getElementById("date").value;
    let temperature = document.getElementById("temperature").value;
    let pressure = document.getElementById("pressure").value;
    let current = document.getElementById("current").value;

    // 將 temperature、pressure 和 current 轉換為浮點數
    temperature = temperature ? parseFloat(temperature) : null;
    pressure = pressure ? parseFloat(pressure) : null;
    current = current ? parseFloat(current) : null;

    // 三個欄位為必填
    if (temperature == null || pressure == null || current == null) {
      alert("Temperature, pressure, and current fields are all required.");
      return;
    }

    try {
      // 發送 POST 請求到後端
      const response = await fetch("http://localhost:3000/api/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date, temperature, pressure, current }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("The data has been successfully submitted！");
        console.log("後端回應:", result);
        document.getElementById("dataform").reset();
      } else {
        alert("提交失敗，請稍後再試。");
        console.error("後端錯誤:", result);
      }
    } catch (error) {
      alert("提交失敗，請檢查網路或伺服器狀態！");
      console.error("錯誤:", error);
    }
  });

// **檢查 dataform2 的日期條件並提交**
document
  .getElementById("dataform2")
  .addEventListener("submit", async function (e) {
    e.preventDefault(); // 阻止表單的默認提交行為

    const startDateInput = document.getElementById("startdate")?.value;
    const endDateInput = document.getElementById("enddate")?.value;

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);

    if (startDate >= endDate) {
      alert("The start date must be earlier than the end date!");
      return;
    }

    // 計算日期範圍
    const dateDifference = Math.floor(
      (endDate - startDate) / (1000 * 3600 * 24)
    ); // 轉換為天數

    if (dateDifference >= 14) {
      alert("The query range can be set for a maximum of 14 days!");
      return;
    }

    try {
      // **發送一次 `/api/query` 並繪製圖表**
      await fetchDataAndDrawChart(startDateInput, endDateInput);
    } catch (error) {
      alert("獲取數據失敗，請稍後再試！");
      console.error("錯誤:", error);
    }
  });

// **獲取數據並繪製圖表**
let temperatureChart, pressureChart, currentChart;
let cachedData = null; // 儲存數據，避免 nextbtn 重新請求
let currentStartDate = null;
let currentEndDate = null;

// 當用戶送出新的日期時，才會重新請求數據
async function fetchDataAndDrawChart(startDate, endDate) {
  // 若日期未變更，直接使用快取數據
  if (
    startDate === currentStartDate &&
    endDate === currentEndDate &&
    cachedData
  ) {
    drawChart();
    return;
  }

  try {
    // 更新當前的日期範圍
    currentStartDate = startDate;
    currentEndDate = endDate;

    // 向後端請求數據
    const response = await fetch("http://localhost:3000/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "獲取資料失敗");

    if (!result.data || !Array.isArray(result.data)) {
      throw new Error("API 回傳的資料格式不正確！");
    }

    // 儲存新的數據
    cachedData = result.data;
    console.log("獲取新數據:", cachedData);

    drawChart(); // 繪製圖表
  } catch (error) {
    console.error("獲取數據錯誤:", error);
  }
}

// Chart.js 繪製函數
function createChart(canvasId, labels, data, label, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  let yAxisConfig = {
    temperatureChart: { min: 30, max: 100, stepSize: 10, redLines: [60, 80] },
    pressureChart: { min: 0, max: 2, stepSize: 0.5, redLines: [0.5, 1] },
    currentChart: { min: 0, max: 2, stepSize: 0.5, redLines: [0.5, 1] },
  };

  let config = yAxisConfig[canvasId] || {
    min: 0,
    max: 10,
    stepSize: 1,
    redLines: [],
  };

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: label,
          data: data,
          borderColor: color,
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: { display: true, text: "Date" },
          ticks: {
            autoSkip: false,
            callback: function (value, index) {
              return labels[index];
            },
          },
        },
        y: {
          title: { display: true, text: label },
          min: config.min,
          max: config.max,
          ticks: {
            stepSize: config.stepSize,
            color: function (value) {
              return config.redLines.includes(value) ? "red" : "black";
            },
          },
          grid: {
            color: function (context) {
              return config.redLines.includes(context.tick.value)
                ? "red"
                : "rgba(0,0,0,0.1)";
            },
          },
        },
      },
    },
  });
}

// 只負責繪製圖表，確保 nextbtn 只會執行這個函式
function drawChart() {
  if (!cachedData) return;

  const labels = cachedData.map((item) => item.created_date);
  const temperatures = cachedData.map((item) => item.temperature);
  const pressures = cachedData.map((item) => item.pressure);
  const currents = cachedData.map((item) => item.electric_current);

  // 更新表格
  updateTable(cachedData);

  // 延遲顯示按鈕與表格
  setTimeout(() => {
    document.querySelector(".next-btn").style.display = "block";
    document.querySelector(".navigator").style.display = "flex";
    document.querySelector(".tablecontainer").style.display = "block";
  }, 100);

  // 清除舊的圖表
  if (temperatureChart) temperatureChart.destroy();
  if (pressureChart) pressureChart.destroy();
  if (currentChart) currentChart.destroy();

  // 創建新的折線圖
  temperatureChart = createChart(
    "temperatureChart",
    labels,
    temperatures,
    "Temperature (°C)",
    "blue"
  );
  pressureChart = createChart(
    "pressureChart",
    labels,
    pressures,
    "Pressure (atm)",
    "green"
  );
  currentChart = createChart(
    "currentChart",
    labels,
    currents,
    "Current (nA)",
    "purple"
  );
}

// 按下 nextbtn 時，不重新請求數據，只重新繪製圖表
document.querySelector(".next-btn").addEventListener("click", drawChart);

// 輪播功能
document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slide");
  const indicators = document.querySelectorAll(".indicator");
  const nextBtn = document.querySelector(".next-btn");
  let currentIndex = 0;

  function showSlide(index) {
    // 確保 index 在範圍內
    if (index < 0) {
      index = slides.length - 1;
    } else if (index >= slides.length) {
      index = 0;
    }

    currentIndex = index;

    // 瞬間切換，不要動畫
    const slideTrack = document.querySelector(".slide-track");
    slideTrack.style.transform = `translateX(-${index * 100}%)`;

    // 更新指示器
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle("active", i === currentIndex);
    });
  }

  // 按下 Next 按鈕
  nextBtn.addEventListener("click", function () {
    showSlide(currentIndex + 1);
  });

  // 點擊指示器切換
  indicators.forEach((indicator, i) => {
    indicator.addEventListener("click", function () {
      showSlide(i);
    });
  });

  // 初始化顯示第一張
  showSlide(0);
});

// 更新表格數據
function updateTable(data) {
  const tableBody = document.getElementById("datatable");
  const tableContainer = document.querySelector(".tablecontainer");

  tableContainer.style.display = "block";
  tableBody.innerHTML = "";

  data.forEach((item) => {
    const row = document.createElement("tr");

    const temperatureCell = document.createElement("td");
    temperatureCell.textContent = item.temperature;
    if (item.temperature < 60 || item.temperature > 80) {
      temperatureCell.style.color = "red";
    }

    const pressureCell = document.createElement("td");
    pressureCell.textContent = item.pressure;
    if (item.pressure < 0.5 || item.pressure > 1) {
      pressureCell.style.color = "red";
    }

    const currentCell = document.createElement("td");
    currentCell.textContent = item.electric_current;
    if (item.electric_current < 0.5 || item.electric_current > 1) {
      currentCell.style.color = "red";
    }

    const dateCell = document.createElement("td");
    dateCell.textContent = item.created_date;

    row.appendChild(dateCell);
    row.appendChild(temperatureCell);
    row.appendChild(pressureCell);
    row.appendChild(currentCell);

    tableBody.appendChild(row);
  });
}

// 下載 Excel 文件功能
document.getElementById("downloadBtn").addEventListener("click", function () {
  const table = document.getElementById("datatable");
  const rows = table.querySelectorAll("tr");

  let data = [];
  let headers = ["Date", "Temperature(°C)", "Pressure(atm)", "Current(nA)"];
  data.push(headers);

  rows.forEach((row) => {
    const cells = row.querySelectorAll("td");
    let rowData = [];

    if (cells.length === 0) return;

    cells.forEach((cell, cellIndex) => {
      let value = cell.innerText.trim();
      if (cellIndex === 0) {
        let dateParts = value.split("/");
        if (dateParts.length === 2) {
          let formattedDate = new Date(
            2025,
            parseInt(dateParts[0]) - 1,
            parseInt(dateParts[1])
          );
          rowData.push(formattedDate);
        } else {
          rowData.push(value);
        }
      } else {
        rowData.push(value);
      }
    });

    data.push(rowData);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = [
    { wch: 12, numFmt: "yyyy/mm/dd" },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "data.xlsx");
});
