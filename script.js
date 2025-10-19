// ============ Data & State ============
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

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

// ============ Tampilan App ============
function renderApp() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;

  document.querySelector(".app-header nav").innerHTML = `
    <button onclick="showView('dashboard')"><i class="fas fa-tachometer-alt"></i> Dashboard</button>
    <button onclick="showView('tasks')"><i class="fas fa-tasks"></i> Tugas</button>
    <button onclick="showView('projects')"><i class="fas fa-project-diagram"></i> Proyek</button>
    <button onclick="showView('kanban')"><i class="fas fa-columns"></i> Kanban</button>
    <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
  `;

  document.getElementById("app").innerHTML = `
    <div class="app-grid">
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
        <textarea id="taskDesc" class="input" placeholder="Deskripsi" rows="3"></textarea>
      </div>
      <button class="btn" onclick="addTask()"><i class="fas fa-plus"></i> Tambah Tugas</button>
    </div>
    
    <div class="card">
      <h3>Daftar Tugas (${tasks.length})</h3>
      <div style="margin-bottom: 1rem;">
        <button class="btn-secondary" onclick="filterTasks('all')" id="filterAll">Semua</button>
        <button class="btn-secondary" onclick="filterTasks('todo')" id="filterTodo">Belum Dikerjakan</button>
        <button class="btn-secondary" onclick="filterTasks('inprogress')" id="filterInProgress">Sedang Dikerjakan</button>
        <button class="btn-secondary" onclick="filterTasks('done')" id="filterDone">Selesai</button>
      </div>
      <div id="taskList">
        ${tasks.length
          ? tasks
              .map(
                (t, i) => `
          <div class="task-card" data-status="${t.status}">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <strong>${t.title}</strong>
                <p style="margin: 0.3rem 0; font-size: 0.9rem;">${t.description || 'Tidak ada deskripsi'}</p>
                <small>Deadline: ${t.deadline ? formatDate(t.deadline) : "-"}</small>
              </div>
              <select onchange="updateTaskStatus(${i}, this.value)" style="margin-left: 1rem;">
                <option value="todo" ${t.status === "todo" ? "selected" : ""}>To Do</option>
                <option value="inprogress" ${t.status === "inprogress" ? "selected" : ""}>In Progress</option>
                <option value="done" ${t.status === "done" ? "selected" : ""}>Done</option>
              </select>
            </div>
            <div class="task-actions">
              <button onclick="editTask(${i})" title="Edit"><i class="fas fa-edit"></i></button>
              <button onclick="deleteTask(${i})" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
          </div>`
              )
              .join("")
          : "<p>Belum ada tugas. Buat tugas pertama Anda!</p>"}
      </div>
    </div>
  `;
  
  // Set filter aktif
  document.getElementById("filterAll").classList.add("active");
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

function filterTasks(status) {
  const taskCards = document.querySelectorAll('.task-card');
  const filterButtons = document.querySelectorAll('.btn-secondary');
  
  // Update active filter button
  filterButtons.forEach(btn => btn.classList.remove('active'));
  document.getElementById(`filter${status.charAt(0).toUpperCase() + status.slice(1)}`).classList.add('active');
  
  // Show/hide tasks based on filter
  taskCards.forEach(card => {
    if (status === 'all' || card.dataset.status === status) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const deadline = document.getElementById("taskDeadline").value.trim();
  
  if (!title) {
    showToast("Judul tugas wajib diisi!", "error");
    document.getElementById("taskTitle").focus();
    return;
  }
  
  const newTask = {
    title,
    description: desc,
    deadline,
    status: "todo",
  };
  
  currentUser.tasks.push(newTask);
  saveUserData();
  renderTasks(document.getElementById("view"));
  showToast("Tugas berhasil ditambahkan!", "success");
  
  // Reset form
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("taskDeadline").value = "";
}

function updateTaskStatus(index, status) {
  currentUser.tasks[index].status = status;
  saveUserData();
  showToast(`Status tugas diubah menjadi ${status}`, "info");
  
  // Update dashboard if we're on it
  if (document.querySelector('.app-grid')) {
    renderDashboard(document.getElementById("view"));
  }
}

function editTask(index) {
  const task = currentUser.tasks[index];
  const newTitle = prompt("Edit judul tugas:", task.title);
  if (newTitle !== null) {
    const newDesc = prompt("Edit deskripsi tugas:", task.description || "");
    const newDeadline = prompt("Edit deadline (YYYY-MM-DD):", task.deadline || "");
    
    currentUser.tasks[index] = {
      ...task,
      title: newTitle.trim(),
      description: newDesc.trim(),
      deadline: newDeadline.trim(),
    };
    
    saveUserData();
    renderTasks(document.getElementById("view"));
    showToast("Tugas berhasil diubah!", "success");
  }
}

function deleteTask(index) {
  if (confirm("Hapus tugas ini?")) {
    currentUser.tasks.splice(index, 1);
    saveUserData();
    renderTasks(document.getElementById("view"));
    showToast("Tugas berhasil dihapus!", "success");
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
        <input id="projectTitle" class="input" placeholder="Nama proyek">
      </div>
      <div class="input-group">
        <i class="fas fa-calendar"></i>
        <input id="projectDeadline" type="date" class="input">
      </div>
      <div class="input-group">
        <i class="fas fa-align-left"></i>
        <textarea id="projectDesc" class="input" placeholder="Deskripsi proyek" rows="3"></textarea>
      </div>
      <button class="btn" onclick="addProject()"><i class="fas fa-plus"></i> Tambah Proyek</button>
    </div>
    
    <div class="card">
      <h3>Daftar Proyek (${projects.length})</h3>
      <div id="projectList">
        ${projects.length
          ? projects
              .map(
                (p, i) => `
          <div class="task-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="flex: 1;">
                <strong>${p.title}</strong>
                <p style="margin: 0.3rem 0; font-size: 0.9rem;">${p.description || 'Tidak ada deskripsi'}</p>
                <small>Deadline: ${p.deadline ? formatDate(p.deadline) : "-"}</small>
              </div>
            </div>
            <div class="task-actions">
              <button onclick="editProject(${i})" title="Edit"><i class="fas fa-edit"></i></button>
              <button onclick="deleteProject(${i})" title="Hapus"><i class="fas fa-trash"></i></button>
            </div>
          </div>`
              )
              .join("")
          : "<p>Belum ada proyek. Buat proyek pertama Anda!</p>"}
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
  const desc = document.getElementById("projectDesc").value.trim();
  const deadline = document.getElementById("projectDeadline").value.trim();
  
  if (!title) {
    showToast("Nama proyek wajib diisi!", "error");
    document.getElementById("projectTitle").focus();
    return;
  }
  
  const newProject = {
    title,
    description: desc,
    deadline,
  };
  
  currentUser.projects.push(newProject);
  saveUserData();
  renderProjects(document.getElementById("view"));
  showToast("Proyek berhasil ditambahkan!", "success");
  
  // Reset form
  document.getElementById("projectTitle").value = "";
  document.getElementById("projectDesc").value = "";
  document.getElementById("projectDeadline").value = "";
}

function editProject(index) {
  const project = currentUser.projects[index];
  const newTitle = prompt("Edit nama proyek:", project.title);
  if (newTitle !== null) {
    const newDesc = prompt("Edit deskripsi proyek:", project.description || "");
    const newDeadline = prompt("Edit deadline (YYYY-MM-DD):", project.deadline || "");
    
    currentUser.projects[index] = {
      ...project,
      title: newTitle.trim(),
      description: newDesc.trim(),
      deadline: newDeadline.trim(),
    };
    
    saveUserData();
    renderProjects(document.getElementById("view"));
    showToast("Proyek berhasil diubah!", "success");
  }
}

function deleteProject(index) {
  if (confirm("Hapus proyek ini?")) {
    currentUser.projects.splice(index, 1);
    saveUserData();
    renderProjects(document.getElementById("view"));
    showToast("Proyek berhasil dihapus!", "success");
  }
}

// ============ Kanban Board ============
function renderKanban(container) {
  const tasks = currentUser.tasks || [];
  const todo = tasks.filter(t => t.status === "todo");
  const inprogress = tasks.filter(t => t.status === "inprogress");
  const done = tasks.filter(t => t.status === "done");
  
  container.innerHTML = `
    <h2 style="margin-bottom: 1.5rem;">Kanban Board</h2>
    <p style="margin-bottom: 1.5rem;">Drag & drop untuk mengubah status tugas</p>
    
    <div class="kanban-board">
      <div class="kanban-column todo">
        <h3>To Do <span class="badge">${todo.length}</span></h3>
        <div class="kanban-list" data-status="todo">
          ${todo.map((t, i) => renderKanbanTask(t, i)).join('')}
        </div>
      </div>
      
      <div class="kanban-column inprogress">
        <h3>In Progress <span class="badge">${inprogress.length}</span></h3>
        <div class="kanban-list" data-status="inprogress">
          ${inprogress.map((t, i) => renderKanbanTask(t, i)).join('')}
        </div>
      </div>
      
      <div class="kanban-column done">
        <h3>Done <span class="badge">${done.length}</span></h3>
        <div class="kanban-list" data-status="done">
          ${done.map((t, i) => renderKanbanTask(t, i)).join('')}
        </div>
      </div>
    </div>
  `;
  
  // Setup drag and drop
  setupDragAndDrop();
}

function renderKanbanTask(task, index) {
  return `
    <div class="task-card" draggable="true" data-index="${index}">
      <strong>${task.title}</strong>
      <p style="margin: 0.3rem 0; font-size: 0.9rem;">${task.description || 'Tidak ada deskripsi'}</p>
      <small>Deadline: ${task.deadline ? formatDate(task.deadline) : "-"}</small>
      <div class="task-actions">
        <button onclick="editTask(${index})" title="Edit"><i class="fas fa-edit"></i></button>
        <button onclick="deleteTask(${index})" title="Hapus"><i class="fas fa-trash"></i></button>
      </div>
    </div>
  `;
}

function setupDragAndDrop() {
  const tasks = document.querySelectorAll('.task-card');
  const columns = document.querySelectorAll('.kanban-list');
  
  tasks.forEach(task => {
    task.addEventListener('dragstart', () => {
      task.classList.add('dragging');
    });
    
    task.addEventListener('dragend', () => {
      task.classList.remove('dragging');
    });
  });
  
  columns.forEach(column => {
    column.addEventListener('dragover', e => {
      e.preventDefault();
      const afterElement = getDragAfterElement(column, e.clientY);
      const draggable = document.querySelector('.dragging');
      
      if (afterElement == null) {
        column.appendChild(draggable);
      } else {
        column.insertBefore(draggable, afterElement);
      }
    });
    
    column.addEventListener('drop', e => {
      e.preventDefault();
      const draggable = document.querySelector('.dragging');
      const taskIndex = parseInt(draggable.dataset.index);
      const newStatus = column.dataset.status;
      
      // Update task status
      currentUser.tasks[taskIndex].status = newStatus;
      saveUserData();
      showToast(`Tugas dipindahkan ke ${newStatus}`, "info");
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ============ Utilitas ============
function saveUserData() {
  const index = users.findIndex((u) => u.username === currentUser.username);
  if (index !== -1) {
    users[index] = currentUser;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}

function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast";
  
  // Set color based on type
  if (type === "success") toast.style.background = "var(--secondary)";
  else if (type === "error") toast.style.background = "var(--danger)";
  else if (type === "warning") toast.style.background = "var(--warning)";
  else toast.style.background = "var(--primary)";
  
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// CSS untuk hidden class
const style = document.createElement('style');
style.textContent = `
  .hidden { display: none !important; }
  .badge {
    background: var(--primary);
    color: white;
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    font-size: 0.8rem;
  }
  .kanban-column.todo .badge { background: var(--gray); }
  .kanban-column.inprogress .badge { background: var(--warning); }
  .kanban-column.done .badge { background: var(--secondary); }
`;
document.head.appendChild(style);