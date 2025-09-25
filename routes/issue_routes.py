from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from services import IssueService

issue_bp = Blueprint('issue', __name__, url_prefix='/api/issues')

@issue_bp.route('')
@login_required
def get_issues():
    """获取所有问题"""
    # 添加用户隔离，只获取当前用户的问题
    issues = IssueService.get_all_issues(user_id=current_user.id)
    return jsonify(issues)

@issue_bp.route('/<int:issue_id>')
@login_required
def get_issue(issue_id):
    """获取单个问题详情"""
    issue = IssueService.get_issue_by_id(issue_id)
    if not issue:
        return jsonify({'error': '问题不存在'}), 404
    
    # 检查用户权限：只能访问自己的问题
    if issue.user_id != current_user.id:
        return jsonify({'error': '无权访问此问题'}), 403
    
    return jsonify(issue.to_dict())

@issue_bp.route('', methods=['POST'])
@login_required
def add_issue():
    """添加新问题"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '无效的请求数据'}), 400
        
        # 创建问题时传递当前用户ID
        issue = IssueService.create_issue(data, user_id=current_user.id)
        return jsonify({'success': True, 'id': issue.id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@issue_bp.route('/<int:issue_id>', methods=['DELETE'])
@login_required
def delete_issue(issue_id):
    """删除问题（标记为已解决）"""
    # 先检查问题是否存在以及用户权限
    issue = IssueService.get_issue_by_id(issue_id)
    if not issue:
        return jsonify({'success': False, 'error': '问题不存在'}), 404
    
    # 检查用户权限：只能删除自己的问题
    if issue.user_id != current_user.id:
        return jsonify({'success': False, 'error': '无权删除此问题'}), 403
    
    success = IssueService.delete_issue(issue_id)
    if not success:
        return jsonify({'success': False, 'error': '删除失败'}), 500
    
    return jsonify({'success': True})

@issue_bp.route('/<int:issue_id>/resolve', methods=['PUT'])
@login_required
def resolve_issue(issue_id):
    """解决问题"""
    # 先检查问题是否存在以及用户权限
    issue = IssueService.get_issue_by_id(issue_id)
    if not issue:
        return jsonify({'success': False, 'error': '问题不存在'}), 404
    
    # 检查用户权限：只能解决自己的问题
    if issue.user_id != current_user.id:
        return jsonify({'success': False, 'error': '无权解决此问题'}), 403
    
    success = IssueService.resolve_issue(issue_id)
    if not success:
        return jsonify({'success': False, 'error': '解决失败'}), 500
    
    return jsonify({'success': True})

@issue_bp.route('/<int:issue_id>/solutions', methods=['POST'])
def add_solution(issue_id):
    """为问题添加解决方案"""
    try:
        data = request.get_json()
        if not data or 'solution' not in data:
            return jsonify({'success': False, 'error': '缺少解决方案内容'}), 400
        
        success = IssueService.add_solution(issue_id, data['solution'])
        if not success:
            return jsonify({'success': False, 'error': '问题不存在'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@issue_bp.route('/<int:issue_id>/solutions/<int:solution_index>/mark-successful', methods=['PUT'])
def mark_solution_successful(issue_id, solution_index):
    """标记解决方案为成功"""
    try:
        success = IssueService.mark_solution_successful(issue_id, solution_index)
        if not success:
            return jsonify({'success': False, 'error': '问题不存在或解决方案索引无效'}), 404
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@issue_bp.route('/<int:issue_id>', methods=['PUT'])
@login_required
def update_issue(issue_id):
    """更新问题信息"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '无效的请求数据'}), 400
        
        # 先检查问题是否存在以及用户权限
        issue = IssueService.get_issue_by_id(issue_id)
        if not issue:
            return jsonify({'success': False, 'error': '问题不存在'}), 404
        
        # 检查用户权限：只能更新自己的问题
        if issue.user_id != current_user.id:
            return jsonify({'success': False, 'error': '无权更新此问题'}), 403
        
        success = IssueService.update_issue(issue_id, data)
        if not success:
            return jsonify({'success': False, 'error': '更新失败'}), 500
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500