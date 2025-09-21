import os
import sys
import pytest
from datetime import datetime, timedelta
from flask import Flask

# 添加项目根目录到系统路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from models import db, Task, TaskReviewComment, Workflow, Issue
from config import config

# 添加测试配置
config['testing'] = type('TestingConfig', (config['default'],), {
    'TESTING': True,
    'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
    'WTF_CSRF_ENABLED': False
})

@pytest.fixture
def app():
    """创建并配置一个Flask应用实例用于测试"""
    app = create_app('testing')
    
    # 创建测试数据库上下文
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    """创建测试客户端"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """创建测试CLI运行器"""
    return app.test_cli_runner()

@pytest.fixture
def test_db(app):
    """提供测试数据库会话"""
    with app.app_context():
        yield db

@pytest.fixture
def sample_workflow(test_db):
    """创建示例工作流"""
    workflow = Workflow(
        name="测试工作流",
        description="用于测试的工作流",
        steps='["计划", "执行", "审核", "完成"]'  # 将列表转换为JSON字符串
    )
    test_db.session.add(workflow)
    test_db.session.commit()
    return workflow

@pytest.fixture
def sample_task(test_db, sample_workflow):
    """创建示例任务"""
    task = Task(
        title="测试任务",
        description="这是一个测试任务",
        status="进行中",
        priority="高",
        start_date=datetime.now().date(),
        deadline=(datetime.now() + timedelta(days=7)).date(),
        workflow_id=sample_workflow.id,
        current_step=1
    )
    test_db.session.add(task)
    test_db.session.commit()
    return task

@pytest.fixture
def sample_completed_task(test_db, sample_workflow):
    """创建示例已完成任务"""
    task = Task(
        title="已完成测试任务",
        description="这是一个已完成的测试任务",
        status="已完成",
        priority="高",
        start_date=(datetime.now() - timedelta(days=14)).date(),
        deadline=(datetime.now() - timedelta(days=7)).date(),
        completion_date=datetime.now().date(),
        workflow_id=sample_workflow.id,
        current_step=3
    )
    test_db.session.add(task)
    test_db.session.commit()
    return task

@pytest.fixture
def sample_review_comments(test_db, sample_completed_task):
    """创建示例任务复盘评论"""
    comments = []
    for i in range(3):
        comment = TaskReviewComment(
            task_id=sample_completed_task.id,
            content=f"测试评论 {i+1}",
            created_at=datetime.now() - timedelta(hours=i)
        )
        test_db.session.add(comment)
        comments.append(comment)
    
    test_db.session.commit()
    return comments

@pytest.fixture
def sample_issue(test_db):
    """创建示例问题"""
    issue = Issue(
        title="测试问题",
        description="这是一个测试问题",
        status="待解决",
        priority="高",
        created_at=datetime.now()
    )
    test_db.session.add(issue)
    test_db.session.commit()
    return issue