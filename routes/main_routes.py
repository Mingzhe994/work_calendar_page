from flask import Blueprint, render_template, current_app
from services import TaskService, IssueService

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """主页"""
    tasks = TaskService.get_pending_tasks()
    issues = IssueService.get_open_issues()
    return render_template('index.html', tasks=tasks, issues=issues)

@main_bp.route('/simple_test.html')
def simple_test():
    """简单测试页面"""
    return current_app.send_static_file('simple_test.html')

@main_bp.route('/workflow_test.html')
def workflow_test():
    """工作流测试页面"""
    return current_app.send_static_file('workflow_test.html')