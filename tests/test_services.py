import pytest
from datetime import datetime, timedelta
from services.task_service import get_tasks, get_task_by_id, create_task, update_task, delete_task, get_task_review_comments, add_task_review_comment
from services.workflow_service import get_workflows, get_workflow_by_id
from models import Task, TaskReviewComment

def test_get_tasks(test_db, sample_task, sample_completed_task):
    """测试获取任务列表功能"""
    # 测试获取所有任务
    tasks = get_tasks()
    assert len(tasks['tasks']) == 2
    
    # 测试按状态筛选
    tasks = get_tasks(status="进行中")
    assert len(tasks['tasks']) == 1
    assert tasks['tasks'][0]['title'] == "测试任务"
    
    tasks = get_tasks(status="已完成")
    assert len(tasks['tasks']) == 1
    assert tasks['tasks'][0]['title'] == "已完成测试任务"

def test_get_task_by_id(test_db, sample_task):
    """测试通过ID获取任务"""
    task = get_task_by_id(sample_task.id)
    assert task['task']['id'] == sample_task.id
    assert task['task']['title'] == "测试任务"

def test_create_task(test_db, sample_workflow):
    """测试创建任务"""
    task_data = {
        'title': '新测试任务',
        'description': '这是一个新创建的测试任务',
        'status': '未开始',
        'priority': '中',
        'start_date': datetime.now().strftime('%Y-%m-%d'),
        'deadline': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
        'workflow_id': sample_workflow.id
    }
    
    result = create_task(task_data)
    assert result['success'] is True
    assert 'task_id' in result
    
    # 验证任务是否真的创建了
    task = Task.query.get(result['task_id'])
    assert task is not None
    assert task.title == '新测试任务'

def test_update_task(test_db, sample_task):
    """测试更新任务"""
    update_data = {
        'title': '更新后的测试任务',
        'description': '这是更新后的描述',
        'status': '已完成',
        'completion_date': datetime.now().strftime('%Y-%m-%d')
    }
    
    result = update_task(sample_task.id, update_data)
    assert result['success'] is True
    
    # 验证任务是否真的更新了
    task = Task.query.get(sample_task.id)
    assert task.title == '更新后的测试任务'
    assert task.status == '已完成'

def test_delete_task(test_db, sample_task):
    """测试删除任务"""
    task_id = sample_task.id
    result = delete_task(task_id)
    assert result['success'] is True
    
    # 验证任务是否真的被删除了
    task = Task.query.get(task_id)
    assert task is None

def test_task_review_comments(test_db, sample_completed_task, sample_review_comments):
    """测试任务复盘评论功能"""
    # 测试获取评论
    comments = get_task_review_comments(sample_completed_task.id)
    assert len(comments['comments']) == 3
    
    # 验证评论排序（从新到旧）
    for i in range(len(comments['comments']) - 1):
        assert comments['comments'][i]['created_at'] >= comments['comments'][i+1]['created_at']
    
    # 测试添加评论
    result = add_task_review_comment(sample_completed_task.id, {'content': '新测试评论'})
    assert result['success'] is True
    
    # 验证评论是否真的添加了
    comments = get_task_review_comments(sample_completed_task.id)
    assert len(comments['comments']) == 4
    assert comments['comments'][0]['content'] == '新测试评论'  # 新评论应该在最前面

def test_get_workflows(test_db, sample_workflow):
    """测试获取工作流列表"""
    workflows = get_workflows()
    assert len(workflows['workflows']) >= 1
    
    # 验证示例工作流是否在列表中
    found = False
    for workflow in workflows['workflows']:
        if workflow['id'] == sample_workflow.id:
            found = True
            break
    assert found is True

def test_get_workflow_by_id(test_db, sample_workflow):
    """测试通过ID获取工作流"""
    workflow = get_workflow_by_id(sample_workflow.id)
    assert workflow['workflow']['id'] == sample_workflow.id
    assert workflow['workflow']['name'] == "测试工作流"
    assert len(workflow['workflow']['steps']) == 4