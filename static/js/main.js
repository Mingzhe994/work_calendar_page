/**
 * 主应用程序入口文件
 * 使用模块化架构重构
 */

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用程序（使用全局app实例）
    if (window.App) {
        window.App.init();
        console.log('应用程序初始化完成');
    } else {
        console.error('App实例未找到');
    }
});

// 兼容性函数 - 保持向后兼容
// 这些函数将调用相应的模块方法

// 问题管理相关函数
function showIssueList() {
    return window.IssueModule.showIssueList();
}

function showIssueDetails(issueId) {
    return window.IssueModule.showIssueDetails(issueId);
}

function refreshIssueList() {
    return window.IssueModule.loadIssues();
}

function addSolution() {
    return window.IssueModule.addSolution();
}

function markSolutionSuccessful(index) {
    return window.IssueModule.markSolutionSuccessful(index);
}

function markIssueResolved() {
    return window.IssueModule.markIssueResolved();
}

// 任务相关函数
function addTask() {
    return window.TaskModule.addTask();
}

function validateDates() {
    const startDate = document.getElementById('taskStartDate').value;
    const deadline = document.getElementById('taskDeadline').value;
    const startDateInput = document.getElementById('taskStartDate');
    const deadlineInput = document.getElementById('taskDeadline');
    const feedbackElement = document.getElementById('dateValidationFeedback');
    
    if (startDate && deadline && new Date(startDate) > new Date(deadline)) {
        startDateInput.classList.add('is-invalid');
        deadlineInput.classList.add('is-invalid');
        feedbackElement.style.display = 'block';
        return false;
    } else {
        startDateInput.classList.remove('is-invalid');
        deadlineInput.classList.remove('is-invalid');
        feedbackElement.style.display = 'none';
        return true;
    }
}

function showTaskDetails(event) {
    return window.TaskModule.showTaskDetails(event);
}

// 状态更新功能已统一到changeTaskStatus函数中

function executeCompleteTask() {
    return window.TaskModule.executeCompleteTask();
}

function loadTaskList() {
    return window.TaskModule.loadTaskList();
}

function refreshTaskList() {
    return window.TaskModule.loadTaskList();
}

function showTaskDetailsFromList(taskId) {
    return window.TaskModule.showTaskDetailsFromList(taskId);
}



function changeTaskStatus(newStatus) {
    return window.TaskModule.changeTaskStatus(newStatus);
}

function addReviewComment() {
    return window.TaskModule.addReviewComment();
}

function addReviewCommentCompleted() {
    return window.TaskModule.addReviewCommentCompleted();
}

// 问题相关函数
function addIssue() {
    return window.IssueModule.addIssue();
}

function resolveIssue(issueId) {
    return window.IssueModule.resolveIssue(issueId);
}

// 工作流相关函数
function loadWorkflows() {
    return window.WorkflowModule.loadWorkflows();
}

function loadWorkflowSteps(workflowId) {
    return window.WorkflowModule.loadWorkflowSteps(workflowId);
}

function showWorkflowListView() {
    return window.WorkflowModule.showWorkflowListView();
}

function showWorkflowSteps(workflowId) {
    return window.WorkflowModule.showWorkflowSteps(workflowId);
}

function backToWorkflowList() {
    return window.WorkflowModule.backToWorkflowList();
}

function showWorkflowForm() {
    return window.WorkflowModule.showWorkflowForm();
}

function hideWorkflowForm() {
    return window.WorkflowModule.hideWorkflowForm();
}

function showCreateWorkflowForm() {
    return window.WorkflowModule.showCreateWorkflowForm();
}

function editWorkflow(workflowId) {
    return window.WorkflowModule.editWorkflow(workflowId);
}

function saveWorkflow() {
    return window.WorkflowModule.saveWorkflow();
}

function deleteWorkflow(workflowId) {
    return window.WorkflowModule.deleteWorkflow(workflowId);
}

function setDefaultWorkflow(workflowId) {
    return window.WorkflowModule.setDefaultWorkflow(workflowId);
}

// 工具函数
function escapeHtml(text) {
    return window.Utils.escapeHtml(text);
}

function formatDateTime(dateTimeString) {
    return window.Utils.formatDateTime(dateTimeString);
}

function getPriorityColor(priority) {
    return window.Utils.getPriorityColor(priority);
}

function getPriorityColorHex(priority) {
    return window.Utils.getPriorityColorHex(priority);
}

function getPriorityText(priority) {
    return window.Utils.getPriorityText(priority);
}

function getPriorityBadge(priority) {
    return window.Utils.getPriorityBadge(priority);
}

function getStatusText(status) {
    return window.Utils.getStatusText(status);
}

function getStatusBadge(status) {
    return window.Utils.getStatusBadge(status);
}

function getStatusBadgeClass(status) {
    return window.Utils.getStatusBadgeClass(status);
}

function getTypeBadge(taskType) {
    return window.Utils.getTypeBadge(taskType);
}

function getProgressBarClass(percentage) {
    return window.Utils.getProgressBarClass(percentage);
}

function getProgressOptions(taskType) {
    return window.Utils.getProgressOptions(taskType);
}

function getTaskProgressPercentage(task) {
    return window.Utils.getTaskProgressPercentage(task);
}

// 其他兼容性函数
function updateTaskProgressOptions(taskType, progressSelectId) {
    // 兼容性函数，可能需要根据具体实现调整
    const progressSelect = document.getElementById(progressSelectId);
    if (progressSelect) {
        const options = Utils.getProgressOptions(taskType);
        progressSelect.innerHTML = options.map(option => 
            `<option value="${option.value}">${option.text}</option>`
        ).join('');
    }
}

function updateTaskStatusOptions() {
    // 兼容性函数，可能需要根据具体实现调整
    console.log('更新任务状态选项');
}

function handleStatusChange(statusSelectId, progressSelectId) {
    // 兼容性函数，可能需要根据具体实现调整
    console.log('处理状态变更');
}



function calculateTaskStatus() {
    // 兼容性函数，可能需要根据具体实现调整
    console.log('计算任务状态');
}

function updateAnalytics() {
    // 兼容性函数，可能需要根据具体实现调整
    if (window.ChartModule) {
        ChartModule.updateAnalytics();
    }
}

function refreshTaskHistory() {
    // 兼容性函数，可能需要根据具体实现调整
    console.log('刷新任务历史');
}

function updateStatusButtons(currentStatus) {
    // 兼容性函数，可能需要根据具体实现调整
    console.log('更新状态按钮:', currentStatus);
}

// 全局变量兼容性
let calendar;
let taskAnalysisChart;
let currentTaskId = null;
let currentWorkflows = [];
let editingWorkflowId = null;
let currentWorkflowForSteps = null;

// 加载主页面工作流选择器
async function loadMainPageWorkflows() {
    try {
        const response = await fetch('/api/workflows');
        const data = await response.json();
        const workflows = data.workflows || []; // 正确获取workflows数组
        
        const workflowSelect = document.getElementById('workflowSelect');
        if (workflowSelect) {
            workflowSelect.innerHTML = '<option value="">选择工作类型</option>';
            workflows.forEach(workflow => {
                const option = document.createElement('option');
                option.value = workflow.name; // 使用工作流名称作为值
                option.textContent = workflow.name;
                workflowSelect.appendChild(option);
            });
        }
        
        console.log('主页面工作流选择器加载完成，共加载', workflows.length, '个工作流');
    } catch (error) {
        console.error('加载工作流失败:', error);
    }
}

// 加载主页面工作流步骤（通过名称）
async function loadMainPageWorkflowSteps(workflowName) {
    const workflowStepsContainer = document.getElementById('workflowSteps');
    if (!workflowStepsContainer) return;
    
    if (!workflowName) {
        workflowStepsContainer.innerHTML = '<div class="text-center text-muted py-4">请选择工作流查看步骤</div>';
        return;
    }
    
    try {
        const response = await fetch(`/api/workflows/${encodeURIComponent(workflowName)}/steps`);
        const steps = await response.json();
        
        if (steps.length === 0) {
            workflowStepsContainer.innerHTML = '<div class="text-center text-muted py-4">该工作流暂无步骤</div>';
            return;
        }
        
        // 创建可视化的工作流步骤展示
        const stepsHtml = `
            <div class="workflow-visualization">
                <div class="workflow-header">
                    <h5 class="workflow-title">工作流程步骤 (共${steps.length}步)</h5>
                </div>
                <div class="workflow-steps-container">
                    ${steps.map((step, index) => `
                        <div class="workflow-step-container">
                            <div class="workflow-step-visual">
                                <div class="step-circle">
                                    <div class="step-number">${index + 1}</div>
                                </div>
                                <div class="step-content">
                                    <div class="step-title">第${index + 1}步：${escapeHtml(step.title || step.name || '未命名步骤')}</div>
                                    ${step.description ? `<div class="step-description">${escapeHtml(step.description)}</div>` : ''}
                                </div>
                            </div>
                            ${index < steps.length - 1 ? `
                                <div class="step-arrow">
                                    <i class="fas fa-arrow-right"></i>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>`;
        
        workflowStepsContainer.innerHTML = stepsHtml;
        console.log('工作流步骤加载完成');
    } catch (error) {
        console.error('加载工作流步骤失败:', error);
        workflowStepsContainer.innerHTML = '<div class="text-center text-danger py-4">加载步骤失败，请重试</div>';
    }
}

// 事件监听器设置
document.addEventListener('DOMContentLoaded', function() {
    // 加载主页面工作流选择器
    loadMainPageWorkflows();
    
    // 工作流选择器事件
    const workflowSelect = document.getElementById('workflowSelect');
    if (workflowSelect) {
        workflowSelect.addEventListener('change', function() {
            loadMainPageWorkflowSteps(this.value);
        });
    }
    
    // 进展选择器事件
    const detailProgress = document.getElementById('detailProgress');
    if (detailProgress) {
        detailProgress.addEventListener('change', function() {
            // 自动更新任务进展状态
            if (window.TaskModule && window.TaskModule.updateTaskStatus) {
                window.TaskModule.updateTaskStatus();
            }
        });
    }
    
    // 任务状态选择器事件
    const detailCurrentStatus = document.getElementById('detailCurrentStatus');
    if (detailCurrentStatus) {
        detailCurrentStatus.addEventListener('change', function() {
            handleStatusChange('detailCurrentStatus', 'detailProgress');
        });
    }
    
    // 设置开始日期默认值为今天
    const taskStartDate = document.getElementById('taskStartDate');
    if (taskStartDate) {
        const today = new Date().toISOString().split('T')[0];
        taskStartDate.value = today;
    }
});

console.log('主应用程序文件加载完成');