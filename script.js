// ============ Data & State ============
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let sidebarCollapsed = false;

// ============ Inisialisasi ============
document.addEventListener("DOMContentLoaded", () => {
  const tabLogin = document.getElementById("tab-login");
  const tabReg = document.getElementById("tab-reg");
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("regForm");

  tabLogin.onclick = () => switchTab("login");
  tabReg.onclick = () => switchTab("register");

  document.getElementById("btnLogin").onclick = handleLogin;
  document.getElementById("btnDemo").onclick = demoLogin;
  document.getElementById("btnReg").onclick = handleRegister;
  document.getElementById("btnFillExample").onclick = fillExample;

  // Enter key untuk login/register
  document.getElementById("loginPass").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  document.getElementById("regPass").addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleRegister();
  });

  if (currentUser) renderApp();
});

function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const regForm = document.getElementById("regForm");
  document.getElementById("tab-login").classList.toggle("active", tab === "login");
  document.getElementById("tab-reg").classList.toggle("active", tab === "register");
  loginForm.classList.toggle("hidden", tab !== "login");
  regForm.classList.toggle("hidden", tab !== "register");
}

// ============ Auth ============
function handleLogin() {
  const u = document.getElementById("loginUser").value.trim();
  const p = document.getElementById("loginPass").value.trim();
  const msg = document.getElementById("loginMsg");
  const user = users.find((x) => x.username === u && x.password === p);

  if (user) {
    currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    msg.textContent = "";
    showToast(`Selamat datang, ${user.name}!`, "success");
    renderApp();
  } else {
    msg.textContent = "Username atau password salah!";
    document.getElementById("loginPass").value = "";
  }
}

function handleRegister() {
  const u = document.getElementById("regUser").value.trim();
  const n = document.getElementById("regName").value.trim();
  const p = document.getElementById("regPass").value.trim();
  const msg = document.getElementById("regMsg");

  if (!u || !n || !p) return (msg.textContent = "Lengkapi semua data!");
  if (users.some((x) => x.username === u))
    return (msg.textContent = "Username sudah terdaftar!");

  const newUser = {
    username: u,
    name: n,
    password: p,
    tasks: [],
    projects: [],
  };
  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));
  msg.textContent = "Registrasi berhasil! Silakan login.";
  showToast("Akun berhasil dibuat! Silakan login.", "success");
  switchTab("login");
}

function demoLogin() {
  const demo = {
    username: "admin",
    name: "Admin Demo",
    password: "admin",
    tasks: [
      { title: "Buat laporan proyek", description: "Laporan akhir untuk klien", deadline: "2025-06-15", status: "inprogress" },
      { title: "Rapat tim", description: "Diskusi progress mingguan", deadline: "2025-06-10", status: "todo" },
      { title: "Perbaikan bug", description: "Bug di modul login", deadline: "2025-06-05", status: "done" }
    ],
    projects: [
      { title: "Website Perusahaan", description: "Redesign website perusahaan", deadline: "2025-07-01" },
      { title: "Aplikasi Mobile", description: "Pengembangan aplikasi iOS dan Android", deadline: "2025-08-15" }
    ]
  };

  if (!users.some((u) => u.username === "admin")) {
    users.push(demo);
    localStorage.setItem("users", JSON.stringify(users));
  }
  currentUser = demo;
  localStorage.setItem("currentUser", JSON.stringify(demo));
  showToast("Masuk sebagai akun demo", "info");
  renderApp();
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  document.getElementById("app").innerHTML = `
    <section id="auth" class="auth-container">
      <div class="auth-card"><h2>Silakan Login Ulang</h2></div>
    </section>
  `;
  showToast("Anda telah logout", "info");
  setTimeout(() => location.reload(), 800);
}

function fillExample() {
  document.getElementById("regUser").value = "userbaru";
  document.getElementById("regName").value = "Nama Pengguna";
  document.getElementById("regPass").value = "12345";
  showToast("Form telah diisi dengan contoh", "info");
}

// ============ Sidebar & Profile ============
function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const appGrid = document.querySelector('.app-grid');
  if (appGrid) {
    appGrid.classList.toggle('sidebar-collapsed', sidebarCollapsed);
  }
  
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn) {
    toggleBtn.innerHTML = sidebarCollapsed ? 
      '<i class="fas fa-bars"></i>' : 
      '<i class="fas fa-times"></i>';
  }
}

function toggleUserMenu() {
  const userMenu = document.querySelector('.user-menu');
  if (userMenu) {
    userMenu.classList.toggle('show');
  }
}

function editProfile() {
  const newName = prompt("Edit nama Anda:", currentUser.name);
  if (newName !== null && newName.trim() !== "") {
    currentUser.name = newName.trim();
    saveUserData();
    renderUserProfile();
    showToast("Profil berhasil diperbarui!", "success");
  }
}

function renderUserProfile() {
  const userProfile = document.getElementById('userProfile');
  if (userProfile && currentUser) {
    userProfile.innerHTML = `
      <div class="user-dropdown">
        <div class="user-profile" onclick="toggleUserMenu()">
          <div class="user-avatar">${currentUser.name[0].toUpperCase()}</div>
          <div class="user-info">
            <div class="user-name">${currentUser.name}</div>
            <div class="user-username">@${currentUser.username}</div>
          </div>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="user-menu">
          <button onclick="editProfile()"><i class="fas fa-user-edit"></i> Edit Profil</button>
          <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      </div>
    `;
  }
}

// ============ Tampilan App ============
function renderApp() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  document.querySelector(".app-header nav").innerHTML = `
    <button onclick="showView('dashboard')"><i class="fas fa-tachometer-alt"></i> Dashboard</button>
    <button onclick="showView('tasks')"><i class="fas fa-tasks"></i> Tugas</button>
    <button onclick="showView('projects')"><i class="fas fa-project-diagram"></i> Proyek</button>
    <button onclick="showView('kanban')"><i class="fas fa-columns"></i> Kanban</button>
  `;

  document.getElementById("app").innerHTML = `
    <div class="app-grid ${sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <aside class="sidebar">
        <div class="profile">
          <div class="avatar">${currentUser.name[0].toUpperCase()}</div>
          <div>
            <strong>${currentUser.name}</strong><br>
            <small>@${currentUser.username}</small>
          </div>
        </div>
        <div class="quick">
          <button class="btn-secondary" onclick="showView('dashboard')"><i class="fas fa-tachometer-alt"></i> Dashboard</button>
          <button class="btn-secondary" onclick="showView('tasks')"><i class="fas fa-tasks"></i> Tugas</button>
          <button class="btn-secondary" onclick="showView('projects')"><i class="fas fa-project-diagram"></i> Proyek</button>
          <button class="btn-secondary" onclick="showView('kanban')"><i class="fas fa-columns"></i> Kanban</button>
        </div>
        <div class="notify">
          <h4><i class="fas fa-bell"></i> Aktivitas Terbaru</h4>
          <div id="notifList"></div>
        </div>
      </aside>
      <section id="view"></section>
    </div>
  `;

  // Setup sidebar toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.onclick = toggleSidebar;
  }

  renderUserProfile();
  showView("dashboard");
}

// ============ Navigasi ============
function showView(view) {
  const v = document.getElementById("view");
  if (view === "dashboard") renderDashboard(v);
  if (view === "tasks") renderTasks(v);
  if (view === "projects") renderProjects(v);
  if (view === "kanban") renderKanban(v);
}

// ============ Dashboard ============
function renderDashboard(container) {
  const tasks = currentUser.tasks || [];
  const projects = currentUser.projects || [];

  // Hitung statistik
  const todo = tasks.filter(t => t.status === "todo").length;
  const inprogress = tasks.filter(t => t.status === "inprogress").length;
  const done = tasks.filter(t => t.status === "done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const deg = (progress / 100) * 360;

  // Tugas yang mendekati deadline
  const today = new Date();
  const upcomingTasks = tasks
    .filter(t => t.deadline && new Date(t.deadline) > today)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  container.innerHTML = `
    <h2 style="margin-bottom: 1.5rem;">Dashboard</h2>
   
    <div class="stats-container">
      <div class="stat-card total">
        <i class="fas fa-tasks"></i>
        <h3>${tasks.length}</h3>
        <p>Total Tugas</p>
      </div>
      <div class="stat-card todo">
        <i class="fas fa-circle"></i>
        <h3>${todo}</h3>
        <p>Belum Dikerjakan</p>
      </div>
      <div class="stat-card inprogress">
        <i class="fas fa-spinner"></i>
        <h3>${inprogress}</h3>
        <p>Sedang Dikerjakan</p>
      </div>
      <div class="stat-card done">
        <i class="fas fa-check-circle"></i>
        <h3>${done}</h3>
        <p>Selesai</p>
      </div>
    </div>
   
    <div class="card">
      <h3>Progress Keseluruhan</h3>
      <div class="progress-circle" style="--deg:${deg}deg">
        <span style="position: relative; z-index: 1;">${progress}%</span>
      </div>
      <p style="text-align: center;">${done} dari ${tasks.length} tugas selesai</p>
    </div>
   
    <div class="card">
      <h3><i class="fas fa-clock"></i> Tugas Mendatang</h3>
      ${
        upcomingTasks.length
          ? upcomingTasks.map(t => `
            <div class="task-card">
              <strong>${t.title}</strong>
              <p style="margin: 0.3rem 0; font-size: 0.9rem;">${t.description || 'Tidak ada deskripsi'}</p>
              <small>Deadline: ${formatDate(t.deadline)}</small>
            </div>
          `).join('')
          : '<p>Tidak ada tugas mendatang</p>'
      }
    </div>
   
    <div class="card">
      <h3><i class="fas fa-project-diagram"></i> Proyek Aktif</h3>
      <p>Anda memiliki ${projects.length} proyek aktif</p>
      <button class="btn" onclick="showView('projects')" style="margin-top: 1rem;">
        <i class="fas fa-eye"></i> Lihat Semua Proyek
      </button>
    </div>
  `;
}

// ============ CRUD Tugas ============
function renderTasks(container) {
  const tasks = currentUser.tasks || [];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Manajemen Tugas</h2>
      <button class="btn" onclick="toggleTaskForm()" id="toggleTaskFormBtn">
        <i class="fas fa-plus"></i> Tugas Baru
      </button>
    </div>
   
    <div class="card ${tasks.length ? 'hidden' : ''}" id="taskForm">
      <h3>Buat Tugas Baru</h3>
      <div class="input-group">
        <i class="fas fa-heading"></i>
        <input id="taskTitle" class="input" placeholder="Judul tugas">
      </div>
      <div class="input-group">
        <i class="fas fa-calendar"></i>
        <input id="taskDeadline" type="date" class="input">
      </div>
      <div class="input-group">
        <i class="fas fa-align-left"></i>
        <textarea id="taskDesc" class="input" placeholder="Deskripsi tugas" rows="3"></textarea>
      </div>
      <div class="input-group">
        <i class="fas fa-list"></i>
        <select id="taskStatus" class="input">
          <option value="todo">Belum Dikerjakan</option>
          <option value="inprogress">Sedang Dikerjakan</option>
          <option value="done">Selesai</option>
        </select>
      </div>
      <button class="btn" onclick="addTask()">
        <i class="fas fa-save"></i> Simpan Tugas
      </button>
    </div>
   
    <div class="card">
      <h3>Daftar Tugas</h3>
      <div id="taskList">
        ${
          tasks.length
            ? tasks
                .map(
                  (t, i) => `
                <div class="task-card">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <strong>${t.title}</strong>
                      <p style="margin: 0.3rem 0; font-size: 0.9rem;">${t.description || 'Tidak ada deskripsi'}</p>
                      <small>Deadline: ${formatDate(t.deadline)}</small>
                    </div>
                    <span class="status-badge ${t.status}">
                      ${t.status === 'todo' ? 'Belum' : t.status === 'inprogress' ? 'Sedang' : 'Selesai'}
                    </span>
                  </div>
                  <div class="task-actions">
                    <button onclick="editTask(${i})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteTask(${i})"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              `
                )
                .join("")
            : "<p>Belum ada tugas. Buat tugas baru!</p>"
        }
      </div>
    </div>
  `;
}

function toggleTaskForm() {
  const form = document.getElementById("taskForm");
  const btn = document.getElementById("toggleTaskFormBtn");
  if (form.classList.contains("hidden")) {
    form.classList.remove("hidden");
    btn.innerHTML = '<i class="fas fa-times"></i> Batal';
  } else {
    form.classList.add("hidden");
    btn.innerHTML = '<i class="fas fa-plus"></i> Tugas Baru';
  }
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const deadline = document.getElementById("taskDeadline").value;
  const description = document.getElementById("taskDesc").value.trim();
  const status = document.getElementById("taskStatus").value;

  if (!title) return showToast("Judul tugas harus diisi!", "error");

  const task = { title, deadline, description, status };
  currentUser.tasks.push(task);
  saveUserData();
  showToast("Tugas berhasil ditambahkan!", "success");
  renderTasks(document.getElementById("view"));
}

function editTask(index) {
  const task = currentUser.tasks[index];
  const newTitle = prompt("Edit judul:", task.title);
  if (newTitle === null) return;
  const newDesc = prompt("Edit deskripsi:", task.description);
  const newDeadline = prompt("Edit deadline (YYYY-MM-DD):", task.deadline);
  const newStatus = prompt("Status (todo/inprogress/done):", task.status);

  if (newTitle) task.title = newTitle;
  if (newDesc !== null) task.description = newDesc;
  if (newDeadline) task.deadline = newDeadline;
  if (newStatus && ["todo", "inprogress", "done"].includes(newStatus))
    task.status = newStatus;

  saveUserData();
  showToast("Tugas berhasil diupdate!", "success");
  renderTasks(document.getElementById("view"));
}

function deleteTask(index) {
  if (confirm("Hapus tugas ini?")) {
    currentUser.tasks.splice(index, 1);
    saveUserData();
    showToast("Tugas dihapus", "info");
    renderTasks(document.getElementById("view"));
  }
}

// ============ CRUD Proyek ============
function renderProjects(container) {
  const projects = currentUser.projects || [];

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2>Manajemen Proyek</h2>
      <button class="btn" onclick="toggleProjectForm()" id="toggleProjectFormBtn">
        <i class="fas fa-plus"></i> Proyek Baru
      </button>
    </div>
   
    <div class="card ${projects.length ? 'hidden' : ''}" id="projectForm">
      <h3>Buat Proyek Baru</h3>
      <div class="input-group">
        <i class="fas fa-heading"></i>
        <input id="projectTitle" class="input" placeholder="Judul proyek">
      </div>
      <div class="input-group">
        <i class="fas fa-calendar"></i>
        <input id="projectDeadline" type="date" class="input">
      </div>
      <div class="input-group">
        <i class="fas fa-align-left"></i>
        <textarea id="projectDesc" class="input" placeholder="Deskripsi proyek" rows="3"></textarea>
      </div>
      <button class="btn" onclick="addProject()">
        <i class="fas fa-save"></i> Simpan Proyek
      </button>
    </div>
   
    <div class="card">
      <h3>Daftar Proyek</h3>
      <div id="projectList">
        ${
          projects.length
            ? projects
                .map(
                  (p, i) => `
                <div class="task-card">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                      <strong>${p.title}</strong>
                      <p style="margin: 0.3rem 0; font-size: 0.9rem;">${p.description || 'Tidak ada deskripsi'}</p>
                      <small>Deadline: ${formatDate(p.deadline)}</small>
                    </div>
                  </div>
                  <div class="task-actions">
                    <button onclick="editProject(${i})"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteProject(${i})"><i class="fas fa-trash"></i></button>
                  </div>
                </div>
              `
                )
                .join("")
            : "<p>Belum ada proyek. Buat proyek baru!</p>"
        }
      </div>
    </div>
  `;
}

function toggleProjectForm() {
  const form = document.getElementById("projectForm");
  const btn = document.getElementById("toggleProjectFormBtn");
  if (form.classList.contains("hidden")) {
    form.classList.remove("hidden");
    btn.innerHTML = '<i class="fas fa-times"></i> Batal';
  } else {
    form.classList.add("hidden");
    btn.innerHTML = '<i class="fas fa-plus"></i> Proyek Baru';
  }
}

function addProject() {
  const title = document.getElementById("projectTitle").value.trim();
  const deadline = document.getElementById("projectDeadline").value;
  const description = document.getElementById("projectDesc").value.trim();

  if (!title) return showToast("Judul proyek harus diisi!", "error");

  const project = { title, deadline, description };
  currentUser.projects.push(project);
  saveUserData();
  showToast("Proyek berhasil ditambahkan!", "success");
  renderProjects(document.getElementById("view"));
}

function editProject(index) {
  const project = currentUser.projects[index];
  const newTitle = prompt("Edit judul:", project.title);
  if (newTitle === null) return;
  const newDesc = prompt("Edit deskripsi:", project.description);
  const newDeadline = prompt("Edit deadline (YYYY-MM-DD):", project.deadline);

  if (newTitle) project.title = newTitle;
  if (newDesc !== null) project.description = newDesc;
  if (newDeadline) project.deadline = newDeadline;

  saveUserData();
  showToast("Proyek berhasil diupdate!", "success");
  renderProjects(document.getElementById("view"));
}

function deleteProject(index) {
  if (confirm("Hapus proyek ini?")) {
    currentUser.projects.splice(index, 1);
    saveUserData();
    showToast("Proyek dihapus", "info");
    renderProjects(document.getElementById("view"));
  }
}

// ============ Kanban ============
function renderKanban(container) {
  const tasks = currentUser.tasks || [];

  container.innerHTML = `
    <h2 style="margin-bottom: 1.5rem;">Kanban Board</h2>
    <div class="kanban-board">
      <div class="kanban-column todo">
        <h3>
          <i class="fas fa-circle"></i> Belum Dikerjakan
          <span class="task-count">${tasks.filter(t => t.status === "todo").length}</span>
        </h3>
        <div class="kanban-tasks" data-status="todo" ondrop="drop(event)" ondragover="allowDrop(event)">
          ${renderKanbanTasks(tasks, "todo")}
        </div>
      </div>
      <div class="kanban-column inprogress">
        <h3>
          <i class="fas fa-spinner"></i> Sedang Dikerjakan
          <span class="task-count">${tasks.filter(t => t.status === "inprogress").length}</span>
        </h3>
        <div class="kanban-tasks" data-status="inprogress" ondrop="drop(event)" ondragover="allowDrop(event)">
          ${renderKanbanTasks(tasks, "inprogress")}
        </div>
      </div>
      <div class="kanban-column done">
        <h3>
          <i class="fas fa-check-circle"></i> Selesai
          <span class="task-count">${tasks.filter(t => t.status === "done").length}</span>
        </h3>
        <div class="kanban-tasks" data-status="done" ondrop="drop(event)" ondragover="allowDrop(event)">
          ${renderKanbanTasks(tasks, "done")}
        </div>
      </div>
    </div>
  `;
}

function renderKanbanTasks(tasks, status) {
  return tasks
    .filter(t => t.status === status)
    .map(
      (t, i) => `
      <div class="task-card" draggable="true" ondragstart="drag(event)" data-index="${i}">
        <strong>${t.title}</strong>
        <p style="margin: 0.3rem 0; font-size: 0.9rem;">${t.description || 'Tidak ada deskripsi'}</p>
        <small>Deadline: ${formatDate(t.deadline)}</small>
      </div>
    `
    )
    .join("");
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.dataset.index);
  ev.target.classList.add("dragging");
}

function drop(ev) {
  ev.preventDefault();
  const taskIndex = ev.dataTransfer.getData("text");
  const newStatus = ev.target.closest(".kanban-tasks").dataset.status;
  
  // Hapus class dragging dari semua elemen
  document.querySelectorAll('.task-card').forEach(card => {
    card.classList.remove('dragging');
  });
  
  currentUser.tasks[taskIndex].status = newStatus;
  saveUserData();
  showToast(`Tugas dipindah ke ${newStatus === 'todo' ? 'Belum Dikerjakan' : newStatus === 'inprogress' ? 'Sedang Dikerjakan' : 'Selesai'}`, "success");
  renderKanban(document.getElementById("view"));
}

// ============ Utilitas ============
function saveUserData() {
  const index = users.findIndex(u => u.username === currentUser.username);
  if (index !== -1) {
    users[index] = currentUser;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "Tidak ada";
  const options = { day: "numeric", month: "long", year: "numeric" };
  return new Date(dateStr).toLocaleDateString("id-ID", options);
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast";
  
  // Set warna berdasarkan tipe
  if (type === "success") toast.style.background = "#10b981";
  else if (type === "error") toast.style.background = "#ef4444";
  else if (type === "warning") toast.style.background = "#f59e0b";
  else toast.style.background = "#4f46e5";
  
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

// Event listener untuk menutup dropdown user saat klik di luar
document.addEventListener('click', function(event) {
  const userDropdown = document.querySelector('.user-dropdown');
  if (userDropdown && !userDropdown.contains(event.target)) {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) userMenu.classList.remove('show');
  }
});