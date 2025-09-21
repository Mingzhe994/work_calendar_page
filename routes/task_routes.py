from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from services import TaskService

task_bp = Blueprint('task', __name__, url_prefix='/api/tasks')

@task_bp.route('')
@login_required
def get_tasks():
    """获取所有任务"""
    exclude_completed = request.args.get('exclude_completed', 'false').lower() == 'true'
    status = request.args.get('status')
    # 添加用户隔离，只获取当前用户的任务
    tasks = TaskService.get_all_tasks(exclude_completed=exclude_completed, status=status, user_id=current_user.id)
    return jsonify(tasks)

@task_bp.route('', methods=['POST'])
@login_required
def add_task():
    """添加新任务"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '无效的请求数据'}), 400
        
        # 验证起始日期必须早于或等于截止日期
        if data.get('start_date') and data.get('deadline'):
            from datetime import datetime
            
            # 支持两种格式：日期格式和日期时间格式
            try:
                # 尝试解析日期时间格式 (YYYY-MM-DDThh:mm)
                if 'T' in data['start_date']:
                    start_date = datetime.strptime(data['start_date'], '%Y-%m-%dT%H:%M')
                else:
                    start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
                    
                if 'T' in data['deadline']:
                    deadline = datetime.strptime(data['deadline'], '%Y-%m-%dT%H:%M')
                else:
                    deadline = datetime.strptime(data['deadline'], '%Y-%m-%d')
            except ValueError as e:
                return jsonify({'success': False, 'error': f'日期格式错误: {str(e)}'}), 400
            
            if start_date > deadline:
                return jsonify({'success': False, 'error': '起始日期必须早于或等于截止日期'}), 400
        
        # 添加当前用户ID到任务数据
        if 'user_id' not in data:
            data['user_id'] = current_user.id
            
        task = TaskService.create_task(data)
        return jsonify({'success': True, 'id': task.id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@task_bp.route('/<int:task_id>')
def get_task(task_id):
    """获取单个任务详情"""
    task = TaskService.get_task_by_id(task_id)
    if not task:
        return jsonify({'error': '任务不存在'}), 404
    
    return jsonify(task.to_detail_dict())

@task_bp.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """删除任务"""
    success = TaskService.delete_task(task_id)
    if not success:
        return jsonify({'success': False, 'error': '任务不存在'}), 404
    
    return jsonify({'success': True})

@task_bp.route('/<int:task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """完成任务"""
    success = TaskService.complete_task(task_id)
    if not success:
        return jsonify({'success': False, 'error': '任务不存在'}), 404
    
    return jsonify({'success': True})

@task_bp.route('/<int:task_id>/status', methods=['PUT'])
def update_task_status(task_id):
    """更新任务状态"""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': '无效的请求数据'}), 400
    
    result = TaskService.update_task_status(task_id, data)
    if not result['success']:
        return jsonify(result), 400
    
    return jsonify(result)

@task_bp.route('/<int:task_id>/history')
def get_task_history(task_id):
    """获取任务历史"""
    result = TaskService.get_task_history(task_id)
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@task_bp.route('/<int:task_id>/comments')
def get_task_comments(task_id):
    """获取任务评论"""
    result = TaskService.get_task_comments(task_id)
    if 'error' in result:
        return jsonify(result), 404
    
    return jsonify(result)

@task_bp.route('/<int:task_id>/comments', methods=['POST'])
def add_task_comment(task_id):
    """添加任务评论"""
    data = request.get_json()
    if not data or 'comment' not in data:
        return jsonify({'error': '评论内容不能为空'}), 400
    
    result = TaskService.add_task_comment(task_id, data['comment'])
    if 'error' in result:
        return jsonify(result), 400
    
    return jsonify(result)