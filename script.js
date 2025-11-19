 // --- State Management ---
        let timerInterval;
        let startTime;
        let elapsedTime = 0;
        let isRunning = false;
        let sessions = JSON.parse(localStorage.getItem('focusSessions')) || [];
        let myChart = null;

        // --- DOM Elements ---
        const display = document.getElementById('timerDisplay');
        const statusText = document.getElementById('statusText');
        const taskInput = document.getElementById('taskInput');
        const toggleBtn = document.getElementById('btn-toggle');
        const toggleIcon = document.getElementById('icon-toggle');
        const toggleText = document.getElementById('text-toggle');
        const timerCircle = document.getElementById('timer-circle');
        const sessionListEl = document.getElementById('sessionList');

        // --- Initialization ---
        window.onload = () => {
            renderSessions();
            updateStats();
        };

        // --- Timer Logic ---
        function toggleTimer() {
            if (isRunning) {
                pauseTimer();
            } else {
                startTimer();
            }
        }

        function startTimer() {
            if (!taskInput.value.trim()) {
                // Simple shake animation for validation
                taskInput.classList.add('ring-2', 'ring-red-400');
                setTimeout(() => taskInput.classList.remove('ring-2', 'ring-red-400'), 500);
                taskInput.focus();
                return;
            }

            isRunning = true;
            startTime = Date.now() - elapsedTime;
            
            // UI Updates
            toggleBtn.classList.replace('bg-blue-600', 'bg-amber-500');
            toggleBtn.classList.replace('hover:bg-blue-700', 'hover:bg-amber-600');
            toggleIcon.classList.replace('fa-play', 'fa-pause');
            toggleText.innerText = "Pause";
            statusText.innerText = "FOCUSING...";
            statusText.classList.add('text-blue-500');
            timerCircle.classList.add('border-blue-500', 'timer-active');
            timerCircle.classList.remove('border-slate-100');

            timerInterval = setInterval(() => {
                elapsedTime = Date.now() - startTime;
                updateDisplay(elapsedTime);
            }, 100); // Update every 100ms for smoothness
        }

        function pauseTimer() {
            isRunning = false;
            clearInterval(timerInterval);
            
            // UI Updates
            toggleBtn.classList.replace('bg-amber-500', 'bg-blue-600');
            toggleBtn.classList.replace('hover:bg-amber-600', 'hover:bg-blue-700');
            toggleIcon.classList.replace('fa-pause', 'fa-play');
            toggleText.innerText = "Resume";
            statusText.innerText = "PAUSED";
            statusText.classList.remove('text-blue-500');
            timerCircle.classList.remove('timer-active');
        }

        function stopTimer() {
            if (elapsedTime === 0) return;

            pauseTimer();
            
            // Save Session
            const session = {
                id: Date.now(),
                task: taskInput.value,
                duration: elapsedTime,
                date: new Date().toISOString()
            };
            
            sessions.unshift(session); // Add to top
            localStorage.setItem('focusSessions', JSON.stringify(sessions));

            // Reset State
            elapsedTime = 0;
            updateDisplay(0);
            taskInput.value = "";
            toggleText.innerText = "Start";
            statusText.innerText = "READY TO FOCUS";
            timerCircle.classList.remove('border-blue-500');
            timerCircle.classList.add('border-slate-100');

            renderSessions();
            updateStats();
        }

        function updateDisplay(timeInMs) {
            const totalSeconds = Math.floor(timeInMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const fH = hours.toString().padStart(2, '0');
            const fM = minutes.toString().padStart(2, '0');
            const fS = seconds.toString().padStart(2, '0');

            display.innerText = `${fH}:${fM}:${fS}`;
        }

        // --- UI Logic ---
        function renderSessions() {
            sessionListEl.innerHTML = '';
            
            if (sessions.length === 0) {
                sessionListEl.innerHTML = '<div class="text-center text-gray-400 text-sm py-4">No recent sessions</div>';
                return;
            }

            // Show only last 5
            sessions.slice(0, 5).forEach(session => {
                const durationSec = Math.floor(session.duration / 1000);
                const mins = Math.floor(durationSec / 60);
                const secs = durationSec % 60;
                const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                
                const el = document.createElement('div');
                el.className = 'bg-white p-3 rounded border border-gray-100 flex justify-between items-center text-sm shadow-sm';
                el.innerHTML = `
                    <div class="flex items-center gap-3 overflow-hidden">
                        <div class="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                        <span class="font-medium text-slate-700 truncate">${session.task}</span>
                    </div>
                    <span class="font-mono text-gray-500 text-xs shrink-0">${timeStr}</span>
                `;
                sessionListEl.appendChild(el);
            });
        }

        function switchTab(tab) {
            const trackerBtn = document.getElementById('tab-tracker');
            const analyticsBtn = document.getElementById('tab-analytics');
            const trackerView = document.getElementById('view-tracker');
            const analyticsView = document.getElementById('view-analytics');

            if (tab === 'tracker') {
                trackerView.classList.remove('hidden');
                analyticsView.classList.add('hidden');
                
                trackerBtn.className = "flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 hover:bg-gray-50 transition-colors";
                analyticsBtn.className = "flex-1 py-3 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors";
            } else {
                trackerView.classList.add('hidden');
                analyticsView.classList.remove('hidden');
                analyticsView.classList.add('flex');
                
                trackerBtn.className = "flex-1 py-3 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-gray-50 transition-colors";
                analyticsBtn.className = "flex-1 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 hover:bg-gray-50 transition-colors";
                
                renderChart();
            }
        }

        function clearData() {
            if(confirm("Are you sure you want to clear all data? This is just a prototype, but still...")) {
                localStorage.removeItem('focusSessions');
                sessions = [];
                elapsedTime = 0;
                pauseTimer();
                updateDisplay(0);
                renderSessions();
                updateStats();
                if(myChart) {
                    myChart.destroy();
                    myChart = null;
                }
            }
        }

        // --- Analytics Logic ---
        function updateStats() {
            const totalMs = sessions.reduce((acc, curr) => acc + curr.duration, 0);
            const totalSeconds = Math.floor(totalMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            
            document.getElementById('totalTimeDisplay').innerText = `${hours}h ${minutes}m`;
            document.getElementById('totalSessionsDisplay').innerText = sessions.length;
        }

        function renderChart() {
            const ctx = document.getElementById('productivityChart').getContext('2d');
            
            // Group sessions by Task Name for the chart
            const taskData = {};
            sessions.forEach(s => {
                // Normalize task name case
                const name = s.task.trim();
                if (!taskData[name]) taskData[name] = 0;
                taskData[name] += (s.duration / 1000 / 60); // in minutes
            });

            const labels = Object.keys(taskData);
            const data = Object.values(taskData);

            // Add some dummy data if empty so the chart looks cool for the demo
            if (labels.length === 0) {
                labels.push("Email", "Coding", "Meetings");
                data.push(15, 45, 30);
            }

            if (myChart) {
                myChart.destroy();
            }

            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Time Spent (Minutes)',
                        data: data,
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.6)',
                            'rgba(16, 185, 129, 0.6)',
                            'rgba(245, 158, 11, 0.6)',
                            'rgba(99, 102, 241, 0.6)'
                        ],
                        borderColor: [
                            'rgba(59, 130, 246, 1)',
                            'rgba(16, 185, 129, 1)',
                            'rgba(245, 158, 11, 1)',
                            'rgba(99, 102, 241, 1)'
                        ],
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                                drawBorder: false,
                                color: '#f3f4f6'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }