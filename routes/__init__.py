# 路由模块
from .task_routes import task_bp
from .issue_routes import issue_bp
from .workflow_routes import workflow_bp
from .analytics_routes import analytics_bp
from .main_routes import main_bp
from .auth_routes import auth_bp

__all__ = ['task_bp', 'issue_bp', 'workflow_bp', 'analytics_bp', 'main_bp', 'auth_bp']