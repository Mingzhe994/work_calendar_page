from flask import Blueprint, request, jsonify
from services import WorkflowService

workflow_bp = Blueprint('workflow', __name__, url_prefix='/api')

@workflow_bp.route('/workflow/<task_type>')
def get_workflow(task_type):
    """根据任务类型获取工作流"""
    result = WorkflowService.get_workflow_by_task_type(task_type)
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@workflow_bp.route('/workflows')
def get_workflows():
    """获取所有工作流"""
    workflows = WorkflowService.get_all_workflows()
    return jsonify({'workflows': workflows})

@workflow_bp.route('/workflows', methods=['POST'])
def create_workflow():
    """创建新工作流"""
    data = request.get_json()
    result = WorkflowService.create_workflow(data)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>', methods=['PUT'])
def update_workflow(workflow_id):
    """更新工作流"""
    data = request.get_json()
    result = WorkflowService.update_workflow(workflow_id, data)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/set-default', methods=['POST'])
def set_default_workflow(workflow_id):
    """设置默认工作流"""
    result = WorkflowService.set_default_workflow(workflow_id)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>', methods=['DELETE'])
def delete_workflow(workflow_id):
    """删除工作流"""
    result = WorkflowService.delete_workflow(workflow_id)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/steps')
def get_workflow_steps(workflow_id):
    """获取工作流步骤（通过ID）"""
    result = WorkflowService.get_workflow_steps(workflow_id)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@workflow_bp.route('/workflows/<workflow_name>/steps')
def get_workflow_steps_by_name(workflow_name):
    """获取工作流步骤（通过名称）"""
    result = WorkflowService.get_workflow_steps_by_name(workflow_name)
    
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/steps', methods=['POST'])
def add_workflow_step(workflow_id):
    """添加工作流步骤"""
    data = request.get_json()
    result = WorkflowService.add_workflow_step(workflow_id, data)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/steps/<int:step_index>', methods=['PUT'])
def update_workflow_step(workflow_id, step_index):
    """更新工作流步骤"""
    data = request.get_json()
    result = WorkflowService.update_workflow_step(workflow_id, step_index, data)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/steps/<int:step_index>', methods=['DELETE'])
def delete_workflow_step(workflow_id, step_index):
    """删除工作流步骤"""
    result = WorkflowService.delete_workflow_step(workflow_id, step_index)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)

@workflow_bp.route('/workflows/<int:workflow_id>/steps/reorder', methods=['PUT'])
def reorder_workflow_steps(workflow_id):
    """调整工作流步骤顺序"""
    data = request.get_json()
    result = WorkflowService.reorder_workflow_steps(workflow_id, data)
    
    if not result.get('success', False):
        return jsonify(result), 400
    
    return jsonify(result)