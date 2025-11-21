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
            productivityStats: this.initializeProductivityStats(),
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

    // Initialize productivity stats
    initializeProductivityStats() {
        return {
            weekly: {
                tasksCompleted: 0,
                tasksCreated: 0,
                productivityScore: 0
            },
            monthly: {
                tasksCompleted: 0,
                tasksCreated: 0,
                productivityScore: 0
            },
            lastUpdated: new Date().toISOString()
        };
    },

    // Update productivity stats
    updateProductivityStats(userId, taskAction) {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return;

        const user = users[userIndex];
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        const currentMonth = now.getMonth();
        
        if (!user.productivityStats) {
            user.productivityStats = this.initializeProductivityStats();
        }

        // Update weekly stats
        if (taskAction === 'completed') {
            user.productivityStats.weekly.tasksCompleted++;
        } else if (taskAction === 'created') {
            user.productivityStats.weekly.tasksCreated++;
        }

        // Update monthly stats
        if (taskAction === 'completed') {
            user.productivityStats.monthly.tasksCompleted++;
        } else if (taskAction === 'created') {
            user.productivityStats.monthly.tasksCreated++;
        }

        // Calculate productivity scores (simple formula)
        user.productivityStats.weekly.productivityScore = 
            Math.round((user.productivityStats.weekly.tasksCompleted / 
                       Math.max(user.productivityStats.weekly.tasksCreated, 1)) * 100);
        
        user.productivityStats.monthly.productivityScore = 
            Math.round((user.productivityStats.monthly.tasksCompleted / 
                       Math.max(user.productivityStats.monthly.tasksCreated, 1)) * 100);

        user.productivityStats.lastUpdated = now.toISOString();

        localStorage.setItem("flowsync_users", JSON.stringify(users));
    },

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
            created_at: new Date().toISOString(),
            completed_at: null
        };

        if (!users[userIndex].tasks) {
            users[userIndex].tasks = [];
        }

        users[userIndex].tasks.push(newTask);
        
        // Update productivity stats
        this.updateProductivityStats(userId, 'created');
        
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
                const oldStatus = user.tasks[taskIndex].status;
                user.tasks[taskIndex] = { ...user.tasks[taskIndex], ...updateData };
                
                // Update productivity stats if task was completed
                if (updateData.status === 'done' && oldStatus !== 'done') {
                    user.tasks[taskIndex].completed_at = new Date().toISOString();
                    this.updateProductivityStats(user.id, 'completed');
                }
                
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
    },

    // Productivity Reports
    async getProductivityReport(userId, period = 'week') {
        await this.delay(300);
        const user = users.find(u => u.id === userId);
        if (!user) {
            return { success: false, message: "User tidak ditemukan!" };
        }

        const now = new Date();
        let startDate, endDate;

        if (period === 'week') {
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            endDate = now;
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (period === 'lastMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        }

        // Filter tasks for the period
        const periodTasks = user.tasks?.filter(task => {
            const taskDate = new Date(task.created_at);
            return taskDate >= startDate && taskDate <= endDate;
        }) || [];

        const completedTasks = periodTasks.filter(task => task.status === 'done');
        const inProgressTasks = periodTasks.filter(task => task.status === 'inprogress');
        const todoTasks = periodTasks.filter(task => task.status === 'todo');

        // Calculate completion rate
        const completionRate = periodTasks.length > 0 
            ? Math.round((completedTasks.length / periodTasks.length) * 100) 
            : 0;

        // Get recently completed tasks
        const recentlyCompleted = completedTasks
            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
            .slice(0, 5);

        return {
            success: true,
            report: {
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalTasks: periodTasks.length,
                completedTasks: completedTasks.length,
                inProgressTasks: inProgressTasks.length,
                todoTasks: todoTasks.length,
                completionRate,
                recentlyCompleted,
                productivityStats: user.productivityStats || this.initializeProductivityStats()
            }
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
        const icon = currentTheme === "light" ? '🌙' : '☀️';
        themeToggle.innerHTML = `${icon}`;
    }
}

// ============ Password Toggle Functionality ============
function togglePasswordVisibility(event) {
    const toggleBtn = event.currentTarget;
    const passwordInput = toggleBtn.previousElementSibling; // Input element
    const icon = toggleBtn.querySelector('i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleBtn.setAttribute('aria-label', 'Sembunyikan password');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleBtn.setAttribute('aria-label', 'Tampilkan password');
    }
    
    // Focus kembali ke input setelah toggle
    passwordInput.focus();
}

function initPasswordToggles() {
    // Initialize login password toggle
    const loginToggle = document.getElementById('toggleLoginPassword');
    if (loginToggle) {
        loginToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    // Initialize register password toggle
    const regToggle = document.getElementById('toggleRegPassword');
    if (regToggle) {
        regToggle.addEventListener('click', togglePasswordVisibility);
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

// ============ Deadline Notification System ============
const DeadlineManager = {
    checkDeadlines() {
        if (!currentUser || !currentUser.tasks) return [];
        
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const upcomingDeadlines = currentUser.tasks.filter(task => {
            if (!task.deadline || task.status === 'done') return false;
            
            const taskDeadline = new Date(task.deadline);
            const timeDiff = taskDeadline - now;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            return daysDiff <= 1 && daysDiff >= 0;
        });
        
        return upcomingDeadlines;
    },
    
    showDeadlineNotifications() {
        const upcomingDeadlines = this.checkDeadlines();
        
        if (upcomingDeadlines.length > 0) {
            upcomingDeadlines.forEach(task => {
                const taskDeadline = new Date(task.deadline);
                const now = new Date();
                const hoursDiff = Math.ceil((taskDeadline - now) / (1000 * 60 * 60));
                
                let message = '';
                if (hoursDiff <= 24 && hoursDiff > 0) {
                    message = `⏰ Deadline "${task.title}" dalam ${hoursDiff} jam! Ayo kerjakan!`;
                } else if (hoursDiff <= 0) {
                    message = `🚨 Deadline "${task.title}" sudah lewat!`;
                }
                
                if (message) {
                    setTimeout(() => {
                        showToast(message, 'warning');
                    }, 1000);
                }
            });
        }
    },
    
    renderDeadlineWarning() {
        const upcomingDeadlines = this.checkDeadlines();
        
        if (upcomingDeadlines.length === 0) return '';
        
        return `
            <div class="deadline-warning" style="
                background: linear-gradient(90deg, var(--warning), #fbbf24);
                color: white;
                padding: 1rem;
                border-radius: 12px;
                margin-bottom: 1rem;
                animation: pulse 2s infinite;
            ">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 1.2rem;"></i>
                    <strong style="font-size: 1rem;">Deadline Mendekat!</strong>
                </div>
                <div style="font-size: 0.9rem;">
                    ${upcomingDeadlines.length} tugas mendekati deadline. Ayo kerjakan!
                </div>
            </div>
        `;
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

// ============ Productivity Report Functions ============
function openReportModal() {
    document.getElementById('reportModal').classList.add('show');
    loadProductivityReport('week');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('show');
}

async function loadProductivityReport(period) {
    try {
        const result = await FlowSyncAPI.getProductivityReport(currentUser.id, period);
        
        if (result.success) {
            renderProductivityReport(result.report);
            
            // Update active period button
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`.period-btn[data-period="${period}"]`).classList.add('active');
        } else {
            showToast(result.message || "Gagal memuat laporan!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan saat memuat laporan!", "error");
    }
}

function renderProductivityReport(report) {
    const reportContent = document.getElementById('reportContent');
    const periodText = getPeriodText(report.period);
    
    reportContent.innerHTML = `
        <div class="report-summary">
            <div class="report-stat">
                <h4>${report.totalTasks}</h4>
                <p>Total Tugas</p>
            </div>
            <div class="report-stat">
                <h4>${report.completedTasks}</h4>
                <p>Selesai</p>
            </div>
            <div class="report-stat">
                <h4>${report.completionRate}%</h4>
                <p>Tingkat Penyelesaian</p>
            </div>
            <div class="report-stat">
                <h4>${report.productivityStats[report.period === 'week' ? 'weekly' : 'monthly'].productivityScore}%</h4>
                <p>Skor Produktivitas</p>
            </div>
        </div>

        <div class="productivity-chart">
            <h4>Distribusi Tugas</h4>
            <div class="chart-bar">
                <div class="chart-label">Belum Dikerjakan</div>
                <div class="chart-bar-inner">
                    <div class="chart-bar-fill todo" style="width: ${report.totalTasks > 0 ? (report.todoTasks / report.totalTasks) * 100 : 0}%"></div>
                </div>
                <div class="chart-value">${report.todoTasks}</div>
            </div>
            <div class="chart-bar">
                <div class="chart-label">Sedang Dikerjakan</div>
                <div class="chart-bar-inner">
                    <div class="chart-bar-fill inprogress" style="width: ${report.totalTasks > 0 ? (report.inProgressTasks / report.totalTasks) * 100 : 0}%"></div>
                </div>
                <div class="chart-value">${report.inProgressTasks}</div>
            </div>
            <div class="chart-bar">
                <div class="chart-label">Selesai</div>
                <div class="chart-bar-inner">
                    <div class="chart-bar-fill done" style="width: ${report.totalTasks > 0 ? (report.completedTasks / report.totalTasks) * 100 : 0}%"></div>
                </div>
                <div class="chart-value">${report.completedTasks}</div>
            </div>
        </div>

        ${report.recentlyCompleted.length > 0 ? `
            <div class="report-tasks">
                <h4>Tugas yang Baru Selesai</h4>
                ${report.recentlyCompleted.map(task => `
                    <div class="report-task-item">
                        <div class="report-task-info">
                            <div class="report-task-title">${task.title}</div>
                            <div class="report-task-meta">
                                <span>Diselesaikan: ${formatDate(task.completed_at)}</span>
                                ${task.deadline ? `<span>Deadline: ${formatDate(task.deadline)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function getPeriodText(period) {
    const periods = {
        'week': 'Minggu Ini',
        'month': 'Bulan Ini',
        'lastMonth': 'Bulan Lalu'
    };
    return periods[period] || period;
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
                    <button onclick="openReportModal()">
                        <i class="fas fa-chart-line"></i> Laporan Produktivitas
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
    if (window.innerWidth <= 768) {
        // Mode mobile - toggle sidebar dengan overlay
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.toggle('mobile-open');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    } else {
        // Mode desktop - behavior lama
        sidebarCollapsed = !sidebarCollapsed;
        const appGrid = document.querySelector('.app-grid');
        if (appGrid) {
            appGrid.classList.toggle('sidebar-collapsed', sidebarCollapsed);
        }
    }
}

function closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar.classList.remove('mobile-open');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

function switchTab(tab) {
    document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
    document.getElementById("regForm").classList.toggle("hidden", tab !== "register");
    
    document.getElementById("tab-login").classList.toggle("active", tab === "login");
    document.getElementById("tab-reg").classList.toggle("active", tab === "register");
    
    document.getElementById("loginMsg").textContent = "";
    document.getElementById("regMsg").textContent = "";
    
    // Initialize password toggles when switching tabs
    setTimeout(initPasswordToggles, 50);
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
            
            ${DeadlineManager.renderDeadlineWarning()}
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

        <div class="dashboard-grid">
            <div class="card">
                <h3><i class="fas fa-list-ul"></i> Tugas Terbaru</h3>
                ${currentUser.tasks && currentUser.tasks.length > 0 ? 
                    currentUser.tasks.slice(0, 5).map(task => `
                        <div style="padding: 0.8rem 0; border-bottom: 1px solid var(--border);">
                            <strong style="color: var(--dark);">${task.title}</strong>
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
                            <strong style="color: var(--dark);">${project.title}</strong>
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
                    <i class="fas fa-list"></i> Semua
                </button>
                <button class="task-status-tab todo ${currentTaskFilter === 'todo' ? 'active' : ''}" onclick="setTaskFilter('todo')">
                    <i class="fas fa-clock"></i> Belum
                </button>
                <button class="task-status-tab inprogress ${currentTaskFilter === 'inprogress' ? 'active' : ''}" onclick="setTaskFilter('inprogress')">
                    <i class="fas fa-spinner"></i> Sedang
                </button>
                <button class="task-status-tab done ${currentTaskFilter === 'done' ? 'active' : ''}" onclick="setTaskFilter('done')">
                    <i class="fas fa-check"></i> Selesai
                </button>
            </div>

            <div style="background: var(--card-bg); padding: var(--spacing-lg); border-radius: 12px; margin-bottom: var(--spacing-md);">
                <h3><i class="fas fa-plus"></i> Tambah Tugas Baru</h3>
                <div class="input-group">
                    <i class="fas fa-pencil-alt"></i>
                    <input type="text" id="taskTitle" class="input" placeholder="Judul Tugas">
                </div>
                <div class="input-group">
                    <i class="fas fa-calendar"></i>
                    <input type="date" id="taskDeadline" class="input">
                </div>
                <div class="input-group">
                    <i class="fas fa-align-left"></i>
                    <textarea id="taskDesc" class="input" placeholder="Deskripsi Tugas" style="min-height: 80px; resize: vertical;"></textarea>
                </div>
                <div class="input-group">
                    <i class="fas fa-tag"></i>
                    <select id="taskStatus" class="input">
                        <option value="todo">Belum Dikerjakan</option>
                        <option value="inprogress">Sedang Dikerjakan</option>
                        <option value="done">Selesai</option>
                    </select>
                </div>
                <button class="btn" onclick="addTask()">
                    <i class="fas fa-plus"></i> Tambah Tugas
                </button>
            </div>

            <h3>Daftar Tugas (${filteredTasks.length})</h3>
            ${filteredTasks.length > 0 ? 
                filteredTasks.map((task, index) => `
                    <div class="task-card">
                        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                            <div style="flex: 1; min-width: 250px;">
                                <h4 style="margin: 0 0 0.5rem 0; color: var(--dark);">${task.title}</h4>
                                ${task.description ? `<p style="margin: 0 0 0.8rem 0; color: var(--gray); line-height: 1.4;">${task.description}</p>` : ''}
                                <div style="display: flex; gap: var(--spacing-md); font-size: 0.8rem; color: var(--gray); margin-bottom: 0.8rem; flex-wrap: wrap;">
                                    ${task.deadline ? `<span style="display: flex; align-items: center; gap: 0.3rem;"><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</span>` : ''}
                                    <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                                </div>
                                
                                <!-- Tombol Aksi Status -->
                                <div class="task-status-buttons">
                                    <button class="status-btn todo-btn ${task.status === 'todo' ? 'active' : ''}" onclick="changeTaskStatus(${index}, 'todo')" title="Tandai sebagai Belum Dikerjakan">
                                        <i class="fas fa-clock"></i> Belum
                                    </button>
                                    <button class="status-btn inprogress-btn ${task.status === 'inprogress' ? 'active' : ''}" onclick="changeTaskStatus(${index}, 'inprogress')" title="Tandai sebagai Sedang Dikerjakan">
                                        <i class="fas fa-spinner"></i> Sedang
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
                '<div class="card" style="text-align: center; color: var(--gray); padding: var(--spacing-lg);"><p>Tidak ada tugas yang ditemukan</p></div>'
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
                <div class="input-group">
                    <i class="fas fa-pencil-alt"></i>
                    <input type="text" id="projectTitle" class="input" placeholder="Judul Proyek">
                </div>
                <div class="input-group">
                    <i class="fas fa-calendar"></i>
                    <input type="date" id="projectDeadline" class="input">
                </div>
                <div class="input-group">
                    <i class="fas fa-align-left"></i>
                    <textarea id="projectDesc" class="input" placeholder="Deskripsi Proyek" style="min-height: 80px; resize: vertical;"></textarea>
                </div>
                <button class="btn" onclick="addProject()">
                    <i class="fas fa-plus"></i> Tambah Proyek
                </button>
            </div>

            <h3>Daftar Proyek (${projects.length})</h3>
            ${projects.length > 0 ? 
                projects.map((project, index) => `
                    <div class="card">
                        <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                            <div style="flex: 1; min-width: 250px;">
                                <h4 style="margin: 0 0 0.5rem 0; color: var(--dark);">${project.title}</h4>
                                ${project.description ? `<p style="margin: 0 0 0.8rem 0; color: var(--gray); line-height: 1.4;">${project.description}</p>` : ''}
                                ${project.deadline ? `<p style="margin: 0; font-size: 0.8rem; color: var(--gray); display: flex; align-items: center; gap: 0.3rem;"><i class="fas fa-calendar"></i> Deadline: ${formatDate(project.deadline)}</p>` : ''}
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

    // Update theme toggle dengan emoji yang sesuai
    document.querySelector(".app-header nav").innerHTML = `
        <button class="theme-toggle" onclick="toggleTheme()">
            ${currentTheme === "light" ? '🌙' : '☀️'}
        </button>
    `;

    document.getElementById("app").innerHTML = `
        <!-- Overlay untuk mobile -->
        <div class="sidebar-overlay" onclick="closeMobileSidebar()"></div>
        
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
                    <button class="btn-secondary" onclick="showView('dashboard'); closeMobileSidebar();">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </button>
                    <button class="btn-secondary" onclick="showView('tasks'); closeMobileSidebar();">
                        <i class="fas fa-tasks"></i> Tugas
                    </button>
                    <button class="btn-secondary" onclick="showView('projects'); closeMobileSidebar();">
                        <i class="fas fa-project-diagram"></i> Proyek
                    </button>
                    <button class="btn-secondary" onclick="showView('kanban'); closeMobileSidebar();">
                        <i class="fas fa-columns"></i> Kanban
                    </button>
                    <button class="btn-secondary" onclick="openReportModal(); closeMobileSidebar();">
                        <i class="fas fa-chart-line"></i> Laporan
                    </button>
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

    // Tampilkan notifikasi deadline
    setTimeout(() => {
        DeadlineManager.showDeadlineNotifications();
    }, 2000);

    // Periksa deadline setiap 5 menit
    setInterval(() => {
        DeadlineManager.showDeadlineNotifications();
    }, 5 * 60 * 1000);

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
            productivityStats: FlowSyncAPI.initializeProductivityStats(),
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

    // Initialize password toggles
    initPasswordToggles();

    // Event listeners untuk Enter key
    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const activeTab = document.querySelector('.tab.active').id;
            if (activeTab === 'tab-login') {
                handleLogin();
            } else {
                handleRegister();
            }
        }
    });

    // Event listeners untuk productivity report period buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('period-btn')) {
            const period = e.target.dataset.period;
            loadProductivityReport(period);
        }
    });

    // Tutup sidebar mobile ketika window di-resize ke desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileSidebar();
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

    initDemoData();

    if (currentUser) {
        renderApp();
        ActivityManager.addActivity('login', `Session dilanjutkan`);
    }
});