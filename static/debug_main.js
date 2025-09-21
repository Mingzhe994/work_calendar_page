// 调试主页面工作流功能
console.log('=== 开始调试主页面工作流功能 ===');

// 检查页面元素
function checkElements() {
    console.log('\n--- 检查页面元素 ---');
    
    const workflowBtn = document.getElementById('workflowBtn');
    console.log('工作流按钮:', workflowBtn);
    
    const workflowModal = document.getElementById('workflowModal');
    console.log('工作流模态框:', workflowModal);
    
    const workflowListView = document.getElementById('workflowListView');
    console.log('工作流列表视图:', workflowListView);
    
    const workflowList = document.getElementById('workflowList');
    console.log('工作流列表容器:', workflowList);
    
    return { workflowBtn, workflowModal, workflowListView, workflowList };
}

// 测试API调用
function testAPI() {
    console.log('\n--- 测试API调用 ---');
    
    fetch('/api/workflows')
        .then(response => {
            console.log('API响应状态:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('API返回数据:', data);
            if (data.workflows) {
                console.log('工作流数量:', data.workflows.length);
                data.workflows.forEach((workflow, index) => {
                    console.log(`工作流 ${index + 1}:`, workflow.name);
                });
            }
        })
        .catch(error => {
            console.error('API调用错误:', error);
        });
}

// 手动触发工作流功能
function manualTrigger() {
    console.log('\n--- 手动触发工作流功能 ---');
    
    const elements = checkElements();
    
    if (elements.workflowBtn) {
        console.log('模拟点击工作流按钮...');
        elements.workflowBtn.click();
        
        setTimeout(() => {
            console.log('检查模态框状态...');
            if (elements.workflowModal) {
                console.log('模态框显示状态:', window.getComputedStyle(elements.workflowModal).display);
            }
            
            if (elements.workflowListView) {
                console.log('列表视图显示状态:', window.getComputedStyle(elements.workflowListView).display);
            }
            
            // 手动调用函数
            if (typeof showWorkflowListView === 'function') {
                console.log('手动调用 showWorkflowListView...');
                showWorkflowListView();
            }
            
            if (typeof loadWorkflows === 'function') {
                console.log('手动调用 loadWorkflows...');
                loadWorkflows();
            }
        }, 1000);
    }
}

// 页面加载完成后执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            checkElements();
            testAPI();
            manualTrigger();
        }, 2000);
    });
} else {
    setTimeout(() => {
        checkElements();
        testAPI();
        manualTrigger();
    }, 2000);
}

// 导出函数供手动调用
window.debugWorkflow = {
    checkElements,
    testAPI,
    manualTrigger
};

console.log('调试脚本加载完成。可以在控制台使用 debugWorkflow.checkElements(), debugWorkflow.testAPI(), debugWorkflow.manualTrigger() 进行手动测试。');