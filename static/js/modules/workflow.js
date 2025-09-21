/**
 * 工作流管理模块
 * 负责工作流的管理和步骤处理
 */

class WorkflowModule {
    constructor() {
        this.workflows = [];
        this.currentWorkflow = null;
        this.workflowSteps = [];
    }

    /**
     * 初始化工作流模块
     */
    static init() {
        const instance = new WorkflowModule();
        window.WorkflowModule = instance;
        return instance;
    }

    /**
     * 加载工作流列表
     */
    async loadWorkflows() {
        try {
            const response = await fetch('/api/workflows');
            const data = await response.json();
            
            // API 返回的是 { workflows: [...] } 格式
            const workflows = data.workflows || [];
            
            // 按创建时间从新到旧排序
            workflows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            this.workflows = workflows;
            this.populateWorkflowSelector(workflows);
            
            console.log('工作流加载完成:', workflows.length, '个工作流');
            return workflows;
        } catch (error) {
            console.error('加载工作流失败:', error);
            Utils.showError('加载工作流失败，请重试');
            this.workflows = []; // 确保在错误情况下 workflows 仍然是数组
            return [];
        }
    }

    /**
     * 显示工作流列表视图
     */
    showWorkflowListView() {
        const workflowListView = document.getElementById('workflowListView');
        const workflowStepsView = document.getElementById('workflowStepsView');
        
        if (workflowListView) {
            workflowListView.style.display = 'block';
        }
        
        if (workflowStepsView) {
            workflowStepsView.style.display = 'none';
        }
        
        // 加载并显示工作流列表
        this.displayWorkflowList();
    }

    /**
     * 显示工作流列表
     */
    async displayWorkflowList() {
        const workflowTypeList = document.getElementById('workflowTypeList');
        if (!workflowTypeList) return;
        
        try {
            // 确保 workflows 是数组
            if (!Array.isArray(this.workflows)) {
                this.workflows = [];
            }
            
            // 如果还没有加载工作流，先加载
            if (this.workflows.length === 0) {
                await this.loadWorkflows();
            }
            
            // 再次确保 workflows 是数组
            if (!Array.isArray(this.workflows)) {
                this.workflows = [];
            }
            
            if (this.workflows.length === 0) {
                workflowTypeList.innerHTML = '<div class="text-center text-muted py-4">暂无工作流类型</div>';
                return;
            }
            
            const workflowsHtml = this.workflows.map(workflow => this.createWorkflowListItem(workflow)).join('');
            workflowTypeList.innerHTML = workflowsHtml;
        } catch (error) {
            console.error('显示工作流列表失败:', error);
            workflowTypeList.innerHTML = '<div class="text-center text-danger py-4">加载工作流列表失败</div>';
        }
    }

    /**
     * 创建工作流列表项
     */
    createWorkflowListItem(workflow) {
        return `
            <div class="workflow-item border rounded p-3 mb-3" onclick="window.WorkflowModule.showWorkflowSteps(${workflow.id})">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">
                                <i class="fas fa-project-diagram me-2"></i>${workflow.name}
                            </h6>
                            <div>
                                ${!workflow.is_default ? 
                                    `<button class="btn btn-icon" onclick="event.stopPropagation(); window.WorkflowModule.setDefaultWorkflow(${workflow.id})" title="设为默认">
                                        <i class="fas fa-star"></i>
                                    </button>` : 
                                    `<span class="badge bg-primary ms-2">默认</span>`
                                }
                            </div>
                        </div>
                        <p class="text-muted mb-2 small">${workflow.description || '无描述'}</p>
                        <div class="d-flex align-items-center text-muted small">
                            <span class="me-3">
                                <i class="fas fa-list me-1"></i>步骤数: ${workflow.steps ? workflow.steps.length : 0}
                            </span>
                            <span class="me-3">
                                <i class="fas fa-calendar me-1"></i>创建时间: ${new Date(workflow.created_at).toLocaleDateString()}
                            </span>
                            <div class="ms-auto">
                                <button class="btn btn-sm btn-outline-secondary me-2" onclick="event.stopPropagation(); window.WorkflowModule.editWorkflow(${workflow.id})" title="编辑">
                                    <i class="fas fa-edit me-1"></i>编辑
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); window.WorkflowModule.deleteWorkflow(${workflow.id})" title="删除">
                                    <i class="fas fa-trash me-1"></i>删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 显示工作流步骤视图
     */
    showWorkflowSteps(workflowId) {
        // 保存当前工作流ID
        this.currentWorkflowId = workflowId;
        
        const workflowListView = document.getElementById('workflowListView');
        const workflowStepsView = document.getElementById('workflowStepsView');
        const currentWorkflowName = document.getElementById('currentWorkflowName');
        
        if (workflowListView) {
            workflowListView.style.display = 'none';
        }
        
        if (workflowStepsView) {
            workflowStepsView.style.display = 'block';
        }
        
        // 设置当前工作流名称
        const workflow = this.workflows.find(w => w.id == workflowId);
        if (currentWorkflowName && workflow) {
            currentWorkflowName.textContent = `${workflow.name} - 步骤管理`;
        }
        
        // 加载工作流步骤
        this.loadWorkflowSteps(workflowId);
    }
    
    /**
     * 查看工作流步骤详情
     */
    viewWorkflowStep(stepIndex) {
        if (!this.currentWorkflowId || !this.currentSteps) {
            Utils.showError('请先选择一个工作流');
            return;
        }

        const step = this.currentSteps[stepIndex];
        if (!step) {
            Utils.showError('步骤不存在');
            return;
        }
        
        // 显示步骤详情
        Utils.showInfo(`步骤 ${stepIndex + 1}: ${step.title}${step.description ? '<br>' + step.description : ''}`);
    }

    /**
     * 返回工作流列表
     */
    backToWorkflowList() {
        // 先加载最新的工作流数据
        this.loadWorkflows().then(() => {
            // 然后显示工作流列表视图
            this.showWorkflowListView();
        });
    }

    /**
     * 填充工作流选择器
     */
    populateWorkflowSelector(workflows) {
        const workflowSelector = document.getElementById('workflowSelector');
        const taskWorkflowSelect = document.getElementById('taskWorkflow');
        const taskTypeSelect = document.getElementById('taskType');
        
        if (workflowSelector) {
            workflowSelector.innerHTML = '<option value="">选择工作流</option>';
            workflows.forEach(workflow => {
                const option = document.createElement('option');
                option.value = workflow.id;
                option.textContent = workflow.name;
                workflowSelector.appendChild(option);
            });
        }
        
        if (taskWorkflowSelect) {
            taskWorkflowSelect.innerHTML = '<option value="">选择工作流</option>';
            workflows.forEach(workflow => {
                const option = document.createElement('option');
                option.value = workflow.id;
                option.textContent = workflow.name;
                taskWorkflowSelect.appendChild(option);
            });
        }
        
        // 更新任务类型选择器，使其与工作流清单保持一致
        if (taskTypeSelect) {
            taskTypeSelect.innerHTML = '<option value="">选择任务类型</option>';
            workflows.forEach(workflow => {
                const option = document.createElement('option');
                option.value = workflow.name;
                option.textContent = workflow.name;
                taskTypeSelect.appendChild(option);
            });
        }
    }

    /**
     * 加载工作流步骤
     */
    async loadWorkflowSteps(workflowId) {
        if (!workflowId) {
            this.clearWorkflowSteps();
            return;
        }
        
        try {
            const response = await fetch(`/api/workflows/${workflowId}/steps`);
            const steps = await response.json();
            
            this.workflowSteps = steps;
            this.currentSteps = steps; // 保存当前步骤数据
            this.displayWorkflowSteps(steps);
            
            // 更新当前工作流
            this.currentWorkflow = this.workflows.find(w => w.id == workflowId);
            
            console.log('工作流步骤加载完成');
            return steps;
        } catch (error) {
            console.error('加载工作流步骤失败:', error);
            Utils.showError('加载工作流步骤失败');
            return [];
        }
    }

    /**
     * 显示工作流步骤
     */
    displayWorkflowSteps(steps) {
        const workflowStepsContainer = document.getElementById('workflowStepsList');
        if (!workflowStepsContainer) return;

        if (steps.length === 0) {
            workflowStepsContainer.innerHTML = '<div class="text-center text-muted py-4">该工作流暂无步骤</div>';
            return;
        }

        const stepsHtml = steps.map((step, index) => this.createWorkflowStepElement(step, index, steps.length)).join('');
        workflowStepsContainer.innerHTML = stepsHtml;
    }

    /**
     * 创建工作流步骤元素
     */
    createWorkflowStepElement(step, index, totalSteps) {
        // 适配后端返回的数据结构：step.title 而不是 step.name
        const stepTitle = step.title || step.name || `步骤 ${index + 1}`;
        const stepDescription = step.description || '';
        
        return `
            <div class="workflow-step-item" onclick="window.WorkflowModule.viewWorkflowStep(${index})">
                <div class="workflow-step-header">
                    <div class="d-flex align-items-center">
                        <span class="workflow-step-number me-2">${index + 1}</span>
                        <h6 class="workflow-step-title">${Utils.escapeHtml(stepTitle)}</h6>
                    </div>
                    <div class="step-actions">
                        <button class="btn btn-icon" onclick="event.stopPropagation(); window.WorkflowModule.editWorkflowStep(${index})" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon" onclick="event.stopPropagation(); window.WorkflowModule.deleteWorkflowStep(${index})" title="删除">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-icon" onclick="event.stopPropagation(); window.WorkflowModule.moveStepUp(${index})" title="上移" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button class="btn btn-icon" onclick="event.stopPropagation(); window.WorkflowModule.moveStepDown(${index})" title="下移" ${index === totalSteps - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down"></i>
                        </button>
                    </div>
                </div>
                ${stepDescription ? `<p class="workflow-step-description">${Utils.escapeHtml(stepDescription)}</p>` : ''}
            </div>
        `;
    }

    // 注意：以下方法已移除，因为后端没有对应的API端点：
    // - completeStep(stepId): 完成工作流步骤
    // - showStepDetails(stepId): 显示步骤详情
    // - fillStepDetails(step): 填充步骤详情

    /**
     * 创建新工作流
     */
    async createWorkflow() {
        const name = document.getElementById('workflowName').value;
        const description = document.getElementById('workflowDescription').value;
        const isDefault = document.getElementById('isDefaultWorkflow').checked;
        
        if (!name) {
            Utils.showError('请填写工作流名称');
            return;
        }
        
        const workflowData = {
            name: name,
            description: description,
            is_default: isDefault
        };
        
        try {
            const response = await fetch('/api/workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 隐藏表单
                this.hideWorkflowForm();
                
                // 重新加载工作流
                await this.loadWorkflows();
                
                Utils.showSuccess('工作流创建成功');
            } else {
                Utils.showError(data.error || data.message || '创建工作流失败');
            }
        } catch (error) {
            console.error('创建工作流失败:', error);
            Utils.showError('创建工作流失败，请重试');
        }
    }

    // 注意：以下方法已移除，因为后端没有对应的API端点：
    // - addWorkflowStep(): 添加工作流步骤
    // - updateStepActualHours(stepId, actualHours): 更新步骤实际工时

    /**
     * 获取工作流进度
     */
    getWorkflowProgress(workflowId) {
        const workflow = this.workflows.find(w => w.id == workflowId);
        if (!workflow || !this.workflowSteps.length) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        
        const steps = this.workflowSteps.filter(step => step.workflow_id == workflowId);
        const completedSteps = steps.filter(step => step.status === 'completed');
        
        return {
            completed: completedSteps.length,
            total: steps.length,
            percentage: steps.length > 0 ? Math.round((completedSteps.length / steps.length) * 100) : 0
        };
    }

    /**
     * 获取工作流统计信息
     */
    getWorkflowStats() {
        const totalWorkflows = this.workflows.length;
        const activeWorkflows = this.workflows.filter(w => {
            const progress = this.getWorkflowProgress(w.id);
            return progress.percentage > 0 && progress.percentage < 100;
        }).length;
        
        const completedWorkflows = this.workflows.filter(w => {
            const progress = this.getWorkflowProgress(w.id);
            return progress.percentage === 100;
        }).length;
        
        return {
            total: totalWorkflows,
            active: activeWorkflows,
            completed: completedWorkflows,
            pending: totalWorkflows - activeWorkflows - completedWorkflows
        };
    }

    /**
     * 清空工作流步骤显示
     */
    clearWorkflowSteps() {
        const workflowStepsContainer = document.getElementById('workflowSteps');
        if (workflowStepsContainer) {
            workflowStepsContainer.innerHTML = '<div class="text-center text-muted py-4">请选择工作流查看步骤</div>';
        }
        this.workflowSteps = [];
        this.currentWorkflow = null;
    }

    /**
     * 导出工作流数据
     */
    exportWorkflowData() {
        const data = {
            workflows: this.workflows,
            steps: this.workflowSteps,
            exportTime: new Date().toISOString()
        };
        
        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `workflow_data_${new Date().toISOString().split('T')[0]}.json`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * 复制工作流
     */
    async duplicateWorkflow(workflowId) {
        try {
            const response = await fetch(`/api/workflows/${workflowId}/duplicate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                await this.loadWorkflows();
                Utils.showSuccess('工作流复制成功');
            } else {
                Utils.showError(data.message || '复制工作流失败');
            }
        } catch (error) {
            console.error('复制工作流失败:', error);
            Utils.showError('复制工作流失败，请重试');
        }
    }

    /**
     * 编辑工作流
     */
    editWorkflow(workflowId) {
        const workflow = this.workflows.find(w => w.id == workflowId);
        if (!workflow) {
            Utils.showError('找不到指定的工作流');
            return;
        }
        
        this.showWorkflowForm();
        
        // 设置表单标题
        const formTitle = document.getElementById('workflowFormTitle');
        if (formTitle) {
            formTitle.textContent = '编辑工作流类型';
        }
        
        // 填充表单数据
        const nameInput = document.getElementById('workflowName');
        const descriptionInput = document.getElementById('workflowDescription');
        const isDefaultCheckbox = document.getElementById('isDefaultWorkflow');
        const editWorkflowIdInput = document.getElementById('editWorkflowId');
        
        if (nameInput) {
            nameInput.value = workflow.name;
            // 设置名称字段为只读
            nameInput.readOnly = true;
        }
        
        if (descriptionInput) {
            descriptionInput.value = workflow.description || '';
        }
        
        if (isDefaultCheckbox) {
            isDefaultCheckbox.checked = workflow.is_default;
        }
        
        if (editWorkflowIdInput) {
            editWorkflowIdInput.value = workflow.id;
        }
    }

    /**
     * 删除工作流
     */
    deleteWorkflow(workflowId) {
        // 创建确认对话框
        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal fade';
        confirmModal.id = 'deleteWorkflowConfirmModal';
        confirmModal.setAttribute('tabindex', '-1');
        confirmModal.setAttribute('aria-labelledby', 'deleteWorkflowConfirmModalLabel');
        confirmModal.setAttribute('aria-hidden', 'true');
        
        confirmModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteWorkflowConfirmModalLabel">确认删除</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>确定要删除这个工作流吗？此操作不可恢复。</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteWorkflowBtn">确认删除</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmModal);
        
        // 创建Bootstrap模态框实例
        const modal = new bootstrap.Modal(confirmModal);
        modal.show();
        
        // 确认删除按钮点击事件
        document.getElementById('confirmDeleteWorkflowBtn').addEventListener('click', () => {
            fetch(`/api/workflows/${workflowId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (response.ok) {
                    modal.hide();
                    // 刷新工作流列表
                    this.loadWorkflows().then(() => {
                        // 确保列表完全刷新后再显示成功消息
                        this.displayWorkflowList();
                        Utils.showSuccess('工作流已删除');
                    });
                } else {
                    throw new Error('删除工作流失败');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Utils.showError('删除工作流失败');
                modal.hide();
            });
        });
        
        // 模态框关闭后移除DOM元素
        confirmModal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(confirmModal);
        });
    }

    /**
     * 显示创建工作流表单
     */
    showCreateWorkflowForm() {
        this.showWorkflowForm();
        
        // 清空表单
        const form = document.getElementById('workflowEditForm');
        if (form) {
            form.reset();
        }
        
        // 设置表单标题
        const formTitle = document.getElementById('workflowFormTitle');
        if (formTitle) {
            formTitle.textContent = '新建工作流类型';
        }
        
        // 清空隐藏的工作流ID
        const editWorkflowId = document.getElementById('editWorkflowId');
        if (editWorkflowId) {
            editWorkflowId.value = '';
        }
    }

    /**
     * 显示工作流表单
     */
    showWorkflowForm() {
        const workflowListView = document.getElementById('workflowListView');
        const workflowStepsView = document.getElementById('workflowStepsView');
        const workflowForm = document.getElementById('workflowForm');
        
        if (workflowListView) {
            workflowListView.style.display = 'none';
        }
        
        if (workflowStepsView) {
            workflowStepsView.style.display = 'none';
        }
        
        if (workflowForm) {
            workflowForm.style.display = 'block';
        }
    }

    /**
     * 隐藏工作流表单
     */
    hideWorkflowForm() {
        const workflowListView = document.getElementById('workflowListView');
        const workflowForm = document.getElementById('workflowForm');
        
        if (workflowForm) {
            workflowForm.style.display = 'none';
        }
        
        if (workflowListView) {
            workflowListView.style.display = 'block';
        }
    }

    /**
     * 保存工作流
     */
    async saveWorkflow() {
        const editWorkflowId = document.getElementById('editWorkflowId').value;
        
        if (editWorkflowId) {
            // 编辑现有工作流
            await this.updateWorkflow(editWorkflowId);
        } else {
            // 创建新工作流
            await this.createWorkflow();
        }
        
        // 确保在工作流列表视图
        this.showWorkflowListView();
        // 立即刷新工作流列表
        this.displayWorkflowList();
    }

    /**
     * 更新工作流
     */
    async updateWorkflow(workflowId) {
        const name = document.getElementById('workflowName').value;
        const description = document.getElementById('workflowDescription').value;
        const isDefault = document.getElementById('isDefaultWorkflow').checked;
        
        if (!name) {
            Utils.showError('请填写工作流名称');
            return;
        }
        
        const workflowData = {
            name: name,
            description: description,
            is_default: isDefault
        };
        
        try {
            const response = await fetch(`/api/workflows/${workflowId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // 隐藏表单
                this.hideWorkflowForm();
                
                // 重新加载工作流
                await this.loadWorkflows();
                
                Utils.showSuccess('工作流更新成功');
            } else {
                Utils.showError(data.message || '更新工作流失败');
            }
        } catch (error) {
            console.error('更新工作流失败:', error);
            Utils.showError('更新工作流失败，请重试');
        }
    }

    /**
     * 设置默认工作流
     */
    setDefaultWorkflow(workflowId) {
        event.stopPropagation();
        fetch(`/api/workflows/${workflowId}/set-default`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // 重新加载工作流并立即刷新界面
                this.loadWorkflows().then(() => {
                    // 确保在工作流列表视图
                    this.showWorkflowListView();
                    // 立即更新工作流列表界面
                    this.displayWorkflowList();
                    Utils.showSuccess('默认工作流已设置');
                });
            } else {
                throw new Error('设置默认工作流失败');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Utils.showError('设置默认工作流失败');
        });
    }
    
    /**
     * 获取默认工作流
     * @returns {Object|null} 默认工作流对象，如果没有则返回null
     */
    getDefaultWorkflow() {
        if (!this.workflows || this.workflows.length === 0) {
            return null;
        }
        
        // 查找标记为默认的工作流
        const defaultWorkflow = this.workflows.find(workflow => workflow.is_default);
        return defaultWorkflow || null;
    }

    /**
     * 添加工作流步骤
     */
    async addWorkflowStep() {
        if (!this.currentWorkflowId) {
            Utils.showError('请先选择一个工作流');
            return;
        }

        this.showStepModal('add');
    }

    /**
     * 显示步骤管理模态框
     */
    showStepModal(mode, stepIndex = null) {
        const modal = document.getElementById('stepManageModal');
        const modalTitle = document.getElementById('stepManageModalLabel');
        const stepTitle = document.getElementById('stepTitle');
        const stepDescription = document.getElementById('stepDescription');
        const saveBtn = document.getElementById('saveStepBtn');

        if (mode === 'add') {
            modalTitle.textContent = '添加步骤';
            stepTitle.value = '';
            stepDescription.value = '';
            saveBtn.onclick = () => this.saveStep('add');
        } else if (mode === 'edit' && stepIndex !== null) {
            const step = this.currentSteps[stepIndex];
            modalTitle.textContent = '编辑步骤';
            stepTitle.value = step.title;
            stepDescription.value = step.description || '';
            saveBtn.onclick = () => this.saveStep('edit', stepIndex);
        }

        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * 保存步骤
     */
    async saveStep(mode, stepIndex = null) {
        const stepTitle = document.getElementById('stepTitle').value.trim();
        const stepDescription = document.getElementById('stepDescription').value.trim();

        if (!stepTitle) {
            Utils.showError('请输入步骤标题');
            return;
        }

        try {
            let response;
            const requestBody = { 
                title: stepTitle,
                description: stepDescription || null
            };

            if (mode === 'add') {
                response = await fetch(`/api/workflows/${this.currentWorkflowId}/steps`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            } else if (mode === 'edit') {
                response = await fetch(`/api/workflows/${this.currentWorkflowId}/steps/${stepIndex}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestBody)
                });
            }

            const data = await response.json();

            if (data.success) {
                // 关闭模态框
                const modal = bootstrap.Modal.getInstance(document.getElementById('stepManageModal'));
                modal.hide();
                
                // 重新加载步骤
                await this.loadWorkflowSteps(this.currentWorkflowId);
                Utils.showSuccess(mode === 'add' ? '步骤添加成功' : '步骤更新成功');
            } else {
                Utils.showError(data.error || (mode === 'add' ? '添加步骤失败' : '更新步骤失败'));
            }
        } catch (error) {
            console.error(`${mode === 'add' ? '添加' : '更新'}步骤失败:`, error);
            Utils.showError(`${mode === 'add' ? '添加' : '更新'}步骤失败，请重试`);
        }
    }

    /**
     * 编辑工作流步骤
     */
    async editWorkflowStep(stepIndex) {
        if (!this.currentWorkflowId || !this.currentSteps) {
            Utils.showError('请先选择一个工作流');
            return;
        }

        const step = this.currentSteps[stepIndex];
        if (!step) {
            Utils.showError('步骤不存在');
            return;
        }

        this.showStepModal('edit', stepIndex);
    }

    /**
     * 删除工作流步骤
     */
    async deleteWorkflowStep(stepIndex) {
        if (!this.currentWorkflowId || !this.currentSteps) {
            Utils.showError('请先选择一个工作流');
            return;
        }

        const step = this.currentSteps[stepIndex];
        if (!step) {
            Utils.showError('步骤不存在');
            return;
        }

        if (!confirm(`确定要删除步骤 "${step.title}" 吗？`)) {
            return;
        }

        try {
            const response = await fetch(`/api/workflows/${this.currentWorkflowId}/steps/${stepIndex}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // 重新加载步骤
                await this.loadWorkflowSteps(this.currentWorkflowId);
                Utils.showSuccess('步骤删除成功');
            } else {
                Utils.showError(data.error || '删除步骤失败');
            }
        } catch (error) {
            console.error('删除步骤失败:', error);
            Utils.showError('删除步骤失败，请重试');
        }
    }

    /**
     * 上移步骤
     */
    async moveStepUp(stepIndex) {
        if (stepIndex <= 0 || !this.currentSteps) {
            return;
        }

        await this.swapSteps(stepIndex, stepIndex - 1);
    }

    /**
     * 下移步骤
     */
    async moveStepDown(stepIndex) {
        if (!this.currentSteps || stepIndex >= this.currentSteps.length - 1) {
            return;
        }

        await this.swapSteps(stepIndex, stepIndex + 1);
    }

    /**
     * 交换两个步骤的位置
     */
    async swapSteps(index1, index2) {
        if (!this.currentWorkflowId || !this.currentSteps) {
            Utils.showError('请先选择一个工作流');
            return;
        }

        try {
            // 创建新的步骤顺序
            const newSteps = [...this.currentSteps];
            const step1 = newSteps[index1];
            const step2 = newSteps[index2];
            
            newSteps[index1] = step2;
            newSteps[index2] = step1;

            // 提取步骤标题
            const stepTitles = newSteps.map(step => step.title);

            const response = await fetch(`/api/workflows/${this.currentWorkflowId}/steps/reorder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ steps: stepTitles })
            });

            const data = await response.json();

            if (data.success) {
                // 重新加载步骤
                await this.loadWorkflowSteps(this.currentWorkflowId);
                Utils.showSuccess('步骤顺序调整成功');
            } else {
                Utils.showError(data.error || '调整步骤顺序失败');
            }
        } catch (error) {
            console.error('调整步骤顺序失败:', error);
            Utils.showError('调整步骤顺序失败，请重试');
        }
    }

}

// 导出工作流模块
// WorkflowModule实例通过WorkflowModule.init()方法设置到window.WorkflowModule
// 不需要在这里设置类本身