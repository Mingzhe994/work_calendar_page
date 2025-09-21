from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from models import Task

class AnalyticsService:
    """分析统计服务类"""
    
    @staticmethod
    def get_analytics_data(user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        获取分析统计数据
        
        Args:
            user_id: 用户ID，如果提供则只返回该用户的数据
        """
        # 获取本月完成的任务数
        current_month = datetime.now().replace(day=1)
        query = Task.query.filter(
            Task.status == 'completed',
            Task.completed_at >= current_month
        )
        
        # 添加用户过滤条件
        if user_id is not None:
            query = query.filter(Task.user_id == user_id)
            
        monthly_completed = query.count()
        
        # 获取上月完成的任务数
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        last_month_query = Task.query.filter(
            Task.status == 'completed',
            Task.completed_at >= last_month,
            Task.completed_at < current_month
        )
        
        # 添加用户过滤条件
        if user_id is not None:
            last_month_query = last_month_query.filter(Task.user_id == user_id)
            
        last_month_completed = last_month_query.count()
        
        # 计算环比变化
        if last_month_completed > 0:
            month_over_month_change = round(((monthly_completed - last_month_completed) / last_month_completed) * 100, 1)
        else:
            month_over_month_change = 100 if monthly_completed > 0 else 0
        
        # 计算平均完成时间
        completed_query = Task.query.filter_by(status='completed')
        if user_id is not None:
            completed_query = completed_query.filter_by(user_id=user_id)
            
        completed_tasks = completed_query.all()
        total_days = 0
        task_count = 0
        
        for task in completed_tasks:
            if task.completed_at and task.created_at:
                days = (task.completed_at - task.created_at).days
                total_days += days
                task_count += 1
        
        average_days = round(total_days / task_count, 1) if task_count > 0 else 0
        
        # 获取完成总数
        total_completed_query = Task.query.filter_by(status='completed')
        if user_id is not None:
            total_completed_query = total_completed_query.filter_by(user_id=user_id)
        total_completed = total_completed_query.count()
        
        # 获取排名第一的任务类型
        task_types = {}
        tasks_by_type_query = Task.query.filter_by(status='completed')
        if user_id is not None:
            tasks_by_type_query = tasks_by_type_query.filter_by(user_id=user_id)
        tasks_by_type = tasks_by_type_query.with_entities(Task.task_type).all()
        for (task_type,) in tasks_by_type:
            if task_type not in task_types:
                task_types[task_type] = 0
            task_types[task_type] += 1
        
        # 获取完成数量最多的任务类型
        top_task_type = max(task_types.items(), key=lambda x: x[1])[0] if task_types else ""
        
        # 生成图表数据 - 最近6个月的任务完成统计
        chart_labels = []
        chart_data = []
        
        for i in range(5, -1, -1):  # 从5个月前到当前月
            month_start = (datetime.now().replace(day=1) - timedelta(days=32*i)).replace(day=1)
            if i == 0:
                month_end = datetime.now()
            else:
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
            
            month_completed = Task.query.filter(
                Task.status == 'completed',
                Task.completed_at >= month_start,
                Task.completed_at <= month_end
            ).count()
            
            chart_labels.append(f"{month_start.month}月")
            chart_data.append(month_completed)
        
        return {
            'monthly_completed': monthly_completed,
            'last_month_completed': last_month_completed,
            'month_over_month_change': month_over_month_change,
            'average_days': average_days,
            'total_completed': total_completed,
            'top_task_type': top_task_type,
            'chart_data': {
                'labels': chart_labels,
                'data': chart_data
            }
        }
    
    @staticmethod
    def get_task_statistics(user_id: Optional[int] = None) -> Dict[str, Any]:
        """
        获取任务统计信息
        
        Args:
            user_id: 用户ID，如果提供则只返回该用户的数据
        """
        # 基础查询
        base_query = Task.query
        if user_id is not None:
            base_query = base_query.filter_by(user_id=user_id)
            
        total_tasks = base_query.count()
        pending_tasks = base_query.filter_by(status='pending').count()
        in_progress_tasks = base_query.filter_by(status='in_progress').count()
        completed_tasks = base_query.filter_by(status='completed').count()
        
        # 按优先级统计
        high_priority = base_query.filter_by(priority='high').count()
        medium_priority = base_query.filter_by(priority='medium').count()
        low_priority = base_query.filter_by(priority='low').count()
        
        # 按任务类型统计
        task_types = {}
        tasks_by_type_query = Task.query
        if user_id is not None:
            tasks_by_type_query = tasks_by_type_query.filter_by(user_id=user_id)
        tasks_by_type = tasks_by_type_query.with_entities(Task.task_type, Task.status, Task.created_at, Task.completed_at).all()
        for task_type, status, created_at, completed_at in tasks_by_type:
            if task_type not in task_types:
                task_types[task_type] = {
                    'total': 0, 
                    'completed': 0, 
                    'pending': 0, 
                    'in_progress': 0,
                    'avg_duration': 0,
                    'total_duration': 0,
                    'completed_count': 0
                }
            task_types[task_type]['total'] += 1
            task_types[task_type][status] += 1
            
            # 计算已完成任务的平均处理时长
            if status == 'completed' and created_at and completed_at:
                # 计算处理时长（结束日期-开始日期+1日）
                duration = (completed_at - created_at).days + 1
                if duration > 0:  # 确保时长为正数
                    task_types[task_type]['total_duration'] += duration
                    task_types[task_type]['completed_count'] += 1
        
        # 计算每种任务类型的平均处理时长
        for task_type in task_types:
            if task_types[task_type]['completed_count'] > 0:
                task_types[task_type]['avg_duration'] = round(
                    task_types[task_type]['total_duration'] / task_types[task_type]['completed_count'], 
                    1
                )
        
        # 过滤掉被删除且从未完成过任务的类型
        # 如果任务类型为空字符串、None或"测试类型"，且该类型下没有已完成的任务，则不在统计中显示
        filtered_task_types = {
            task_type: data for task_type, data in task_types.items() 
            if not ((not task_type or task_type.strip() == '' or task_type == '测试类型') and data['completed'] == 0)
        }
        
        # 按完成任务数量从高到低排序
        sorted_task_types = dict(sorted(
            filtered_task_types.items(), 
            key=lambda item: item[1]['completed'], 
            reverse=True
        ))
        
        return {
            'total_tasks': total_tasks,
            'status_breakdown': {
                'pending': pending_tasks,
                'in_progress': in_progress_tasks,
                'completed': completed_tasks
            },
            'priority_breakdown': {
                'high': high_priority,
                'medium': medium_priority,
                'low': low_priority
            },
            'task_types': sorted_task_types
        }