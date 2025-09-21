import pytest
import json
from datetime import datetime, timedelta

def test_get_tasks_route(client, sample_task, sample_completed_task):
    """测试获取任务列表API"""
    response = client.get('/api/tasks')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['tasks']) == 2
    
    # 测试按状态筛选
    response = client.get('/api/tasks?status=进行中')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['tasks']) == 1
    assert data['tasks'][0]['title'] == "测试任务"

def test_get_task_by_id_route(client, sample_task):
    """测试通过ID获取任务API"""
    response = client.get(f'/api/tasks/{sample_task.id}')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['task']['id'] == sample_task.id
    assert data['task']['title'] == "测试任务"

def test_create_task_route(client, sample_workflow):
    """测试创建任务API"""
    task_data = {
        'title': '新测试任务',
        'description': '这是一个新创建的测试任务',
        'status': '未开始',
        'priority': '中',
        'start_date': datetime.now().strftime('%Y-%m-%d'),
        'deadline': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
        'workflow_id': sample_workflow.id
    }
    
    response = client.post('/api/tasks', 
                          data=json.dumps(task_data),
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['success'] is True
    assert 'task_id' in data

def test_update_task_route(client, sample_task):
    """测试更新任务API"""
    update_data = {
        'title': '更新后的测试任务',
        'description': '这是更新后的描述',
        'status': '已完成',
        'completion_date': datetime.now().strftime('%Y-%m-%d')
    }
    
    response = client.put(f'/api/tasks/{sample_task.id}', 
                         data=json.dumps(update_data),
                         content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['success'] is True

def test_delete_task_route(client, sample_task):
    """测试删除任务API"""
    response = client.delete(f'/api/tasks/{sample_task.id}')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['success'] is True

def test_task_review_comments_route(client, sample_completed_task, sample_review_comments):
    """测试任务复盘评论API"""
    # 测试获取评论
    response = client.get(f'/api/tasks/{sample_completed_task.id}/review_comments')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['comments']) == 3
    
    # 验证评论排序（从新到旧）
    for i in range(len(data['comments']) - 1):
        assert data['comments'][i]['created_at'] >= data['comments'][i+1]['created_at']
    
    # 测试添加评论
    comment_data = {'content': '新测试评论'}
    response = client.post(f'/api/tasks/{sample_completed_task.id}/review_comments',
                          data=json.dumps(comment_data),
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['success'] is True

def test_get_workflows_route(client, sample_workflow):
    """测试获取工作流列表API"""
    response = client.get('/api/workflows')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['workflows']) >= 1
    
    # 验证示例工作流是否在列表中
    found = False
    for workflow in data['workflows']:
        if workflow['id'] == sample_workflow.id:
            found = True
            break
    assert found is True

def test_get_workflow_by_id_route(client, sample_workflow):
    """测试通过ID获取工作流API"""
    response = client.get(f'/api/workflows/{sample_workflow.id}')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['workflow']['id'] == sample_workflow.id
    assert data['workflow']['name'] == "测试工作流"