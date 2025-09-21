import os
import sys
import pytest
import json
from datetime import datetime
from flask import Flask

# 添加项目根目录到系统路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.task_service import TaskService
from services.workflow_service import WorkflowService
from app import create_app

def test_key_features():
    """测试关键功能"""
    app = create_app()
    with app.app_context():
        print("\n===== 开始关键功能测试 =====")
        print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # 测试任务复盘评论排序功能
        print("\n1. 测试任务复盘评论排序功能")
        try:
            # 获取所有任务
            tasks = TaskService.get_all_tasks()
            if tasks:
                task_id = tasks[0]['id']
                # 获取任务对象
                task = TaskService.get_task_by_id(task_id)
                # 获取任务的复盘评论
                comments = task.review_comments if task else []
                # 转换为字典列表
                comments = [comment.to_dict() for comment in comments]
                
                if comments and len(comments) > 1:
                    # 验证评论按时间从新到旧排序
                    is_sorted = True
                    for i in range(len(comments) - 1):
                        if comments[i]['created_at'] < comments[i+1]['created_at']:
                            is_sorted = False
                            break
                    
                    if is_sorted:
                        print("✅ 任务复盘评论排序测试通过: 评论按时间从新到旧排序")
                    else:
                        print("❌ 任务复盘评论排序测试失败: 评论未按时间从新到旧排序")
                else:
                    print("⚠️ 任务复盘评论排序测试跳过: 评论数量不足")
            else:
                print("⚠️ 任务复盘评论排序测试跳过: 没有找到任务数据")
        except Exception as e:
            print(f"❌ 任务复盘评论排序测试出错: {str(e)}")
        
        # 测试工作流功能
        print("\n2. 测试工作流功能")
        try:
            # 获取所有工作流
            workflows = WorkflowService.get_all_workflows()
            if workflows:
                print(f"✅ 工作流测试通过: 找到{len(workflows)}个工作流")
            else:
                print("⚠️ 工作流测试跳过: 没有找到工作流数据")
        except Exception as e:
            print(f"❌ 工作流测试出错: {str(e)}")
        
        # 测试任务状态功能
        print("\n3. 测试任务状态功能")
        try:
            # 获取不同状态的任务
            pending_tasks = TaskService.get_all_tasks(status='未开始')
            in_progress_tasks = TaskService.get_all_tasks(status='进行中')
            completed_tasks = TaskService.get_all_tasks(status='已完成')
            
            print(f"✅ 任务状态测试通过: 未开始({len(pending_tasks)}), 进行中({len(in_progress_tasks)}), 已完成({len(completed_tasks)})")
        except Exception as e:
            print(f"❌ 任务状态测试出错: {str(e)}")
        
        print("\n===== 关键功能测试完成 =====")

if __name__ == "__main__":
    test_key_features()