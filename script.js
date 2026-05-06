const STORAGE_KEY = "medical-equipment-list";
const USERS_KEY = "medical-equipment-users";
const SESSION_KEY = "medical-equipment-session";

const defaultEquipment = [
  {
    id: crypto.randomUUID(),
    code: "MED-001",
    name: "เครื่องวัดความดัน",
    department: "ห้องตรวจ",
    status: "พร้อมใช้งาน",
    checkedDate: "2026-05-01",
    owner: "คุณสมชาย"
  },
  {
    id: crypto.randomUUID(),
    code: "MED-002",
    name: "เครื่องช่วยหายใจ",
    department: "ห้องฉุกเฉิน",
    status: "กำลังใช้งาน",
    checkedDate: "2026-04-28",
    owner: "คุณมาลี"
  },
  {
    id: crypto.randomUUID(),
    code: "MED-003",
    name: "เครื่องติดตามสัญญาณชีพ",
    department: "ผู้ป่วยใน",
    status: "รอซ่อม",
    checkedDate: "2026-04-18",
    owner: "คุณอนันต์"
  }
];

const authPage = document.querySelector("#authPage");
const appPage = document.querySelector("#appPage");
const showLoginBtn = document.querySelector("#showLoginBtn");
const showRegisterBtn = document.querySelector("#showRegisterBtn");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const loginMessage = document.querySelector("#loginMessage");
const registerMessage = document.querySelector("#registerMessage");
const logoutBtn = document.querySelector("#logoutBtn");
const currentUserName = document.querySelector("#currentUserName");
const currentUserDepartment = document.querySelector("#currentUserDepartment");

const form = document.querySelector("#equipmentForm");
const tableBody = document.querySelector("#equipmentTable");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const filterStatus = document.querySelector("#filterStatus");
const resultText = document.querySelector("#resultText");
const totalCount = document.querySelector("#totalCount");
const statusSummary = document.querySelector("#statusSummary");
const resetFormBtn = document.querySelector("#resetFormBtn");

const fields = {
  name: document.querySelector("#nameInput"),
  code: document.querySelector("#codeInput"),
  department: document.querySelector("#departmentInput"),
  status: document.querySelector("#statusInput"),
  checkedDate: document.querySelector("#checkedInput"),
  owner: document.querySelector("#ownerInput")
};

let equipment = loadEquipment();
let editingId = null;

setupAuth();
setupEquipmentEvents();
showPageFromSession();
clearForm();
render();

function setupAuth() {
  showLoginBtn.addEventListener("click", () => showAuthForm("login"));
  showRegisterBtn.addEventListener("click", () => showAuthForm("register"));
  logoutBtn.addEventListener("click", logout);

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#registerName").value.trim();
    const department = document.querySelector("#registerDepartment").value;
    const password = document.querySelector("#registerPassword").value;
    const users = loadUsers();
    const exists = users.some((user) => normalizeName(user.name) === normalizeName(name));

    if (exists) {
      showMessage(registerMessage, "ชื่อนี้ลงทะเบียนแล้ว กรุณาใช้ชื่ออื่น");
      return;
    }

    const user = {
      id: crypto.randomUUID(),
      name,
      department,
      password
    };

    users.push(user);
    saveUsers(users);
    registerForm.reset();
    showAuthForm("login");
    showMessage(loginMessage, "สร้างบัญชีสำเร็จ เข้าสู่ระบบได้เลย", true);
    document.querySelector("#loginName").value = name;
  });

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#loginName").value.trim();
    const password = document.querySelector("#loginPassword").value;
    const user = loadUsers().find((current) => {
      return normalizeName(current.name) === normalizeName(name) && current.password === password;
    });

    if (!user) {
      showMessage(loginMessage, "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({
      id: user.id,
      name: user.name,
      department: user.department
    }));
    loginForm.reset();
    showApp(user);
  });
}

function setupEquipmentEvents() {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const item = {
      id: editingId || crypto.randomUUID(),
      code: fields.code.value.trim(),
      name: fields.name.value.trim(),
      department: fields.department.value,
      status: fields.status.value,
      checkedDate: fields.checkedDate.value,
      owner: fields.owner.value.trim()
    };

    if (editingId) {
      equipment = equipment.map((current) => current.id === editingId ? item : current);
    } else {
      equipment.unshift(item);
    }

    saveEquipment();
    clearForm();
    render();
  });

  resetFormBtn.addEventListener("click", clearForm);
  searchInput.addEventListener("input", render);
  filterStatus.addEventListener("change", render);

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
      startEdit(id);
    }

    if (button.dataset.action === "delete") {
      deleteItem(id);
    }
  });
}

function showAuthForm(type) {
  const isLogin = type === "login";

  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  showLoginBtn.classList.toggle("active", isLogin);
  showRegisterBtn.classList.toggle("active", !isLogin);
  clearMessages();
}

function showPageFromSession() {
  const session = getSession();

  if (session) {
    showApp(session);
  } else {
    showAuth();
  }
}

function showAuth() {
  authPage.classList.remove("hidden");
  appPage.classList.add("hidden");
}

function showApp(user) {
  currentUserName.textContent = user.name;
  currentUserDepartment.textContent = user.department;
  authPage.classList.add("hidden");
  appPage.classList.remove("hidden");
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  clearForm();
  showAuthForm("login");
  showAuth();
}

function getSession() {
  const saved = localStorage.getItem(SESSION_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function loadUsers() {
  const saved = localStorage.getItem(USERS_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadEquipment() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return defaultEquipment;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return defaultEquipment;
  }
}

function saveEquipment() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(equipment));
}

function render() {
  const filtered = getFilteredEquipment();

  totalCount.textContent = equipment.length;
  resultText.textContent = `แสดง ${filtered.length} จาก ${equipment.length} รายการ`;
  emptyState.hidden = filtered.length > 0;
  tableBody.innerHTML = filtered.map(createRow).join("");
  renderSummary();
}

function getFilteredEquipment() {
  const keyword = searchInput.value.trim().toLowerCase();
  const status = filterStatus.value;

  return equipment.filter((item) => {
    const matchesStatus = status === "all" || item.status === status;
    const searchable = `${item.code} ${item.name} ${item.department} ${item.owner}`.toLowerCase();
    return matchesStatus && searchable.includes(keyword);
  });
}

function createRow(item) {
  return `
    <tr>
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.department)}</td>
      <td>${formatDate(item.checkedDate)}</td>
      <td>${escapeHtml(item.owner)}</td>
      <td><span class="badge ${getStatusClass(item.status)}">${escapeHtml(item.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn ghost small" type="button" data-action="edit" data-id="${item.id}">แก้ไข</button>
          <button class="btn danger small" type="button" data-action="delete" data-id="${item.id}">ลบ</button>
        </div>
      </td>
    </tr>
  `;
}

function renderSummary() {
  const statuses = ["พร้อมใช้งาน", "กำลังใช้งาน", "รอซ่อม", "ปลดระวาง"];

  statusSummary.innerHTML = statuses.map((status) => {
    const count = equipment.filter((item) => item.status === status).length;
    return `
      <div class="summary-item">
        <span>${status}</span>
        <strong>${count}</strong>
      </div>
    `;
  }).join("");
}

function startEdit(id) {
  const item = equipment.find((current) => current.id === id);

  if (!item) {
    return;
  }

  editingId = id;
  fields.name.value = item.name;
  fields.code.value = item.code;
  fields.department.value = item.department;
  fields.status.value = item.status;
  fields.checkedDate.value = item.checkedDate;
  fields.owner.value = item.owner;
  form.querySelector(".primary").textContent = "อัปเดตข้อมูล";
  fields.name.focus();
}

function deleteItem(id) {
  const item = equipment.find((current) => current.id === id);

  if (!item || !confirm(`ต้องการลบ "${item.name}" ใช่ไหม?`)) {
    return;
  }

  equipment = equipment.filter((current) => current.id !== id);
  saveEquipment();
  render();
}

function clearForm() {
  editingId = null;
  form.reset();
  fields.checkedDate.valueAsDate = new Date();
  form.querySelector(".primary").textContent = "บันทึกข้อมูล";
}

function clearMessages() {
  loginMessage.textContent = "";
  registerMessage.textContent = "";
  loginMessage.classList.remove("success");
  registerMessage.classList.remove("success");
}

function showMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.toggle("success", isSuccess);
}

function normalizeName(value) {
  return value.trim().toLowerCase();
}

function getStatusClass(status) {
  const classMap = {
    "พร้อมใช้งาน": "ready",
    "กำลังใช้งาน": "active",
    "รอซ่อม": "repair",
    "ปลดระวาง": "retired"
  };

  return classMap[status] || "retired";
}

function formatDate(value) {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
