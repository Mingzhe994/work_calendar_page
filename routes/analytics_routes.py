from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from services import AnalyticsService

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api')

@analytics_bp.route('/analytics')
@login_required
def get_analytics():
    """获取分析统计数据"""
    try:
        # 添加用户隔离，只获取当前用户的分析数据
        data = AnalyticsService.get_analytics_data(user_id=current_user.id)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/analytics/statistics')
@login_required
def get_statistics():
    """获取任务统计信息"""
    try:
        # 添加用户隔离，只获取当前用户的统计数据
        data = AnalyticsService.get_task_statistics(user_id=current_user.id)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500