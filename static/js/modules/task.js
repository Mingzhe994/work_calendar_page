/**
 * 任务管理模块
 * 负责任务的增删改查和状态管理
 */

class TaskModule {
    constructor() {
        this.currentTaskId = null;
    }

    /**
     * 初始化任务模块
     */
    static init() {
        const instance = new TaskModule();
        window.TaskModule = instance;
        return instance;
    }

    /**
     * 加载任务列表
     */
    async loadTasks() {
        try {
            const response = await fetch('/api/tasks?exclude_completed=true');
            const tasks = await response.json();
            
            // 更新日历
            if (window.CalendarModule) {
                await window.CalendarModule.refreshEvents();
            }
            
            console.log('任务加载完成');
            return tasks;
        } catch (error) {
            console.error('加载任务失败:', error);
            Utils.showError('加载任务失败，请重试');
            return [];
        }
    }

    /**
     * 加载任务列表（用于任务列表模态框）
     */
    async loadTaskList() {
        try {
            // 加载所有任务（包括已完成的）
            const [pendingResponse, completedResponse] = await Promise.all([
                fetch('/api/tasks?exclude_completed=true'),
                fetch('/api/tasks?status=completed')
            ]);
            
            const pendingTasks = await pendingResponse.json();
            const completedTasks = await completedResponse.json();
            
            // 对已完成任务按完成日期从新到旧排序
            completedTasks.sort((a, b) => {
                if (!a.completed_at) return 1;
                if (!b.completed_at) return -1;
                return new Date(b.completed_at) - new Date(a.completed_at);
            });
            
            // 显示未完成任务
            this.displayTaskList(pendingTasks, 'pendingTasksList');
            
            // 显示已完成任务
            this.displayTaskList(completedTasks, 'completedTasksList');
            
            // 更新计数
            this.updateTaskCounts(pendingTasks.length, completedTasks.length);
            
            console.log('任务列表加载完成');
        } catch (error) {
            console.error('加载任务列表失败:', error);
            Utils.showError('加载任务列表失败，请重试');
        }
    }

    /**
     * 显示任务列表
     */
    displayTaskList(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = '<div class="text-center text-muted py-4">暂无任务</div>';
            return;
        }
        
        const tasksHtml = tasks.map(task => this.createTaskListItem(task)).join('');
        container.innerHTML = tasksHtml;
    }

    /**
     * 更新任务计数
     */
    updateTaskCounts(pendingCount, completedCount) {
        const pendingCountElement = document.getElementById('pendingCount');
        const completedCountElement = document.getElementById('completedCount');
        
        if (pendingCountElement) {
            pendingCountElement.textContent = pendingCount;
        }
        
        if (completedCountElement) {
            completedCountElement.textContent = completedCount;
        }
    }



    /**
     * 创建任务列表项
     */
    createTaskListItem(task) {
        const progressPercentage = Utils.getTaskProgressPercentage(task);
        const progressBarClass = Utils.getProgressBarClass(progressPercentage);
        
        return `
            <div class="task-list-item border rounded p-3 mb-3 fade-in cursor-pointer" data-task-id="${task.id}" onclick="window.TaskModule.showTaskDetailsFromList(${task.id})">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="mb-0">${Utils.escapeHtml(task.title)}</h6>
                            <div class="d-flex gap-1 ms-auto">
                                ${Utils.getTypeBadge(task.task_type)}
                                ${task.status !== 'completed' ? Utils.getStatusBadge(task.status, task.is_overdue) : ''}
                                ${task.status !== 'completed' ? Utils.getPriorityBadge(task.priority) : ''}
                            </div>
                        </div>
                        ${task.progress ? `<small class="text-info">当前进展: ${task.progress}</small>` : ''}
                    </div>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${progressBarClass}" role="progressbar" 
                         style="width: ${progressPercentage}%" 
                         aria-valuenow="${progressPercentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                <div class="d-flex justify-content-between mt-2">
                    <small class="text-muted">
                        ${task.start_date ? `开始: ${task.start_date}` : ''}
                    </small>
                    <small class="text-muted">
                        ${task.status === 'completed' && task.completed_at ? 
                          (() => {
                              try {
                                  // 确保日期字符串格式正确
                                  let dateStr = task.completed_at;
                                  if (typeof dateStr === 'string' && !dateStr.includes('Z') && !dateStr.includes('+')) {
                                      // 如果没有时区信息，假设是UTC时间，添加Z表示
                                      dateStr = dateStr + 'Z';
                                  }
                                  
                                  // 创建日期对象
                                  const date = new Date(dateStr);
                                  
                                  // 手动转换为东八区时间
                                  const utcYear = date.getUTCFullYear();
                                  const utcMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
                                  const utcDay = String(date.getUTCDate()).padStart(2, '0');
                                  
                                  // 计算东八区时间（UTC+8）
                                  let utcHours = date.getUTCHours() + 8;
                                  let utcDate = date.getUTCDate();
                                  
                                  // 处理跨日情况
                                  if (utcHours >= 24) {
                                      utcHours -= 24;
                                      utcDate += 1;
                                  }
                                  
                                  const hours = String(utcHours).padStart(2, '0');
                                  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
                                  
                                  // 处理月份边界情况
                                  const daysInMonth = new Date(utcYear, date.getUTCMonth() + 1, 0).getDate();
                                  let finalDay = utcDate;
                                  let finalMonth = date.getUTCMonth() + 1;
                                  let finalYear = utcYear;
                                  
                                  if (utcDate > daysInMonth) {
                                      finalDay = 1;
                                      finalMonth += 1;
                                      if (finalMonth > 12) {
                                          finalMonth = 1;
                                          finalYear += 1;
                                      }
                                  }
                                  
                                  const formattedDay = String(finalDay).padStart(2, '0');
                                  const formattedMonth = String(finalMonth).padStart(2, '0');
                                  
                                  return `完成: ${finalYear}-${formattedMonth}-${formattedDay} ${hours}:${minutes}`;
                              } catch (error) {
                                  console.error('日期格式化失败:', error);
                                  return `完成: ${task.completed_at}`;
                              }
                          })() : 
                          (task.deadline ? `截止: ${task.deadline}` : '')}
                    </small>
                </div>
            </div>
        `;
    }

    /**
     * 从列表显示任务详情
     */
    async showTaskDetailsFromList(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`);
            const task = await response.json();
            
            // 创建一个模拟的FullCalendar事件对象
            const mockEvent = {
                id: task.id,
                title: task.title,
                start: task.start_date,
                end: task.deadline,
                extendedProps: {
                    task_type: task.task_type,
                    description: task.description,
                    status: task.status,
                    progress: task.progress,
                    start_date: task.start_date,
                    deadline: task.deadline,
                    priority: task.priority,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                    completed_at: task.completed_at
                }
            };
            
            this.showTaskDetails(mockEvent);
        } catch (error) {
            console.error('获取任务详情失败:', error);
            Utils.showError('获取任务详情失败');
        }
    }

    /**
     * 显示任务详情
     */
    showTaskDetails(event) {
        this.currentTaskId = event.id;
        
        if (window.App) {
            window.App.setCurrentTaskId(event.id);
        }
        
        // 获取模态框元素
        const taskDetailsModal = document.getElementById('taskDetailsModal');
        if (!taskDetailsModal) return;
        
        // 清除之前的状态类
        taskDetailsModal.classList.remove('task-active', 'task-completed', 'task-pending');
        
        // 根据任务状态添加对应的CSS类
        if (event.extendedProps.status === 'completed') {
            taskDetailsModal.classList.add('task-completed');
        } else if (event.extendedProps.status === 'pending') {
            taskDetailsModal.classList.add('task-pending');
        } else {
            taskDetailsModal.classList.add('task-active');
        }
        
        // 使用统一的填充方法
        this.fillUnifiedTaskDetails(event);
        
        // 显示蒙版
        const overlay = document.getElementById('taskDetailOverlay');
        if (overlay) {
            overlay.style.display = 'block';
        }
        
        // 显示任务详情模态框
        new bootstrap.Modal(taskDetailsModal).show();
    }







    /**
     * 统一填充任务详情
     */
    fillUnifiedTaskDetails(event) {
        // 保存当前任务对象，以便其他函数使用
        this.currentTask = event;
        const props = event.extendedProps;
        
        // 填充基本信息
        document.getElementById('detailTitle').textContent = event.title;
        document.getElementById('detailDescription').textContent = props.description || '无描述';
        document.getElementById('detailType').textContent = props.task_type;
        
        // 添加对detailCurrentStatus元素的存在性检查
        const detailCurrentStatusElement = document.getElementById('detailCurrentStatus');
        if (detailCurrentStatusElement) {
            detailCurrentStatusElement.innerHTML = Utils.getStatusBadge(props.status, props.is_overdue);
        }
        
        document.getElementById('detailPriority').innerHTML = Utils.getPriorityBadge(props.priority);
        document.getElementById('detailStartDate').textContent = Utils.formatDateTime(event.start);
        document.getElementById('detailDeadline').textContent = Utils.formatDateTime(event.end);
        // 创建时间显示已移除
        document.getElementById('detailUpdatedAt').textContent = Utils.formatDateTime(props.updated_at);
        
        // 填充完成日期（如果存在）
        const completedDateElement = document.getElementById('detailCompletedDate');
        if (completedDateElement) {
            completedDateElement.textContent = props.completed_at ? Utils.formatDateTime(props.completed_at) : '尚未完成';
        }
        
        // 设置头部状态
        document.getElementById('headerStatus').innerHTML = Utils.getStatusBadge(props.status);
        
        // 只有非完成状态的任务才需要更新进展选项
        if (props.status !== 'completed') {
            // 根据任务类型更新进展选项
            this.updateTaskProgressOptions(props.task_type, 'detailProgress');
            
            // 设置当前进展值
            const detailProgressSelect = document.getElementById('detailProgress');
            if (detailProgressSelect && props.progress) {
                // 等待选项加载完成后设置值
                setTimeout(() => {
                    detailProgressSelect.value = props.progress;
                }, 100);
            }
        } else {
            // 已完成任务直接设置进展值，不请求工作流
            const detailProgressSelect = document.getElementById('detailProgress');
            if (detailProgressSelect && props.progress) {
                // 清空现有选项
                detailProgressSelect.innerHTML = '';
                // 添加当前进展作为唯一选项
                const option = document.createElement('option');
                option.value = props.progress;
                option.textContent = props.progress;
                detailProgressSelect.appendChild(option);
                detailProgressSelect.value = props.progress;
                detailProgressSelect.disabled = true;
            }
        }
        
        // 根据状态更新按钮和内容
        if (props.status === 'completed') {
            this.setupCompletedTaskView(event);
        } else if (props.status === 'pending') {
            this.setupPendingTaskView(event);
        } else {
            this.setupActiveTaskView(event);
        }
    }
    
    /**
     * 设置已完成任务视图
     */
    setupCompletedTaskView(event) {
        // 显示操作按钮（删除按钮）
        const taskActionButtons = document.getElementById('taskActionButtons');
        if (taskActionButtons) {
            taskActionButtons.style.display = 'flex';
            taskActionButtons.style.visibility = 'visible';
            taskActionButtons.classList.remove('d-none');
        }
        
        // 使用统一的进展历史显示方法
        this.loadTaskHistoryCompleted(event.id);
        this.loadTaskCommentsForCompleted(event.id);
    }
    
    /**
     * 设置未开始任务视图
     */
    setupPendingTaskView(event) {
        // 更新状态按钮
        this.updateStatusButtons(event.extendedProps.status);
        
        // 显示操作按钮
        const taskActionButtons = document.getElementById('taskActionButtons');
        if (taskActionButtons) {
            taskActionButtons.style.display = 'flex';
            taskActionButtons.style.visibility = 'visible';
            taskActionButtons.classList.remove('d-none');
        }
        
        // 加载进展历史
        this.loadTaskHistory(event.id);
        this.clearTaskComments();
    }
    
    /**
     * 设置活动任务视图
     */
    setupActiveTaskView(event) {
        const props = event.extendedProps;
        
        // 更新状态按钮
        this.updateStatusButtons(props.status);
        
        // 显示操作按钮
        const taskActionButtons = document.getElementById('taskActionButtons');
        if (taskActionButtons) {
            taskActionButtons.style.display = 'flex';
            taskActionButtons.style.visibility = 'visible';
            taskActionButtons.classList.remove('d-none');
        }
        
        // 根据状态加载不同内容
        if (props.status === 'pending') {
            this.loadTaskHistory(event.id);
            this.clearTaskComments();
        } else if (props.status === 'in_progress') {
            this.loadTaskHistory(event.id);
            this.clearTaskComments();
        } else {
            // 兼容其他状态
            this.loadTaskHistory(event.id);
            this.loadTaskComments(event.id);
        }
    }

    /**
     * 清空任务历史记录显示
     */
    clearTaskHistory() {
        // 清空所有进展历史容器
        ['progressHistoryCompleted', 'progressHistory', 'progressHistoryPending'].forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-clock mb-2 d-block"></i><small>暂无历史记录</small></div>';
            }
        });
    }

    /**
     * 清空任务评论显示
     */
    clearTaskComments() {
        const commentsList = document.getElementById('taskCommentsList');
        if (commentsList) {
            commentsList.innerHTML = '<div class="text-muted text-center py-3">暂无评论</div>';
        }
    }



    /**
     * 加载任务历史
     */
    async loadTaskHistory(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/history`);
            const data = await response.json();
            this.displayTaskHistory(data.history || []);
        } catch (error) {
            console.error('加载任务历史失败:', error);
        }
    }
    

    
    /**
     * 为已完成任务加载评论到统一容器
     */
    async loadTaskCommentsForCompleted(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`);
            const data = await response.json();
            this.displayTaskCommentsInCompleted(data.comments || []);
        } catch (error) {
            console.error('加载已完成任务评论失败:', error);
        }
    }

    /**
     * 加载已完成任务历史
     */
    async loadTaskHistoryCompleted(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/history`);
            const data = await response.json();
            this.displayTaskHistoryCompleted(data.history || []);
        } catch (error) {
            console.error('加载任务历史失败:', error);
        }
    }

    /**
     * 显示任务历史
     */
    displayTaskHistory(historyList) {
        // 根据当前任务状态选择正确的容器
        // 不再依赖已移除的detailCurrentStatus元素，而是直接从任务对象获取状态
        const taskStatus = this.currentTask?.extendedProps?.status || 'pending';
        let historyContainer;
        
        if (taskStatus === 'completed') {
            historyContainer = document.getElementById('progressHistoryCompleted');
        } else if (taskStatus === 'in_progress') {
            historyContainer = document.getElementById('progressHistory');
        } else {
            historyContainer = document.getElementById('progressHistoryPending');
        }
        
        if (!historyContainer) {
            console.error('找不到对应的进展历史容器');
            return;
        }
        
        // 清空其他容器
        ['progressHistoryCompleted', 'progressHistory', 'progressHistoryPending'].forEach(id => {
            const container = document.getElementById(id);
            if (container && container !== historyContainer) {
                container.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-clock mb-2 d-block"></i><small>暂无历史记录</small></div>';
            }
        });
        
        if (historyList.length === 0) {
            historyContainer.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-clock mb-2 d-block"></i><small>暂无历史记录</small></div>';
            return;
        }
        
        const historyHtml = historyList.map(item => `
            <div class="history-item border-start border-3 border-primary ps-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${item.field_name}</strong>
                        <div class="text-muted small">
                            从 "${item.old_value || '无'}" 更改为 "${item.new_value}"
                        </div>
                    </div>
                    <small class="text-muted">${Utils.formatDateTime(item.created_at)}</small>
                </div>
                ${item.note ? `<div class="mt-2 text-info small">${Utils.escapeHtml(item.note)}</div>` : ''}
            </div>
        `).join('');
        
        historyContainer.innerHTML = historyHtml;
    }



    /**
     * 在统一容器中显示已完成任务的评论
     */
    displayTaskCommentsInCompleted(comments) {
        const commentsContainer = document.getElementById('reviewCommentsCompleted');
        if (!commentsContainer) return;
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<div class="empty-state-compact"><i class="fas fa-comment-alt text-muted mb-2"></i><p class="text-muted mb-0">暂无复盘评论</p><small class="text-muted">添加评论来记录任务复盘内容</small></div>';
            return;
        }
        
        const commentsHtml = comments.map(comment => {
            // 直接处理时间格式，强制转换为东八区
            let formattedTime = '';
            try {
                // 解析日期字符串，添加Z表示UTC时间
                const dateObj = new Date(comment.created_at + 'Z');
                
                // 转换为东八区时间
                const beijingTime = new Date(dateObj.getTime() + (8 * 60 * 60 * 1000));
                
                // 格式化时间
                const beijingYear = beijingTime.getUTCFullYear();
                const beijingMonth = String(beijingTime.getUTCMonth() + 1).padStart(2, '0');
                const beijingDay = String(beijingTime.getUTCDate()).padStart(2, '0');
                const beijingHour = String(beijingTime.getUTCHours()).padStart(2, '0');
                const beijingMinute = String(beijingTime.getUTCMinutes()).padStart(2, '0');
                
                formattedTime = `${beijingYear}-${beijingMonth}-${beijingDay} ${beijingHour}:${beijingMinute}`;
            } catch (error) {
                console.error('日期格式化失败:', error, comment.created_at);
                formattedTime = comment.created_at;
            }
            
            return `
            <div class="comment-item bg-light rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <small class="text-muted">${formattedTime}</small>
                </div>
                <div>${Utils.escapeHtml(comment.content)}</div>
            </div>
            `;
        }).join('');
        
        commentsContainer.innerHTML = commentsHtml;
    }

    /**
     * 显示已完成任务历史
     */
    displayTaskHistoryCompleted(historyList) {
        const historyContainer = document.getElementById('progressHistoryCompleted');
        if (!historyContainer) return;
        
        if (historyList.length === 0) {
            historyContainer.innerHTML = '<div class="text-center py-3 text-muted"><i class="fas fa-clock mb-2 d-block"></i><small>暂无历史记录</small></div>';
            return;
        }
        
        const historyHtml = historyList.map(item => `
            <div class="history-item border-start border-3 border-success ps-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${item.field_name}</strong>
                        <div class="text-muted small">
                            从 "${item.old_value || '无'}" 更改为 "${item.new_value}"
                        </div>
                    </div>
                    <small class="text-muted">${Utils.formatDateTime(item.created_at)}</small>
                </div>
                ${item.note ? `<div class="mt-2 text-success small">${Utils.escapeHtml(item.note)}</div>` : ''}
            </div>
        `).join('');
        
        historyContainer.innerHTML = historyHtml;
    }

    /**
     * 加载任务评论
     */
    async loadTaskComments(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`);
            const comments = await response.json();
            this.displayTaskComments(comments);
        } catch (error) {
            console.error('加载任务评论失败:', error);
        }
    }

    /**
     * 加载已完成任务评论
     */
    async loadTaskCommentsCompleted(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`);
            const comments = await response.json();
            this.displayTaskCommentsCompleted(comments);
        } catch (error) {
            console.error('加载任务评论失败:', error);
        }
    }

    /**
     * 显示任务评论
     */
    displayTaskComments(comments) {
        const commentsContainer = document.getElementById('taskComments');
        if (!commentsContainer) return;
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<div class="text-muted">暂无评论</div>';
            return;
        }
        
        const commentsHtml = comments.map(comment => `
            <div class="comment-item bg-light rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>评审意见</strong>
                    <small class="text-muted">${Utils.formatDateTime(comment.created_at)}</small>
                </div>
                <div>${Utils.escapeHtml(comment.comment)}</div>
            </div>
        `).join('');
        
        commentsContainer.innerHTML = commentsHtml;
    }

    /**
     * 显示已完成任务评论
     */
    displayTaskCommentsCompleted(comments) {
        const commentsContainer = document.getElementById('taskCommentsCompleted');
        if (!commentsContainer) return;
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = '<div class="text-muted">暂无评论</div>';
            return;
        }
        
        const commentsHtml = comments.map(comment => `
            <div class="comment-item bg-light rounded p-3 mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <strong>评审意见</strong>
                    <small class="text-muted">${Utils.formatDateTime(comment.created_at)}</small>
                </div>
                <div>${Utils.escapeHtml(comment.comment)}</div>
            </div>
        `).join('');
        
        commentsContainer.innerHTML = commentsHtml;
    }

    /**
     * 添加任务
     */
    async addTask() {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const taskType = document.getElementById('taskType').value;
        const priority = document.getElementById('taskPriority').value;
        const startDate = document.getElementById('taskStartDate').value;
        const deadline = document.getElementById('taskDeadline').value;
        const status = document.getElementById('taskStatus').value;
        const progress = document.getElementById('taskProgress').value;
        
        if (!title || !taskType || !startDate) {
            Utils.showError('请填写必填字段（标题、类型、开始日期）');
            return;
        }
        
        // 验证起始日期必须早于或等于截止日期
        if (deadline && new Date(startDate) > new Date(deadline)) {
            Utils.showError('起始日期必须早于或等于截止日期');
            return;
        }
        
        // 确保状态已计算
        if (!status) {
            this.calculateTaskStatus();
        }
        
        const taskData = {
            title: title,
            description: description,
            task_type: taskType,
            priority: priority,
            start_date: startDate,
            deadline: deadline || null,
            status: status,
            progress: progress || null
        };
        
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 关闭模态框
                const addTaskModal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
                if (addTaskModal) {
                    addTaskModal.hide();
                }
                
                // 清空表单
                document.getElementById('addTaskForm').reset();
                
                // 重置进展选择框
                const taskProgressSelect = document.getElementById('taskProgress');
                taskProgressSelect.innerHTML = '';
                taskProgressSelect.disabled = true;
                
                // 重新加载任务
                await this.loadTasks();
                
                // 更新分析数据
                if (window.ChartModule) {
                    await window.ChartModule.updateAnalytics();
                }
                
                Utils.showSuccess('任务添加成功');
            } else {
                Utils.showError(data.message || '添加任务失败');
            }
        } catch (error) {
            console.error('添加任务失败:', error);
            Utils.showError('添加任务失败，请重试');
        }
    }

    /**
     * 计算任务状态
     */
    calculateTaskStatus() {
        const startDate = document.getElementById('taskStartDate').value;
        const deadline = document.getElementById('taskDeadline').value;
        const statusDisplay = document.getElementById('taskStatusDisplay');
        const statusHidden = document.getElementById('taskStatus');
        
        if (!startDate) {
            if (statusDisplay) statusDisplay.value = '';
            if (statusHidden) statusHidden.value = 'pending';
            return;
        }
        
        const today = new Date();
        const start = new Date(startDate);
        const deadlineDate = deadline ? new Date(deadline) : null;
        
        // 移除时间部分，只比较日期
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        if (deadlineDate) {
            deadlineDate.setHours(0, 0, 0, 0);
        }
        
        let status, statusText;
        
        // 如果有截止日期且已过期，状态为"未完成"
        if (deadlineDate && deadlineDate < today) {
            status = 'pending';
            statusText = '未完成';
        }
        // 如果开始日期小于或等于当前日期，状态为"进行中"
        else if (start <= today) {
            status = 'in_progress';
            statusText = '进行中';
        }
        // 如果开始日期大于当前日期，状态为"未开始"
        else {
            status = 'pending';
            statusText = '未开始';
        }
        
        if (statusDisplay) statusDisplay.value = statusText;
        if (statusHidden) statusHidden.value = status;
        
        // 根据状态更新进展选项
        const taskType = document.getElementById('taskType').value;
        if (status === 'in_progress' && taskType) {
            this.updateTaskProgressOptions(taskType, 'taskProgress');
        } else {
            const progressSelect = document.getElementById('taskProgress');
            if (progressSelect) {
                progressSelect.innerHTML = '';
            }
        }
    }

    /**
     * 更新任务进展选项
     */
    updateTaskProgressOptions(taskType, progressSelectId) {
        const progressSelect = document.getElementById(progressSelectId);
        if (!progressSelect) return;
        
        progressSelect.innerHTML = '';
        
        if (!taskType) {
            progressSelect.disabled = true;
            return;
        }
        
        fetch(`/api/workflow/${taskType}`)
            .then(response => response.json())
            .then(data => {
                if (data.steps && Array.isArray(data.steps)) {
                    data.steps.forEach(step => {
                        const option = document.createElement('option');
                        option.value = step;
                        option.textContent = step;
                        // 如果是关键步骤，添加标记
                        if (data.key_steps && data.key_steps.includes(step)) {
                            option.textContent += ' ★';
                            option.classList.add('key-step');
                        }
                        // 如果是里程碑步骤，添加特殊标记
                        if (data.milestone_steps && data.milestone_steps.includes(step)) {
                            option.textContent += ' 📍';
                            option.classList.add('milestone-step');
                        }
                        progressSelect.appendChild(option);
                    });
                    progressSelect.disabled = false;
                    
                    // 如果有默认进展，设置为默认选中
                    if (data.default_step) {
                        progressSelect.value = data.default_step;
                        // 触发change事件以更新相关UI
                        progressSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // 如果是任务详情页面，更新当前进展文本
                    if (progressSelectId === 'detailProgress') {
                        const currentProgressText = document.getElementById('currentProgressText');
                        if (currentProgressText && progressSelect.value) {
                            currentProgressText.textContent = progressSelect.value;
                        }
                    }
                } else {
                    console.error('工作流步骤数据格式错误:', data);
                    progressSelect.disabled = true;
                }
            })
            .catch(error => {
                console.error('获取工作流程失败:', error);
                progressSelect.innerHTML = '';
                progressSelect.disabled = true;
            });
    }

    /**
     * 更新任务状态选项
     */
    updateTaskStatusOptions() {
        const taskType = document.getElementById('taskType').value;
        this.updateTaskProgressOptions(taskType, 'taskProgress');
    }

    /**
     * 处理状态改变
     */
    handleStatusChange(statusSelectId, progressSelectId) {
        const statusSelect = document.getElementById(statusSelectId);
        const progressSelect = document.getElementById(progressSelectId);
        
        if (statusSelect && progressSelect) {
            if (statusSelect.value === 'in_progress') {
                progressSelect.disabled = false;
            } else {
                progressSelect.disabled = true;
                progressSelect.value = '';
            }
        }
    }

    /**
     * 更新状态按钮
     */
    updateStatusButtons(currentStatus) {
        const statusButtonsContainer = document.getElementById('statusButtons');
        if (!statusButtonsContainer) return;
        
        let buttonsHtml = '';
        
        if (currentStatus === 'pending') {
            buttonsHtml = `
                <button class="btn btn-primary btn-sm" onclick="TaskModule.changeTaskStatus('in_progress')">
                    开始任务
                </button>
            `;
        } else if (currentStatus === 'in_progress') {
            buttonsHtml = `
                <button class="btn btn-warning btn-sm" onclick="TaskModule.changeTaskStatus('pending')">
                    暂停任务
                </button>
                <button class="btn btn-success btn-sm" onclick="TaskModule.completeTask()">
                    完成任务
                </button>
            `;
        }
        
        statusButtonsContainer.innerHTML = buttonsHtml;
    }

    /**
     * 改变任务状态
     */
    async changeTaskStatus(newStatus) {
        if (!this.currentTaskId) return;
        
        // 如果是完成状态，显示确认对话框
        if (newStatus === 'completed') {
            const confirmModal = document.getElementById('completeTaskConfirmModal');
            if (confirmModal) {
                new bootstrap.Modal(confirmModal).show();
                return;
            }
        }
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 刷新任务详情
                await this.refreshTaskDetails();
                
                // 重新加载任务
                await this.loadTasks();
                
                Utils.showSuccess('任务状态更新成功');
            } else {
                Utils.showError(data.message || '更新任务状态失败');
            }
        } catch (error) {
            console.error('更新任务状态失败:', error);
            Utils.showError('更新任务状态失败，请重试');
        }
    }

    /**
     * 完成任务
     */
    completeTask() {
        const confirmModal = document.getElementById('completeTaskConfirmModal');
        if (confirmModal) {
            new bootstrap.Modal(confirmModal).show();
        }
    }

    /**
     * 显示删除任务确认对话框
     */
    showDeleteTaskConfirm() {
        const deleteTaskModal = new bootstrap.Modal(document.getElementById('deleteTaskConfirmModal'));
        deleteTaskModal.show();
    }

    /**
     * 执行删除任务
     */
    async executeDeleteTask() {
        if (!this.currentTaskId) return;
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 关闭确认模态框
                const confirmModal = bootstrap.Modal.getInstance(document.getElementById('deleteTaskConfirmModal'));
                if (confirmModal) {
                    confirmModal.hide();
                }
                
                // 关闭任务详情模态框
                const taskDetailsModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailsModal'));
                if (taskDetailsModal) {
                    taskDetailsModal.hide();
                }
                
                // 重新加载任务
                await this.loadTasks();
                
                // 更新分析数据
                if (window.ChartModule) {
                    await window.ChartModule.updateAnalytics();
                }
                
                Utils.showSuccess('任务删除成功');
            } else {
                Utils.showError(data.message || '删除任务失败');
            }
        } catch (error) {
            console.error('删除任务出错:', error);
            Utils.showError('删除任务时发生错误');
        }
    }

    /**
     * 执行完成任务
     */
    async executeCompleteTask() {
        if (!this.currentTaskId) return;
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 关闭确认模态框
                const confirmModal = bootstrap.Modal.getInstance(document.getElementById('completeTaskConfirmModal'));
                if (confirmModal) {
                    confirmModal.hide();
                }
                
                // 关闭任务详情模态框
                const taskDetailsModal = bootstrap.Modal.getInstance(document.getElementById('taskDetailsModal'));
                if (taskDetailsModal) {
                    taskDetailsModal.hide();
                }
                
                // 重新加载任务
                await this.loadTasks();
                
                // 更新分析数据
                if (window.ChartModule) {
                    await window.ChartModule.updateAnalytics();
                }
                
                Utils.showSuccess('任务完成成功');
            } else {
                Utils.showError(data.message || '完成任务失败');
            }
        } catch (error) {
            console.error('完成任务失败:', error);
            Utils.showError('完成任务失败，请重试');
        }
    }

    /**
     * 刷新任务详情
     */
    async refreshTaskDetails() {
        if (!this.currentTaskId) return;
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}`);
            const task = await response.json();
            
            // 创建模拟事件对象
            const mockEvent = {
                id: task.id,
                title: task.title,
                start: task.start_date,
                end: task.deadline,
                extendedProps: {
                    task_type: task.task_type,
                    description: task.description,
                    status: task.status,
                    progress: task.progress,
                    start_date: task.start_date,
                    deadline: task.deadline,
                    priority: task.priority,
                    created_at: task.created_at,
                    updated_at: task.updated_at,
                    completed_at: task.completed_at
                }
            };
            
            // 使用统一的填充方法
            this.fillUnifiedTaskDetails(mockEvent);
        } catch (error) {
            console.error('刷新任务详情失败:', error);
        }
    }



    /**
     * 动态添加新的进展历史记录项到历史列表
     */
    addProgressHistoryItem(oldValue, newValue, timestamp = null) {
        const historyContainer = document.getElementById('progressHistory');
        if (!historyContainer) {
            console.error('找不到progressHistory元素');
            return;
        }

        // 如果没有提供时间戳，使用当前时间
        const now = timestamp || new Date().toISOString();
        
        // 创建新的历史记录项HTML
        const historyItemHtml = `
            <div class="history-item border-start border-3 border-primary ps-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>任务进展</strong>
                        <div class="text-muted small">
                            从 "${oldValue || '无'}" 更改为 "${newValue}"
                        </div>
                    </div>
                    <small class="text-muted">${Utils.formatDateTime(now)}</small>
                </div>
            </div>
        `;

        // 检查是否有现有的历史记录
        const existingContent = historyContainer.innerHTML;
        const hasEmptyState = existingContent.includes('暂无历史记录');
        
        if (hasEmptyState) {
            // 如果是空状态，直接替换内容
            historyContainer.innerHTML = historyItemHtml;
        } else {
            // 如果有现有记录，在顶部插入新记录
            historyContainer.insertAdjacentHTML('afterbegin', historyItemHtml);
        }
    }

    /**
     * 添加评审意见
     */
    async addReviewComment() {
        const commentText = document.getElementById('reviewCommentText').value;
        if (!commentText || !this.currentTaskId) {
            Utils.showError('请输入评审意见');
            return;
        }
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: commentText })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 清空输入框
                document.getElementById('reviewCommentText').value = '';
                
                // 刷新评论
                await this.loadTaskComments(this.currentTaskId);
                
                Utils.showSuccess('评审意见添加成功');
            } else {
                Utils.showError(data.message || '添加评审意见失败');
            }
        } catch (error) {
            console.error('添加评审意见失败:', error);
            Utils.showError('添加评审意见失败，请重试');
        }
    }

    /**
     * 添加已完成任务的评审意见
     */
    async addReviewCommentCompleted() {
        const commentText = document.getElementById('reviewCommentCompleted').value;
        if (!commentText || !this.currentTaskId) {
            Utils.showError('请输入评审意见');
            return;
        }
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ comment: commentText })
            });
            
            const data = await response.json();
            
            if (data.message && !data.error) {
                // 清空输入框
                document.getElementById('reviewCommentCompleted').value = '';
                
                // 刷新评论
                await this.loadTaskCommentsForCompleted(this.currentTaskId);
                
                Utils.showSuccess('评审意见添加成功');
            } else {
                Utils.showError(data.error || '添加评审意见失败');
            }
        } catch (error) {
            console.error('添加评审意见失败:', error);
            Utils.showError('添加评审意见失败，请重试');
        }
    }

    /**
     * 更新任务状态（详细版本）
     */
    async updateTaskStatus() {
        if (!this.currentTaskId) return;
        
        const newProgress = document.getElementById('detailProgress').value;
        if (!newProgress) {
            Utils.showError('请选择新的进展状态');
            return;
        }

        // 获取当前进展值用于历史记录
        const currentProgressText = document.getElementById('currentProgressText');
        const oldProgress = currentProgressText ? currentProgressText.textContent : '无';
        
        try {
            const response = await fetch(`/api/tasks/${this.currentTaskId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ progress: newProgress })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 立即添加新的历史记录项到列表
                this.addProgressHistoryItem(oldProgress, newProgress);
                
                // 刷新任务详情
                await this.refreshTaskDetails();
                
                // 重新加载任务
                await this.loadTasks();
                
                Utils.showSuccess('任务进展更新成功');
            } else {
                Utils.showError(data.message || '更新任务进展失败');
            }
        } catch (error) {
            console.error('更新任务进展失败:', error);
            Utils.showError('更新任务进展失败，请重试');
        }
    }
}

// 导出任务模块
// TaskModule实例通过TaskModule.init()方法设置到window.TaskModule
// 不需要在这里设置类本身