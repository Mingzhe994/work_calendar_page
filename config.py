import os
from datetime import timedelta

class Config:
    """基础配置类"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 数据库配置
    @staticmethod
    def get_database_uri():
        """获取数据库URI"""
        base_dir = os.path.dirname(os.path.abspath(__file__))
        return 'sqlite:///' + os.path.join(base_dir, 'instance', 'work_calendar.db')
    
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    
    # 应用配置
    DEBUG = True
    PORT = 5005
    
    # 工作流配置
    DEFAULT_WORKFLOWS = {
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
    
    # 任务状态配置
    VALID_TASK_STATUSES = ['pending', 'in_progress', 'completed']
    VALID_PRIORITIES = ['low', 'medium', 'high']
    VALID_ISSUE_STATUSES = ['open', 'resolved']

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'production-secret-key'

class TestingConfig(Config):
    """测试环境配置"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# 配置字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}