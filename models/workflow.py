from datetime import datetime
import json
from . import db
from models.task import beijing_now

class Workflow(db.Model):
    """工作流模型"""
    __tablename__ = 'workflows'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)  # 工作流名称
    description = db.Column(db.Text)  # 工作流描述
    steps = db.Column(db.Text, nullable=False)  # JSON格式存储步骤列表
    is_default = db.Column(db.Boolean, default=False)  # 是否为默认工作流
    created_at = db.Column(db.DateTime, default=beijing_now)
    updated_at = db.Column(db.DateTime, default=beijing_now, onupdate=beijing_now)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def get_steps(self):
        """获取步骤列表"""
        try:
            return json.loads(self.steps)
        except (json.JSONDecodeError, TypeError):
            return []
    
    def set_steps(self, steps_list):
        """设置步骤列表"""
        self.steps = json.dumps(steps_list, ensure_ascii=False)
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'steps': self.get_steps(),
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Workflow {self.id}: {self.name}>'