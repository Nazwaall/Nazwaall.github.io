// ============ Data & State ============
let users = JSON.parse(localStorage.getItem("flowsync_users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let sidebarCollapsed = false;
let currentTaskFilter = 'all';
let currentTheme = localStorage.getItem("flowsync_theme") || "light";

// ============ FlowSyncAPI Implementation ============
const FlowSyncAPI = {
    // Simulate API delay
    delay(ms = 500) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // User Authentication
    async login(username, password) {
        await this.delay(800);
        
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            return {
                success: true,
                user: { ...user },
                message: "Login berhasil!"
            };
        } else {
            return {
                success: false,
                message: "Username atau password salah!"
            };
        }
    },

    async register(userData) {
        await this.delay(800);
        
        const existingUser = users.find(u => u.username === userData.username);
        if (existingUser) {
            return {
                success: false,
                message: "Username sudah digunakan!"
            };
        }

        const newUser = {
            id: Date.now(),
            username: userData.username,
            password: userData.password,
            name: userData.name,
            email: userData.email,
            phone: userData.phone || "",
            tasks: [],
            projects: [],
            activities: [],
            created_at: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem("flowsync_users", JSON.stringify(users));

        return {
            success: true,
            user: { ...newUser },
            message: "Registrasi berhasil!"
        };
    },

    // Task Management
    async getTasks(userId) {
        await this.delay(300);
        const user = users.find(u => u.id === userId);
        return {
            success: true,
            tasks: user ? user.tasks || [] : []
        };
    },

    async createTask(userId, taskData) {
        await this.delay(600);
        
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: "User tidak ditemukan!" };
        }

        const newTask = {
            id: Date.now(),
            title: taskData.title,
            description: taskData.description || "",
            deadline: taskData.deadline || "",
            status: taskData.status || "todo",
            created_at: new Date().toISOString()
        };

        if (!users[userIndex].tasks) {
            users[userIndex].tasks = [];
        }

        users[userIndex].tasks.push(newTask);
        localStorage.setItem("flowsync_users", JSON.stringify(users));

        return {
            success: true,
            task: newTask,
            message: "Tugas berhasil dibuat!"
        };
    },

    async updateTask(taskId, updateData) {
        await this.delay(400);
        
        for (let user of users) {
            const taskIndex = user.tasks?.findIndex(t => t.id === taskId);
            if (taskIndex !== -1 && taskIndex !== undefined) {
                user.tasks[taskIndex] = { ...user.tasks[taskIndex], ...updateData };
                localStorage.setItem("flowsync_users", JSON.stringify(users));
                return {
                    success: true,
                    task: user.tasks[taskIndex],
                    message: "Tugas berhasil diperbarui!"
                };
            }
        }

        return { success: false, message: "Tugas tidak ditemukan!" };
    },

    async deleteTask(taskId) {
        await this.delay(400);
        
        for (let user of users) {
            const taskIndex = user.tasks?.findIndex(t => t.id === taskId);
            if (taskIndex !== -1 && taskIndex !== undefined) {
                user.tasks.splice(taskIndex, 1);
                localStorage.setItem("flowsync_users", JSON.stringify(users));
                return {
                    success: true,
                    message: "Tugas berhasil dihapus!"
                };
            }
        }

        return { success: false, message: "Tugas tidak ditemukan!" };
    },

    // Project Management
    async getProjects(userId) {
        await this.delay(300);
        const user = users.find(u => u.id === userId);
        return {
            success: true,
            projects: user ? user.projects || [] : []
        };
    },

    async createProject(userId, projectData) {
        await this.delay(600);
        
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: "User tidak ditemukan!" };
        }

        const newProject = {
            id: Date.now(),
            title: projectData.title,
            description: projectData.description || "",
            deadline: projectData.deadline || "",
            status: "active",
            created_at: new Date().toISOString()
        };

        if (!users[userIndex].projects) {
            users[userIndex].projects = [];
        }

        users[userIndex].projects.push(newProject);
        localStorage.setItem("flowsync_users", JSON.stringify(users));

        return {
            success: true,
            project: newProject,
            message: "Proyek berhasil dibuat!"
        };
    },

    async updateProject(projectId, updateData) {
        await this.delay(400);
        
        for (let user of users) {
            const projectIndex = user.projects?.findIndex(p => p.id === projectId);
            if (projectIndex !== -1 && projectIndex !== undefined) {
                user.projects[projectIndex] = { ...user.projects[projectIndex], ...updateData };
                localStorage.setItem("flowsync_users", JSON.stringify(users));
                return {
                    success: true,
                    project: user.projects[projectIndex],
                    message: "Proyek berhasil diperbarui!"
                };
            }
        }

        return { success: false, message: "Proyek tidak ditemukan!" };
    },

    async deleteProject(projectId) {
        await this.delay(400);
        
        for (let user of users) {
            const projectIndex = user.projects?.findIndex(p => p.id === projectId);
            if (projectIndex !== -1 && projectIndex !== undefined) {
                user.projects.splice(projectIndex, 1);
                localStorage.setItem("flowsync_users", JSON.stringify(users));
                return {
                    success: true,
                    message: "Proyek berhasil dihapus!"
                };
            }
        }

        return { success: false, message: "Proyek tidak ditemukan!" };
    },

    // Profile Management
    async updateProfile(userId, profileData) {
        await this.delay(600);
        
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: "User tidak ditemukan!" };
        }

        users[userIndex] = { 
            ...users[userIndex], 
            ...profileData 
        };

        localStorage.setItem("flowsync_users", JSON.stringify(users));

        return {
            success: true,
            user: users[userIndex],
            message: "Profil berhasil diperbarui!"
        };
    }
};

// ============ Theme Management ============
function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeToggleIcon();
}

function toggleTheme() {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("flowsync_theme", currentTheme);
    updateThemeToggleIcon();
    showToast(`Mode ${currentTheme === "light" ? "Terang" : "Gelap"} diaktifkan`, "info");
}

function updateThemeToggleIcon() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.innerHTML = currentTheme === "light" 
            ? '<i class="fas fa-moon"></i><span>Tema Gelap</span>'
            : '<i class="fas fa-sun"></i><span>Tema Terang</span>';
    }
}

// ============ Activity System ============
const ActivityManager = {
    addActivity(type, title) {
        if (!currentUser) return;
        
        if (!currentUser.activities) {
            currentUser.activities = [];
        }
        
        const activity = {
            id: Date.now(),
            type: type,
            title: title,
            timestamp: new Date().toISOString()
        };
        
        currentUser.activities.unshift(activity);
        
        if (currentUser.activities.length > 10) {
            currentUser.activities = currentUser.activities.slice(0, 10);
        }
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].activities = currentUser.activities;
            localStorage.setItem("flowsync_users", JSON.stringify(users));
        }
        
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        
        if (document.getElementById('notifList')) {
            this.renderActivities();
        }
    },
    
    renderActivities() {
        const notifList = document.getElementById('notifList');
        if (!notifList || !currentUser || !currentUser.activities) return;
        
        const activities = currentUser.activities.slice(0, 5);
        
        if (activities.length === 0) {
            notifList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-bell"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Belum ada aktivitas</div>
                        <div class="activity-time">Mulai dengan menambahkan tugas</div>
                    </div>
                </div>
            `;
            return;
        }
        
        notifList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },
    
    formatTime(timestamp) {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        
        return activityTime.toLocaleDateString('id-ID');
    }
};

// ============ Authentication Functions ============
async function handleLogin() {
    const u = document.getElementById("loginUser").value.trim();
    const p = document.getElementById("loginPass").value.trim();
    const msg = document.getElementById("loginMsg");
    const btn = document.getElementById("btnLogin");

    if (!u || !p) {
        msg.textContent = "Username dan password harus diisi!";
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="loading"></div> Memproses...';
    btn.disabled = true;

    try {
        const result = await FlowSyncAPI.login(u, p);
        
        if (result.success) {
            currentUser = result.user;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            
            ActivityManager.addActivity('login', `Berhasil login sebagai ${currentUser.name}`);
            
            msg.textContent = "";
            showToast(`Selamat datang, ${currentUser.name}!`, "success");
            renderApp();
        } else {
            msg.textContent = result.message || "Login gagal!";
        }
    } catch (error) {
        msg.textContent = error.message || "Terjadi kesalahan saat login!";
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function handleRegister() {
    const username = document.getElementById("regUser").value.trim();
    const name = document.getElementById("regName").value.trim();
    const password = document.getElementById("regPass").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const msg = document.getElementById("regMsg");
    const btn = document.getElementById("btnReg");

    if (!username || !name || !password || !email) {
        msg.textContent = "Semua field harus diisi!";
        return;
    }

    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="loading"></div> Memproses...';
    btn.disabled = true;

    try {
        const result = await FlowSyncAPI.register({
            username,
            name,
            password,
            email
        });

        if (result.success) {
            currentUser = result.user;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            
            ActivityManager.addActivity('register', `Akun baru dibuat: ${currentUser.name}`);
            
            msg.textContent = "";
            showToast(`Registrasi berhasil! Selamat datang, ${currentUser.name}!`, "success");
            renderApp();
        } else {
            msg.textContent = result.message || "Registrasi gagal!";
        }
    } catch (error) {
        msg.textContent = error.message || "Terjadi kesalahan saat registrasi!";
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function demoLogin() {
    document.getElementById("loginUser").value = "admin";
    document.getElementById("loginPass").value = "admin";
    handleLogin();
}

function fillExample() {
    document.getElementById("regUser").value = "user123";
    document.getElementById("regName").value = "John Doe";
    document.getElementById("regPass").value = "password123";
    document.getElementById("regEmail").value = "john@example.com";
}

// ============ Task Management Functions ============
async function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const deadline = document.getElementById("taskDeadline").value;
    const description = document.getElementById("taskDesc").value.trim();
    const status = document.getElementById("taskStatus").value;

    if (!title) {
        showToast("Judul tugas harus diisi!", "error");
        return;
    }

    const task = { 
        title, 
        deadline, 
        description, 
        status 
    };

    try {
        const result = await FlowSyncAPI.createTask(currentUser.id, task);

        if (result.success) {
            const tasksResult = await FlowSyncAPI.getTasks(currentUser.id);
            if (tasksResult.success) {
                currentUser.tasks = tasksResult.tasks;
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
            
            ActivityManager.addActivity('task_added', `Menambahkan tugas: ${title}`);
            
            showToast("Tugas berhasil ditambahkan!", "success");
            renderTasks(document.getElementById("view"));
            
            document.getElementById("taskTitle").value = '';
            document.getElementById("taskDeadline").value = '';
            document.getElementById("taskDesc").value = '';
        } else {
            showToast(result.message || "Gagal menambah tugas!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan!", "error");
    }
}

async function changeTaskStatus(index, newStatus) {
    const task = currentUser.tasks[index];
    const oldStatus = task.status;
    task.status = newStatus;

    if (newStatus === 'done' && oldStatus !== 'done') {
        ActivityManager.addActivity('task_completed', `Menyelesaikan tugas: ${task.title}`);
    }

    try {
        await FlowSyncAPI.updateTask(task.id, {
            status: newStatus
        });
    } catch (error) {
        console.error('Error updating task status:', error);
    }

    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    showToast(`Status tugas diubah`, "success");
    renderTasks(document.getElementById("view"));
}

async function deleteTask(index) {
    if (confirm("Hapus tugas ini?")) {
        const task = currentUser.tasks[index];
        
        ActivityManager.addActivity('task_deleted', `Menghapus tugas: ${task.title}`);
        
        try {
            await FlowSyncAPI.deleteTask(task.id);
        } catch (error) {
            console.error('Error deleting task:', error);
        }

        currentUser.tasks.splice(index, 1);
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        showToast("Tugas dihapus", "info");
        renderTasks(document.getElementById("view"));
    }
}

// ============ Edit Task Function ============
function editTask(index) {
    const task = currentUser.tasks[index];
    
    // Buat modal edit
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-edit"></i> Edit Tugas</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="input-group">
                <i class="fas fa-pencil-alt"></i>
                <input type="text" id="editTaskTitle" class="input" value="${task.title}" placeholder="Judul Tugas">
            </div>
            <div class="input-group">
                <i class="fas fa-calendar"></i>
                <input type="date" id="editTaskDeadline" class="input" value="${task.deadline || ''}">
            </div>
            <div class="input-group">
                <i class="fas fa-align-left"></i>
                <textarea id="editTaskDesc" class="input" placeholder="Deskripsi Tugas" style="min-height: 100px;">${task.description || ''}</textarea>
            </div>
            <div class="input-group">
                <i class="fas fa-tag"></i>
                <select id="editTaskStatus" class="input">
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Belum Dikerjakan</option>
                    <option value="inprogress" ${task.status === 'inprogress' ? 'selected' : ''}>Sedang Dikerjakan</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Selesai</option>
                </select>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="btn" onclick="saveTaskEdit(${index})" style="flex: 1;">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
                <button class="btn-secondary" onclick="this.closest('.modal').remove()" style="flex: 1;">
                    <i class="fas fa-times"></i> Batal
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function saveTaskEdit(index) {
    const title = document.getElementById("editTaskTitle").value.trim();
    const deadline = document.getElementById("editTaskDeadline").value;
    const description = document.getElementById("editTaskDesc").value.trim();
    const status = document.getElementById("editTaskStatus").value;

    if (!title) {
        showToast("Judul tugas harus diisi!", "error");
        return;
    }

    const updatedTask = {
        title,
        deadline,
        description,
        status
    };

    try {
        const result = await FlowSyncAPI.updateTask(currentUser.tasks[index].id, updatedTask);

        if (result.success) {
            // Update local data
            currentUser.tasks[index] = { ...currentUser.tasks[index], ...updatedTask };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            
            ActivityManager.addActivity('task_updated', `Mengedit tugas: ${title}`);
            
            showToast("Tugas berhasil diperbarui!", "success");
            
            // Tutup modal dan refresh tampilan
            document.querySelector('.modal.show')?.remove();
            renderTasks(document.getElementById("view"));
        } else {
            showToast(result.message || "Gagal memperbarui tugas!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan!", "error");
    }
}

// ============ Project Management Functions ============
async function addProject() {
    const title = document.getElementById("projectTitle").value.trim();
    const deadline = document.getElementById("projectDeadline").value;
    const description = document.getElementById("projectDesc").value.trim();

    if (!title) {
        showToast("Judul proyek harus diisi!", "error");
        return;
    }

    const project = { 
        title, 
        deadline, 
        description 
    };

    try {
        const result = await FlowSyncAPI.createProject(currentUser.id, project);

        if (result.success) {
            const projectsResult = await FlowSyncAPI.getProjects(currentUser.id);
            if (projectsResult.success) {
                currentUser.projects = projectsResult.projects;
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
            }
            
            ActivityManager.addActivity('project_added', `Menambahkan proyek: ${title}`);
            
            showToast("Proyek berhasil ditambahkan!", "success");
            renderProjects(document.getElementById("view"));
            
            document.getElementById("projectTitle").value = '';
            document.getElementById("projectDeadline").value = '';
            document.getElementById("projectDesc").value = '';
        } else {
            showToast(result.message || "Gagal menambah proyek!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan!", "error");
    }
}

async function deleteProject(index) {
    if (confirm("Hapus proyek ini?")) {
        const project = currentUser.projects[index];
        
        ActivityManager.addActivity('project_deleted', `Menghapus proyek: ${project.title}`);
        
        try {
            await FlowSyncAPI.deleteProject(project.id);
        } catch (error) {
            console.error('Error deleting project:', error);
        }

        currentUser.projects.splice(index, 1);
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        showToast("Proyek dihapus", "info");
        renderProjects(document.getElementById("view"));
    }
}

// ============ Profile Management ============
function openProfileModal() {
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('profileModal').classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();

    if (!name) {
        showToast("Nama tidak boleh kosong!", "error");
        return;
    }

    try {
        const result = await FlowSyncAPI.updateProfile(currentUser.id, {
            name: name,
            email: email,
            phone: phone
        });

        if (result.success) {
            currentUser = result.user;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            
            ActivityManager.addActivity('profile_updated', `Memperbarui profil`);
            
            renderUserProfile();
            closeProfileModal();
            showToast("Profil berhasil diperbarui!", "success");
        } else {
            showToast(result.message || "Gagal memperbarui profil!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan!", "error");
    }
}

// ============ UI Rendering Functions ============
function renderUserProfile() {
    const userProfile = document.getElementById("userProfile");
    if (!userProfile) return;

    if (currentUser) {
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
                <div class="user-menu" id="userMenu">
                    <button onclick="openProfileModal()">
                        <i class="fas fa-user-edit"></i> Edit Profil
                    </button>
                    <button onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
    } else {
        userProfile.innerHTML = '';
    }
}

function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    const appGrid = document.querySelector('.app-grid');
    if (appGrid) {
        appGrid.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    }
}

function switchTab(tab) {
    document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
    document.getElementById("regForm").classList.toggle("hidden", tab !== "register");
    
    document.getElementById("tab-login").classList.toggle("active", tab === "login");
    document.getElementById("tab-reg").classList.toggle("active", tab === "register");
    
    document.getElementById("loginMsg").textContent = "";
    document.getElementById("regMsg").textContent = "";
}

function showView(view) {
    const viewEl = document.getElementById("view");
    if (!viewEl) return;

    switch (view) {
        case "dashboard":
            renderDashboard(viewEl);
            break;
        case "tasks":
            renderTasks(viewEl);
            break;
        case "projects":
            renderProjects(viewEl);
            break;
        case "kanban":
            renderKanban(viewEl);
            break;
        default:
            renderDashboard(viewEl);
    }
}

function renderDashboard(container) {
    const todoCount = currentUser.tasks?.filter(t => t.status === 'todo').length || 0;
    const inProgressCount = currentUser.tasks?.filter(t => t.status === 'inprogress').length || 0;
    const doneCount = currentUser.tasks?.filter(t => t.status === 'done').length || 0;
    const totalTasks = currentUser.tasks?.length || 0;
    const totalProjects = currentUser.projects?.length || 0;
    
    const progressPercentage = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
            <p class="mb-3">Selamat datang kembali, ${currentUser.name}! 👋</p>
        </div>

        <div class="stats-container">
            <div class="stat-card total">
                <i class="fas fa-tasks"></i>
                <h3>${totalTasks}</h3>
                <p>Total Tugas</p>
            </div>
            <div class="stat-card todo">
                <i class="fas fa-clock"></i>
                <h3>${todoCount}</h3>
                <p>Belum Dikerjakan</p>
            </div>
            <div class="stat-card inprogress">
                <i class="fas fa-spinner"></i>
                <h3>${inProgressCount}</h3>
                <p>Sedang Dikerjakan</p>
            </div>
            <div class="stat-card done">
                <i class="fas fa-check-circle"></i>
                <h3>${doneCount}</h3>
                <p>Selesai</p>
            </div>
        </div>

        <div class="card">
            <h3><i class="fas fa-chart-pie"></i> Progress Tugas</h3>
            <div class="progress-circle" style="--deg: ${progressPercentage * 3.6}deg">
                <span>${progressPercentage}%</span>
            </div>
            <p style="text-align: center;">${doneCount} dari ${totalTasks} tugas selesai</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
            <div class="card">
                <h3><i class="fas fa-list-ul"></i> Tugas Terbaru</h3>
                ${currentUser.tasks && currentUser.tasks.length > 0 ? 
                    currentUser.tasks.slice(0, 5).map(task => `
                        <div style="padding: 0.8rem 0; border-bottom: 1px solid var(--border);">
                            <strong>${task.title}</strong>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--gray); margin-top: 0.3rem;">
                                <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                                ${task.deadline ? `<span>${formatDate(task.deadline)}</span>` : ''}
                            </div>
                        </div>
                    `).join('') : 
                    '<p style="text-align: center; color: var(--gray); padding: var(--spacing-md);">Belum ada tugas</p>'
                }
            </div>

            <div class="card">
                <h3><i class="fas fa-project-diagram"></i> Proyek Aktif</h3>
                ${currentUser.projects && currentUser.projects.length > 0 ? 
                    currentUser.projects.slice(0, 5).map(project => `
                        <div style="padding: 0.8rem 0; border-bottom: 1px solid var(--border);">
                            <strong>${project.title}</strong>
                            <div style="font-size: 0.8rem; color: var(--gray); margin-top: 0.3rem;">
                                ${project.deadline ? `Deadline: ${formatDate(project.deadline)}` : 'Tidak ada deadline'}
                            </div>
                        </div>
                    `).join('') : 
                    '<p style="text-align: center; color: var(--gray); padding: var(--spacing-md);">Belum ada proyek</p>'
                }
            </div>
        </div>
    `;
}

function renderTasks(container) {
    const filteredTasks = currentUser.tasks?.filter(task => {
        if (currentTaskFilter === 'all') return true;
        return task.status === currentTaskFilter;
    }) || [];

    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-tasks"></i> Manajemen Tugas</h2>
            
            <div class="task-status-tabs">
                <button class="task-status-tab ${currentTaskFilter === 'all' ? 'active' : ''}" onclick="setTaskFilter('all')">
                    Semua Tugas
                </button>
                <button class="task-status-tab todo ${currentTaskFilter === 'todo' ? 'active' : ''}" onclick="setTaskFilter('todo')">
                    Belum Dikerjakan
                </button>
                <button class="task-status-tab inprogress ${currentTaskFilter === 'inprogress' ? 'active' : ''}" onclick="setTaskFilter('inprogress')">
                    Sedang Dikerjakan
                </button>
                <button class="task-status-tab done ${currentTaskFilter === 'done' ? 'active' : ''}" onclick="setTaskFilter('done')">
                    Selesai
                </button>
            </div>

            <div style="background: var(--card-bg); padding: var(--spacing-lg); border-radius: 12px; margin-bottom: var(--spacing-md);">
                <h3><i class="fas fa-plus"></i> Tambah Tugas Baru</h3>
                <div style="display: grid; gap: var(--spacing-md); grid-template-columns: 1fr 1fr; margin-bottom: var(--spacing-md);">
                    <input type="text" id="taskTitle" class="input" placeholder="Judul Tugas">
                    <input type="date" id="taskDeadline" class="input">
                </div>
                <textarea id="taskDesc" class="input" placeholder="Deskripsi Tugas" style="width: 100%; margin-bottom: var(--spacing-md); min-height: 80px;"></textarea>
                <select id="taskStatus" class="input" style="margin-bottom: var(--spacing-md);">
                    <option value="todo">Belum Dikerjakan</option>
                    <option value="inprogress">Sedang Dikerjakan</option>
                    <option value="done">Selesai</option>
                </select>
                <button class="btn" onclick="addTask()">
                    <i class="fas fa-plus"></i> Tambah Tugas
                </button>
            </div>

            <h3>Daftar Tugas (${filteredTasks.length})</h3>
            ${filteredTasks.length > 0 ? 
                filteredTasks.map((task, index) => `
                    <div class="task-card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 0.5rem 0;">${task.title}</h4>
                                ${task.description ? `<p style="margin: 0 0 0.8rem 0; color: var(--gray);">${task.description}</p>` : ''}
                                <div style="display: flex; gap: var(--spacing-md); font-size: 0.8rem; color: var(--gray); margin-bottom: 0.8rem;">
                                    ${task.deadline ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</span>` : ''}
                                    <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                                </div>
                                
                                <!-- Tombol Aksi Status -->
                                <div class="task-status-buttons">
                                    <button class="status-btn todo-btn ${task.status === 'todo' ? 'active' : ''}" onclick="changeTaskStatus(${index}, 'todo')" title="Tandai sebagai Belum Dikerjakan">
                                        <i class="fas fa-clock"></i> Belum Dikerjakan
                                    </button>
                                    <button class="status-btn inprogress-btn ${task.status === 'inprogress' ? 'active' : ''}" onclick="changeTaskStatus(${index}, 'inprogress')" title="Tandai sebagai Sedang Dikerjakan">
                                        <i class="fas fa-spinner"></i> Sedang Dikerjakan
                                    </button>
                                    <button class="status-btn done-btn ${task.status === 'done' ? 'active' : ''}" onclick="changeTaskStatus(${index}, 'done')" title="Tandai sebagai Selesai">
                                        <i class="fas fa-check"></i> Selesai
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Tombol Aksi Edit dan Delete -->
                            <div class="task-action-buttons">
                                <button class="edit-btn" onclick="editTask(${index})" title="Edit Tugas">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="delete-btn" onclick="deleteTask(${index})" title="Hapus Tugas">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('') : 
                '<div class="card" style="text-align: center; color: var(--gray); padding: var(--spacing-lg);"><p>Tidak ada tugas</p></div>'
            }
        </div>
    `;
}

function renderProjects(container) {
    const projects = currentUser.projects || [];

    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-project-diagram"></i> Manajemen Proyek</h2>
            
            <div style="background: var(--card-bg); padding: var(--spacing-lg); border-radius: 12px; margin-bottom: var(--spacing-md);">
                <h3><i class="fas fa-plus"></i> Tambah Proyek Baru</h3>
                <input type="text" id="projectTitle" class="input mb-2" placeholder="Judul Proyek">
                <input type="date" id="projectDeadline" class="input mb-2">
                <textarea id="projectDesc" class="input mb-2" placeholder="Deskripsi Proyek" style="width: 100%; min-height: 80px;"></textarea>
                <button class="btn" onclick="addProject()">
                    <i class="fas fa-plus"></i> Tambah Proyek
                </button>
            </div>

            <h3>Daftar Proyek (${projects.length})</h3>
            ${projects.length > 0 ? 
                projects.map((project, index) => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0 0 0.5rem 0;">${project.title}</h4>
                                ${project.description ? `<p style="margin: 0 0 0.8rem 0; color: var(--gray);">${project.description}</p>` : ''}
                                ${project.deadline ? `<p style="margin: 0; font-size: 0.8rem; color: var(--gray);"><i class="fas fa-calendar"></i> Deadline: ${formatDate(project.deadline)}</p>` : ''}
                            </div>
                            <div class="task-action-buttons">
                                <button class="delete-btn" onclick="deleteProject(${index})" title="Hapus proyek">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('') : 
                '<div class="card" style="text-align: center; color: var(--gray); padding: var(--spacing-lg);"><p>Belum ada proyek</p></div>'
            }
        </div>
    `;
}

function renderKanban(container) {
    const todoTasks = currentUser.tasks?.filter(t => t.status === 'todo') || [];
    const inProgressTasks = currentUser.tasks?.filter(t => t.status === 'inprogress') || [];
    const doneTasks = currentUser.tasks?.filter(t => t.status === 'done') || [];

    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-columns"></i> Kanban Board</h2>
            <p class="mb-3">Drag and drop tugas untuk mengubah status</p>
            
            <div class="kanban-board">
                <div class="kanban-column todo" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <h3>Belum Dikerjakan <span class="status-badge todo">${todoTasks.length}</span></h3>
                    ${todoTasks.map((task, index) => `
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${index}">
                            <h4>${task.title}</h4>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            ${task.deadline ? `<small><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="kanban-column inprogress" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <h3>Sedang Dikerjakan <span class="status-badge inprogress">${inProgressTasks.length}</span></h3>
                    ${inProgressTasks.map((task, index) => `
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${index}">
                            <h4>${task.title}</h4>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            ${task.deadline ? `<small><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="kanban-column done" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <h3>Selesai <span class="status-badge done">${doneTasks.length}</span></h3>
                    ${doneTasks.map((task, index) => `
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${index}">
                            <h4>${task.title}</h4>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            ${task.deadline ? `<small><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// ============ Utility Functions ============
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const taskElement = document.getElementById(data);
    const newStatus = ev.target.closest('.kanban-column').classList[1];
    
    if (taskElement) {
        ev.target.closest('.kanban-column').appendChild(taskElement);
        
        const taskIndex = parseInt(data.split('-')[1]);
        changeTaskStatus(taskIndex, newStatus);
    }
}

function setTaskFilter(filter) {
    currentTaskFilter = filter;
    renderTasks(document.getElementById("view"));
}

function getStatusText(status) {
    const statusMap = {
        'todo': 'Belum Dikerjakan',
        'inprogress': 'Sedang Dikerjakan',
        'done': 'Selesai'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = "toast show";
    
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

function logout() {
    if (confirm("Yakin ingin logout?")) {
        ActivityManager.addActivity('logout', `Logout dari akun`);
        currentUser = null;
        localStorage.removeItem("currentUser");
        location.reload();
    }
}

// ============ App Initialization ============
function renderApp() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Hanya menampilkan tombol theme toggle di navbar
    document.querySelector(".app-header nav").innerHTML = `
        <button class="theme-toggle" onclick="toggleTheme()">
            ${currentTheme === "light" 
                ? '<i class="fas fa-moon"></i><span>Tema Gelap</span>'
                : '<i class="fas fa-sun"></i><span>Tema Terang</span>'
            }
        </button>
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

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.onclick = toggleSidebar;
    }

    renderUserProfile();
    ActivityManager.renderActivities();
    showView("dashboard");
}

function initDemoData() {
    const demoUser = users.find(u => u.username === "admin");
    
    if (!demoUser) {
        const demoData = {
            id: 1,
            username: "admin",
            password: "admin",
            name: "Admin Demo",
            email: "admin@demo.com",
            phone: "08123456789",
            tasks: [
                { 
                    id: 1, 
                    title: "Buat laporan proyek", 
                    description: "Laporan akhir untuk klien", 
                    deadline: "2025-06-15", 
                    status: "inprogress",
                    created_at: new Date().toISOString()
                }
            ],
            projects: [
                { 
                    id: 1, 
                    title: "Website Perusahaan", 
                    description: "Redesign website perusahaan", 
                    deadline: "2025-07-01",
                    created_at: new Date().toISOString()
                }
            ],
            activities: [
                {
                    id: 1,
                    type: 'login',
                    title: 'Akun demo diinisialisasi',
                    timestamp: new Date().toISOString()
                }
            ],
            created_at: new Date().toISOString()
        };

        users.push(demoData);
        localStorage.setItem("flowsync_users", JSON.stringify(users));
    }
}

// ============ Event Listeners ============
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    
    const tabLogin = document.getElementById("tab-login");
    const tabReg = document.getElementById("tab-reg");

    tabLogin.onclick = () => switchTab("login");
    tabReg.onclick = () => switchTab("register");

    document.getElementById("btnLogin").onclick = handleLogin;
    document.getElementById("btnDemo").onclick = demoLogin;
    document.getElementById("btnReg").onclick = handleRegister;
    document.getElementById("btnFillExample").onclick = fillExample;

    document.getElementById("loginPass").addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleLogin();
    });

    document.getElementById("regPass").addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleRegister();
    });

    initDemoData();

    if (currentUser) {
        renderApp();
        ActivityManager.addActivity('login', `Session dilanjutkan`);
    }
});

// Close user menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
        const menu = document.getElementById('userMenu');
        if (menu) {
            menu.classList.remove('show');
        }
    }
});