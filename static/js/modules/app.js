/**
 * 应用程序主模块
 * 负责应用初始化和全局状态管理
 */

class App {
    constructor() {
        this.calendar = null;
        this.taskAnalysisChart = null;
        this.currentTaskId = null;
        this.currentWorkflows = [];
        this.editingWorkflowId = null;
        this.currentWorkflowForSteps = null;
        
        // 初始化模块实例
        this.utils = new Utils();
    }

    /**
     * 初始化应用程序
     */
    async init() {
        try {
            // 等待FullCalendar库加载完成
            await this.waitForFullCalendar();
            
            // 初始化日历
            this.calendarModule = await CalendarModule.init();
            this.calendar = this.calendarModule.getCalendar();

            // 初始化图表
            this.chartModule = await ChartModule.init();
            this.taskAnalysisChart = this.chartModule.getChart();

            // 加载初始数据
            await this.loadInitialData();

            // 初始化事件监听器
            this.initEventListeners();
            this.initModalEvents();

            console.log('应用程序初始化完成');
        } catch (error) {
            console.error('应用程序初始化失败:', error);
        }
    }

    /**
     * 等待FullCalendar库加载完成
     */
    async waitForFullCalendar() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 最多等待5秒
            
            const checkFullCalendar = () => {
                if (typeof FullCalendar !== 'undefined') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('FullCalendar库加载超时'));
                } else {
                    attempts++;
                    setTimeout(checkFullCalendar, 100);
                }
            };
            
            checkFullCalendar();
        });
    }

    /**
     * 加载初始数据
     */
    async loadInitialData() {
        try {
            // 初始化模块实例
            this.taskModule = TaskModule.init();
            this.issueModule = IssueModule.init();
            this.workflowModule = WorkflowModule.init();
            
            await Promise.all([
                this.taskModule.loadTasks(),
                this.issueModule.loadIssues(),
                this.workflowModule.loadWorkflows()
            ]);
            
            // 初始化公告栏
            if (this.issueModule && this.issueModule.initAnnouncementBar) {
                this.issueModule.initAnnouncementBar();
            }
        } catch (error) {
            console.error('加载初始数据失败:', error);
        }
    }

    /**
     * 初始化全局事件监听器
     */
    initEventListeners() {
        // 任务类型改变事件
        const taskTypeSelect = document.getElementById('taskType');
        if (taskTypeSelect) {
            taskTypeSelect.addEventListener('change', () => {
                if (window.TaskModule) {
                    window.TaskModule.updateTaskStatusOptions();
                }
            });
        }

        // 开始日期和截止日期改变事件
        const startDateInput = document.getElementById('taskStartDate');
        const deadlineInput = document.getElementById('taskDeadline');
        
        if (startDateInput) {
            startDateInput.addEventListener('change', TaskModule.calculateTaskStatus);
        }
        if (deadlineInput) {
            deadlineInput.addEventListener('change', TaskModule.calculateTaskStatus);
        }

        // 工作流选择器事件
        const workflowSelect = document.getElementById('workflowSelect');
        if (workflowSelect) {
            workflowSelect.addEventListener('change', (e) => {
                const taskType = e.target.value;
                if (taskType) {
                    window.WorkflowModule.loadWorkflowSteps(taskType);
                }
            });
        }

        // 模态框事件
        this.initModalEvents();
    }

    /**
     * 初始化模态框事件
     */
    initModalEvents() {
        // 任务列表模态框
        const taskListModal = document.getElementById('taskListModal');
        if (taskListModal) {
            taskListModal.addEventListener('show.bs.modal', () => {
                if (window.TaskModule) {
                    window.TaskModule.loadTaskList();
                }
            });
        }
        
        // 任务详情模态框关闭时隐藏蒙版并刷新任务列表
        const taskDetailsModal = document.getElementById('taskDetailsModal');
        if (taskDetailsModal) {
            taskDetailsModal.addEventListener('hidden.bs.modal', () => {
                const overlay = document.getElementById('taskDetailOverlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
                
                // 刷新任务列表
                if (typeof refreshTaskList === 'function') {
                    refreshTaskList();
                }
            });
        }

        // 问题清单模态框
        const issueListModal = document.getElementById('issueListModal');
        if (issueListModal) {
            issueListModal.addEventListener('show.bs.modal', async () => {
                if (window.IssueModule) {
                    await window.IssueModule.loadIssues();
                    window.IssueModule.displayIssueListTabs();
                }
            });
        }
        
        // 添加任务模态框
        const addTaskModal = document.getElementById('addTaskModal');
        if (addTaskModal) {
            addTaskModal.addEventListener('show.bs.modal', () => {
                // 自动设置默认任务类型
                this.setDefaultTaskType();
                
                // 设置开始日期默认为当前时间
                const now = new Date();
                // 格式化为datetime-local所需的格式：YYYY-MM-DDThh:mm
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
                
                // 设置开始日期输入框的值
                const startDateInput = document.getElementById('taskStartDate');
                if (startDateInput) {
                    startDateInput.value = formattedDateTime;
                }
            });
        }

        // 确认完成任务按钮
        const confirmCompleteBtn = document.getElementById('confirmCompleteTaskBtn');
        if (confirmCompleteBtn) {
            confirmCompleteBtn.addEventListener('click', () => {
                if (window.TaskModule) {
                    window.TaskModule.executeCompleteTask();
                }
            });
        }
        
        // 确认删除任务按钮
        const confirmDeleteBtn = document.getElementById('confirmDeleteTaskBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                if (window.TaskModule) {
                    window.TaskModule.executeDeleteTask();
                }
            });
        }
    }
    
    /**
     * 设置默认任务类型
     * 当打开添加任务模态框时，自动将任务类型设置为配置的默认值
     */
    setDefaultTaskType() {
        const taskTypeSelect = document.getElementById('taskType');
        if (!taskTypeSelect) return;
        
        // 如果已经选择了值，不进行覆盖
        if (taskTypeSelect.value) return;
        
        // 获取默认工作流
        if (window.WorkflowModule && typeof window.WorkflowModule.getDefaultWorkflow === 'function') {
            const defaultWorkflow = window.WorkflowModule.getDefaultWorkflow();
            if (defaultWorkflow && defaultWorkflow.name) {
                // 查找对应的选项并设置
                for (let i = 0; i < taskTypeSelect.options.length; i++) {
                    if (taskTypeSelect.options[i].value === defaultWorkflow.name) {
                        taskTypeSelect.value = defaultWorkflow.name;
                        // 触发change事件以更新相关UI
                        taskTypeSelect.dispatchEvent(new Event('change'));
                        console.log('已自动设置默认任务类型:', defaultWorkflow.name);
                        break;
                    }
                }
            }
        }
    }

    /**
     * 获取当前任务ID
     */
    getCurrentTaskId() {
        return this.currentTaskId;
    }

    /**
     * 设置当前任务ID
     */
    setCurrentTaskId(taskId) {
        this.currentTaskId = taskId;
    }

    /**
     * 获取日历实例
     */
    getCalendar() {
        return this.calendar;
    }

    /**
     * 获取图表实例
     */
    getChart() {
        return this.taskAnalysisChart;
    }
}

// 创建全局应用实例
const app = new App();

// 导出应用实例
window.App = app;

// 注意：模块实例通过各自的init()方法设置到全局变量
// 不需要在这里重复设置，因为会覆盖正确的实例