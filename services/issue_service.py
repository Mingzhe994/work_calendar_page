from datetime import datetime, timezone
from models.task import beijing_now
from typing import List, Dict, Optional, Any
import json
from models import db, Issue

class IssueService:
    """问题服务类"""
    
    @staticmethod
    def get_all_issues(user_id=None) -> List[Dict[str, Any]]:
        """获取所有问题，如果提供user_id则只返回该用户的问题"""
        query = Issue.query
        
        if user_id:
            # 如果指定了用户ID，按用户过滤
            query = query.filter_by(user_id=user_id)
            
        issues = query.order_by(Issue.priority.desc()).all()
        return [issue.to_dict() for issue in issues]
    
    @staticmethod
    def get_open_issues(user_id=None) -> List[Dict[str, Any]]:
        """获取所有开放的问题"""
        query = Issue.query.filter_by(status='open')
        
        if user_id:
            # 如果指定了用户ID，按用户过滤
            query = query.filter_by(user_id=user_id)
            
        issues = query.order_by(Issue.priority.desc()).all()
        return [issue.to_dict() for issue in issues]
    
    @staticmethod
    def get_issue_by_id(issue_id: int) -> Optional[Issue]:
        """根据ID获取问题"""
        return Issue.query.get(issue_id)
    
    @staticmethod
    def create_issue(data: Dict[str, Any]) -> Issue:
        """创建新问题"""
        issue = Issue(
            title=data['title'],
            description=data.get('description', ''),
            priority=data.get('priority', 'medium'),
            user_id=data.get('user_id')
        )
        
        db.session.add(issue)
        db.session.commit()
        return issue
    
    @staticmethod
    def resolve_issue(issue_id: int) -> bool:
        """解决问题"""
        issue = Issue.query.get(issue_id)
        if not issue:
            return False
        
        issue.status = 'resolved'
        issue.resolved_at = beijing_now()
        db.session.commit()
        return True
    
    @staticmethod
    def delete_issue(issue_id: int) -> bool:
        """删除问题"""
        issue = Issue.query.get(issue_id)
        if not issue:
            return False
        
        db.session.delete(issue)
        db.session.commit()
        return True
    
    @staticmethod
    def add_solution(issue_id: int, solution: str) -> bool:
        """为问题添加解决方案"""
        issue = Issue.query.get(issue_id)
        if not issue:
            return False
        
        # 获取现有解决方案列表
        try:
            solutions = json.loads(issue.solutions) if issue.solutions else []
        except (json.JSONDecodeError, TypeError):
            solutions = []
        
        # 添加新解决方案
        solutions.append(solution)
        
        # 更新数据库
        issue.solutions = json.dumps(solutions, ensure_ascii=False)
        db.session.commit()
        return True
    
    @staticmethod
    def mark_solution_successful(issue_id: int, solution_index: int) -> bool:
        """标记解决方案为成功"""
        issue = Issue.query.get(issue_id)
        if not issue:
            return False
        
        # 获取解决方案列表
        try:
            solutions = json.loads(issue.solutions) if issue.solutions else []
        except (json.JSONDecodeError, TypeError):
            solutions = []
        
        # 检查索引是否有效
        if solution_index < 0 or solution_index >= len(solutions):
            return False
        
        # 标记成功的解决方案
        issue.successful_solution = solutions[solution_index]
        db.session.commit()
        return True
    
    @staticmethod
    def get_all_issues_with_resolved(user_id=None) -> List[Dict[str, Any]]:
        """获取所有问题（包括已解决的），如果提供user_id则只返回该用户的问题"""
        query = Issue.query
        
        if user_id:
            # 如果指定了用户ID，按用户过滤
            query = query.filter_by(user_id=user_id)
            
        issues = query.order_by(Issue.created_at.desc()).all()
        return [issue.to_dict() for issue in issues]
        
    @staticmethod
    def update_issue(issue_id: int, data: Dict[str, Any]) -> bool:
        """更新问题信息"""
        issue = Issue.query.get(issue_id)
        if not issue:
            return False
        
        # 更新问题字段
        if 'title' in data:
            issue.title = data['title']
        if 'description' in data:
            issue.description = data['description']
        if 'priority' in data:
            issue.priority = data['priority']
            
        db.session.commit()
        return True