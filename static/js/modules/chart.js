/**
 * 图表模块
 * 负责Chart.js的初始化和数据分析图表管理
 */

class ChartModule {
    constructor() {
        this.taskAnalysisChart = null;
        this.taskTypeChart = null;
    }

    /**
     * 初始化图表模块
     */
    static async init() {
        const instance = new ChartModule();
        await instance.initializeChart();
        window.ChartModule = instance;
        return instance;
    }

    /**
     * 初始化任务分析图表
     */
    async initializeChart() {
        // 任务月份统计图表已移除
        
        // 初始化任务类型统计图表
        const typeCtx = document.getElementById('taskTypeChart');
        if (!typeCtx) {
            console.error('找不到任务类型统计图表容器元素');
            return;
        }
        
        this.taskTypeChart = new Chart(typeCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '完成任务数',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',  // 横向条形图
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '完成任务数'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const taskType = context.chart.data.labels[context.dataIndex];
                                const completedCount = context.raw;
                                const avgDuration = context.chart.data.avgDurations[context.dataIndex];
                                return [`完成数量: ${completedCount}`, `平均处理时长: ${avgDuration}天`];
                            }
                        }
                    }
                }
            }
        });

        console.log('图表初始化完成');
        
        // 加载实际数据
        await this.updateAnalytics();
    }

    /**
     * 更新分析数据
     */
    async updateAnalytics() {
        try {
            // 获取月度分析数据（仅用于更新本月完成和平均用时）
            const response = await fetch('/api/analytics');
            if (response.ok) {
                const data = await response.json();
                this.updateStatistics(data);
            }
            
            // 获取任务类型统计数据
            const statsResponse = await fetch('/api/analytics/statistics');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                this.updateTaskTypeChart(statsData);
            }
        } catch (error) {
            console.error('加载分析数据失败:', error);
        }
    }
    
    /**
     * 更新任务类型统计图表
     */
    updateTaskTypeChart(data) {
        if (!this.taskTypeChart || !data.task_types) return;
        
        const taskTypes = data.task_types;
        const labels = [];
        const completedCounts = [];
        const avgDurations = [];
        
        // 提取数据
        Object.entries(taskTypes).forEach(([type, stats]) => {
            labels.push(type);
            completedCounts.push(stats.completed);
            avgDurations.push(stats.avg_duration);
        });
        
        // 更新图表数据
        this.taskTypeChart.data.labels = labels;
        this.taskTypeChart.data.datasets[0].data = completedCounts;
        // 存储平均处理时长数据用于tooltip显示
        this.taskTypeChart.data.avgDurations = avgDurations;
        
        // 更新图表
        this.taskTypeChart.update();
    }

    /**
     * 加载模拟分析数据
     */
    async loadMockAnalytics() {
        try {
            // 获取任务数据进行分析
            const response = await fetch('/api/tasks');
            const tasks = await response.json();
            
            const analytics = this.calculateAnalytics(tasks);
            this.updateChartData(analytics);
            this.updateStatistics(analytics);
        } catch (error) {
            console.error('加载模拟分析数据失败:', error);
        }
    }

    /**
     * 计算分析数据
     */
    calculateAnalytics(tasks) {
        const now = new Date();
        const monthlyData = {};
        const statusCounts = { pending: 0, in_progress: 0, completed: 0 };
        const typeCounts = {};
        const priorityCounts = { high: 0, medium: 0, low: 0 };

        // 初始化最近6个月的数据
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[key] = { completed: 0, created: 0 };
        }

        tasks.forEach(task => {
            // 统计状态
            statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
            
            // 统计类型
            typeCounts[task.task_type] = (typeCounts[task.task_type] || 0) + 1;
            
            // 统计优先级
            priorityCounts[task.priority] = (priorityCounts[task.priority] || 0) + 1;
            
            // 统计月度数据
            if (task.start_date) {
                const startDate = new Date(task.start_date);
                const startKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[startKey]) {
                    monthlyData[startKey].created++;
                }
            }
            
            // 如果任务已完成，统计完成月份
            if (task.status === 'completed' && task.updated_at) {
                const completedDate = new Date(task.updated_at);
                const completedKey = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[completedKey]) {
                    monthlyData[completedKey].completed++;
                }
            }
        });

        return {
            monthlyData,
            statusCounts,
            typeCounts,
            priorityCounts,
            totalTasks: tasks.length
        };
    }

    /**
     * 更新统计信息
     */
    updateStatistics(analytics) {
        // 更新状态统计
        this.updateStatusStats(analytics.statusCounts);
        
        // 更新类型统计
        this.updateTypeStats(analytics.typeCounts);
        
        // 更新优先级统计
        this.updatePriorityStats(analytics.priorityCounts);
        
        // 更新总体统计
        this.updateOverallStats(analytics);
        
        // 更新本月完成和上月对比数据
        this.updateMonthlyCompletedStats(analytics);
    }
    
    /**
     * 更新本月完成和上月对比数据
     */
    updateMonthlyCompletedStats(analytics) {
        // 更新本月完成数量
        const monthlyCompletedEl = document.getElementById('monthlyCompleted');
        if (monthlyCompletedEl) {
            monthlyCompletedEl.textContent = analytics.monthly_completed || 0;
        }
        
        // 更新上月完成数量
        const lastMonthCompletedEl = document.getElementById('lastMonthCompleted');
        if (lastMonthCompletedEl) {
            lastMonthCompletedEl.textContent = `上月: ${analytics.last_month_completed || 0}`;
        }
        
        // 更新环比变化
        const monthCompareChangeEl = document.getElementById('monthCompareChange');
        if (monthCompareChangeEl) {
            const change = analytics.month_over_month_change || 0;
            const isPositive = change > 0;
            const changeText = isPositive ? `+${change}%` : `${change}%`;
            
            monthCompareChangeEl.textContent = changeText;
            monthCompareChangeEl.className = `ms-2 badge ${isPositive ? 'bg-success' : 'bg-danger'}`;
            monthCompareChangeEl.innerHTML = `${isPositive ? '↑' : '↓'} ${Math.abs(change)}%`;
            
            // 如果变化为0，使用灰色背景
            if (change === 0) {
                monthCompareChangeEl.className = 'ms-2 badge bg-secondary';
                monthCompareChangeEl.innerHTML = '0%';
            }
        }
        
        // 平均用时显示已移除
        
        // 更新专家等级和专长任务类型
        const expertLevelEl = document.getElementById('expertLevel');
        if (expertLevelEl) {
            const totalCompleted = analytics.total_completed || 0;
            const topTaskType = analytics.top_task_type || '未知';
            expertLevelEl.textContent = `专家等级：LV ${totalCompleted}，当前是 ${topTaskType} 专家`;
        }
    }

    /**
     * 更新状态统计
     */
    updateStatusStats(statusCounts) {
        const statusStatsEl = document.getElementById('statusStats');
        if (statusStatsEl) {
            statusStatsEl.innerHTML = `
                <div class="row text-center">
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-secondary">${statusCounts.pending || 0}</div>
                            <div class="stat-label">未开始</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-primary">${statusCounts.in_progress || 0}</div>
                            <div class="stat-label">进行中</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-success">${statusCounts.completed || 0}</div>
                            <div class="stat-label">已完成</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 更新类型统计
     */
    updateTypeStats(typeCounts) {
        const typeStatsEl = document.getElementById('typeStats');
        if (typeStatsEl) {
            const typeItems = Object.entries(typeCounts)
                .map(([type, count]) => `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>${type}</span>
                        <span class="badge bg-primary">${count}</span>
                    </div>
                `).join('');
            
            typeStatsEl.innerHTML = typeItems || '<div class="text-muted">暂无数据</div>';
        }
    }

    /**
     * 更新优先级统计
     */
    updatePriorityStats(priorityCounts) {
        const priorityStatsEl = document.getElementById('priorityStats');
        if (priorityStatsEl) {
            priorityStatsEl.innerHTML = `
                <div class="row text-center">
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-danger">${priorityCounts.high || 0}</div>
                            <div class="stat-label">高优先级</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-warning">${priorityCounts.medium || 0}</div>
                            <div class="stat-label">中优先级</div>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="stat-item">
                            <div class="stat-number text-info">${priorityCounts.low || 0}</div>
                            <div class="stat-label">低优先级</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 更新总体统计
     */
    updateOverallStats(analytics) {
        const totalTasksEl = document.getElementById('totalTasks');
        if (totalTasksEl) {
            totalTasksEl.textContent = analytics.totalTasks || 0;
        }
        
        const completionRateEl = document.getElementById('completionRate');
        if (completionRateEl && analytics.totalTasks > 0) {
            const rate = Math.round((analytics.statusCounts.completed / analytics.totalTasks) * 100);
            completionRateEl.textContent = `${rate}%`;
        }
    }

    /**
     * 获取图表实例
     */
    getChart() {
        return this.taskAnalysisChart;
    }

    /**
     * 销毁图表
     */
    destroy() {
        if (this.taskAnalysisChart) {
            this.taskAnalysisChart.destroy();
            this.taskAnalysisChart = null;
        }
    }

    /**
     * 重新渲染图表
     */
    render() {
        if (this.taskAnalysisChart) {
            this.taskAnalysisChart.update();
        }
    }
}

// 导出图表模块
// ChartModule实例通过ChartModule.init()方法设置到window.ChartModule
// 不需要在这里设置类本身