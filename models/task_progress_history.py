from datetime import datetime
from . import db

class TaskProgressHistory(db.Model):
    """任务进度历史模型"""
    __tablename__ = 'task_progress_history'
    
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    operation_time = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    old_progress = db.Column(db.String(200), nullable=True)  # 原进展步骤
    new_progress = db.Column(db.String(200), nullable=True)  # 新进展步骤
    old_status = db.Column(db.String(20), nullable=True)  # 原状态
    new_status = db.Column(db.String(20), nullable=True)  # 新状态
    
    # 建立与Task的关系
    task = db.relationship('Task', backref=db.backref('progress_history', lazy=True, order_by='TaskProgressHistory.operation_time.desc()'))
    
    def to_dict(self):
        """转换为字典格式"""
        # 优先显示工作流步骤更新，而不是任务状态
        if self.old_progress != self.new_progress:
            field_name = '工作进展更新'
            old_value = self.old_progress or '未开始'
            new_value = self.new_progress or '未开始'
        elif self.old_status != self.new_status:
            # 将状态转换为更友好的显示
            status_map = {
                'pending': '未开始',
                'in_progress': '进行中', 
                'completed': '已完成'
            }
            field_name = '任务状态更新'
            old_value = status_map.get(self.old_status, self.old_status or '未知')
            new_value = status_map.get(self.new_status, self.new_status or '未知')
        else:
            field_name = '任务更新'
            old_value = '无'
            new_value = '已更新'
        
        return {
            'id': self.id,
            'task_id': self.task_id,
            'created_at': self.operation_time.strftime('%Y-%m-%d %H:%M:%S') if self.operation_time else None,
            'field_name': field_name,
            'old_value': old_value,
            'new_value': new_value,
            'note': None  # 历史记录暂无备注
        }
    
    def __repr__(self):
        return f'<TaskProgressHistory {self.id}: Task {self.task_id}>'