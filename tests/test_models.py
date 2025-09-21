import pytest
from datetime import datetime, timedelta
from models import Task, TaskReviewComment, Workflow, Issue

def test_task_model(test_db, sample_task):
    """测试任务模型基本功能"""
    # 测试任务创建
    assert sample_task.title == "测试任务"
    assert sample_task.status == "进行中"
    
    # 测试任务字典转换
    task_dict = sample_task.to_dict()
    assert task_dict['title'] == "测试任务"
    assert task_dict['status'] == "进行中"
    assert 'id' in task_dict

def test_task_review_comment_model(test_db, sample_completed_task, sample_review_comments):
    """测试任务复盘评论模型"""
    # 测试评论创建
    assert len(sample_review_comments) == 3
    
    # 测试评论与任务的关联
    task = Task.query.get(sample_completed_task.id)
    assert len(task.review_comments) == 3
    
    # 测试评论排序（应该是从新到旧）
    comments = task.review_comments
    for i in range(len(comments) - 1):
        assert comments[i].created_at >= comments[i+1].created_at

def test_workflow_model(test_db, sample_workflow):
    """测试工作流模型"""
    # 测试工作流创建
    assert sample_workflow.name == "测试工作流"
    assert len(sample_workflow.steps) == 4
    
    # 测试工作流字典转换
    workflow_dict = sample_workflow.to_dict()
    assert workflow_dict['name'] == "测试工作流"
    assert len(workflow_dict['steps']) == 4

def test_issue_model(test_db, sample_issue):
    """测试问题模型"""
    # 测试问题创建
    assert sample_issue.title == "测试问题"
    assert sample_issue.status == "待解决"
    
    # 测试问题字典转换
    issue_dict = sample_issue.to_dict()
    assert issue_dict['title'] == "测试问题"
    assert issue_dict['status'] == "待解决"