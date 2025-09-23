import sys
import os

# 添加应用程序目录到 Python 路径
path = '/home/mz994/工作日历系统'
if path not in sys.path:
    sys.path.append(path)

# 设置环境变量
os.environ['FLASK_CONFIG'] = 'production'

# 导入应用并创建 WSGI 应用对象
from app import create_app
application = create_app()