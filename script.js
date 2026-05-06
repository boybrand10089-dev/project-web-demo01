const STORAGE_KEY = "medical-equipment-list";
const USERS_KEY = "medical-equipment-users";
const SESSION_KEY = "medical-equipment-session";
const STOCK_KEY = "medical-equipment-stock";

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

const defaultStockItems = [
  {
    id: crypto.randomUUID(),
    code: "SUP-001",
    name: "ถุงมือแพทย์",
    category: "วัสดุสิ้นเปลือง",
    quantity: 120,
    minimum: 50,
    unit: "กล่อง",
    location: "ชั้น A-01",
    updatedDate: "2026-05-04"
  },
  {
    id: crypto.randomUUID(),
    code: "SUP-002",
    name: "หน้ากากอนามัย",
    category: "วัสดุสิ้นเปลือง",
    quantity: 35,
    minimum: 80,
    unit: "กล่อง",
    location: "ชั้น A-02",
    updatedDate: "2026-05-03"
  },
  {
    id: crypto.randomUUID(),
    code: "SPP-001",
    name: "สายออกซิเจน",
    category: "อะไหล่อุปกรณ์",
    quantity: 0,
    minimum: 15,
    unit: "เส้น",
    location: "ตู้ B-04",
    updatedDate: "2026-04-30"
  }
];

const authPage = document.querySelector("#authPage");
const appPage = document.querySelector("#appPage");
const pageTabs = document.querySelectorAll(".page-tab");
const appViews = document.querySelectorAll(".app-view");
const adminOnlyElements = document.querySelectorAll(".admin-only");
const showLoginBtn = document.querySelector("#showLoginBtn");
const showRegisterBtn = document.querySelector("#showRegisterBtn");
const contactAdminBtn = document.querySelector("#contactAdminBtn");
const contactMemo = document.querySelector("#contactMemo");
const closeContactMemoBtn = document.querySelector("#closeContactMemoBtn");
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
const stockForm = document.querySelector("#stockForm");
const stockTable = document.querySelector("#stockTable");
const stockEmptyState = document.querySelector("#stockEmptyState");
const stockSearchInput = document.querySelector("#stockSearchInput");
const stockFilterStatus = document.querySelector("#stockFilterStatus");
const stockResultText = document.querySelector("#stockResultText");
const stockSummary = document.querySelector("#stockSummary");
const resetStockFormBtn = document.querySelector("#resetStockFormBtn");
const userForm = document.querySelector("#userForm");
const userTable = document.querySelector("#userTable");
const userEmptyState = document.querySelector("#userEmptyState");
const userSearchInput = document.querySelector("#userSearchInput");
const userResultText = document.querySelector("#userResultText");
const userSummary = document.querySelector("#userSummary");
const resetUserFormBtn = document.querySelector("#resetUserFormBtn");

const fields = {
  name: document.querySelector("#nameInput"),
  code: document.querySelector("#codeInput"),
  department: document.querySelector("#departmentInput"),
  status: document.querySelector("#statusInput"),
  checkedDate: document.querySelector("#checkedInput"),
  owner: document.querySelector("#ownerInput")
};

const stockFields = {
  name: document.querySelector("#stockNameInput"),
  code: document.querySelector("#stockCodeInput"),
  category: document.querySelector("#stockCategoryInput"),
  quantity: document.querySelector("#stockQuantityInput"),
  minimum: document.querySelector("#stockMinimumInput"),
  unit: document.querySelector("#stockUnitInput"),
  location: document.querySelector("#stockLocationInput"),
  updatedDate: document.querySelector("#stockUpdatedInput")
};

const userFields = {
  name: document.querySelector("#managedUserNameInput"),
  department: document.querySelector("#managedUserDepartmentInput"),
  role: document.querySelector("#managedUserRoleInput"),
  password: document.querySelector("#managedUserPasswordInput")
};

let equipment = loadEquipment();
let stockItems = loadStockItems();
let managedUsers = loadUsers();
let editingId = null;
let editingStockId = null;
let editingUserId = null;

setupAuth();
setupContactMemo();
setupPageNavigation();
setupEquipmentEvents();
setupStockEvents();
setupUserEvents();
showPageFromSession();
clearForm();
clearStockForm();
clearUserForm();
render();
renderStock();
renderUsers();

function setupAuth() {
  showLoginBtn.addEventListener("click", () => showAuthForm("login"));
  showRegisterBtn.addEventListener("click", () => showAuthForm("register"));
  logoutBtn.addEventListener("click", logout);

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#registerName").value.trim();
    const department = document.querySelector("#registerDepartment").value;
    const role = document.querySelector("#registerRole").value;
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
      role,
      password
    };

    users.push(user);
    saveUsers(users);
    managedUsers = users;
    renderUsers();
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
      department: user.department,
      role: getUserRole(user)
    }));
    loginForm.reset();
    showApp(user);
  });
}

function setupContactMemo() {
  contactAdminBtn.addEventListener("click", () => {
    contactMemo.classList.toggle("hidden");
  });

  closeContactMemoBtn.addEventListener("click", () => {
    contactMemo.classList.add("hidden");
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

function setupPageNavigation() {
  pageTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.pageTarget;

      if (targetId === "userPage" && !isCurrentUserAdmin()) {
        showAppPage("equipmentPage");
        return;
      }

      showAppPage(targetId);
    });
  });
}

function showAppPage(targetId) {
  const safeTargetId = targetId === "userPage" && !isCurrentUserAdmin() ? "equipmentPage" : targetId;

  pageTabs.forEach((current) => {
    current.classList.toggle("active", current.dataset.pageTarget === safeTargetId);
  });
  appViews.forEach((view) => view.classList.toggle("hidden", view.id !== safeTargetId));
}

function updateAdminAccess() {
  const isAdmin = isCurrentUserAdmin();

  adminOnlyElements.forEach((element) => {
    element.classList.toggle("hidden", !isAdmin);
  });

  if (!isAdmin && !document.querySelector("#userPage").classList.contains("hidden")) {
    showAppPage("equipmentPage");
  }
}

function setupStockEvents() {
  stockForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const item = {
      id: editingStockId || crypto.randomUUID(),
      code: stockFields.code.value.trim(),
      name: stockFields.name.value.trim(),
      category: stockFields.category.value,
      quantity: Number(stockFields.quantity.value),
      minimum: Number(stockFields.minimum.value),
      unit: stockFields.unit.value.trim(),
      location: stockFields.location.value.trim(),
      updatedDate: stockFields.updatedDate.value
    };

    if (editingStockId) {
      stockItems = stockItems.map((current) => current.id === editingStockId ? item : current);
    } else {
      stockItems.unshift(item);
    }

    saveStockItems();
    clearStockForm();
    renderStock();
  });

  resetStockFormBtn.addEventListener("click", clearStockForm);
  stockSearchInput.addEventListener("input", renderStock);
  stockFilterStatus.addEventListener("change", renderStock);

  stockTable.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "stock-edit") {
      startStockEdit(id);
    }

    if (action === "stock-delete") {
      deleteStockItem(id);
    }

    if (action === "stock-in") {
      adjustStock(id, 1);
    }

    if (action === "stock-out") {
      adjustStock(id, -1);
    }
  });
}

function setupUserEvents() {
  userForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = userFields.name.value.trim();
    const department = userFields.department.value;
    const role = userFields.role.value;
    const password = userFields.password.value;
    const existingUser = managedUsers.find((user) => user.id === editingUserId);
    const duplicate = managedUsers.some((user) => {
      return user.id !== editingUserId && normalizeName(user.name) === normalizeName(name);
    });

    if (duplicate) {
      alert("ชื่อนี้มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น");
      return;
    }

    if (!editingUserId && password.length < 4) {
      alert("กรุณากรอกรหัสผ่านอย่างน้อย 4 ตัวอักษรสำหรับผู้ใช้ใหม่");
      return;
    }

    if (editingUserId && !existingUser) {
      clearUserForm();
      return;
    }

    const user = {
      id: editingUserId || crypto.randomUUID(),
      name,
      department,
      role,
      password: password || existingUser?.password || ""
    };

    if (editingUserId) {
      managedUsers = managedUsers.map((current) => current.id === editingUserId ? user : current);
    } else {
      managedUsers.unshift(user);
    }

    saveUsers(managedUsers);
    syncCurrentSessionUser(user);
    clearUserForm();
    renderUsers();
  });

  resetUserFormBtn.addEventListener("click", clearUserForm);
  userSearchInput.addEventListener("input", renderUsers);

  userTable.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = button.dataset.id;

    if (button.dataset.action === "user-edit") {
      startUserEdit(id);
    }

    if (button.dataset.action === "user-delete") {
      deleteUser(id);
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
  showAppPage("equipmentPage");
  updateAdminAccess();
}

function showApp(user) {
  currentUserName.textContent = user.name;
  currentUserDepartment.textContent = user.department;
  authPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  updateAdminAccess();
  showAppPage("equipmentPage");
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

function isCurrentUserAdmin() {
  const session = getSession();

  if (!session) {
    return false;
  }

  if (session.role) {
    return session.role === "admin";
  }

  const user = loadUsers().find((current) => current.id === session.id);
  return getUserRole(user || {}) === "admin";
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

function loadStockItems() {
  const saved = localStorage.getItem(STOCK_KEY);

  if (!saved) {
    return defaultStockItems;
  }

  try {
    return JSON.parse(saved);
  } catch {
    return defaultStockItems;
  }
}

function saveStockItems() {
  localStorage.setItem(STOCK_KEY, JSON.stringify(stockItems));
}

function render() {
  const filtered = getFilteredEquipment();

  totalCount.textContent = equipment.length;
  resultText.textContent = `แสดง ${filtered.length} จาก ${equipment.length} รายการ`;
  emptyState.hidden = filtered.length > 0;
  tableBody.innerHTML = filtered.map(createRow).join("");
  renderSummary();
}

function renderStock() {
  const filtered = getFilteredStockItems();

  stockResultText.textContent = `แสดง ${filtered.length} จาก ${stockItems.length} รายการ`;
  stockEmptyState.hidden = filtered.length > 0;
  stockTable.innerHTML = filtered.map(createStockRow).join("");
  renderStockSummary();
}

function renderUsers() {
  const filtered = getFilteredUsers();

  userResultText.textContent = `แสดง ${filtered.length} จาก ${managedUsers.length} รายการ`;
  userEmptyState.hidden = filtered.length > 0;
  userTable.innerHTML = filtered.map(createUserRow).join("");
  renderUserSummary();
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

function getFilteredStockItems() {
  const keyword = stockSearchInput.value.trim().toLowerCase();
  const status = stockFilterStatus.value;

  return stockItems.filter((item) => {
    const stockStatus = getStockStatus(item);
    const matchesStatus = status === "all" || stockStatus === status;
    const searchable = `${item.code} ${item.name} ${item.category} ${item.location}`.toLowerCase();
    return matchesStatus && searchable.includes(keyword);
  });
}

function getFilteredUsers() {
  const keyword = userSearchInput.value.trim().toLowerCase();

  return managedUsers.filter((user) => {
    const searchable = `${user.name} ${user.department} ${getUserRole(user)}`.toLowerCase();
    return searchable.includes(keyword);
  });
}

function createRow(item) {
  const deleteButton = isCurrentUserAdmin()
    ? `<button class="btn danger small" type="button" data-action="delete" data-id="${item.id}">ลบ</button>`
    : "";

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
          ${deleteButton}
        </div>
      </td>
    </tr>
  `;
}

function createStockRow(item) {
  const stockStatus = getStockStatus(item);
  const statusText = getStockStatusText(stockStatus);
  const deleteButton = isCurrentUserAdmin()
    ? `<button class="btn danger small" type="button" data-action="stock-delete" data-id="${item.id}">ลบ</button>`
    : "";

  return `
    <tr>
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td><strong>${item.quantity}</strong> ${escapeHtml(item.unit)}</td>
      <td>${item.minimum} ${escapeHtml(item.unit)}</td>
      <td>${escapeHtml(item.location)}</td>
      <td>${formatDate(item.updatedDate)}</td>
      <td><span class="badge stock-${stockStatus}">${statusText}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn ghost small" type="button" data-action="stock-in" data-id="${item.id}">รับเข้า</button>
          <button class="btn ghost small" type="button" data-action="stock-out" data-id="${item.id}">เบิกออก</button>
          <button class="btn ghost small" type="button" data-action="stock-edit" data-id="${item.id}">แก้ไข</button>
          ${deleteButton}
        </div>
      </td>
    </tr>
  `;
}

function createUserRow(user) {
  const session = getSession();
  const isCurrentUser = session?.id === user.id;
  const statusLabel = isCurrentUser ? "กำลังใช้งาน" : "ผู้ใช้ทั่วไป";
  const statusClass = isCurrentUser ? "active" : "retired";

  return `
    <tr>
      <td>${escapeHtml(user.name)}</td>
      <td>${escapeHtml(user.department)}</td>
      <td><span class="badge role-${getUserRole(user)}">${getUserRole(user)}</span></td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="row-actions">
          <button class="btn ghost small" type="button" data-action="user-edit" data-id="${user.id}">แก้ไข</button>
          <button class="btn danger small" type="button" data-action="user-delete" data-id="${user.id}">ลบ</button>
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

function renderStockSummary() {
  const totalQuantity = stockItems.reduce((sum, item) => sum + item.quantity, 0);
  const lowCount = stockItems.filter((item) => getStockStatus(item) === "low").length;
  const emptyCount = stockItems.filter((item) => getStockStatus(item) === "empty").length;
  const okCount = stockItems.filter((item) => getStockStatus(item) === "ok").length;

  stockSummary.innerHTML = `
    <div class="summary-item">
      <span>จำนวนรายการสินค้า</span>
      <strong>${stockItems.length}</strong>
    </div>
    <div class="summary-item ok">
      <span>สต็อกเพียงพอ</span>
      <strong>${okCount}</strong>
    </div>
    <div class="summary-item warning">
      <span>ต่ำกว่าขั้นต่ำ</span>
      <strong>${lowCount}</strong>
    </div>
    <div class="summary-item danger">
      <span>หมดสต็อก / รวมคงเหลือ ${totalQuantity}</span>
      <strong>${emptyCount}</strong>
    </div>
  `;
}

function renderUserSummary() {
  const departments = new Set(managedUsers.map((user) => user.department).filter(Boolean));
  const adminCount = managedUsers.filter((user) => getUserRole(user) === "admin").length;
  const userCount = managedUsers.filter((user) => getUserRole(user) === "user").length;
  const session = getSession();

  userSummary.innerHTML = `
    <div class="summary-item">
      <span>ผู้ใช้ทั้งหมด</span>
      <strong>${managedUsers.length}</strong>
    </div>
    <div class="summary-item">
      <span>จำนวนแผนก</span>
      <strong>${departments.size}</strong>
    </div>
    <div class="summary-item warning">
      <span>admin</span>
      <strong>${adminCount}</strong>
    </div>
    <div class="summary-item">
      <span>user</span>
      <strong>${userCount}</strong>
    </div>
    <div class="summary-item ok">
      <span>ผู้ใช้ปัจจุบัน</span>
      <strong>${session ? 1 : 0}</strong>
    </div>
  `;
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

function startStockEdit(id) {
  const item = stockItems.find((current) => current.id === id);

  if (!item) {
    return;
  }

  editingStockId = id;
  stockFields.name.value = item.name;
  stockFields.code.value = item.code;
  stockFields.category.value = item.category;
  stockFields.quantity.value = item.quantity;
  stockFields.minimum.value = item.minimum;
  stockFields.unit.value = item.unit;
  stockFields.location.value = item.location;
  stockFields.updatedDate.value = item.updatedDate;
  stockForm.querySelector(".primary").textContent = "อัปเดตสินค้า";
  stockFields.name.focus();
}

function startUserEdit(id) {
  const user = managedUsers.find((current) => current.id === id);

  if (!user) {
    return;
  }

  editingUserId = id;
  userFields.name.value = user.name;
  userFields.department.value = user.department;
  userFields.role.value = getUserRole(user);
  userFields.password.value = "";
  userFields.password.placeholder = "เว้นว่างไว้ถ้าไม่เปลี่ยนรหัสผ่าน";
  userForm.querySelector(".primary").textContent = "อัปเดตผู้ใช้";
  userFields.name.focus();
}

function deleteItem(id) {
  if (!isCurrentUserAdmin()) {
    alert("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลได้");
    return;
  }

  const item = equipment.find((current) => current.id === id);

  if (!item || !confirm(`ต้องการลบ "${item.name}" ใช่ไหม?`)) {
    return;
  }

  equipment = equipment.filter((current) => current.id !== id);
  saveEquipment();
  render();
}

function deleteStockItem(id) {
  if (!isCurrentUserAdmin()) {
    alert("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลได้");
    return;
  }

  const item = stockItems.find((current) => current.id === id);

  if (!item || !confirm(`ต้องการลบ "${item.name}" ออกจากคลังใช่ไหม?`)) {
    return;
  }

  stockItems = stockItems.filter((current) => current.id !== id);
  saveStockItems();
  renderStock();
}

function deleteUser(id) {
  const user = managedUsers.find((current) => current.id === id);
  const session = getSession();

  if (!user) {
    return;
  }

  if (session?.id === id) {
    alert("ไม่สามารถลบผู้ใช้ที่กำลังเข้าสู่ระบบอยู่ได้");
    return;
  }

  if (!confirm(`ต้องการลบผู้ใช้ "${user.name}" ใช่ไหม?`)) {
    return;
  }

  managedUsers = managedUsers.filter((current) => current.id !== id);
  saveUsers(managedUsers);
  clearUserForm();
  renderUsers();
}

function adjustStock(id, direction) {
  const item = stockItems.find((current) => current.id === id);

  if (!item) {
    return;
  }

  const actionText = direction > 0 ? "รับเข้า" : "เบิกออก";
  const input = prompt(`กรอกจำนวนที่ต้องการ${actionText}สำหรับ "${item.name}"`, "1");

  if (input === null) {
    return;
  }

  const amount = Number(input);

  if (!Number.isInteger(amount) || amount <= 0) {
    alert("กรุณากรอกจำนวนเป็นตัวเลขจำนวนเต็มที่มากกว่า 0");
    return;
  }

  if (direction < 0 && amount > item.quantity) {
    alert(`จำนวนคงเหลือมีเพียง ${item.quantity} ${item.unit} ไม่สามารถเบิกออก ${amount} ${item.unit} ได้`);
    return;
  }

  stockItems = stockItems.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      quantity: item.quantity + (amount * direction),
      updatedDate: getTodayValue()
    };
  });

  saveStockItems();
  renderStock();
}

function clearForm() {
  editingId = null;
  form.reset();
  fields.checkedDate.valueAsDate = new Date();
  form.querySelector(".primary").textContent = "บันทึกข้อมูล";
}

function clearStockForm() {
  editingStockId = null;
  stockForm.reset();
  stockFields.updatedDate.value = getTodayValue();
  stockForm.querySelector(".primary").textContent = "บันทึกสินค้า";
}

function clearUserForm() {
  editingUserId = null;
  userForm.reset();
  userFields.role.value = "user";
  userFields.password.placeholder = "";
  userForm.querySelector(".primary").textContent = "บันทึกผู้ใช้";
}

function syncCurrentSessionUser(user) {
  const session = getSession();

  if (!session || session.id !== user.id) {
    return;
  }

  const updatedSession = {
    id: user.id,
    name: user.name,
    department: user.department,
    role: getUserRole(user)
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
  currentUserName.textContent = user.name;
  currentUserDepartment.textContent = user.department;
  updateAdminAccess();
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

function getUserRole(user) {
  return user.role === "admin" ? "admin" : "user";
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

function getStockStatus(item) {
  if (item.quantity <= 0) {
    return "empty";
  }

  if (item.quantity < item.minimum) {
    return "low";
  }

  return "ok";
}

function getStockStatusText(status) {
  const textMap = {
    ok: "เพียงพอ",
    low: "ต่ำกว่าขั้นต่ำ",
    empty: "หมดสต็อก"
  };

  return textMap[status] || "ไม่ทราบสถานะ";
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
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
