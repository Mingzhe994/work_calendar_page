from datetime import datetime, date, timezone, timedelta
from . import db

def beijing_now():
    """返回北京时间"""
    return datetime.now(timezone(timedelta(hours=8)))

class Task(db.Model):
    """任务模型"""
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.String(50), nullable=False)  # 五年战略规划、商业计划、管理报告等
    start_date = db.Column(db.Date, nullable=False, default=date.today)
    deadline = db.Column(db.Date, nullable=True)  # 截止日期改为可选
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed
    priority = db.Column(db.String(20), default='medium')  # low, medium, high
    progress = db.Column(db.String(200), nullable=True)  # 工作流程步骤进展
    created_at = db.Column(db.DateTime, default=beijing_now)
    updated_at = db.Column(db.DateTime, default=beijing_now, onupdate=beijing_now)
    completed_at = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    def is_overdue(self):
        """判断任务是否已延期"""
        if not self.deadline:
            return False
        return self.deadline < date.today() and self.status != 'completed'
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.get_calculated_status(),
            'priority': self.priority,
            'progress': self.progress,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'is_overdue': self.is_overdue()
        }
    
    def get_calculated_status(self):
        """根据日期自动计算任务状态"""
        # 如果任务已手动标记为已完成，保持已完成状态
        if self.status == 'completed':
            return 'completed'
        
        if not self.start_date:
            return 'pending'
        
        today = date.today()
        
        # 如果有截止日期且已过期，状态为"in_progress"（进行中）
        if self.deadline and self.deadline < today:
            # 如果状态是pending，自动更新为in_progress
            if self.status == 'pending':
                self.status = 'in_progress'
                db.session.commit()
            return 'in_progress'
        
        # 如果开始日期小于或等于当前日期，状态为"进行中"
        if self.start_date <= today:
            return 'in_progress'
        
        # 如果开始日期大于当前日期，状态为"未开始"
        return 'pending'
    
    def to_detail_dict(self):
        """转换为详细字典格式（用于单个任务查询）"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'task_type': self.task_type,
            'start_date': self.start_date.strftime('%Y-%m-%d') if self.start_date else None,
            'deadline': self.deadline.strftime('%Y-%m-%d') if self.deadline else None,
            'status': self.get_calculated_status(),
            'priority': self.priority,
            'is_overdue': self.is_overdue(),
            'progress': self.progress,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None,
            'completed_at': self.completed_at.strftime('%Y-%m-%d %H:%M:%S') if self.completed_at else None
        }
    
    def __repr__(self):
        return f'<Task {self.id}: {self.title}>'