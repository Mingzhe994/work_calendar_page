#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
初始化默认工作流数据到数据库
"""

import json
from models import Workflow
from config import Config

WORKFLOWS = Config.DEFAULT_WORKFLOWS

def init_default_workflows(app, db):
    """初始化默认工作流数据"""
    # 检查是否已经有工作流数据
    existing_count = Workflow.query.count()
    if existing_count > 0:
        print(f"数据库中已存在 {existing_count} 个工作流，跳过初始化")
        return
    
    print("开始初始化默认工作流数据...")
    
    # 从WORKFLOWS字典创建工作流
    for workflow_name, steps in WORKFLOWS.items():
        # 检查是否已存在同名工作流
        existing_workflow = Workflow.query.filter_by(name=workflow_name).first()
        if existing_workflow:
            print(f"工作流 '{workflow_name}' 已存在，跳过")
            continue
        
        # 创建新工作流
        workflow = Workflow(
            name=workflow_name,
            description=f"{workflow_name}的标准工作流程",
            steps=json.dumps(steps, ensure_ascii=False),
            is_default=False  # 暂时都设为非默认
        )
        
        db.session.add(workflow)
        print(f"添加工作流: {workflow_name} ({len(steps)} 个步骤)")
    
    # 设置第一个工作流为默认
    if WORKFLOWS:
        first_workflow_name = list(WORKFLOWS.keys())[0]
        first_workflow = Workflow.query.filter_by(name=first_workflow_name).first()
        if first_workflow:
            first_workflow.is_default = True
            print(f"设置 '{first_workflow_name}' 为默认工作流")
    
    # 提交更改
    try:
        db.session.commit()
        print("默认工作流数据初始化完成！")
        
        # 显示初始化结果
        total_workflows = Workflow.query.count()
        print(f"\n初始化结果:")
        print(f"- 总工作流数量: {total_workflows}")
        
        for workflow in Workflow.query.all():
            steps_count = len(json.loads(workflow.steps))
            default_mark = " (默认)" if workflow.is_default else ""
            print(f"- {workflow.name}: {steps_count} 个步骤{default_mark}")
            
    except Exception as e:
        db.session.rollback()
        print(f"初始化失败: {e}")
        raise

if __name__ == '__main__':
    # This part will not be executed when imported, only when run directly
    # For direct execution, you would need to set up app and db context
    print("This script is intended to be imported and called from app.py")