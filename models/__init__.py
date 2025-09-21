from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# 导入所有模型
from .task import Task
from .issue import Issue
from .workflow import Workflow
from .task_progress_history import TaskProgressHistory
from .task_review_comment import TaskReviewComment

__all__ = ['db', 'Task', 'Issue', 'Workflow', 'TaskProgressHistory', 'TaskReviewComment']