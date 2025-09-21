from datetime import datetime, date, timezone, timedelta
from typing import List, Dict, Optional, Any
from models import db, Task, TaskProgressHistory, TaskReviewComment
from config import Config
from models.task import beijing_now

class TaskService:
    """任务服务类"""
    
    @staticmethod
    def get_all_tasks(exclude_completed: bool = False, status: str = None, user_id: int = None) -> List[Dict[str, Any]]:
        """获取所有任务，如果提供user_id则只返回该用户的任务"""
        query = Task.query
        
        if user_id:
            # 如果指定了用户ID，按用户过滤
            query = query.filter_by(user_id=user_id)
            
        if status:
            # 如果指定了状态，按状态过滤
            query = query.filter(Task.status == status)
        elif exclude_completed:
            # 如果排除已完成任务
            query = query.filter(Task.status != 'completed')
        
        tasks = query.all()
        return [task.to_dict() for task in tasks]
    
    @staticmethod
    def get_pending_tasks() -> List[Task]:
        """获取待处理任务"""
        return Task.query.filter_by(status='pending').order_by(Task.created_at.desc()).all()
    
    @staticmethod
    def get_task_by_id(task_id: int) -> Optional[Task]:
        """根据ID获取任务"""
        return Task.query.get(task_id)
    
    @staticmethod
    def create_task(data: Dict[str, Any]) -> Task:
        """创建新任务"""
        # 处理开始日期
        start_date_str = data.get('start_date', date.today().isoformat())
        
        # 支持日期时间格式
        if 'T' in start_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%dT%H:%M')
        else:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        
        # 处理截止日期（可选）
        deadline = None
        if data.get('deadline'):
            deadline_str = data['deadline']
            if 'T' in deadline_str:
                deadline = datetime.strptime(deadline_str, '%Y-%m-%dT%H:%M')
            else:
                deadline = datetime.strptime(deadline_str, '%Y-%m-%d')
        
        task = Task(
            title=data['title'],
            description=data.get('description', ''),
            task_type=data['task_type'],
            start_date=start_date.date(),  # 转换为日期对象
            deadline=deadline.date() if deadline else None,  # 转换为日期对象
            status=data.get('status', 'pending'),
            priority=data.get('priority', 'medium'),
            progress=data.get('progress'),
            user_id=data.get('user_id')
        )
        
        db.session.add(task)
        db.session.commit()
        return task
    
    @staticmethod
    def delete_task(task_id: int) -> bool:
        """删除任务"""
        task = Task.query.get(task_id)
        if not task:
            return False
        
        # 1. 先删除任务进度历史记录
        TaskProgressHistory.query.filter_by(task_id=task_id).delete()
        
        # 2. 删除任务评论
        TaskReviewComment.query.filter_by(task_id=task_id).delete()
        
        # 3. 最后删除任务本身
        db.session.delete(task)
        
        # 提交所有更改
        db.session.commit()
        return True
    
    @staticmethod
    def complete_task(task_id: int) -> bool:
        """完成任务"""
        task = Task.query.get(task_id)
        if not task:
            return False
        
        task.status = 'completed'
        task.completed_at = beijing_now()
        db.session.commit()
        return True
    
    @staticmethod
    def update_task_status(task_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        """更新任务状态"""
        task = Task.query.get(task_id)
        if not task:
            return {'success': False, 'error': '任务不存在'}
        
        # 记录原始状态和进展
        old_status = task.status
        old_progress = task.progress
        
        status_changed = False
        progress_changed = False
        
        # 更新状态
        if 'status' in data:
            new_status = data['status']
            if new_status not in Config.VALID_TASK_STATUSES:
                return {'success': False, 'error': '无效的状态值'}
            
            if new_status != old_status:
                status_changed = True
                task.status = new_status
                if new_status == 'completed':
                    task.completed_at = beijing_now()
                else:
                    task.completed_at = None
        
        # 更新工作流程进展
        if 'progress' in data:
            new_progress = data['progress']
            # 验证进展是否属于该任务类型的工作流程步骤
            if task.task_type in Config.DEFAULT_WORKFLOWS:
                valid_progress = Config.DEFAULT_WORKFLOWS[task.task_type]
                if new_progress and new_progress not in valid_progress:
                    return {'success': False, 'error': '无效的进展步骤'}
            
            if new_progress != old_progress:
                progress_changed = True
                task.progress = new_progress
        
        # 更新优先级
        if 'priority' in data:
            new_priority = data['priority']
            if new_priority not in Config.VALID_PRIORITIES:
                return {'success': False, 'error': '无效的优先级值'}
            task.priority = new_priority
        
        # 如果有状态或进展变更，记录历史
        if status_changed or progress_changed:
            history = TaskProgressHistory(
                task_id=task_id,
                operation_time=beijing_now(),
                old_status=old_status if status_changed else None,
                new_status=task.status if status_changed else None,
                old_progress=old_progress if progress_changed else None,
                new_progress=task.progress if progress_changed else None
            )
            db.session.add(history)
        
        db.session.commit()
        return {'success': True}
    
    @staticmethod
    def get_task_history(task_id: int) -> Dict[str, Any]:
        """获取任务历史"""
        task = Task.query.get(task_id)
        if not task:
            return {'error': '任务不存在'}
        
        history_records = TaskProgressHistory.query.filter_by(
            task_id=task_id
        ).order_by(TaskProgressHistory.operation_time.desc()).all()
        
        return {
            'task_id': task_id,
            'task_title': task.title,
            'history': [record.to_dict() for record in history_records]
        }
    
    @staticmethod
    def get_task_comments(task_id: int) -> Dict[str, Any]:
        """获取任务评论"""
        task = Task.query.get(task_id)
        if not task:
            return {'error': '任务不存在'}
        
        comments = TaskReviewComment.query.filter_by(
            task_id=task_id
        ).order_by(TaskReviewComment.created_at.desc()).all()
        
        return {'comments': [comment.to_dict() for comment in comments]}
    
    @staticmethod
    def add_task_comment(task_id: int, content: str) -> Dict[str, Any]:
        """添加任务评论"""
        task = Task.query.get(task_id)
        if not task:
            return {'error': '任务不存在'}
        
        # 只允许为已完成的任务添加评论
        if task.status != 'completed':
            return {'error': '只能为已完成的任务添加复盘评论'}
        
        content = content.strip()
        if not content:
            return {'error': '评论内容不能为空'}
        
        comment = TaskReviewComment(
            task_id=task_id,
            content=content
        )
        
        try:
            db.session.add(comment)
            db.session.commit()
            
            return {
                'message': '评论添加成功',
                'comment': comment.to_dict()
            }
        except Exception as e:
            db.session.rollback()
            return {'error': '添加评论失败'}