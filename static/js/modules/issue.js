/**
 * 问题管理模块
 * 负责问题的增删改查和状态管理
 */

class IssueModule {
    constructor() {
        this.issues = [];
        this.currentIssueId = null;
    }

    /**
     * 初始化问题模块
     */
    static init() {
        const instance = new IssueModule();
        window.IssueModule = instance;
        
        // 初始化删除问题确认按钮事件
        const confirmDeleteIssueBtn = document.getElementById('confirmDeleteIssueBtn');
        if (confirmDeleteIssueBtn) {
            confirmDeleteIssueBtn.addEventListener('click', () => {
                instance.executeDeleteIssue();
            });
        }
        
        return instance;
    }

    /**
     * 加载问题列表
     */
    async loadIssues() {
        try {
            const response = await fetch('/api/issues', {
                cache: 'no-cache', // 添加缓存控制，确保每次都获取最新数据
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            // 检查响应状态，如果是重定向或未授权，可能是未登录
            if (response.redirected || response.status === 401) {
                console.log('用户未登录，请先登录');
                return [];
            }
            
            // 检查内容类型，确保是JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // 静默处理非JSON响应
                return [];
            }
            
            const issues = await response.json();
            
            this.issues = issues;
            this.displayIssues(issues);
            
            // 如果首页问题列表存在，强制刷新
            const issuesList = document.getElementById('issuesList');
            if (issuesList) {
                const openIssues = issues.filter(issue => issue.status !== 'resolved');
                if (openIssues.length === 0) {
                    issuesList.innerHTML = '<div class="text-center text-muted py-4">暂无待解决问题</div>';
                } else {
                    const issuesHtml = openIssues.map(issue => this.createIssueElement(issue)).join('');
                    issuesList.innerHTML = issuesHtml;
                }
            }
            
            console.log('问题加载完成');
            return issues;
        } catch (error) {
            console.error('加载问题失败:', error);
            // 静默处理所有错误，不显示错误提示
            return [];
        }
    }

    /**
     * 显示问题列表
     */
    displayIssues(issues) {
        const issuesList = document.getElementById('issuesList');
        if (!issuesList) return;
        
        // 筛选出未解决的问题（状态不为'resolved'的问题）
        const openIssues = issues.filter(issue => issue.status !== 'resolved');
        
        if (openIssues.length === 0) {
            issuesList.innerHTML = '<div class="text-center text-muted py-4">暂无待解决问题</div>';
            return;
        }
        
        const issuesHtml = openIssues.map(issue => this.createIssueElement(issue)).join('');
        issuesList.innerHTML = issuesHtml;
    }

    /**
     * 创建问题元素
     */
    createIssueElement(issue) {
        return `
            <div class="issue-item mb-3 p-3 border rounded fade-in cursor-pointer" data-issue-id="${issue.id}" onclick="window.IssueModule.showIssueDetails(${issue.id})">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${Utils.escapeHtml(issue.title)}</h6>
                        <p class="mb-1 text-muted small">${Utils.escapeHtml(issue.description || '')}</p>
                        <div class="d-flex gap-2 align-items-center">
                            ${Utils.getPriorityBadge(issue.priority)}
                            <small class="text-muted">
                                创建时间: ${Utils.formatDateTime(issue.created_at)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 添加问题
     */
    async addIssue() {
        const title = document.getElementById('issueTitle').value;
        const description = document.getElementById('issueDescription').value;
        const priority = document.getElementById('issuePriority').value;
        
        if (!title) {
            Utils.showError('请填写问题标题');
            return;
        }
        
        const issueData = {
            title: title,
            description: description,
            priority: priority
        };
        
        try {
            const response = await fetch('/api/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 关闭模态框
                const addIssueModal = bootstrap.Modal.getInstance(document.getElementById('addIssueModal'));
                if (addIssueModal) {
                    addIssueModal.hide();
                }
                
                // 清空表单
                document.getElementById('addIssueForm').reset();
                
                // 重新加载问题
                await this.loadIssues();
                
                Utils.showSuccess('问题添加成功');
            } else {
                Utils.showError(data.message || '添加问题失败');
            }
        } catch (error) {
            console.error('添加问题失败:', error);
            Utils.showError('添加问题失败，请重试');
        }
    }

    /**
     * 显示问题清单模态窗口
     */
    async showIssueList() {
        try {
            await this.loadIssues();
            this.displayIssueListTabs();
            
            const issueListModal = document.getElementById('issueListModal');
            if (issueListModal) {
                new bootstrap.Modal(issueListModal).show();
            }
        } catch (error) {
            console.error('显示问题清单失败:', error);
            Utils.showError('显示问题清单失败');
        }
    }

    /**
     * 显示问题清单选项卡内容
     */
    displayIssueListTabs() {
        const resolvedIssues = this.issues.filter(issue => issue.status === 'resolved');
        const unresolvedIssues = this.issues.filter(issue => issue.status === 'open');
        
        // 更新计数徽章
        const openIssuesCount = document.getElementById('openIssuesCount');
        const resolvedIssuesCount = document.getElementById('resolvedIssuesCount');
        if (openIssuesCount) openIssuesCount.textContent = unresolvedIssues.length;
        if (resolvedIssuesCount) resolvedIssuesCount.textContent = resolvedIssues.length;
        
        // 显示未解决问题
        const unresolvedTab = document.getElementById('openIssuesList');
        if (unresolvedTab) {
            if (unresolvedIssues.length === 0) {
                unresolvedTab.innerHTML = '<div class="text-center text-muted py-4">暂无未解决问题</div>';
            } else {
                unresolvedTab.innerHTML = unresolvedIssues.map(issue => this.createIssueListItem(issue)).join('');
            }
        }
        
        // 显示已解决问题
        const resolvedTab = document.getElementById('resolvedIssuesList');
        if (resolvedTab) {
            if (resolvedIssues.length === 0) {
                resolvedTab.innerHTML = '<div class="text-center text-muted py-4">暂无已解决问题</div>';
            } else {
                resolvedTab.innerHTML = resolvedIssues.map(issue => this.createIssueListItem(issue)).join('');
            }
        }
    }

    /**
     * 创建问题清单项
     */
    createIssueListItem(issue) {
        const statusBadge = issue.status === 'resolved'
            ? '<span class="badge bg-success">已解决</span>' 
            : '<span class="badge bg-warning">待解决</span>';
            
        return `
            <div class="card mb-3 issue-card" onclick="window.IssueModule.showIssueDetails(${issue.id})">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <h6 class="card-title mb-2">${Utils.escapeHtml(issue.title)}</h6>
                        <div class="d-flex gap-2 align-items-center">
                            ${Utils.getPriorityBadge(issue.priority)}
                            ${statusBadge}
                        </div>
                    </div>
                    <p class="card-text text-muted mb-3">${Utils.escapeHtml(issue.description || '无描述')}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <small class="text-muted">创建时间: ${Utils.formatDateTime(issue.created_at)}</small>
                            ${issue.resolved_at ? `<small class="text-success d-block">解决时间: ${Utils.formatDateTime(issue.resolved_at)}</small>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 显示问题详情
     */
    async showIssueDetails(issueId) {
        try {
            const response = await fetch(`/api/issues/${issueId}`);
            const issue = await response.json();
            
            // 存储当前问题ID
            this.currentIssueId = issueId;
            
            // 填充问题详情
            this.fillIssueDetails(issue);
            
            // 加载解决方案
            await this.loadSolutions(issueId);
            
            // 显示问题详情模态框
            const issueDetailsModal = document.getElementById('issueDetailsModal');
            if (issueDetailsModal) {
                new bootstrap.Modal(issueDetailsModal).show();
            }
        } catch (error) {
            console.error('获取问题详情失败:', error);
            Utils.showError('获取问题详情失败');
        }
    }

    /**
     * 填充问题详情
     */
    fillIssueDetails(issue) {
        const titleEl = document.getElementById('issueDetailTitle');
        const descriptionEl = document.getElementById('issueDetailDescription');
        const priorityEl = document.getElementById('issueDetailPriority');
        const createdAtEl = document.getElementById('issueDetailCreatedAt');
        const statusEl = document.getElementById('issueDetailStatus');
        
        if (titleEl) titleEl.textContent = issue.title;
        if (descriptionEl) descriptionEl.textContent = issue.description || '无描述';
        if (priorityEl) priorityEl.innerHTML = Utils.getPriorityBadge(issue.priority);
        if (createdAtEl) createdAtEl.textContent = Utils.formatDateTime(issue.created_at);
        if (statusEl) {
            const statusBadge = issue.resolved_at 
                ? '<span class="badge bg-success">已解决</span>' 
                : '<span class="badge bg-warning">待解决</span>';
            statusEl.innerHTML = statusBadge;
        }
        
        // 更新解决按钮状态
        const markResolvedBtn = document.getElementById('markResolvedBtn');
        if (markResolvedBtn) {
            if (issue.resolved_at) {
                markResolvedBtn.style.display = 'none';
            } else {
                markResolvedBtn.style.display = 'inline-block';
                markResolvedBtn.onclick = () => this.markIssueResolved();
            }
        }
        
        // 设置编辑按钮事件
        const editBtn = document.querySelector('.btn-outline-secondary');
        if (editBtn) {
            editBtn.onclick = () => this.editIssue();
        }
    }

    /**
     * 加载解决方案
     */
    async loadSolutions(issueId) {
        try {
            const response = await fetch(`/api/issues/${issueId}`);
            const issue = await response.json();
            
            this.displaySolutions(issue.solutions || [], issue.successful_solution);
        } catch (error) {
            console.error('加载解决方案失败:', error);
            Utils.showError('加载解决方案失败');
        }
    }

    /**
     * 显示解决方案列表
     */
    displaySolutions(solutions, successfulSolution) {
        const solutionsList = document.getElementById('solutionsList');
        if (!solutionsList) return;
        
        if (solutions.length === 0) {
            solutionsList.innerHTML = '<div class="text-center text-muted py-3">暂无解决方案</div>';
            return;
        }
        
        const solutionsHtml = solutions.map((solution, index) => {
            const isSuccessful = successfulSolution && successfulSolution === solution;
            const successBadge = isSuccessful ? '<span class="badge bg-success ms-2">成功方案</span>' : '';
            
            return `
                <div class="solution-item mb-3 p-3 border rounded ${isSuccessful ? 'border-success bg-light' : ''}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h6 class="mb-2">解决方案 ${index + 1} ${successBadge}</h6>
                            <p class="mb-0">${Utils.escapeHtml(solution)}</p>
                        </div>
                        ${!isSuccessful ? `
                            <button class="btn btn-sm btn-outline-success" onclick="window.IssueModule.markSolutionSuccessful(${index})">
                                <i class="fas fa-check"></i> 标记成功
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        solutionsList.innerHTML = solutionsHtml;
    }

    /**
     * 添加解决方案
     */
    async addSolution() {
        const solutionText = document.getElementById('newSolutionText').value.trim();
        if (!solutionText) {
            Utils.showError('请输入解决方案内容');
            return;
        }
        
        try {
            const response = await fetch(`/api/issues/${this.currentIssueId}/solutions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ solution: solutionText })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 清空输入框
                document.getElementById('newSolutionText').value = '';
                
                // 重新加载解决方案
                await this.loadSolutions(this.currentIssueId);
                
                Utils.showSuccess('解决方案添加成功');
            } else {
                Utils.showError(data.message || '添加解决方案失败');
            }
        } catch (error) {
            console.error('添加解决方案失败:', error);
            Utils.showError('添加解决方案失败，请重试');
        }
    }

    /**
     * 标记解决方案为成功
     */
    async markSolutionSuccessful(solutionIndex) {
        try {
            const response = await fetch(`/api/issues/${this.currentIssueId}/solutions/${solutionIndex}/mark-successful`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 重新加载解决方案
                await this.loadSolutions(this.currentIssueId);
                
                Utils.showSuccess('解决方案已标记为成功');
            } else {
                Utils.showError(data.message || '标记解决方案失败');
            }
        } catch (error) {
            console.error('标记解决方案失败:', error);
            Utils.showError('标记解决方案失败，请重试');
        }
    }

    /**
     * 标记问题为已解决
     */
    async markIssueResolved() {
        try {
            const response = await fetch(`/api/issues/${this.currentIssueId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 重新加载问题列表
                await this.loadIssues();
                
                // 如果问题清单模态框是打开的，刷新其内容
                const issueListModal = document.getElementById('issueListModal');
                if (issueListModal && issueListModal.classList.contains('show')) {
                    this.displayIssueListTabs();
                }
                
                // 重新加载解决方案
                await this.loadSolutions(this.currentIssueId);
                
                // 更新问题详情
                const response2 = await fetch(`/api/issues/${this.currentIssueId}`);
                const issue = await response2.json();
                this.fillIssueDetails(issue);
                
                // 更新公告栏
                await this.updateAnnouncementBar();
                
                Utils.showSuccess('问题已标记为解决');
            } else {
                Utils.showError(data.message || '标记问题解决失败');
            }
        } catch (error) {
            console.error('标记问题解决失败:', error);
            Utils.showError('标记问题解决失败，请重试');
        }
    }
    
    /**
     * 显示删除问题确认对话框
     */
    showDeleteIssueConfirm() {
        const deleteIssueModal = new bootstrap.Modal(document.getElementById('deleteIssueConfirmModal'));
        deleteIssueModal.show();
    }
    
    /**
     * 执行删除问题
     */
    async executeDeleteIssue() {
        if (!this.currentIssueId) return;
        
        try {
            const response = await fetch(`/api/issues/${this.currentIssueId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache' // 添加缓存控制，确保不使用缓存
            });
            
            if (response.ok) {
                // 先关闭模态框
                // 关闭确认删除模态框
                const confirmModal = bootstrap.Modal.getInstance(document.getElementById('deleteIssueConfirmModal'));
                if (confirmModal) confirmModal.hide();
                
                // 关闭问题详情模态框
                const detailsModal = bootstrap.Modal.getInstance(document.getElementById('issueDetailsModal'));
                if (detailsModal) detailsModal.hide();
                
                // 强制刷新问题列表（首页和问题清单）
                await this.loadIssues();
                
                // 如果问题清单模态框是打开的，刷新其内容
                const issueListModal = document.getElementById('issueListModal');
                if (issueListModal && issueListModal.classList.contains('show')) {
                    this.displayIssueListTabs();
                }
                
                // 显示成功消息
                Utils.showSuccess('问题已成功删除');
                
                // 更新公告栏
                this.updateAnnouncementBar();
            } else {
                Utils.showError('删除问题失败');
            }
        } catch (error) {
            console.error('删除问题失败:', error);
            Utils.showError('删除问题失败');
        }
    }

    /**
     * 解决问题
     */
    async resolveIssue(issueId) {
        try {
            const response = await fetch(`/api/issues/${issueId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 重新加载问题列表
                await this.loadIssues();
                
                // 如果问题清单模态框是打开的，刷新其内容
                const issueListModal = document.getElementById('issueListModal');
                if (issueListModal && issueListModal.classList.contains('show')) {
                    this.displayIssueListTabs();
                }
                
                // 关闭问题详情模态框（如果打开的话）
                const issueDetailsModal = bootstrap.Modal.getInstance(document.getElementById('issueDetailsModal'));
                if (issueDetailsModal) {
                    issueDetailsModal.hide();
                }
                
                // 更新公告栏
                await this.updateAnnouncementBar();
                
                Utils.showSuccess('问题已解决');
            } else {
                Utils.showError(data.message || '解决问题失败');
            }
        } catch (error) {
            console.error('解决问题失败:', error);
            Utils.showError('解决问题失败，请重试');
        }
    }

    /**
     * 删除问题
     */
    async deleteIssue(issueId) {
        if (!confirm('确定要删除这个问题吗？')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/issues/${issueId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 重新加载问题列表
                await this.loadIssues();
                
                Utils.showSuccess('问题删除成功');
            } else {
                Utils.showError(data.message || '删除问题失败');
            }
        } catch (error) {
            console.error('删除问题失败:', error);
            Utils.showError('删除问题失败，请重试');
        }
    }

    /**
     * 搜索问题
     */
    searchIssues(searchTerm) {
        if (!searchTerm) {
            this.displayIssues(this.issues);
            return;
        }
        
        const filteredIssues = this.issues.filter(issue => 
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (issue.description && issue.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.displayIssues(filteredIssues);
    }

    /**
     * 按优先级过滤问题
     */
    filterIssuesByPriority(priority) {
        if (!priority || priority === 'all') {
            this.displayIssues(this.issues);
            return;
        }
        
        const filteredIssues = this.issues.filter(issue => issue.priority === priority);
        this.displayIssues(filteredIssues);
    }

    /**
     * 按状态过滤问题
     */
    filterIssuesByStatus(status) {
        let filteredIssues;
        
        if (status === 'resolved') {
            filteredIssues = this.issues.filter(issue => issue.resolved_at);
        } else if (status === 'pending') {
            filteredIssues = this.issues.filter(issue => !issue.resolved_at);
        } else {
            filteredIssues = this.issues;
        }
        
        this.displayIssues(filteredIssues);
    }

    /**
     * 获取问题统计信息
     */
    getIssueStats() {
        const total = this.issues.length;
        const resolved = this.issues.filter(issue => issue.resolved_at).length;
        const pending = total - resolved;
        
        const priorityStats = {
            high: this.issues.filter(issue => issue.priority === 'high' && !issue.resolved_at).length,
            medium: this.issues.filter(issue => issue.priority === 'medium' && !issue.resolved_at).length,
            low: this.issues.filter(issue => issue.priority === 'low' && !issue.resolved_at).length
        };
        
        return {
            total,
            resolved,
            pending,
            priorityStats
        };
    }

    /**
     * 更新问题统计显示
     */
    updateIssueStatsDisplay() {
        const stats = this.getIssueStats();
        
        // 更新总数
        const totalEl = document.getElementById('totalIssues');
        if (totalEl) totalEl.textContent = stats.total;
        
        // 更新已解决数
        const resolvedEl = document.getElementById('resolvedIssues');
        if (resolvedEl) resolvedEl.textContent = stats.resolved;
        
        // 更新待解决数
        const pendingEl = document.getElementById('pendingIssues');
        if (pendingEl) pendingEl.textContent = stats.pending;
        
        // 更新优先级统计
        const highPriorityEl = document.getElementById('highPriorityIssues');
        if (highPriorityEl) highPriorityEl.textContent = stats.priorityStats.high;
        
        const mediumPriorityEl = document.getElementById('mediumPriorityIssues');
        if (mediumPriorityEl) mediumPriorityEl.textContent = stats.priorityStats.medium;
        
        const lowPriorityEl = document.getElementById('lowPriorityIssues');
        if (lowPriorityEl) lowPriorityEl.textContent = stats.priorityStats.low;
    }

    /**
     * 导出问题列表
     */
    exportIssues() {
        const csvContent = this.convertIssuesToCSV(this.issues);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `issues_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * 将问题列表转换为CSV格式
     */
    convertIssuesToCSV(issues) {
        const headers = ['ID', '标题', '描述', '优先级', '状态', '创建时间', '解决时间'];
        const csvRows = [headers.join(',')];
        
        issues.forEach(issue => {
            const row = [
                issue.id,
                `"${issue.title.replace(/"/g, '""')}"`,
                `"${(issue.description || '').replace(/"/g, '""')}"`,
                Utils.getPriorityText(issue.priority),
                issue.resolved_at ? '已解决' : '待解决',
                Utils.formatDateTime(issue.created_at),
                issue.resolved_at ? Utils.formatDateTime(issue.resolved_at) : ''
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * 批量操作问题
     */
    async batchResolveIssues(issueIds) {
        if (issueIds.length === 0) {
            Utils.showError('请选择要解决的问题');
            return;
        }
        
        try {
            const response = await fetch('/api/issues/batch-resolve', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ issue_ids: issueIds })
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadIssues();
                
                // 如果问题清单模态框是打开的，刷新其内容
                const issueListModal = document.getElementById('issueListModal');
                if (issueListModal && issueListModal.classList.contains('show')) {
                    this.displayIssueListTabs();
                }
                
                // 更新公告栏
                await this.updateAnnouncementBar();
                
                Utils.showSuccess(`成功解决 ${issueIds.length} 个问题`);
            } else {
                Utils.showError(data.message || '批量解决问题失败');
            }
        } catch (error) {
            console.error('批量解决问题失败:', error);
            Utils.showError('批量解决问题失败，请重试');
        }
    }

    /**
     * 获取选中的问题ID列表
     */
    getSelectedIssueIds() {
        const checkboxes = document.querySelectorAll('.issue-checkbox:checked');
        return Array.from(checkboxes).map(cb => parseInt(cb.value));
    }

    /**
     * 更新公告栏
     */
    async updateAnnouncementBar() {
        try {
            console.log('开始更新公告栏，总问题数:', this.issues ? this.issues.length : 0);
            
            const resolvedIssues = this.issues.filter(issue => issue.resolved_at && issue.successful_solution);
            console.log('符合条件的已解决问题数:', resolvedIssues.length);
            
            const announcementContent = document.getElementById('announcementContent');
            
            if (!announcementContent) {
                console.error('找不到announcementContent元素');
                return;
            }
            
            if (resolvedIssues.length === 0) {
                announcementContent.innerHTML = '<span class="announcement-item announcement-empty">暂无已解决问题的成功方案</span>';
                console.log('公告栏显示空状态');
                return;
            }
            
            // 创建公告项目
            const announcementItems = resolvedIssues.map(issue => 
                `<span class="announcement-item">${issue.title} - ${issue.successful_solution}</span>`
            );
            
            console.log('公告项目:', announcementItems);
            
            // 直接设置公告项目内容（因为announcementContent现在就是.announcement-scroll-content容器）
            announcementContent.innerHTML = announcementItems.join('');
            console.log('公告栏内容已设置');
            
            // 重新启动动画（如果需要）
            this.restartAnnouncementAnimation();
            
        } catch (error) {
            console.error('更新公告栏失败:', error);
            const announcementContent = document.getElementById('announcementContent');
            if (announcementContent) {
                announcementContent.innerHTML = '<span class="announcement-item announcement-empty">加载公告失败</span>';
            }
        }
    }

    /**
     * 重新启动公告栏动画
     */
    restartAnnouncementAnimation() {
        const scrollContent = document.getElementById('announcementContent');
        console.log('重启动画，scrollContent元素:', scrollContent ? '存在' : '不存在');
        
        if (scrollContent) {
            // 移除动画
            scrollContent.style.animation = 'none';
            console.log('动画已移除');
            
            // 强制重排
            scrollContent.offsetHeight;
            
            // 重新添加动画（缩短滚动时长）
            scrollContent.style.animation = 'scroll-announcement 60s linear infinite';
            console.log('动画已重新设置:', scrollContent.style.animation);
        }
    }

    /**
     * 初始化公告栏
     */
    async initAnnouncementBar() {
        // 如果问题数据还没有加载，则先加载
        if (!this.issues || this.issues.length === 0) {
            await this.loadIssues();
        }
        await this.updateAnnouncementBar();
        console.log('公告栏内容更新完成，问题数量:', this.issues ? this.issues.length : 0);
    }

    /**
     * 编辑问题
     */
    editIssue() {
        // 获取当前问题ID
        const issueId = this.currentIssueId;
        if (!issueId) {
            Utils.showError('无法获取问题ID');
            return;
        }
        
        // 关闭问题详情模态框
        const issueDetailsModal = bootstrap.Modal.getInstance(document.getElementById('issueDetailsModal'));
        if (issueDetailsModal) {
            issueDetailsModal.hide();
        }
        
        // 获取当前问题数据
        fetch(`/api/issues/${issueId}`)
            .then(response => response.json())
            .then(issue => {
                // 填充编辑表单
                document.getElementById('editIssueId').value = issueId;
                document.getElementById('editIssueTitle').value = issue.title || '';
                document.getElementById('editIssueDescription').value = issue.description || '';
                document.getElementById('editIssuePriority').value = issue.priority || 'medium';
                
                // 显示编辑模态框
                const editIssueModal = document.getElementById('editIssueModal');
                if (editIssueModal) {
                    new bootstrap.Modal(editIssueModal).show();
                }
            })
            .catch(error => {
                console.error('获取问题详情失败:', error);
                Utils.showError('获取问题详情失败');
            });
    }
    
    /**
     * 保存问题编辑
     */
    async saveIssueEdit() {
        const issueId = document.getElementById('editIssueId').value;
        const title = document.getElementById('editIssueTitle').value;
        const description = document.getElementById('editIssueDescription').value;
        const priority = document.getElementById('editIssuePriority').value;
        
        if (!issueId) {
            Utils.showError('无法获取问题ID');
            return;
        }
        
        if (!title) {
            Utils.showError('请填写问题标题');
            return;
        }
        
        const issueData = {
            title: title,
            description: description,
            priority: priority
        };
        
        try {
            const response = await fetch(`/api/issues/${issueId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issueData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 关闭编辑模态框
                const editIssueModal = bootstrap.Modal.getInstance(document.getElementById('editIssueModal'));
                if (editIssueModal) {
                    editIssueModal.hide();
                }
                
                // 重新加载问题列表和首页数据
                await this.loadIssues();
                
                // 如果在首页，刷新首页数据
                if (window.DashboardModule) {
                    window.DashboardModule.refreshDashboard();
                }
                
                Utils.showSuccess('问题更新成功');
            } else {
                Utils.showError(data.message || '更新问题失败');
            }
        } catch (error) {
            console.error('更新问题失败:', error);
            Utils.showError('更新问题失败，请重试');
        }
    }

    /**
     * 刷新问题清单
     */
    async refreshIssueList() {
        try {
            await this.loadIssues();
            this.displayIssueListTabs();
            Utils.showSuccess('问题清单已刷新');
        } catch (error) {
            console.error('刷新问题清单失败:', error);
            Utils.showError('刷新问题清单失败');
        }
    }
}

// 全局函数，供HTML调用
window.showIssueList = function() {
    if (window.IssueModule) {
        window.IssueModule.showIssueList();
    }
};

window.addSolution = function() {
    if (window.IssueModule) {
        window.IssueModule.addSolution();
    }
};

window.markIssueResolved = function() {
    if (window.IssueModule) {
        window.IssueModule.markIssueResolved();
    }
};

window.editIssue = function() {
    if (window.IssueModule) {
        window.IssueModule.editIssue();
    }
};

window.saveIssueEdit = function() {
    if (window.IssueModule) {
        window.IssueModule.saveIssueEdit();
    }
};

window.refreshIssueList = function() {
    if (window.IssueModule) {
        window.IssueModule.loadIssues();
    }
};

// 导出问题模块
// IssueModule实例通过IssueModule.init()方法设置到window.IssueModule
// 不需要在这里设置类本身