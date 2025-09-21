#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
数据库时区修复脚本
将UTC时间转换为北京时间（UTC+8）
"""

from datetime import datetime, timedelta, timezone
from app import create_app
app = create_app()
from models import db, Task, Issue, Workflow, TaskProgressHistory, TaskReviewComment

def beijing_timezone():
    """返回北京时区"""
    return timezone(timedelta(hours=8))

def fix_datetime(dt):
    """将UTC时间转换为北京时间"""
    if dt is None:
        return None
    
    # 检查时间是否已经有时区信息
    if dt.tzinfo is not None:
        # 已有时区信息，转换到北京时区
        return dt.astimezone(beijing_timezone())
    else:
        # 无时区信息，假设是UTC时间，添加8小时
        return dt + timedelta(hours=8)

def fix_task_times():
    """修复Task表中的时间字段"""
    print("正在修复Task表时间...")
    tasks = Task.query.all()
    count = 0
    
    for task in tasks:
        task.created_at = fix_datetime(task.created_at)
        task.updated_at = fix_datetime(task.updated_at)
        task.completed_at = fix_datetime(task.completed_at)
        count += 1
    
    db.session.commit()
    print(f"已修复 {count} 条Task记录")

def fix_issue_times():
    """修复Issue表中的时间字段"""
    print("正在修复Issue表时间...")
    issues = Issue.query.all()
    count = 0
    
    for issue in issues:
        issue.created_at = fix_datetime(issue.created_at)
        issue.resolved_at = fix_datetime(issue.resolved_at)
        count += 1
    
    db.session.commit()
    print(f"已修复 {count} 条Issue记录")

def fix_workflow_times():
    """修复Workflow表中的时间字段"""
    print("正在修复Workflow表时间...")
    workflows = Workflow.query.all()
    count = 0
    
    for workflow in workflows:
        workflow.created_at = fix_datetime(workflow.created_at)
        workflow.updated_at = fix_datetime(workflow.updated_at)
        count += 1
    
    db.session.commit()
    print(f"已修复 {count} 条Workflow记录")

def fix_task_progress_history_times():
    """修复TaskProgressHistory表中的时间字段"""
    print("正在修复TaskProgressHistory表时间...")
    histories = TaskProgressHistory.query.all()
    count = 0
    
    for history in histories:
        history.operation_time = fix_datetime(history.operation_time)
        count += 1
    
    db.session.commit()
    print(f"已修复 {count} 条TaskProgressHistory记录")

def fix_task_review_comment_times():
    """修复TaskReviewComment表中的时间字段"""
    print("正在修复TaskReviewComment表时间...")
    comments = TaskReviewComment.query.all()
    count = 0
    
    for comment in comments:
        comment.created_at = fix_datetime(comment.created_at)
        count += 1
    
    db.session.commit()
    print(f"已修复 {count} 条TaskReviewComment记录")

def main():
    """主函数"""
    with app.app_context():
        print("开始修复数据库时区问题...")
        
        fix_task_times()
        fix_issue_times()
        fix_workflow_times()
        fix_task_progress_history_times()
        fix_task_review_comment_times()
        
        print("数据库时区修复完成！")

if __name__ == "__main__":
    main()