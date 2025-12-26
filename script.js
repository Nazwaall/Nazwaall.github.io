// ============ Data & State ============
let users = JSON.parse(localStorage.getItem("flowsync_users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let sidebarCollapsed = false;
let currentTaskFilter = 'all';
let currentTheme = localStorage.getItem("flowsync_theme") || "light";

// ============ Desktop Notification System ============
const NotificationManager = {
    // Request permission untuk notifications
    async requestPermission() {
        if (!("Notification" in window)) {
            console.log("Browser tidak mendukung desktop notification");
            return false;
        }
        
        if (Notification.permission === "granted") {
            return true;
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        return false;
    },
    
    // Tampilkan desktop notification
    showDesktopNotification(title, options = {}) {
        if (!("Notification" in window) || Notification.permission !== "granted") {
            return;
        }
        
        const defaultOptions = {
            icon: 'https://cdn-icons-png.flaticon.com/512/1998/1998675.png', // Icon FlowSync
            badge: 'https://cdn-icons-png.flaticon.com/512/1998/1998675.png',
            vibrate: [200, 100, 200],
            tag: 'flowsync-notification',
            renotify: true,
            ...options
        };
        
        const notification = new Notification(title, defaultOptions);
        
        // Handle klik pada notification
        notification.onclick = function() {
            window.focus();
            this.close();
            
            // Focus ke aplikasi jika sedang di tab lain
            if (document.hidden) {
                window.focus();
            }
        };
        
        // Auto close setelah 10 detik
        setTimeout(() => notification.close(), 10000);
        
        return notification;
    },
    
    // Cek dan tampilkan notifikasi untuk deadline yang mendekati
    async checkAndShowDeadlineNotifications() {
        if (!currentUser || !currentUser.tasks) return;
        
        const permissionGranted = await this.requestPermission();
        if (!permissionGranted) return;
        
        const now = new Date();
        const upcomingDeadlines = currentUser.tasks.filter(task => {
            if (!task.deadline || task.status === 'done') return false;
            
            const taskDeadline = new Date(task.deadline);
            const timeDiff = taskDeadline - now;
            const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
            
            // Tampilkan notifikasi untuk deadline dalam 24 jam ke depan
            return hoursDiff <= 24 && hoursDiff > 0;
        });
        
        const overdueTasks = currentUser.tasks.filter(task => {
            if (!task.deadline || task.status === 'done') return false;
            
            const taskDeadline = new Date(task.deadline);
            const timeDiff = taskDeadline - now;
            const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
            
            // Tampilkan notifikasi untuk deadline yang sudah lewat
            return hoursDiff <= 0;
        });
        
        // Tampilkan notifikasi untuk setiap deadline mendekati
        upcomingDeadlines.forEach(task => {
            const taskDeadline = new Date(task.deadline);
            const hoursDiff = Math.ceil((taskDeadline - now) / (1000 * 60 * 60));
            
            this.showDesktopNotification('⏰ Deadline Mendekat!', {
                body: `"${task.title}" dalam ${hoursDiff} jam!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3441/3441358.png',
                requireInteraction: hoursDiff <= 3, // Interaksi jika <= 3 jam
                silent: hoursDiff > 12 // Silent jika > 12 jam
            });
        });
        
        // Tampilkan notifikasi untuk deadline yang sudah lewat
        overdueTasks.forEach(task => {
            this.showDesktopNotification('🚨 Deadline Terlewat!', {
                body: `"${task.title}" sudah melewati deadline!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png',
                requireInteraction: true,
                silent: false
            });
        });
        
        return { upcomingDeadlines, overdueTasks };
    },
    
    // Cek dan tampilkan notifikasi produktivitas
    async checkAndShowProductivityNotifications() {
        if (!currentUser || !currentUser.tasks) return;
        
        const permissionGranted = await this.requestPermission();
        if (!permissionGranted) return;
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Minggu, 1 = Senin, dst
        
        // Skip notifikasi di akhir pekan (Sabtu = 6, Minggu = 0)
        if (currentDay === 0 || currentDay === 6) return;
        
        // Cek waktu untuk pengingat produktivitas
        // Pagi hari (8-10 AM) - Pengingat mulai kerja
        if (currentHour >= 8 && currentHour <= 10) {
            const pendingTasks = currentUser.tasks.filter(task => 
                task.status !== 'done'
            ).length;
            
            if (pendingTasks > 0) {
                this.showDesktopNotification('🌅 Selamat Pagi!', {
                    body: `Anda memiliki ${pendingTasks} tugas yang belum selesai. Ayo mulai kerjakan!`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076134.png',
                    silent: true
                });
            }
        }
        
        // Siang hari (12-2 PM) - Pengingat istirahat
        if (currentHour >= 12 && currentHour <= 14) {
            this.showDesktopNotification('☀️ Waktu Istirahat!', {
                body: 'Sudah waktunya istirahat sejenak. Jangan lupa makan siang!',
                icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076134.png',
                silent: true
            });
        }
        
        // Sore hari (4-6 PM) - Pengingat evaluasi
        if (currentHour >= 16 && currentHour <= 18) {
            const completedToday = currentUser.tasks.filter(task => {
                if (task.status !== 'done' || !task.completed_at) return false;
                const completedDate = new Date(task.completed_at);
                return completedDate.toDateString() === now.toDateString();
            }).length;
            
            this.showDesktopNotification('🌇 Evaluasi Harian', {
                body: `Hari ini Anda telah menyelesaikan ${completedToday} tugas. Tetap semangat!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076134.png',
                silent: true
            });
        }
        
        // Malam hari (8-10 PM) - Pengingat istirahat malam
        if (currentHour >= 20 && currentHour <= 22) {
            const pendingTasks = currentUser.tasks.filter(task => 
                task.status !== 'done'
            ).length;
            
            if (pendingTasks > 0) {
                this.showDesktopNotification('🌙 Waktu Istirahat Malam', {
                    body: `Masih ada ${pendingTasks} tugas yang belum selesai. Jangan lupa istirahat yang cukup!`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076134.png',
                    silent: true
                });
            }
        }
        
        // Cek tugas yang belum disentuh dalam 3 hari
        const staleTasks = currentUser.tasks.filter(task => {
            if (task.status === 'done') return false;
            
            const createdDate = new Date(task.created_at);
            const daysSinceCreation = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
            
            return daysSinceCreation >= 3;
        });
        
        if (staleTasks.length > 0) {
            this.showDesktopNotification('📌 Tugas Tertunda', {
                body: `Anda memiliki ${staleTasks.length} tugas yang belum disentuh dalam 3 hari.`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png',
                silent: true
            });
        }
        
        // Cek jika ada tugas dengan prioritas tinggi yang belum dikerjakan
        const highPriorityTasks = currentUser.tasks.filter(task => 
            task.status !== 'done' && 
            task.deadline && 
            new Date(task.deadline) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Deadline dalam 2 hari
        );
        
        if (highPriorityTasks.length > 0 && currentHour >= 9 && currentHour <= 17) {
            this.showDesktopNotification('⚠️ Tugas Prioritas Tinggi', {
                body: `Ada ${highPriorityTasks.length} tugas dengan deadline dekat yang perlu perhatian!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828843.png',
                requireInteraction: highPriorityTasks.length >= 3
            });
        }
    },
    
    // Cek dan tampilkan semua notifikasi
    async checkAllNotifications() {
        if (!currentUser) return;
        
        await this.checkAndShowDeadlineNotifications();
        await this.checkAndShowProductivityNotifications();
    },
    
    // Setup periodic notification checks
    setupPeriodicNotifications() {
        // Hapus interval sebelumnya jika ada
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        if (this.productivityInterval) {
            clearInterval(this.productivityInterval);
        }
        
        // Cek setiap 30 menit untuk notifikasi produktivitas (hanya di jam kerja)
        this.productivityInterval = setInterval(() => {
            if (currentUser && document.visibilityState === 'visible') {
                const now = new Date();
                const currentHour = now.getHours();
                const currentDay = now.getDay();
                
                // Hanya di jam kerja (Senin-Jumat, 8 AM - 6 PM)
                if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour <= 18) {
                    this.checkAndShowProductivityNotifications();
                }
            }
        }, 30 * 60 * 1000); // 30 menit
        
        // Cek setiap 1 jam untuk deadline notifications
        this.notificationInterval = setInterval(() => {
            if (currentUser) {
                this.checkAndShowDeadlineNotifications();
            }
        }, 60 * 60 * 1000); // 1 jam
        
        // Cek setiap hari jam 9 pagi untuk daily reminder (hari kerja)
        const now = new Date();
        const next9AM = new Date();
        next9AM.setHours(9, 0, 0, 0);
        
        if (now > next9AM) {
            next9AM.setDate(next9AM.getDate() + 1);
        }
        
        const timeUntil9AM = next9AM - now;
        
        this.dailyReminderTimeout = setTimeout(() => {
            if (currentUser) {
                const today = new Date();
                if (today.getDay() >= 1 && today.getDay() <= 5) { // Senin-Jumat
                    const pendingTasks = currentUser.tasks?.filter(task => 
                        task.status !== 'done'
                    ).length || 0;
                    
                    if (pendingTasks > 0) {
                        this.showDesktopNotification('📋 Daily Standup Reminder', {
                            body: `Anda memiliki ${pendingTasks} tugas yang belum selesai. Apa yang akan Anda kerjakan hari ini?`,
                            icon: 'https://cdn-icons-png.flaticon.com/512/3076/3076134.png',
                            requireInteraction: true
                        });
                    }
                }
            }
            
            // Set ulang untuk besok
            this.setupPeriodicNotifications();
        }, timeUntil9AM);
    },
    
    // Initialize notification system
    initialize() {
        this.requestPermission();
        
        // Inisialisasi hanya jika user sudah login
        if (currentUser) {
            this.setupPeriodicNotifications();
            
            // Cek notifikasi saat app dimuat (tunggu 3 detik)
            setTimeout(() => {
                this.checkAllNotifications();
            }, 3000);
        }
    },
    
    // Cleanup notifications
    cleanup() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        if (this.productivityInterval) {
            clearInterval(this.productivityInterval);
        }
        if (this.dailyReminderTimeout) {
            clearTimeout(this.dailyReminderTimeout);
        }
    }
};

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

    // Password Reset Functions
    async requestPasswordReset(email) {
        await this.delay(600);
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return {
                success: false,
                message: "Email tidak ditemukan!"
            };
        }
        
        // Generate reset token (sederhana untuk demo)
        const resetToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
        const resetExpiry = Date.now() + 3600000; // 1 jam dari sekarang
        
        // Simpan token ke user
        user.resetToken = resetToken;
        user.resetExpiry = resetExpiry;
        
        localStorage.setItem("flowsync_users", JSON.stringify(users));
        
        // Di aplikasi nyata, di sini akan mengirim email dengan token
        // Untuk demo, kita simpan token di localStorage untuk simulasi
        localStorage.setItem("reset_token_" + user.id, JSON.stringify({
            token: resetToken,
            userId: user.id,
            username: user.username,
            expires: resetExpiry
        }));
        
        return {
            success: true,
            token: resetToken,
            username: user.username,
            message: "Link reset password telah dikirim ke email Anda!"
        };
    },

    async verifyResetToken(token) {
        await this.delay(300);
        
        // Cari token di localStorage (simulasi)
        for (let user of users) {
            const storedToken = localStorage.getItem("reset_token_" + user.id);
            if (storedToken) {
                const tokenData = JSON.parse(storedToken);
                if (tokenData.token === token && tokenData.expires > Date.now()) {
                    return {
                        success: true,
                        userId: user.id,
                        username: user.username
                    };
                }
            }
        }
        
        return {
            success: false,
            message: "Token reset tidak valid atau telah kedaluwarsa!"
        };
    },

    async updatePassword(userId, newPassword, token) {
        await this.delay(600);
        
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) {
            return { success: false, message: "User tidak ditemukan!" };
        }
        
        // Verifikasi token
        const storedToken = localStorage.getItem("reset_token_" + userId);
        if (!storedToken) {
            return { success: false, message: "Token tidak valid!" };
        }
        
        const tokenData = JSON.parse(storedToken);
        if (tokenData.token !== token || tokenData.expires <= Date.now()) {
            return { success: false, message: "Token tidak valid atau kedaluwarsa!" };
        }
        
        // Update password
        users[userIndex].password = newPassword;
        
        // Hapus token setelah digunakan
        delete users[userIndex].resetToken;
        delete users[userIndex].resetExpiry;
        localStorage.removeItem("reset_token_" + userId);
        
        localStorage.setItem("flowsync_users", JSON.stringify(users));
        
        return {
            success: true,
            message: "Password berhasil direset! Silakan login dengan password baru."
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
    
    // Initialize reset password toggles
    const resetToggle = document.getElementById('toggleResetPassword');
    const resetConfirmToggle = document.getElementById('toggleResetConfirmPassword');
    
    if (resetToggle) {
        resetToggle.addEventListener('click', togglePasswordVisibility);
    }
    
    if (resetConfirmToggle) {
        resetConfirmToggle.addEventListener('click', togglePasswordVisibility);
    }
}

// ============ Date Input Enhancement ============
function initializeDateInputs() {
    // Set tanggal minimum ke hari ini untuk semua input date
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        input.min = today;
        
        // Format placeholder untuk browser yang tidak support date input
        if (input.type === 'text') {
            input.placeholder = 'YYYY-MM-DD';
        }
    });
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
            <div class="deadline-warning">
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

// ============ Daily Motivation System ============
const dailyMotivations = [
    "Produktivitas bukan tentang melakukan lebih banyak, tapi tentang melakukan yang penting.",
    "Mulailah dari yang kecil. Konsistensi adalah kunci kesukseksesan.",
    "Jangan menunggu sempurna untuk memulai. Mulai saja, lalu sempurnakan.",
    "Waktu adalah aset paling berharga. Kelola dengan bijak.",
    "Setiap tugas yang diselesaikan adalah langkah menuju tujuan.",
    "Fokus pada satu tugas pada satu waktu. Multitasking mengurangi kualitas.",
    "Istirahat yang cukup adalah bagian dari produktivitas.",
    "Rayakan pencapaian kecil, mereka membawa pada kesukseksesan besar.",
    "Disiplin hari ini menentukan kesukseksesan besok.",
    "Kualitas lebih penting dari kuantitas. Lakukan yang terbaik dalam setiap tugas."
];

function showNewMotivation() {
    const randomIndex = Math.floor(Math.random() * dailyMotivations.length);
    const motivationElement = document.getElementById('dailyMotivation');
    if (motivationElement) {
        motivationElement.textContent = `"${dailyMotivations[randomIndex]}"`;
        motivationElement.style.animation = 'fadeInUp 0.5s ease';
        setTimeout(() => {
            motivationElement.style.animation = '';
        }, 500);
    }
}

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
            
            // Inisialisasi notifikasi setelah login
            NotificationManager.initialize();
            
            // Tampilkan notifikasi deadline jika ada
            setTimeout(() => {
                DeadlineManager.showDeadlineNotifications();
                NotificationManager.checkAllNotifications();
            }, 1500);
            
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

// ============ Forgot Password Functions ============
async function handleForgotPassword() {
    const email = document.getElementById("forgotEmail").value.trim();
    const msg = document.getElementById("forgotMsg");
    const btn = document.getElementById("btnForgotPassword");
    
    if (!email) {
        msg.textContent = "Email harus diisi!";
        msg.style.color = "var(--danger)";
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        msg.textContent = "Format email tidak valid!";
        msg.style.color = "var(--danger)";
        return;
    }
    
    const originalText = btn.innerHTML;
    btn.innerHTML = '<div class="loading"></div> Memproses...';
    btn.disabled = true;
    
    try {
        const result = await FlowSyncAPI.requestPasswordReset(email);
        
        if (result.success) {
            msg.style.color = "var(--success)";
            msg.textContent = result.message;
            
            // Untuk demo, tampilkan modal reset password langsung
            openResetPasswordModal(result.username, result.token);
            
            // Reset form
            document.getElementById("forgotEmail").value = "";
        } else {
            msg.style.color = "var(--danger)";
            msg.textContent = result.message;
        }
    } catch (error) {
        msg.style.color = "var(--danger)";
        msg.textContent = error.message || "Terjadi kesalahan!";
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function openResetPasswordModal(username, token) {
    document.getElementById('resetUsername').value = username;
    document.getElementById('resetToken').value = token;
    document.getElementById('resetNewPassword').value = '';
    document.getElementById('resetConfirmPassword').value = '';
    document.getElementById('resetPasswordModal').classList.add('show');
}

function closeResetPasswordModal() {
    document.getElementById('resetPasswordModal').classList.remove('show');
}

async function resetPassword() {
    const username = document.getElementById('resetUsername').value;
    const newPassword = document.getElementById('resetNewPassword').value.trim();
    const confirmPassword = document.getElementById('resetConfirmPassword').value.trim();
    const token = document.getElementById('resetToken').value;
    
    if (!newPassword || !confirmPassword) {
        showToast("Password baru dan konfirmasi harus diisi!", "error");
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast("Password dan konfirmasi password tidak cocok!", "error");
        return;
    }
    
    if (newPassword.length < 6) {
        showToast("Password minimal 6 karakter!", "error");
        return;
    }
    
    try {
        // Cari user berdasarkan username
        const user = users.find(u => u.username === username);
        if (!user) {
            showToast("User tidak ditemukan!", "error");
            return;
        }
        
        const result = await FlowSyncAPI.updatePassword(user.id, newPassword, token);
        
        if (result.success) {
            showToast(result.message, "success");
            closeResetPasswordModal();
            
            // Kembali ke halaman login
            switchTab("login");
            document.getElementById("loginUser").value = username;
            document.getElementById("forgotEmail").value = "";
            document.getElementById("forgotMsg").textContent = "";
            
            // Tambah aktivitas
            ActivityManager.addActivity('password_reset', `Reset password untuk akun ${username}`);
        } else {
            showToast(result.message, "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan!", "error");
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
            
            // Cek notifikasi setelah menambah tugas
            setTimeout(() => {
                NotificationManager.checkAndShowDeadlineNotifications();
            }, 1000);
            
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

async function changeTaskStatus(taskId, newStatus) {
    // Cari task berdasarkan ID
    const taskIndex = currentUser.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = currentUser.tasks[taskIndex];
    const oldStatus = task.status;
    
    try {
        const result = await FlowSyncAPI.updateTask(task.id, {
            status: newStatus
        });

        if (result.success) {
            // Update local data
            currentUser.tasks[taskIndex].status = newStatus;
            
            if (newStatus === 'done' && oldStatus !== 'done') {
                currentUser.tasks[taskIndex].completed_at = new Date().toISOString();
                ActivityManager.addActivity('task_completed', `Menyelesaikan tugas: ${task.title}`);
            }

            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            showToast(`Status tugas diubah menjadi ${getStatusText(newStatus)}`, "success");
            
            // Refresh tampilan
            renderTasks(document.getElementById("view"));
            
            // Cek notifikasi setelah mengubah status
            NotificationManager.checkAndShowProductivityNotifications();
        } else {
            showToast(result.message || "Gagal mengubah status tugas!", "error");
        }
    } catch (error) {
        showToast("Terjadi kesalahan saat mengubah status!", "error");
        console.error('Error updating task status:', error);
    }
}

async function deleteTask(taskId) {
    if (confirm("Hapus tugas ini?")) {
        const taskIndex = currentUser.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = currentUser.tasks[taskIndex];
        
        ActivityManager.addActivity('task_deleted', `Menghapus tugas: ${task.title}`);
        
        try {
            const result = await FlowSyncAPI.deleteTask(task.id);
            if (result.success) {
                currentUser.tasks.splice(taskIndex, 1);
                localStorage.setItem("currentUser", JSON.stringify(currentUser));
                showToast("Tugas berhasil dihapus", "success");
                renderTasks(document.getElementById("view"));
            } else {
                showToast(result.message || "Gagal menghapus tugas!", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan saat menghapus tugas!", "error");
            console.error('Error deleting task:', error);
        }
    }
}

// ============ Edit Task Function ============
function editTask(taskId) {
    const taskIndex = currentUser.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    const task = currentUser.tasks[taskIndex];
    
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
                <label style="display: block; margin-bottom: 0.3rem; color: var(--gray); font-size: 0.8rem; padding-left: 2.5rem;">Tanggal Deadline</label>
                <i class="fas fa-calendar"></i>
                <input type="date" id="editTaskDeadline" class="input" value="${task.deadline || ''}" placeholder="Tanggal Deadline">
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
                <button class="btn" onclick="saveTaskEdit(${task.id})" style="flex: 1;">
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

async function saveTaskEdit(taskId) {
    const taskIndex = currentUser.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

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
        const result = await FlowSyncAPI.updateTask(taskId, updatedTask);

        if (result.success) {
            // Update local data
            currentUser.tasks[taskIndex] = { ...currentUser.tasks[taskIndex], ...updatedTask };
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
            
            ActivityManager.addActivity('task_updated', `Mengedit tugas: ${title}`);
            
            showToast("Tugas berhasil diperbarui!", "success");
            
            // Cek notifikasi setelah mengedit tugas
            NotificationManager.checkAndShowDeadlineNotifications();
            
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
    document.getElementById("forgotPasswordForm").classList.toggle("hidden", tab !== "forgot");
    
    document.getElementById("tab-login").classList.toggle("active", tab === "login");
    document.getElementById("tab-reg").classList.toggle("active", tab === "register");
    document.getElementById("tab-forgot").classList.toggle("active", tab === "forgot");
    
    document.getElementById("loginMsg").textContent = "";
    document.getElementById("regMsg").textContent = "";
    document.getElementById("forgotMsg").textContent = "";
    
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
    
    // Hitung tugas yang mendekati deadline
    const upcomingDeadlines = DeadlineManager.checkDeadlines();
    const overdueTasks = currentUser.tasks?.filter(task => {
        if (!task.deadline || task.status === 'done') return false;
        const taskDeadline = new Date(task.deadline);
        return taskDeadline < new Date();
    }) || [];

    // Hitung tugas dengan deadline dalam 3 hari
    const highPriorityTasks = currentUser.tasks?.filter(task => {
        if (!task.deadline || task.status === 'done') return false;
        const taskDeadline = new Date(task.deadline);
        const daysDiff = Math.ceil((taskDeadline - new Date()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 3 && daysDiff > 0;
    }) || [];

    container.innerHTML = `
        <div class="card">
            <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
            <p class="mb-3">Selamat datang kembali, ${currentUser.name}! 👋</p>
            
            ${DeadlineManager.renderDeadlineWarning()}
        </div>

        <!-- High Priority Tasks -->
        ${highPriorityTasks.length > 0 ? `
            <div class="card" style="border-left: 4px solid var(--warning);">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div class="notification-icon" style="background: #fef3c7;">
                        <i class="fas fa-exclamation" style="color: #d97706;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 0.2rem 0; color: var(--warning);">Tugas Prioritas Tinggi</h4>
                        <p style="margin: 0; font-size: 0.9rem;">
                            ${highPriorityTasks.length} tugas deadline dalam 3 hari
                        </p>
                    </div>
                </div>
                <button class="btn" onclick="showView('tasks')" style="margin-top: 1rem; width: 100%; padding: 0.8rem; background: var(--warning);">
                    <i class="fas fa-exclamation-circle"></i> Segera Kerjakan
                </button>
            </div>
        ` : ''}

        <!-- Overdue Tasks Warning -->
        ${overdueTasks.length > 0 ? `
            <div class="card overdue-notification">
                <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <div class="notification-icon" style="background: #fee2e2;">
                        <i class="fas fa-exclamation-triangle" style="color: #dc2626;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 0.2rem 0; color: var(--danger);">Tugas Terlambat!</h4>
                        <p style="margin: 0; font-size: 0.9rem;">
                            ${overdueTasks.length} tugas sudah melewati deadline
                        </p>
                    </div>
                </div>
                <button class="btn" onclick="showView('tasks')" style="margin-top: 1rem; width: 100%; padding: 0.8rem; background: var(--danger);">
                    <i class="fas fa-exclamation-circle"></i> Segera Selesaikan
                </button>
            </div>
        ` : ''}

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

        <!-- Daily Motivation -->
        <div class="card motivation-card">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div class="notification-icon" style="background: rgba(79, 70, 229, 0.1);">
                    <i class="fas fa-fire" style="color: var(--primary); font-size: 1.2rem;"></i>
                </div>
                <div>
                    <h3 style="margin: 0; color: var(--primary);">💡 Motivasi Hari Ini</h3>
                    <p style="margin: 0.3rem 0 0 0; color: var(--gray);" id="dailyMotivation">
                        "Produktivitas bukan tentang melakukan lebih banyak, tapi tentang melakukan yang penting."
                    </p>
                </div>
            </div>
            <button class="btn-secondary" onclick="showNewMotivation()" style="margin-top: 1rem; background: var(--card-bg); color: var(--primary); border: 1px solid var(--primary);">
                <i class="fas fa-sync-alt"></i> Motivasi Lainnya
            </button>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <h3><i class="fas fa-list-ul"></i> Tugas Terbaru</h3>
                ${currentUser.tasks && currentUser.tasks.length > 0 ? 
                    currentUser.tasks.slice(0, 5).map(task => {
                        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
                        const isDueToday = task.deadline && new Date(task.deadline).toDateString() === new Date().toDateString();
                        const isDueSoon = task.deadline && !isOverdue && !isDueToday && 
                                          new Date(task.deadline) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                        
                        return `
                        <div class="task-item ${isOverdue ? 'overdue-task' : isDueToday ? 'due-today-task' : isDueSoon ? 'due-soon-task' : ''}">
                            <strong style="color: var(--dark);">${task.title}</strong>
                            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--gray); margin-top: 0.3rem;">
                                <span class="status-badge ${task.status}">${getStatusText(task.status)}</span>
                                ${task.deadline ? `
                                    <span style="${isOverdue ? 'color: var(--danger);' : isDueToday ? 'color: var(--warning);' : isDueSoon ? 'color: var(--info);' : ''}">
                                        <i class="fas fa-calendar${isOverdue ? '-times' : ''}"></i> 
                                        ${formatDate(task.deadline)}
                                        ${isOverdue ? ' (Terlambat)' : ''}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `}).join('') : 
                    '<p style="text-align: center; color: var(--gray); padding: var(--spacing-md);">Belum ada tugas</p>'
                }
            </div>

            <div class="card">
                <h3><i class="fas fa-project-diagram"></i> Proyek Aktif</h3>
                ${currentUser.projects && currentUser.projects.length > 0 ? 
                    currentUser.projects.slice(0, 5).map(project => `
                        <div class="project-item">
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
                    <label style="display: block; margin-bottom: 0.3rem; color: var(--gray); font-size: 0.8rem; padding-left: 2.5rem;">Tanggal Deadline</label>
                    <i class="fas fa-calendar"></i>
                    <input type="date" id="taskDeadline" class="input" placeholder="Tanggal Deadline">
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
                filteredTasks.map((task) => {
                    // Cari index asli di array tasks untuk referensi yang benar
                    const originalIndex = currentUser.tasks.findIndex(t => t.id === task.id);
                    
                    return `
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
                                    <button class="status-btn todo-btn ${task.status === 'todo' ? 'active' : ''}" 
                                            onclick="changeTaskStatus(${task.id}, 'todo')" 
                                            title="Tandai sebagai Belum Dikerjakan"
                                            ${task.status === 'todo' ? 'disabled' : ''}>
                                        <i class="fas fa-clock"></i> Belum
                                    </button>
                                    <button class="status-btn inprogress-btn ${task.status === 'inprogress' ? 'active' : ''}" 
                                            onclick="changeTaskStatus(${task.id}, 'inprogress')" 
                                            title="Tandai sebagai Sedang Dikerjakan"
                                            ${task.status === 'inprogress' ? 'disabled' : ''}>
                                        <i class="fas fa-spinner"></i> Sedang
                                    </button>
                                    <button class="status-btn done-btn ${task.status === 'done' ? 'active' : ''}" 
                                            onclick="changeTaskStatus(${task.id}, 'done')" 
                                            title="Tandai sebagai Selesai"
                                            ${task.status === 'done' ? 'disabled' : ''}>
                                        <i class="fas fa-check"></i> Selesai
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Tombol Aksi Edit dan Delete -->
                            <div class="task-action-buttons">
                                <button class="edit-btn" onclick="editTask(${task.id})" title="Edit Tugas">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="delete-btn" onclick="deleteTask(${task.id})" title="Hapus Tugas">
                                    <i class="fas fa-trash"></i> Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                `}).join('') : 
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
                    <label style="display: block; margin-bottom: 0.3rem; color: var(--gray); font-size: 0.8rem; padding-left: 2.5rem;">Tanggal Deadline</label>
                    <i class="fas fa-calendar"></i>
                    <input type="date" id="projectDeadline" class="input" placeholder="Tanggal Deadline">
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
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${task.id}">
                            <h4>${task.title}</h4>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            ${task.deadline ? `<small><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="kanban-column inprogress" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <h3>Sedang Dikerjakan <span class="status-badge inprogress">${inProgressTasks.length}</span></h3>
                    ${inProgressTasks.map((task, index) => `
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${task.id}">
                            <h4>${task.title}</h4>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            ${task.deadline ? `<small><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</small>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div class="kanban-column done" ondrop="drop(event)" ondragover="allowDrop(event)">
                    <h3>Selesai <span class="status-badge done">${doneTasks.length}</span></h3>
                    ${doneTasks.map((task, index) => `
                        <div class="task-card" draggable="true" ondragstart="drag(event)" id="task-${task.id}">
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

// ============ App Initialization ============
function renderApp() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Update theme toggle dengan emoji yang sesuai (tanpa lonceng)
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
                    <h4><i class="fas fa-history"></i> History Notifikasi</h4>
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

    // Initialize notification system
    NotificationManager.initialize();
    
    // Tampilkan notifikasi deadline
    setTimeout(() => {
        DeadlineManager.showDeadlineNotifications();
        NotificationManager.checkAllNotifications();
    }, 2000);

    // Periksa deadline setiap 5 menit
    setInterval(() => {
        DeadlineManager.showDeadlineNotifications();
    }, 5 * 60 * 1000);

    renderUserProfile();
    ActivityManager.renderActivities();
    showView("dashboard");
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
        
        const taskId = parseInt(data.split('-')[1]);
        changeTaskStatus(taskId, newStatus);
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
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Jika deadline hari ini
    if (diffDays === 0) {
        return 'Hari ini';
    }
    // Jika deadline besok
    else if (diffDays === 1) {
        return 'Besok';
    }
    // Jika deadline kemarin
    else if (diffDays === -1) {
        return 'Kemarin';
    }
    // Jika sudah lewat
    else if (diffDays < 0) {
        return `${Math.abs(diffDays)} hari yang lalu`;
    }
    // Jika masih akan datang
    else {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('id-ID', options);
    }
}

function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = "toast show";
    
    // Tambah warna berdasarkan type
    if (type === "success") {
        toast.style.background = "var(--success)";
    } else if (type === "error") {
        toast.style.background = "var(--danger)";
    } else if (type === "warning") {
        toast.style.background = "var(--warning)";
    } else {
        toast.style.background = "var(--primary)";
    }
    
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

function logout() {
    if (confirm("Yakin ingin logout?")) {
        ActivityManager.addActivity('logout', `Logout dari akun`);
        
        // Cleanup notifications
        NotificationManager.cleanup();
        
        currentUser = null;
        localStorage.removeItem("currentUser");
        location.reload();
    }
}

// ============ App Initialization ============
function initDemoData() {
    const demoUser = users.find(u => u.username === "admin");
    
    // Buat tanggal untuk deadline hari ini (26 Desember 2025)
    const today = new Date(2025, 11, 26); // 26 Desember 2025 (month index 11 = Desember)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format tanggal untuk input date (YYYY-MM-DD)
    const formatDateForInput = (date) => {
        return date.toISOString().split('T')[0];
    };
    
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
                    title: "Laporan Bulanan Desember 2025", 
                    description: "Selesaikan laporan bulanan untuk diserahkan ke manajemen", 
                    deadline: formatDateForInput(today), // Deadline hari ini
                    status: "todo",
                    created_at: new Date(2025, 11, 25).toISOString() // Dibuat kemarin
                },
                { 
                    id: 2, 
                    title: "Presentasi Hasil Proyek Q4", 
                    description: "Persiapkan presentasi untuk rapat akhir tahun", 
                    deadline: formatDateForInput(tomorrow), // Deadline besok
                    status: "inprogress",
                    created_at: new Date(2025, 11, 20).toISOString()
                },
                { 
                    id: 3, 
                    title: "Review Kode Fitur Baru", 
                    description: "Melakukan code review untuk fitur authentication", 
                    deadline: "2025-12-28", 
                    status: "inprogress",
                    created_at: new Date(2025, 11, 22).toISOString()
                },
                { 
                    id: 4, 
                    title: "Setup Server Production", 
                    description: "Deploy aplikasi ke server production", 
                    deadline: "2025-12-24", // Deadline 2 hari yang lalu (sudah lewat)
                    status: "todo",
                    created_at: new Date(2025, 11, 15).toISOString()
                },
                { 
                    id: 5, 
                    title: "Meeting Klien Akhir Tahun", 
                    description: "Meeting evaluasi proyek dengan klien utama", 
                    deadline: "2025-12-30", 
                    status: "todo",
                    created_at: new Date(2025, 11, 10).toISOString()
                },
                { 
                    id: 6, 
                    title: "Testing Aplikasi Mobile", 
                    description: "Melakukan testing pada versi mobile aplikasi", 
                    deadline: "2025-12-27", // Deadline besok lusa
                    status: "inprogress",
                    created_at: new Date(2025, 11, 23).toISOString()
                }
            ],
            projects: [
                { 
                    id: 1, 
                    title: "Website Perusahaan - Redesign", 
                    description: "Redesign total website perusahaan dengan teknologi terbaru", 
                    deadline: "2026-01-15",
                    created_at: new Date(2025, 10, 1).toISOString()
                },
                { 
                    id: 2, 
                    title: "Aplikasi Mobile E-Commerce", 
                    description: "Pengembangan aplikasi mobile untuk platform e-commerce", 
                    deadline: "2026-02-28",
                    created_at: new Date(2025, 11, 1).toISOString()
                },
                { 
                    id: 3, 
                    title: "Sistem Manajemen Inventori", 
                    description: "Membangun sistem untuk manajemen inventori gudang", 
                    deadline: "2026-01-31",
                    created_at: new Date(2025, 10, 15).toISOString()
                }
            ],
            activities: [
                {
                    id: 1,
                    type: 'login',
                    title: 'Akun demo diinisialisasi',
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'task_added',
                    title: 'Menambahkan tugas: Laporan Bulanan Desember 2025',
                    timestamp: new Date(2025, 11, 25, 10, 30).toISOString()
                },
                {
                    id: 3,
                    type: 'task_added',
                    title: 'Menambahkan tugas: Presentasi Hasil Proyek Q4',
                    timestamp: new Date(2025, 11, 20, 14, 15).toISOString()
                },
                {
                    id: 4,
                    type: 'task_completed',
                    title: 'Menyelesaikan tugas: Setup Database',
                    timestamp: new Date(2025, 11, 24, 16, 45).toISOString()
                },
                {
                    id: 5,
                    type: 'project_added',
                    title: 'Menambahkan proyek: Aplikasi Mobile E-Commerce',
                    timestamp: new Date(2025, 11, 1, 9, 0).toISOString()
                }
            ],
            productivityStats: {
                weekly: {
                    tasksCompleted: 3,
                    tasksCreated: 8,
                    productivityScore: 38
                },
                monthly: {
                    tasksCompleted: 8,
                    tasksCreated: 15,
                    productivityScore: 53
                },
                lastUpdated: new Date().toISOString()
            },
            created_at: new Date(2025, 11, 1).toISOString()
        };

        users.push(demoData);
        localStorage.setItem("flowsync_users", JSON.stringify(users));
    }
    
    // Tambahkan juga user lain untuk testing
    const testUser = users.find(u => u.username === "user123");
    if (!testUser) {
        const testData = {
            id: 2,
            username: "user123",
            password: "password123",
            name: "John Doe",
            email: "john@example.com",
            phone: "081234567890",
            tasks: [
                {
                    id: 100,
                    title: "Belajar JavaScript Advanced",
                    description: "Mempelajari konsep advanced JavaScript",
                    deadline: "2025-12-31",
                    status: "inprogress",
                    created_at: new Date(2025, 11, 20).toISOString()
                }
            ],
            projects: [],
            activities: [],
            productivityStats: FlowSyncAPI.initializeProductivityStats(),
            created_at: new Date().toISOString()
        };
        
        users.push(testData);
        localStorage.setItem("flowsync_users", JSON.stringify(users));
    }
}

// ============ Check URL for Reset Token ============
function checkResetTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const resetToken = urlParams.get('reset_token');
    
    if (resetToken) {
        // Verifikasi token
        FlowSyncAPI.verifyResetToken(resetToken).then(result => {
            if (result.success) {
                // Tampilkan modal reset password
                openResetPasswordModal(result.username, resetToken);
                
                // Hapus token dari URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                showToast(result.message, "error");
            }
        });
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
    
    // Add new event listeners for forgot password
    document.getElementById("showForgotPassword").onclick = (e) => {
        e.preventDefault();
        switchTab("forgot");
    };
    
    document.getElementById("btnForgotPassword").onclick = handleForgotPassword;
    document.getElementById("backToLogin").onclick = (e) => {
        e.preventDefault();
        switchTab("login");
    };

    // Initialize password toggles
    initPasswordToggles();

    // Initialize date inputs
    initializeDateInputs();

    // Event listeners untuk Enter key
    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const activeTab = document.querySelector('.tab.active').id;
            if (activeTab === 'tab-login') {
                handleLogin();
            } else if (activeTab === 'tab-reg') {
                handleRegister();
            } else if (activeTab === 'tab-forgot') {
                handleForgotPassword();
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

    // Listen untuk visibility change (tab/window focus)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && currentUser) {
            // Cek notifikasi ketika user kembali ke tab
            setTimeout(() => {
                NotificationManager.checkAllNotifications();
            }, 1000);
        }
    });

    initDemoData();
    
    // Check for reset token in URL
    checkResetTokenFromURL();

    if (currentUser) {
        renderApp();
        ActivityManager.addActivity('login', `Session dilanjutkan`);
    }
});