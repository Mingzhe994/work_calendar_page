#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
初始化工作流数据脚本
将硬编码的工作流数据迁移到数据库中
"""

import json
from app import app, db, Workflow

# 硬编码的工作流数据
WORKFLOWS = {
    '五年战略规划': [
        '来文需求研究',
        '历史数据调研',
        '拟定框架',
        '提交至各部门收集数据',
        '梳理与补充内容材料',
        '各部门审阅',
        '领导审阅',
        '提交上级单位'
    ],
    '商业计划': [
        '市场分析',
        '竞争对手分析',
        '商业模式设计',
        '财务预测',
        '营销策略',
        '运营计划',
        '团队建设',
        '风险管理'
    ],
    '管理报告': [
        '数据收集和整理',
        '关键指标分析',
        '问题识别和分析',
        '解决方案制定',
        '报告撰写',
        '图表制作',
        '内部审核',
        '最终提交'
    ],
    '临时报告': [
        '需求确认',
        '资料收集',
        '分析和总结',
        '报告撰写',
        '审核和修改',
        '提交'
    ],
    '创新管理': [
        '创新需求识别',
        '创新方案征集',
        '方案评估',
        '项目立项',
        '资源配置',
        '项目实施',
        '效果评估',
        '推广应用'
    ]
}

def init_workflows():
    """初始化工作流数据"""
    with app.app_context():
        # 检查是否已有工作流数据
        existing_count = Workflow.query.count()
        if existing_count > 0:
            print(f"数据库中已存在 {existing_count} 个工作流，跳过初始化")
            return
        
        print("开始初始化工作流数据...")
        
        # 创建工作流记录
        for i, (name, steps) in enumerate(WORKFLOWS.items()):
            workflow = Workflow(
                name=name,
                description=f"{name}的标准工作流程",
                steps=json.dumps(steps, ensure_ascii=False),
                is_default=(i == 0)  # 第一个设为默认
            )
            db.session.add(workflow)
            print(f"添加工作流: {name}")
        
        # 提交到数据库
        try:
            db.session.commit()
            print(f"成功初始化 {len(WORKFLOWS)} 个工作流")
        except Exception as e:
            db.session.rollback()
            print(f"初始化失败: {e}")
            raise

if __name__ == '__main__':
    init_workflows()