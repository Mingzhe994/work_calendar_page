from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from . import db

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, index=True)
    email = db.Column(db.String(120), unique=True, index=True)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关联关系
    tasks = db.relationship('Task', backref='user', lazy='dynamic')
    issues = db.relationship('Issue', backref='user', lazy='dynamic')
    workflows = db.relationship('Workflow', backref='user', lazy='dynamic')
    
    @property
    def password(self):
        raise AttributeError('密码不是可读属性')
        
    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @classmethod
    def create_admin(cls):
        """创建默认管理员账号"""
        admin = cls.query.filter_by(username='stuartzhang').first()
        if admin is None:
            admin = cls(
                username='stuartzhang',
                email='admin@example.com',
                is_admin=True
            )
            admin.password = 'Pw123456@python'
            db.session.add(admin)
            db.session.commit()
        return admin