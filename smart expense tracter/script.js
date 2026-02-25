let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editIndex = null;

// Store category colors (stable colors)
let categoryColors = {};

const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalAmount = document.getElementById("totalAmount");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const themeToggle = document.getElementById("themeToggle");
const categorySelect = document.getElementById("category");
const customCategoryInput = document.getElementById("customCategory");
const thisMonthSpan = document.getElementById("thisMonth");

// ================= SAVE =================
function saveToLocal() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// ================= CATEGORY SELECT =================
categorySelect.addEventListener("change", () => {
  customCategoryInput.style.display =
    categorySelect.value === "Custom" ? "block" : "none";
});

// ================= FORM SUBMIT =================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const date = document.getElementById("date").value;

  let category =
    categorySelect.value === "Custom"
      ? customCategoryInput.value.trim()
      : categorySelect.value;

  if (!name || amount <= 0 || !date || !category) {
    alert("Please enter valid details");
    return;
  }

  const expenseData = { name, amount, date, category };

  if (editIndex === null) {
    expenses.push(expenseData);
  } else {
    expenses[editIndex] = expenseData;
    editIndex = null;
  }

  saveToLocal();
  renderExpenses();
  form.reset();
  customCategoryInput.style.display = "none";
});

// ================= RENDER =================
function renderExpenses() {
  expenseList.innerHTML = "";
  let total = 0;
  let thisMonthTotal = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  expenses.forEach((expense, index) => {
    total += expense.amount;

    const expDate = new Date(expense.date);
    if (
      expDate.getMonth() === currentMonth &&
      expDate.getFullYear() === currentYear
    ) {
      thisMonthTotal += expense.amount;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.name}</td>
      <td>₹ ${expense.amount}</td>
      <td>${expense.date}</td>
    <td>
  ${expense.category}
  <input 
    type="color" 
    value="${categoryColors[expense.category] || '#888888'}"
    onchange="changeCategoryColor('${expense.category}', this.value)"
    style="border:none; background:none; cursor:pointer;"
  >
</td>
      <td>
        <button onclick="editExpense(${index})">Edit</button>
        <button onclick="deleteExpense(${index})">Delete</button>
      </td>
    `;
    expenseList.appendChild(row);
  });

  totalAmount.textContent = total;
  thisMonthSpan.textContent = thisMonthTotal;

  updateChart();
}

// ================= DELETE =================
function deleteExpense(index) {
  expenses.splice(index, 1);
  saveToLocal();
  renderExpenses();
}

// ================= EDIT =================
function editExpense(index) {
  const exp = expenses[index];
  document.getElementById("name").value = exp.name;
  document.getElementById("amount").value = exp.amount;
  document.getElementById("date").value = exp.date;

  // Handle category correctly
  if (["Food", "Travel", "Shopping"].includes(exp.category)) {
    categorySelect.value = exp.category;
    customCategoryInput.style.display = "none";
  } else {
    categorySelect.value = "Custom";
    customCategoryInput.style.display = "block";
    customCategoryInput.value = exp.category;
  }

  editIndex = index;
}

// ================= CLEAR =================
clearBtn.addEventListener("click", () => {
  if (confirm("Delete all expenses?")) {
    expenses = [];
    saveToLocal();
    renderExpenses();
  }
});

// ================= EXPORT CSV =================
exportBtn.addEventListener("click", () => {
  let csv = "Name,Amount,Date,Category\n";
  expenses.forEach(exp => {
    csv += `${exp.name},${exp.amount},${exp.date},${exp.category}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
});

// ================= DARK MODE =================
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// ================= CHART =================
const ctx = document.getElementById("expenseChart");

let chart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: []
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  }
});

// Generate stable soft colors
function generateColor() {
  return `hsl(${Math.random() * 360}, 65%, 55%)`;
}
function changeCategoryColor(category, newColor) {
  categoryColors[category] = newColor;
  updateChart();
}

// ================= UPDATE CHART =================
function updateChart() {
  const categoryTotals = {};

  expenses.forEach(exp => {
    if (!categoryTotals[exp.category]) {
      categoryTotals[exp.category] = 0;
    }
    categoryTotals[exp.category] += exp.amount;
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  // Assign stable colors per category
  const colors = labels.map(label => {
    if (!categoryColors[label]) {
      categoryColors[label] = generateColor();
    }
    return categoryColors[label];
  });

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = colors;

  chart.update();
}

// ================= INIT =================
renderExpenses();