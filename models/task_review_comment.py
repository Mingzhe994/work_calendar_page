from datetime import datetime
from . import db

class TaskReviewComment(db.Model):
    """任务复盘评论模型"""
    __tablename__ = 'task_review_comment'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)  # 评论内容
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # 建立与Task的关系
    task = db.relationship('Task', backref=db.backref('review_comments', lazy=True, order_by='TaskReviewComment.created_at.desc()'))
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'task_id': self.task_id,
            'content': self.content,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
    
    def __repr__(self):
        return f'<TaskReviewComment {self.id}: Task {self.task_id}>'