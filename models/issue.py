from datetime import datetime
from . import db

class Issue(db.Model):
    """问题模型"""
    __tablename__ = 'issues'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    status = db.Column(db.String(20), default='open')  # open, resolved
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    solutions = db.Column(db.Text)  # 解决方案列表，JSON格式存储
    successful_solution = db.Column(db.Text)  # 成功的解决方案
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def to_dict(self):
        """转换为字典格式"""
        import json
        solutions_list = []
        if self.solutions:
            try:
                solutions_list = json.loads(self.solutions)
            except:
                solutions_list = []
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'solutions': solutions_list,
            'successful_solution': self.successful_solution
        }
    
    def __repr__(self):
        return f'<Issue {self.id}: {self.title}>'