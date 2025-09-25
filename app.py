import os
from flask import Flask
from flask_login import LoginManager
from config import config
from models import db
from routes import task_bp, issue_bp, workflow_bp, analytics_bp, main_bp, auth_bp

login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = '请先登录以访问此页面'
login_manager.login_message_category = 'warning'

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

def create_app(config_name=None):
    """应用工厂函数"""
    app = Flask(__name__)
    
    # 加载配置
    config_name = config_name or os.environ.get('FLASK_CONFIG') or 'default'
    app.config.from_object(config[config_name])
    
    # 初始化扩展
    db.init_app(app)
    login_manager.init_app(app)
    
    # 注册蓝图
    app.register_blueprint(auth_bp)
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
        from models import User
        WorkflowService.initialize_default_workflows()
        
        # 创建默认管理员账号
        admin = User.query.filter_by(username='stuartzhang').first()
        if not admin:
            admin = User(username='stuartzhang', email='admin@example.com', is_admin=True)
            admin.password = 'Pw123456@python'
            db.session.add(admin)
            db.session.commit()
            print('默认管理员账号已创建')

    app.run(debug=True, host='0.0.0.0', port=5005)