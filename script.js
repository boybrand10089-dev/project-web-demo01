const SESSION_KEY = "medical-equipment-session";

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

let equipment = [];
let stockItems = [];
let managedUsers = [];
let editingId = null;
let editingStockId = null;
let editingUserId = null;

initializeApp();

async function initializeApp() {
  setupAuth();
  setupContactMemo();
  setupPageNavigation();
  setupEquipmentEvents();
  setupStockEvents();
  setupUserEvents();
  clearForm();
  clearStockForm();
  clearUserForm();
  await loadAppData();
  showPageFromSession();
}

async function loadAppData() {
  try {
    const [equipmentData, stockData] = await Promise.all([
      apiRequest("/api/equipment"),
      apiRequest("/api/stock-items")
    ]);

    equipment = equipmentData;
    stockItems = stockData;

    if (isCurrentUserAdmin()) {
      managedUsers = await apiRequest("/api/users");
    } else {
      managedUsers = [];
    }
  } catch (error) {
    alert(`ไม่สามารถเชื่อมต่อ API ได้: ${error.message}`);
  }

  render();
  renderStock();
  renderUsers();
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "x-user-role": getSession()?.role || "",
      ...options.headers
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

function setupAuth() {
  showLoginBtn.addEventListener("click", () => showAuthForm("login"));
  showRegisterBtn.addEventListener("click", () => showAuthForm("register"));
  logoutBtn.addEventListener("click", logout);

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const user = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify({
          name: document.querySelector("#registerName").value.trim(),
          department: document.querySelector("#registerDepartment").value,
          role: document.querySelector("#registerRole").value,
          password: document.querySelector("#registerPassword").value
        })
      });

      registerForm.reset();
      showAuthForm("login");
      showMessage(loginMessage, "สร้างบัญชีสำเร็จ เข้าสู่ระบบได้เลย", true);
      document.querySelector("#loginName").value = user.name;
    } catch (error) {
      showMessage(registerMessage, "ไม่สามารถสร้างบัญชีได้ หรือชื่อนี้มีอยู่แล้ว");
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const user = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify({
          name: document.querySelector("#loginName").value.trim(),
          password: document.querySelector("#loginPassword").value
        })
      });

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      loginForm.reset();
      await loadAppData();
      showApp(user);
    } catch (error) {
      showMessage(loginMessage, "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
    }
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
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const item = {
      code: fields.code.value.trim(),
      name: fields.name.value.trim(),
      department: fields.department.value,
      status: fields.status.value,
      checkedDate: fields.checkedDate.value,
      owner: fields.owner.value.trim()
    };

    try {
      if (editingId) {
        const updated = await apiRequest(`/api/equipment/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(item)
        });
        equipment = equipment.map((current) => current.id === editingId ? updated : current);
      } else {
        const created = await apiRequest("/api/equipment", {
          method: "POST",
          body: JSON.stringify(item)
        });
        equipment.unshift(created);
      }

      clearForm();
      render();
    } catch (error) {
      alert(`ไม่สามารถบันทึกข้อมูลอุปกรณ์ได้: ${error.message}`);
    }
  });

  resetFormBtn.addEventListener("click", clearForm);
  searchInput.addEventListener("input", render);
  filterStatus.addEventListener("change", render);

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = Number(button.dataset.id);

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
    tab.addEventListener("click", async () => {
      const targetId = tab.dataset.pageTarget;

      if (targetId === "userPage" && !isCurrentUserAdmin()) {
        showAppPage("equipmentPage");
        return;
      }

      if (targetId === "userPage") {
        await refreshUsers();
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
  stockForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const item = {
      code: stockFields.code.value.trim(),
      name: stockFields.name.value.trim(),
      category: stockFields.category.value,
      quantity: Number(stockFields.quantity.value),
      minimum: Number(stockFields.minimum.value),
      unit: stockFields.unit.value.trim(),
      location: stockFields.location.value.trim(),
      updatedDate: stockFields.updatedDate.value
    };

    try {
      if (editingStockId) {
        const updated = await apiRequest(`/api/stock-items/${editingStockId}`, {
          method: "PUT",
          body: JSON.stringify(item)
        });
        stockItems = stockItems.map((current) => current.id === editingStockId ? updated : current);
      } else {
        const created = await apiRequest("/api/stock-items", {
          method: "POST",
          body: JSON.stringify(item)
        });
        stockItems.unshift(created);
      }

      clearStockForm();
      renderStock();
    } catch (error) {
      alert(`ไม่สามารถบันทึกสินค้าได้: ${error.message}`);
    }
  });

  resetStockFormBtn.addEventListener("click", clearStockForm);
  stockSearchInput.addEventListener("input", renderStock);
  stockFilterStatus.addEventListener("change", renderStock);

  stockTable.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = Number(button.dataset.id);
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
  userForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = userFields.password.value;
    const user = {
      name: userFields.name.value.trim(),
      department: userFields.department.value,
      role: userFields.role.value,
      password
    };

    if (!editingUserId && password.length < 4) {
      alert("กรุณากรอกรหัสผ่านอย่างน้อย 4 ตัวอักษรสำหรับผู้ใช้ใหม่");
      return;
    }

    try {
      if (editingUserId) {
        const updated = await apiRequest(`/api/users/${editingUserId}`, {
          method: "PUT",
          body: JSON.stringify(user)
        });
        managedUsers = managedUsers.map((current) => current.id === editingUserId ? updated : current);
        syncCurrentSessionUser(updated);
      } else {
        const created = await apiRequest("/api/users", {
          method: "POST",
          body: JSON.stringify(user)
        });
        managedUsers.unshift(created);
      }

      clearUserForm();
      renderUsers();
    } catch (error) {
      alert(`ไม่สามารถบันทึกผู้ใช้ได้: ${error.message}`);
    }
  });

  resetUserFormBtn.addEventListener("click", clearUserForm);
  userSearchInput.addEventListener("input", renderUsers);

  userTable.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
      return;
    }

    const id = Number(button.dataset.id);

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
  sessionStorage.removeItem(SESSION_KEY);
  managedUsers = [];
  clearForm();
  showAuthForm("login");
  showAuth();
}

function getSession() {
  const saved = sessionStorage.getItem(SESSION_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function isCurrentUserAdmin() {
  return getSession()?.role === "admin";
}

async function refreshUsers() {
  if (!isCurrentUserAdmin()) {
    managedUsers = [];
    renderUsers();
    return;
  }

  try {
    managedUsers = await apiRequest("/api/users");
    renderUsers();
  } catch (error) {
    alert(`ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${error.message}`);
  }
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
  fields.checkedDate.value = dateOnly(item.checkedDate);
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
  stockFields.updatedDate.value = dateOnly(item.updatedDate);
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

async function deleteItem(id) {
  if (!isCurrentUserAdmin()) {
    alert("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลได้");
    return;
  }

  const item = equipment.find((current) => current.id === id);

  if (!item || !confirm(`ต้องการลบ "${item.name}" ใช่ไหม?`)) {
    return;
  }

  try {
    await apiRequest(`/api/equipment/${id}`, { method: "DELETE" });
    equipment = equipment.filter((current) => current.id !== id);
    render();
  } catch (error) {
    alert(`ไม่สามารถลบข้อมูลได้: ${error.message}`);
  }
}

async function deleteStockItem(id) {
  if (!isCurrentUserAdmin()) {
    alert("เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบข้อมูลได้");
    return;
  }

  const item = stockItems.find((current) => current.id === id);

  if (!item || !confirm(`ต้องการลบ "${item.name}" ออกจากคลังใช่ไหม?`)) {
    return;
  }

  try {
    await apiRequest(`/api/stock-items/${id}`, { method: "DELETE" });
    stockItems = stockItems.filter((current) => current.id !== id);
    renderStock();
  } catch (error) {
    alert(`ไม่สามารถลบสินค้าได้: ${error.message}`);
  }
}

async function deleteUser(id) {
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

  try {
    await apiRequest(`/api/users/${id}`, { method: "DELETE" });
    managedUsers = managedUsers.filter((current) => current.id !== id);
    clearUserForm();
    renderUsers();
  } catch (error) {
    alert(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`);
  }
}

async function adjustStock(id, direction) {
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

  try {
    const updated = await apiRequest(`/api/stock-items/${id}/adjust`, {
      method: "PATCH",
      body: JSON.stringify({ amount: amount * direction })
    });
    stockItems = stockItems.map((current) => current.id === id ? updated : current);
    renderStock();
  } catch (error) {
    alert(`ไม่สามารถปรับจำนวนสินค้าได้: ${error.message}`);
  }
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

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
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

function dateOnly(value) {
  return String(value || "").slice(0, 10);
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
