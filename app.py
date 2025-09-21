import os
from flask import Flask
from config import config
from models import db
from routes import task_bp, issue_bp, workflow_bp, analytics_bp, main_bp

def create_app(config_name=None):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 加载配置
    config_name = config_name or os.environ.get('FLASK_CONFIG') or 'default'
    app.config.from_object(config[config_name])
    
    # 初始化数据库
    db.init_app(app)
    
    # 注册蓝图
    app.register_blueprint(main_bp)
    app.register_blueprint(task_bp)
    app.register_blueprint(issue_bp)
    app.register_blueprint(workflow_bp)
    app.register_blueprint(analytics_bp)
    
    return app


if __name__ == '__main__':
    app = create_app()
    
    with app.app_context():
        db.create_all()
        
        # 初始化默认工作流
        from services.workflow_service import WorkflowService
        WorkflowService.initialize_default_workflows()
    
    app.run(debug=True, port=5005)