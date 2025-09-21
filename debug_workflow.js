// 调试工作流清单功能
console.log('=== 工作流清单调试脚本 ===');

// 检查模态框元素是否存在
const modal = document.getElementById('workflowConfigModal');
console.log('工作流模态框元素:', modal);

// 检查按钮元素是否存在
const button = document.querySelector('[data-bs-target="#workflowConfigModal"]');
console.log('工作流按钮元素:', button);

// 检查工作流列表容器
const listContainer = document.getElementById('workflowTypeList');
console.log('工作流列表容器:', listContainer);

// 检查Bootstrap模态框是否可用
if (typeof bootstrap !== 'undefined') {
    console.log('Bootstrap已加载');
} else {
    console.error('Bootstrap未加载');
}

// 手动触发工作流加载
if (typeof loadWorkflows === 'function') {
    console.log('手动调用loadWorkflows函数...');
    loadWorkflows();
} else {
    console.error('loadWorkflows函数不存在');
}

// 检查当前工作流数据
console.log('当前工作流数据:', typeof currentWorkflows !== 'undefined' ? currentWorkflows : '未定义');

// 模拟点击按钮
if (button) {
    console.log('模拟点击工作流按钮...');
    button.click();
} else {
    console.error('找不到工作流按钮');
}

console.log('=== 调试脚本执行完毕 ===');